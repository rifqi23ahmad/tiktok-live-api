<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useTikTokStream } from '~/composables/useTikTokStream'
import { useSfx } from '~/composables/useSfx'
import { hashStr, fmtNum, fallbackAvatar, EMOJI_RE } from '~/utils/stream'
import { createHostSessionId, hostGreet, hostAnswer, type HostChatResult } from '~/utils/ai'
import { speak, ttsSupported } from '~/utils/tts'

const props = defineProps<{ settings: Record<string, any> }>()

const stream = useTikTokStream()
const sfx = useSfx()

const sfxOn = computed(() => props.settings.sfx !== false)
const ttsOn = computed(() => props.settings.tts !== false && ttsSupported())
const aiVoice = computed(() => (typeof props.settings.aiVoice === 'string' && props.settings.aiVoice) || 'id-ID')
const commentTtsOn = computed(() => props.settings.commentTts !== false && ttsSupported())
const commentVoice = computed(() => (typeof props.settings.commentVoice === 'string' && props.settings.commentVoice) || 'id-ID')

const mode = computed<'beyblade' | 'arena' | 'marble' | 'war'>(() => {
  const m = props.settings.mode
  if (m === 'arena') return 'arena'
  if (m === 'marble') return 'marble'
  if (m === 'war') return 'war'
  return 'beyblade'
})

// ---------------------------------------------------------------------------
// Arena: viewers pop in as avatar characters, then react.
// ---------------------------------------------------------------------------

interface ArenaChar {
  key: string
  user: string
  nickname: string
  avatarUrl: string
  joinedAt: number
  bubble: string | null
  hearts: number
  crown: boolean
  grow: number
  confetti: boolean
  followBadge: boolean
}

const MAX_CHARS = 12
const chars = ref<ArenaChar[]>([])
const charTimers = new Map<string, ReturnType<typeof setTimeout>>()

function clearTimers(key: string) {
  const t = charTimers.get(key)
  if (t) clearTimeout(t)
  charTimers.delete(key)
}

function patchChar(key: string, patch: Partial<ArenaChar>) {
  const i = chars.value.findIndex((c) => c.key === key)
  if (i >= 0) chars.value[i] = { ...chars.value[i], ...patch }
}

function ensureChar(user: string, nickname: string, avatarUrl: string): ArenaChar {
  const key = user || 'anon'
  let c = chars.value.find((x) => x.key === key)
  if (c) {
    // refresh identity, keep it visible
    c.nickname = nickname || c.nickname
    c.avatarUrl = avatarUrl || c.avatarUrl
    return c
  }
  c = {
    key,
    user,
    nickname: nickname || user || 'anon',
    avatarUrl: avatarUrl || '',
    joinedAt: Date.now(),
    bubble: null,
    hearts: 0,
    crown: false,
    grow: 1,
    confetti: false,
    followBadge: false
  }
  chars.value = [...chars.value, c]
  if (chars.value.length > MAX_CHARS) {
    const evicted = chars.value.shift()!
    clearTimers(evicted.key)
  }
  return c
}

function onMember(m: { id: string; user: string; nickname: string; avatarUrl: string }) {
  ensureChar(m.user, m.nickname, m.avatarUrl)
  sfx.trigger('join', { enabled: sfxOn.value })
}

function onChat(m: { id: string; user: string; nickname: string; avatarUrl: string; comment: string }) {
  const c = ensureChar(m.user, m.nickname, m.avatarUrl)
  const text = (m.comment || '').trim().slice(0, 60)
  if (!text) return
  c.bubble = text
  clearTimers(c.key)
  charTimers.set(c.key, setTimeout(() => patchChar(c.key, { bubble: null }), 3200))
}

function onLike(l: { id: string; user: string; nickname: string; avatarUrl: string; likeCount: number }) {
  const c = ensureChar(l.user, l.nickname, l.avatarUrl)
  c.hearts = Math.min(12, c.hearts + Math.min(l.likeCount || 1, 6))
  sfx.trigger('reaction', { enabled: sfxOn.value })
  clearTimers(c.key)
  charTimers.set(c.key, setTimeout(() => patchChar(c.key, { hearts: 0 }), 2400))
}

function onGift(g: { id: string; user: string; nickname: string; avatarUrl: string; diamondCount: number }) {
  const c = ensureChar(g.user, g.nickname, g.avatarUrl)
  const d = g.diamondCount || 1
  const big = d >= 100
  c.crown = big
  c.confetti = big
  c.grow = big ? 1.6 : 1.25
  clearTimers(c.key)
  charTimers.set(
    c.key,
    setTimeout(() => patchChar(c.key, { crown: false, confetti: false, grow: 1 }), big ? 5000 : 2600)
  )
}

function onFollow(f: { id: string; user: string; nickname: string; avatarUrl: string }) {
  const c = ensureChar(f.user, f.nickname, f.avatarUrl)
  c.followBadge = true
  sfx.trigger('follow', { enabled: sfxOn.value })
  clearTimers(c.key)
  charTimers.set(c.key, setTimeout(() => patchChar(c.key, { followBadge: false }), 4200))
}

// ----- comment TTS: read incoming viewer comments aloud for the host -----

function speakable(text: string): string {
  return (text || '').replace(EMOJI_RE, '').replace(/\s+/g, ' ').trim()
}

function speakComment(m: { id: string; user: string; nickname: string; avatarUrl: string; comment: string }) {
  if (!commentTtsOn.value) return
  const body = speakable(m.comment)
  if (!body) return
  const who = speakable(m.nickname || m.user)
  const line = who ? `${who}: ${body}` : body
  speak(line, { lang: commentVoice.value })
}

watch(
  () => stream.messages.value[0],
  (m) => {
    if (m) speakComment(m)
  }
)

watch(() => stream.members.value[0], onMember)
watch(() => stream.messages.value[0], onChat)
watch(() => stream.likes.value[0], onLike)
watch(() => stream.gifts.value[0], onGift)
watch(() => stream.follows.value[0], onFollow)

// ---------------------------------------------------------------------------
// Avatar Marble Race: gift pushes a viewer's avatar along the track.
// Reuses the marble race engine shape from the mini-game widget.
// ---------------------------------------------------------------------------

const LANES = 4
interface Racer {
  user: string
  nickname: string
  avatarUrl: string
  pos: number
}

const racers = ref<Racer[]>([])
const raceWinner = ref<string | null>(null)
let raceResetTimer: ReturnType<typeof setTimeout> | null = null

function defaultRacers(): Racer[] {
  return Array.from({ length: LANES }, (_, i) => ({
    user: '',
    nickname: `Racer ${i + 1}`,
    avatarUrl: '',
    pos: 0
  }))
}

function currentRoster(): { user: string; nickname: string; avatarUrl: string }[] {
  const map = new Map<string, { user: string; nickname: string; avatarUrl: string }>()
  for (const m of stream.members.value) if (!map.has(m.user)) map.set(m.user, m)
  for (const g of stream.gifters.value) {
    const gName = g[0]
    const ev = stream.gifts.value.find((x) => x.user === gName)
    if (!map.has(gName)) map.set(gName, { user: gName, nickname: ev?.nickname || gName, avatarUrl: ev?.avatarUrl || '' })
  }
  return [...map.values()].slice(0, LANES)
}

function refreshRacers() {
  const roster = currentRoster()
  const next = defaultRacers()
  for (let i = 0; i < LANES; i++) {
    const r = roster[i]
    if (r) next[i] = { ...r, pos: racers.value[i]?.pos || 0 }
  }
  racers.value = next
}

function advanceMarble() {
  if (raceWinner.value !== null) return
  const i = Math.floor(Math.random() * LANES)
  const r = racers.value[i]
  r.pos = Math.min(100, r.pos + 2 + Math.random() * 9)
  sfx.trigger('marble', { enabled: sfxOn.value })
  if (r.pos >= 100 && r.user) {
    raceWinner.value = r.user
    sfx.trigger('win', { enabled: sfxOn.value })
    raceResetTimer = setTimeout(() => {
      racers.value = defaultRacers()
      raceWinner.value = null
      refreshRacers()
    }, 4000)
  }
}

watch(
  () => stream.gifts.value[0],
  (g) => {
    if (!g) return
    if (mode.value !== 'marble') return
    advanceMarble()
  },
  { flush: 'sync' }
)

watch(
  () => stream.members.value[0],
  () => {
    if (mode.value === 'marble' && racers.value.every((r) => !r.user)) refreshRacers()
  }
)

watch(mode, (m) => {
  if (m === 'marble') refreshRacers()
})

// ---------------------------------------------------------------------------
// Avatar War: two teams, viewers split by hash, gift fills each side.
// ---------------------------------------------------------------------------

const warTeams = computed(() => {
  let a = 0
  let b = 0
  const rosterA: { user: string; nickname: string; avatarUrl: string }[] = []
  const rosterB: { user: string; nickname: string; avatarUrl: string }[] = []
  const seen = new Set<string>()
  for (const g of stream.gifts.value) {
    if (hashStr(g.user) % 2 === 0) a += g.diamondCount
    else b += g.diamondCount
    if (!seen.has(g.user)) {
      seen.add(g.user)
      const entry = { user: g.user, nickname: g.nickname, avatarUrl: g.avatarUrl }
      if (hashStr(g.user) % 2 === 0) rosterA.push(entry)
      else rosterB.push(entry)
    }
  }
  return { a, b, rosterA, rosterB }
})

const warTotal = computed(() => warTeams.value.a + warTeams.value.b)
const pctA = computed(() => (warTotal.value > 0 ? (warTeams.value.a / warTotal.value) * 100 : 50))

// ---------------------------------------------------------------------------
// Beyblade Arena: viewer avatars spin like beyblades and clash in a stadium.
// Idle beys spin calmly in place (barely move). A like sends the bey hunting
// the nearest target to clash — likes also heal (nyawa), while gifts feed
// power (damage). Chat renders on the spinning top. The host is a permanent
// player with higher base damage, and greets/answers viewers via AI.
// ---------------------------------------------------------------------------

interface Bey {
  key: string
  user: string
  nickname: string
  avatarUrl: string
  power: number
  hp: number
  maxHp: number
  isHost: boolean
  burst: boolean
  comment: string | null
  crown: boolean
  // physics (percent coords inside the stadium, center = 50,50)
  x: number
  y: number
  vx: number
  vy: number
  lastClash: number
  // like-driven aggression: while aggroUntil is in the future the bey seeks a
  // target and clashes; otherwise it spins calmly in place (barely moves).
  aggroUntil: number
  target: string | null
}

const BEY_MAX = 10
const HOST_POWER = 20
const HOST_HP = 100
const VIEWER_HP = 100
const POWER_CAP = 300      // max power — pure like accumulation is the only source
const CLASH_DMG_MIN = 8
const CLASH_DMG_MAX = 30   // no one-shot kills: strongest clash still needs 4 hits
const RIM = 38             // stadium radius (%), beys bounce off this rim
const BEY_RADIUS = 13      // collision distance (%)
const CLASH_COOLDOWN = 900 // ms between clashes for a given bey

const beys = ref<Bey[]>([])
const beyWinner = ref<string | null>(null)
const clashPair = ref<{ a: string; b: string } | null>(null)
const sparks = ref<Array<{ id: number; x: number; y: number }>>([])
let sparkSeq = 0
const hostSay = ref<string | null>(null)
const hostThinking = ref(false)
const hostNotice = ref<string | null>(null)
const beyCommentTimers = new Map<string, ReturnType<typeof setTimeout>>()
let physicsRaf: number | null = null
let lastFrame = 0
let lastHostSayAt = 0
let hostSayTimer: ReturnType<typeof setTimeout> | null = null
const hostSessionId = createHostSessionId()

const aiEnabled = computed(() => props.settings.ai !== false)
const aiConfig = computed(() => ({ model: props.settings.aiModel, sessionId: hostSessionId }))

function hostName() {
  return stream.username.value.trim().replace(/^@/, '') || 'HOST'
}

function hostBey(): Bey {
  const name = hostName()
  return {
    key: 'host',
    user: name,
    nickname: name,
    avatarUrl: fallbackAvatar(name),
    power: HOST_POWER,
    hp: HOST_HP,
    maxHp: HOST_HP,
    isHost: true,
    burst: false,
    comment: null,
    crown: true,
    x: 50,
    y: 26,
    vx: 4,
    vy: 0,
    lastClash: 0,
    aggroUntil: 0,
    target: null
  }
}

function initBeys() {
  beys.value = [hostBey()]
  beyWinner.value = null
  clearHostSay()
}

// Launch a new viewer on a ring with only a gentle drift, so it spins calmly
// in place until a like sends it hunting for a target.
function spawnViewer(b: Bey, i: number, n: number) {
  const angle = (Math.PI * 2 * i) / n + Math.random() * 0.6
  const r = 20 + Math.random() * 14
  b.x = 50 + Math.cos(angle) * r
  b.y = 50 + Math.sin(angle) * r
  const speed = 4 + Math.random() * 6
  b.vx = -Math.sin(angle) * speed
  b.vy = Math.cos(angle) * speed
}

function ensureBey(user: string, nickname: string, avatarUrl: string): Bey {
  const key = user || 'anon'
  let b = beys.value.find((x) => x.key === key)
  if (b) {
    b.nickname = nickname || b.nickname
    b.avatarUrl = avatarUrl || b.avatarUrl
    return b
  }
  b = {
    key,
    user,
    nickname: nickname || user || 'anon',
    avatarUrl: avatarUrl || fallbackAvatar(user || 'anon'),
    power: 0,
    hp: VIEWER_HP,
    maxHp: VIEWER_HP,
    isHost: false,
    burst: false,
    comment: null,
    crown: false,
    x: 50,
    y: 50,
    vx: 0,
    vy: 0,
    lastClash: 0,
    aggroUntil: 0,
    target: null
  }
  const viewers = beys.value.filter((x) => !x.isHost)
  spawnViewer(b, viewers.length, viewers.length + 1)
  beys.value = [...beys.value, b]
  if (beys.value.filter((x) => !x.isHost).length > BEY_MAX) {
    const evict = beys.value.find((x) => !x.isHost)
    if (evict) {
      beys.value = beys.value.filter((x) => x !== evict)
      beyCommentTimers.delete(evict.key)
    }
  }
  return b
}

function patchBey(key: string, patch: Partial<Bey>) {
  const i = beys.value.findIndex((x) => x.key === key)
  if (i >= 0) beys.value[i] = { ...beys.value[i], ...patch }
}

function beyPos(b: Bey) {
  return { left: b.x + '%', top: b.y + '%' }
}

function spinDur(b: Bey) {
  return Math.min(2.4, Math.max(0.35, 1.7 - b.power * 0.006))
}

function hpPct(b: Bey) {
  return Math.max(0, Math.min(100, (b.hp / b.maxHp) * 100))
}

function setBeyComment(b: Bey, text: string) {
  b.comment = text
  const prev = beyCommentTimers.get(b.key)
  if (prev) clearTimeout(prev)
  beyCommentTimers.set(b.key, setTimeout(() => patchBey(b.key, { comment: null }), 3200))
}

// ----- host AI speech bubble -----

function clearHostSay() {
  hostSay.value = null
  hostThinking.value = false
  hostNotice.value = null
  if (hostSayTimer) {
    clearTimeout(hostSayTimer)
    hostSayTimer = null
  }
}

function showHostMessage(text: string | null, notice: string | null, hold = 6000) {
  hostSay.value = text
  hostNotice.value = notice
  hostThinking.value = false
  if (text && ttsOn.value) speak(text, { lang: aiVoice.value })
  if (hostSayTimer) clearTimeout(hostSayTimer)
  hostSayTimer = setTimeout(() => {
    hostSay.value = null
    hostNotice.value = null
  }, hold)
}

function handleHostResult(result: HostChatResult) {
  if (result.text && (result.status === 'ok' || result.status === 'fallback')) {
    showHostMessage(result.text, result.status === 'fallback' ? result.message : null)
    return
  }
  showHostMessage(null, result.message, 5000)
}

function maybeHostGreet(viewer: string) {
  if (!aiEnabled.value) return
  const now = Date.now()
  if (now - lastHostSayAt < 2000) return
  lastHostSayAt = now
  hostThinking.value = true
  hostGreet(aiConfig.value, hostName(), viewer).then(handleHostResult)
}

function maybeHostAnswer(viewer: string, comment: string) {
  if (!aiEnabled.value) return
  const clean = comment.trim()
  if (clean.length < 3 || clean.startsWith('!')) return
  const now = Date.now()
  if (now - lastHostSayAt < 6000) return
  lastHostSayAt = now
  hostThinking.value = true
  hostAnswer(aiConfig.value, hostName(), viewer, clean).then(handleHostResult)
}

function onBeyMember(m: { id: string; user: string; nickname: string; avatarUrl: string }) {
  const isNew = !beys.value.some((x) => x.key === (m.user || 'anon'))
  ensureBey(m.user, m.nickname, m.avatarUrl)
  sfx.trigger('join', { enabled: sfxOn.value })
  if (isNew) maybeHostGreet(m.nickname || m.user)
}

function onBeyChat(m: { id: string; user: string; nickname: string; avatarUrl: string; comment: string }) {
  const b = ensureBey(m.user, m.nickname, m.avatarUrl)
  const text = (m.comment || '').trim().slice(0, 28)
  if (text) setBeyComment(b, text)
  maybeHostAnswer(m.nickname || m.user, m.comment || '')
}

function onBeyLike(l: { id: string; user: string; nickname: string; avatarUrl: string; likeCount: number }) {
  const b = ensureBey(l.user, l.nickname, l.avatarUrl)
  // Power is driven PURELY by likes — "kenceng-kencengan like". Likes charge
  // attack power only; attacking spends it. HP only recovers via gifts.
  const boost = Math.min(20, l.likeCount || 1)
  b.power = Math.min(POWER_CAP, b.power + boost)
  b.aggroUntil = Date.now() + 1600 + boost * 200
  if (!b.isHost) assignTarget(b)
  sfx.trigger('reaction', { enabled: sfxOn.value })
}

function onBeyGift(g: { id: string; user: string; nickname: string; avatarUrl: string; diamondCount: number }) {
  const b = ensureBey(g.user, g.nickname, g.avatarUrl)
  const d = g.diamondCount || 1
  const big = d >= 100
  // Gifts restore HP and trigger the crown celebration, but they do NOT add
  // power — only likes do. This keeps big spenders strong without making them
  // one-shot everyone; everyone can win by tapping like hard.
  b.hp = Math.min(b.maxHp, b.hp + Math.min(60, Math.floor(d * 0.8)))
  b.crown = b.crown || big
  sfx.trigger(big ? 'gift-big' : 'gift', { enabled: sfxOn.value })
  const prev = beyCommentTimers.get(b.key + ':crown')
  if (prev) clearTimeout(prev)
  beyCommentTimers.set(b.key + ':crown', setTimeout(() => patchBey(b.key, { crown: b.isHost }), big ? 5000 : 2600))
}

function onBeyFollow(f: { id: string; user: string; nickname: string; avatarUrl: string }) {
  const b = ensureBey(f.user, f.nickname, f.avatarUrl)
  // Follow heals a bit, but does not add power — power is like-driven only.
  b.hp = Math.min(b.maxHp, b.hp + 15)
  sfx.trigger('follow', { enabled: sfxOn.value })
}

function burstBey(b: Bey) {
  if (b.burst) return
  b.burst = true
  sfx.trigger('burst', { enabled: sfxOn.value })
  setTimeout(() => {
    beys.value = beys.value.filter((x) => x.key !== b.key)
    beyCommentTimers.delete(b.key)
    const alive = beys.value.filter((x) => !x.burst)
    if (alive.length === 1) declareWinner(alive[0])
  }, 900)
}

function declareWinner(b: Bey) {
  beyWinner.value = b.nickname
  sfx.trigger('win', { enabled: sfxOn.value })
  setTimeout(() => initBeys(), 4000)
}

// ----- physics -----

// A bey is "aggressive" only while a like recently hit it (viewers only; the
// host stays calm). Aggressive beys chase a target and clash; idle beys just
// spin in place.
function isAggro(b: Bey, now: number) {
  return !b.isHost && now < b.aggroUntil
}

// Pick the nearest alive opponent as the hunt target.
function assignTarget(b: Bey) {
  const candidates = beys.value.filter((x) => x !== b && !x.burst)
  if (!candidates.length) {
    b.target = null
    return
  }
  let best = candidates[0]
  let bd = Infinity
  for (const c of candidates) {
    const dx = c.x - b.x
    const dy = c.y - b.y
    const d = dx * dx + dy * dy
    if (d < bd) {
      bd = d
      best = c
    }
  }
  b.target = best.key
}

function spawnSpark(x: number, y: number) {
  const id = ++sparkSeq
  sparks.value = [...sparks.value, { id, x, y }]
  setTimeout(() => {
    sparks.value = sparks.value.filter((s) => s.id !== id)
  }, 520)
}

function resolveClash(a: Bey, c: Bey) {
  spawnSpark((a.x + c.x) / 2, (a.y + c.y) / 2)
  const atk = a.power >= c.power ? a : c
  const def = a.power >= c.power ? c : a
  // Damage scales with the power gap but is clamped — the strongest like-lord
  // still needs multiple clashes to burst someone (no one-shot kills).
  const dmg = Math.min(
    CLASH_DMG_MAX,
    Math.max(CLASH_DMG_MIN, CLASH_DMG_MIN + Math.round((atk.power - def.power) * 0.12) + Math.floor(Math.random() * 6))
  )
  def.hp = Math.max(0, def.hp - dmg)
  // Attacking spends like power: the attacker loses power equal to the damage
  // dealt. A like-hoarder is strong for only a few hits, then must re-charge
  // by tapping again — so power goes up and down with likes and attacks.
  atk.power = Math.max(0, atk.power - dmg)
  clashPair.value = { a: atk.key, b: def.key }
  sfx.trigger('clash', { enabled: sfxOn.value })
  setTimeout(() => (clashPair.value = null), 320)
  if (def.hp <= 0) {
    if (def.isHost) {
      // Host is the permanent boss: it staggers (knockback + partial recovery)
      // instead of bursting, so the arena never ends up without a host.
      def.hp = Math.max(1, Math.round(def.maxHp * 0.35))
      const dx = def.x - atk.x
      const dy = def.y - atk.y
      const d = Math.hypot(dx, dy) || 1
      def.vx += (dx / d) * 70
      def.vy += (dy / d) * 70
      return
    }
    burstBey(def)
  } else {
    const alive = beys.value.filter((x) => !x.burst)
    if (alive.length === 1) declareWinner(alive[0])
  }
}

function stepPhysics(dt: number) {
  if (beyWinner.value !== null) return
  const active = beys.value.filter((b) => !b.burst)
  if (active.length === 0) return

  const now = Date.now()

  for (const b of active) {
    if (b.isHost) b.hp = Math.min(b.maxHp, b.hp + 2 * dt)

    let ax = 0
    let ay = 0
    const aggressive = isAggro(b, now)

    if (aggressive) {
      // Hunt the assigned target — steer straight at it. More power = faster
      // chase, so stacked likes send the bey flying into clashes.
      const t = b.target ? beys.value.find((x) => x.key === b.target && !x.burst) : null
      if (t) {
        const dx = t.x - b.x
        const dy = t.y - b.y
        const d = Math.hypot(dx, dy) || 1
        const seek = 60 + Math.min(90, b.power * 0.25)
        ax = (dx / d) * seek
        ay = (dy / d) * seek
      } else {
        assignTarget(b)
        if (!b.target) {
          ax = (Math.random() - 0.5) * 6
          ay = (Math.random() - 0.5) * 6
        }
      }
    } else {
      // Idle: spin calmly in place — gentle random drift with strong damping so
      // it doesn't wander around or clash on its own.
      ax = (Math.random() - 0.5) * 6
      ay = (Math.random() - 0.5) * 6
      b.vx *= Math.max(0, 1 - 1.8 * dt)
      b.vy *= Math.max(0, 1 - 1.8 * dt)
    }

    b.vx += ax * dt
    b.vy += ay * dt

    const sp = Math.hypot(b.vx, b.vy)
    const maxSp = aggressive ? 38 + Math.min(34, b.power * 0.06) : 9
    if (sp > maxSp) {
      const k = maxSp / sp
      b.vx *= k
      b.vy *= k
    }
    b.x += b.vx * dt
    b.y += b.vy * dt

    // rim bounce
    const r = Math.hypot(b.x - 50, b.y - 50)
    if (r > RIM) {
      const nx = (b.x - 50) / r
      const ny = (b.y - 50) / r
      b.x = 50 + nx * RIM
      b.y = 50 + ny * RIM
      const dot = b.vx * nx + b.vy * ny
      if (dot > 0) {
        b.vx -= 2 * dot * nx
        b.vy -= 2 * dot * ny
      }
    }
  }

  // pairwise collision → clash (only when at least one bey is aggressive)
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i]
      const c = active[j]
      const dx = c.x - a.x
      const dy = c.y - a.y
      const d = Math.hypot(dx, dy)
      if (d > 0.01 && d < BEY_RADIUS) {
        const nx = dx / d
        const ny = dy / d
        const overlap = (BEY_RADIUS - d) / 2
        a.x -= nx * overlap
        a.y -= ny * overlap
        c.x += nx * overlap
        c.y += ny * overlap
        const dotA = a.vx * nx + a.vy * ny
        const dotC = c.vx * nx + c.vy * ny
        a.vx += (dotC - dotA) * nx
        a.vy += (dotC - dotA) * ny
        c.vx += (dotA - dotC) * nx
        c.vy += (dotA - dotC) * ny
        const wantClash = isAggro(a, now) || isAggro(c, now)
        if (wantClash && now - a.lastClash > CLASH_COOLDOWN && now - c.lastClash > CLASH_COOLDOWN) {
          a.lastClash = now
          c.lastClash = now
          resolveClash(a, c)
        }
      }
    }
  }
}

function physicsLoop(ts: number) {
  if (!lastFrame) lastFrame = ts
  const dt = Math.min(0.05, (ts - lastFrame) / 1000)
  lastFrame = ts
  stepPhysics(dt)
  physicsRaf = requestAnimationFrame(physicsLoop)
}

function startPhysics() {
  stopPhysics()
  lastFrame = 0
  physicsRaf = requestAnimationFrame(physicsLoop)
}

function stopPhysics() {
  if (physicsRaf != null) {
    cancelAnimationFrame(physicsRaf)
    physicsRaf = null
  }
}

watch(
  mode,
  (m) => {
    if (m === 'beyblade') {
      if (!beys.value.length) initBeys()
      if (typeof window !== 'undefined') startPhysics()
    } else {
      stopPhysics()
    }
  },
  { immediate: true }
)

watch(
  () => stream.members.value[0],
  (m) => {
    if (m && mode.value === 'beyblade') onBeyMember(m)
  }
)
watch(
  () => stream.messages.value[0],
  (m) => {
    if (m && mode.value === 'beyblade') onBeyChat(m)
  }
)
watch(
  () => stream.likes.value[0],
  (l) => {
    if (l && mode.value === 'beyblade') onBeyLike(l)
  }
)
watch(
  () => stream.gifts.value[0],
  (g) => {
    if (g && mode.value === 'beyblade') onBeyGift(g)
  }
)
watch(
  () => stream.follows.value[0],
  (f) => {
    if (f && mode.value === 'beyblade') onBeyFollow(f)
  }
)

onBeforeUnmount(() => {
  stopPhysics()
  clearHostSay()
})
</script>

<template>
  <div class="aa" :class="mode">
    <!-- ============ ARENA ============ -->
    <div v-if="mode === 'arena'" class="arena">
      <div class="arena-head">
        <span class="arena-title">👥 Audience Arena</span>
        <span class="arena-count">{{ chars.length }} penonton</span>
      </div>

      <div class="arena-stage">
        <div v-for="c in chars" :key="c.key" class="char" :class="{ pop: true }">
          <div
            class="char-avatar-wrap"
            :style="{ transform: 'scale(' + c.grow + ')' }"
          >
            <img class="char-avatar" :src="c.avatarUrl" :alt="c.nickname" loading="lazy" />
            <div v-if="c.crown" class="char-crown">👑</div>
            <div v-if="c.confetti" class="char-confetti">
              <span v-for="n in 8" :key="n" class="cf" :style="{ '--i': n }">🎊</span>
            </div>
            <div v-if="c.hearts" class="char-hearts">
              <span v-for="n in c.hearts" :key="n" class="ht" :style="{ '--i': n }">❤️</span>
            </div>
            <div v-if="c.followBadge" class="char-follow">➕ FOLLOW</div>
          </div>
          <div class="char-nameplate">@{{ c.nickname }}</div>
          <div v-if="c.bubble" class="char-bubble">{{ c.bubble }}</div>
        </div>

        <div v-if="!chars.length" class="arena-empty">
          <div class="ae-icon">🫥</div>
          <p>Tunggu penonton join…</p>
        </div>
      </div>
    </div>

    <!-- ============ MARBLE RACE ============ -->
    <div v-else-if="mode === 'marble'" class="marble">
      <div class="mg-head">
        <span class="mg-title">🏁 Avatar Race</span>
        <span class="mg-hint">gift = dorong avatar-mu</span>
      </div>
      <div class="track">
        <div v-for="(r, i) in racers" :key="i" class="lane">
          <div class="lane-track">
            <div class="racer" :style="{ left: r.pos + '%' }">
              <img class="racer-avatar" :src="r.avatarUrl" :alt="r.nickname" loading="lazy" />
            </div>
            <div v-if="raceWinner === r.user" class="win-flag">🏆</div>
          </div>
          <div class="lane-name">@{{ r.nickname }}</div>
        </div>
      </div>
      <div v-if="raceWinner" class="win-banner">@{{ raceWinner }} menang!</div>
    </div>

    <!-- ============ AVATAR WAR ============ -->
    <div v-else-if="mode === 'war'" class="war">
      <div class="mg-head">
        <span class="mg-title">⚔️ Avatar War</span>
        <span class="mg-hint">gift = isi kubu</span>
      </div>

      <div class="war-side">
        <div class="war-avatars">
          <img
            v-for="p in warTeams.rosterA.slice(0, 5)"
            :key="'a' + p.user"
            class="war-avatar a"
            :src="p.avatarUrl"
            :alt="p.nickname"
            loading="lazy"
          />
          <span v-if="!warTeams.rosterA.length" class="war-empty-avatar a">?</span>
        </div>
        <div class="war-row">
          <span class="war-team">🔴 Kubu Merah</span>
          <span class="war-val">{{ fmtNum(warTeams.a) }} 💎</span>
        </div>
      </div>

      <div class="war-bar">
        <div class="war-fill a" :style="{ width: pctA + '%' }"></div>
        <div class="war-fill b" :style="{ width: 100 - pctA + '%' }"></div>
      </div>

      <div class="war-side">
        <div class="war-avatars">
          <img
            v-for="p in warTeams.rosterB.slice(0, 5)"
            :key="'b' + p.user"
            class="war-avatar b"
            :src="p.avatarUrl"
            :alt="p.nickname"
            loading="lazy"
          />
          <span v-if="!warTeams.rosterB.length" class="war-empty-avatar b">?</span>
        </div>
        <div class="war-row">
          <span class="war-team">🔵 Kubu Biru</span>
          <span class="war-val">{{ fmtNum(warTeams.b) }} 💎</span>
        </div>
      </div>

      <div class="war-lead">
        {{ warTeams.a === warTeams.b ? 'Imbang!' : warTeams.a > warTeams.b ? 'Kubu Merah unggul' : 'Kubu Biru unggul' }}
      </div>
    </div>

    <!-- ============ BEYBLADE ARENA ============ -->
    <div v-else class="beyblade">
      <div class="mg-head">
        <span class="mg-title">🌀 Beyblade Arena</span>
        <span class="mg-hint">like = kekuatan + adu · gift = nyawa</span>
      </div>

      <div class="stadium" :class="{ shake: clashPair }">
        <div class="stadium-ring"></div>
        <div class="stadium-core"></div>

        <div class="host-say" v-if="hostSay || hostThinking">
          <span class="host-say-tag">👑 {{ hostName() }}</span>
          <span v-if="hostThinking" class="host-say-dots"><i>·</i><i>·</i><i>·</i></span>
          <span v-else class="host-say-text">{{ hostSay }}</span>
        </div>

        <div
          v-for="b in beys"
          :key="b.key"
          class="bey"
          :class="{ host: b.isHost, burst: b.burst, clashing: clashPair && (clashPair.a === b.key || clashPair.b === b.key) }"
          :style="beyPos(b)"
        >
          <div class="bey-top" :style="{ '--spin-dur': spinDur(b) + 's' }">
            <div class="bey-rotor">
              <div class="bey-blade"></div>
              <div class="bey-comet"></div>
            </div>
            <img class="bey-avatar" :src="b.avatarUrl" :alt="b.nickname" loading="lazy" />
            <div v-if="b.crown" class="bey-crown">👑</div>
            <div v-if="b.comment" class="bey-comment">{{ b.comment }}</div>
          </div>
          <div class="bey-nameplate" :class="{ host: b.isHost }">
            {{ b.isHost ? '👑 ' : '' }}@{{ b.nickname }}
          </div>
          <div class="bey-bar"><div class="bey-bar-fill" :style="{ width: hpPct(b) + '%' }"></div></div>
          <div class="bey-power">⚡ {{ fmtNum(b.power) }}</div>
        </div>

        <div v-for="s in sparks" :key="s.id" class="bey-spark" :style="{ left: s.x + '%', top: s.y + '%' }">
          <span v-for="n in 6" :key="n" class="sp" :style="{ '--i': n }"></span>
        </div>

        <div v-if="beyWinner" class="bey-win">🏆 @{{ beyWinner }} menang!</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.aa {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 2cqw;
  background: oklch(15% 0.02 280 / 0.72);
  border: 1px solid oklch(60% 0.05 280 / 0.35);
  backdrop-filter: blur(10px);
  overflow: hidden;
  padding: 2cqw;
}

.mg-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1.5cqw;
}
.mg-title { font-size: 3.4cqw; font-weight: 700; }
.mg-hint { font-size: 2.2cqw; color: oklch(80% 0.02 90); }

/* ---------- Arena ---------- */
.arena { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.arena-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1.5cqw;
}
.arena-title { font-size: 3.4cqw; font-weight: 700; }
.arena-count { font-size: 2.2cqw; color: oklch(80% 0.02 90); }
.arena-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: center;
  gap: 1.6cqw;
  overflow-y: auto;
  padding-bottom: 1cqw;
}
.char {
  position: relative;
  width: 14cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes popIn {
  from { opacity: 0; transform: translateY(3cqw) scale(0.4); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.char-avatar-wrap {
  position: relative;
  width: 9cqw;
  height: 9cqw;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.char-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 0.5cqw solid oklch(82% 0.15 195);
  background: oklch(25% 0.03 280);
  box-shadow: 0 0 2cqw oklch(0% 0 0 / 0.5);
}
.char-nameplate {
  margin-top: 0.8cqw;
  max-width: 100%;
  font-size: 2cqw;
  font-weight: 700;
  color: oklch(95% 0.02 90);
  background: oklch(20% 0.03 280 / 0.85);
  border-radius: 999px;
  padding: 0.4cqw 1.2cqw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.char-bubble {
  position: absolute;
  top: -6cqw;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  color: #111;
  font-size: 2.2cqw;
  font-weight: 600;
  padding: 0.8cqw 1.6cqw;
  border-radius: 1.6cqw;
  max-width: 22cqw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 0.5cqw 2cqw oklch(0% 0 0 / 0.5);
  z-index: 6;
  animation: bubbleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.char-bubble::after {
  content: '';
  position: absolute;
  bottom: -0.8cqw;
  left: 50%;
  transform: translateX(-50%);
  border: 0.8cqw solid transparent;
  border-top-color: #fff;
}
@keyframes bubbleIn {
  from { opacity: 0; transform: translateX(-50%) scale(0.5); }
  to { opacity: 1; transform: translateX(-50%) scale(1); }
}
.char-crown {
  position: absolute;
  top: -4cqw;
  left: 50%;
  transform: translateX(-50%);
  font-size: 4.5cqw;
  z-index: 5;
  animation: crownDrop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes crownDrop {
  from { transform: translateX(-50%) translateY(-3cqw) scale(0.4); }
  to { transform: translateX(-50%) translateY(0) scale(1); }
}
.char-confetti {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
}
.cf {
  position: absolute;
  top: 0;
  left: 50%;
  font-size: 2.4cqw;
  animation: confetti 1.4s ease-out forwards;
  animation-delay: calc(var(--i) * 0.05s);
}
@keyframes confetti {
  from { transform: translate(0, 0) scale(1); opacity: 1; }
  to {
    transform: translate(calc((var(--i) - 4) * 2.6cqw), calc(var(--i) * 1.2cqw)) rotate(calc((var(--i) - 4) * 60deg));
    opacity: 0;
  }
}
.char-hearts {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
}
.ht {
  position: absolute;
  bottom: 0;
  left: 50%;
  font-size: 2.6cqw;
  animation: heartUp 1.6s ease-out forwards;
  animation-delay: calc(var(--i) * 0.09s);
}
@keyframes heartUp {
  from { transform: translateX(-50%) translateY(0) scale(0.5); opacity: 1; }
  to {
    transform: translateX(calc((var(--i) - 3) * 2.2cqw)) translateY(-8cqw) scale(1.3);
    opacity: 0;
  }
}
.char-follow {
  position: absolute;
  top: -3cqw;
  left: 50%;
  transform: translateX(-50%);
  background: oklch(75% 0.19 350);
  color: #fff;
  font-size: 2cqw;
  font-weight: 700;
  padding: 0.5cqw 1.4cqw;
  border-radius: 999px;
  z-index: 5;
  white-space: nowrap;
  animation: bubbleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.arena-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: oklch(80% 0.02 90);
  font-size: 3cqw;
}
.ae-icon { font-size: 8cqw; margin-bottom: 1cqw; }

/* ---------- Marble Race ---------- */
.marble { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.track {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.4cqw;
  justify-content: center;
}
.lane { display: flex; flex-direction: column; gap: 0.4cqw; }
.lane-track {
  position: relative;
  height: 5cqw;
  border-radius: 999px;
  background: oklch(28% 0.03 280 / 0.8);
  border: 1px solid oklch(60% 0.05 280 / 0.25);
  overflow: visible;
}
.racer {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 6cqw;
  height: 6cqw;
  transition: left 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  z-index: 2;
}
.racer-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 0.4cqw solid oklch(82% 0.15 195);
  background: oklch(25% 0.03 280);
  box-shadow: 0 0 1.5cqw oklch(0% 0 0 / 0.5);
}
.win-flag {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  font-size: 4cqw;
}
.lane-name {
  font-size: 1.8cqw;
  color: oklch(80% 0.02 90);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.win-banner {
  text-align: center;
  font-size: 3.2cqw;
  font-weight: 700;
  color: oklch(85% 0.16 90);
  animation: pulse 0.6s ease-in-out infinite;
}
@keyframes pulse { 50% { opacity: 0.4; } }

/* ---------- Avatar War ---------- */
.war { display: flex; flex-direction: column; flex: 1; min-height: 0; justify-content: center; gap: 1.2cqw; }
.war-side { display: flex; flex-direction: column; gap: 0.6cqw; }
.war-avatars { display: flex; gap: 0.8cqw; align-items: center; min-height: 5cqw; }
.war-avatar {
  width: 4.6cqw;
  height: 4.6cqw;
  border-radius: 50%;
  object-fit: cover;
  background: oklch(25% 0.03 280);
}
.war-avatar.a { border: 0.3cqw solid oklch(70% 0.2 25); }
.war-avatar.b { border: 0.3cqw solid oklch(70% 0.17 230); }
.war-empty-avatar {
  width: 4.6cqw;
  height: 4.6cqw;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #fff;
}
.war-empty-avatar.a { background: oklch(55% 0.15 25); }
.war-empty-avatar.b { background: oklch(55% 0.14 230); }
.war-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 2.8cqw;
}
.war-team { font-weight: 700; }
.war-val { font-family: var(--font-mono); color: oklch(85% 0.16 90); }
.war-bar {
  display: flex;
  height: 5cqw;
  border-radius: 999px;
  overflow: hidden;
}
.war-fill.a { background: linear-gradient(90deg, oklch(70% 0.2 25), oklch(75% 0.19 350)); transition: width 0.5s; }
.war-fill.b { background: linear-gradient(90deg, oklch(70% 0.17 230), oklch(82% 0.15 195)); transition: width 0.5s; }
.war-lead { text-align: center; font-size: 3cqw; font-weight: 700; color: oklch(82% 0.15 195); }

/* ---------- Beyblade Arena ---------- */
.beyblade { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.stadium {
  position: relative;
  flex: 1;
  min-height: 0;
  border-radius: 50%;
  background:
    radial-gradient(80% 80% at 50% 50%, oklch(30% 0.05 280) 0%, oklch(20% 0.03 280) 55%, oklch(12% 0.02 280) 100%);
  border: 0.6cqw solid oklch(60% 0.08 280 / 0.5);
  box-shadow: inset 0 0 4cqw oklch(0% 0 0 / 0.6), 0 0 3cqw oklch(82% 0.15 195 / 0.15);
  overflow: hidden;
}
.stadium.shake { animation: stadiumShake 0.32s ease-in-out; }
@keyframes stadiumShake {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(-0.6cqw, 0.4cqw); }
  50% { transform: translate(0.6cqw, -0.4cqw); }
  75% { transform: translate(-0.4cqw, -0.3cqw); }
}
.stadium-ring {
  position: absolute;
  inset: 6%;
  border-radius: 50%;
  border: 0.4cqw dashed oklch(70% 0.05 280 / 0.35);
  animation: ringSpin 26s linear infinite;
}
@keyframes ringSpin {
  to { transform: rotate(360deg); }
}
.stadium-core {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12cqw;
  height: 12cqw;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(60% 60% at 50% 40%, oklch(85% 0.16 90 / 0.25), transparent 70%);
  pointer-events: none;
}
.host-say {
  position: absolute;
  top: 6%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1cqw;
  max-width: 78%;
  background: oklch(18% 0.03 280 / 0.9);
  border: 1px solid oklch(60% 0.05 280 / 0.4);
  border-radius: 999px;
  padding: 1cqw 2cqw;
  z-index: 8;
  box-shadow: 0 0.6cqw 2cqw oklch(0% 0 0 / 0.5);
  animation: bubbleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.host-say-tag {
  flex-shrink: 0;
  font-size: 2cqw;
  font-weight: 700;
  color: #0b0b0b;
  background: linear-gradient(135deg, oklch(85% 0.16 90), oklch(82% 0.15 195));
  border-radius: 999px;
  padding: 0.3cqw 1.2cqw;
}
.host-say-text {
  font-size: 2.4cqw;
  font-weight: 600;
  color: oklch(95% 0.02 90);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.host-say-dots {
  display: inline-flex;
  gap: 0.5cqw;
  font-style: normal;
  font-size: 3cqw;
  color: oklch(82% 0.15 195);
}
.host-say-dots i {
  animation: dotBlink 1s ease-in-out infinite;
}
.host-say-dots i:nth-child(2) { animation-delay: 0.15s; }
.host-say-dots i:nth-child(3) { animation-delay: 0.3s; }
@keyframes dotBlink {
  0%, 100% { opacity: 0.25; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-0.4cqw); }
}
.bey {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 16cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 3;
  will-change: left, top;
  animation: beyIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes beyIn {
  from { opacity: 0; transform: translate(-50%, -50%) scale(0.25); }
  to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
.bey.burst {
  animation: burstOut 0.9s ease-in forwards;
}
@keyframes burstOut {
  0% { opacity: 1; transform: translate(-50%, -50%) scale(1) rotate(0deg); }
  60% { transform: translate(-50%, -50%) scale(1.35) rotate(180deg); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.2) rotate(360deg); opacity: 0; }
}
.bey.clashing .bey-top { filter: drop-shadow(0 0 2cqw oklch(85% 0.16 90)); }
.bey-top {
  position: relative;
  width: 9cqw;
  height: 9cqw;
}
.bey-rotor {
  position: absolute;
  inset: 0;
  animation: beySpin linear infinite;
  animation-duration: var(--spin-dur, 1.4s);
  will-change: transform;
}
@keyframes beySpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.bey-blade {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, transparent 55%, oklch(20% 0.04 280) 55.5% 58%, transparent 58.5%),
    repeating-conic-gradient(
      oklch(92% 0.02 280) 0deg 10deg,
      oklch(86% 0.03 280) 10deg 14deg,
      oklch(30% 0.06 280) 14deg 24deg,
      oklch(72% 0.05 280) 24deg 33deg,
      oklch(18% 0.04 280) 33deg 45deg
    );
  box-shadow: inset 0 0 0.6cqw oklch(0% 0 0 / 0.6), 0 0 1.8cqw oklch(82% 0.15 195 / 0.4);
  filter: drop-shadow(0 0 1cqw oklch(82% 0.15 195 / 0.4));
}
.bey.host .bey-blade {
  background:
    radial-gradient(circle at 50% 50%, transparent 55%, oklch(30% 0.1 90) 55.5% 58%, transparent 58.5%),
    repeating-conic-gradient(
      oklch(85% 0.16 90) 0deg 10deg,
      oklch(80% 0.14 90) 10deg 14deg,
      oklch(45% 0.1 90) 14deg 24deg,
      oklch(82% 0.15 195) 24deg 33deg,
      oklch(25% 0.08 90) 33deg 45deg
    );
}
.bey-comet {
  position: absolute;
  top: 1%;
  left: 50%;
  width: 1.4cqw;
  height: 1.4cqw;
  margin: 0 0 0 -0.7cqw;
  border-radius: 50%;
  background: oklch(85% 0.16 90);
  box-shadow: 0 0 1.4cqw oklch(85% 0.16 90), 0 0 3cqw oklch(85% 0.16 90 / 0.5);
}
.bey-spark {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 6;
}
.bey-spark .sp {
  position: absolute;
  top: 0;
  left: 0;
  width: 1cqw;
  height: 1cqw;
  margin: -0.5cqw 0 0 -0.5cqw;
  border-radius: 50%;
  background: oklch(85% 0.16 90);
  box-shadow: 0 0 1.2cqw oklch(85% 0.16 90);
  animation: sparkOut 0.52s ease-out forwards;
}
@keyframes sparkOut {
  from { transform: rotate(calc(var(--i) * 60deg)) translateY(0) scale(1); opacity: 1; }
  to { transform: rotate(calc(var(--i) * 60deg)) translateY(-4.8cqw) scale(0.15); opacity: 0; }
}
.bey-avatar {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 58%;
  height: 58%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  object-fit: cover;
  border: 0.4cqw solid oklch(88% 0.02 280);
  background: oklch(25% 0.03 280);
  box-shadow: 0 0 1.6cqw oklch(0% 0 0 / 0.55);
}
.bey.host .bey-avatar { border-color: oklch(85% 0.16 90); box-shadow: 0 0 2.4cqw oklch(85% 0.16 90 / 0.5); }
.bey-crown {
  position: absolute;
  top: -40%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 4.5cqw;
  z-index: 5;
  filter: drop-shadow(0 0 1cqw oklch(85% 0.16 90 / 0.6));
}
.bey-comment {
  position: absolute;
  top: -78%;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  color: #111;
  font-size: 2cqw;
  font-weight: 700;
  padding: 0.5cqw 1.2cqw;
  border-radius: 1.4cqw;
  max-width: 20cqw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 0.5cqw 2cqw oklch(0% 0 0 / 0.5);
  z-index: 6;
}
.bey-nameplate {
  margin-top: 0.5cqw;
  max-width: 100%;
  font-size: 1.9cqw;
  font-weight: 700;
  color: oklch(95% 0.02 90);
  background: oklch(20% 0.03 280 / 0.85);
  border-radius: 999px;
  padding: 0.3cqw 1cqw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bey-nameplate.host {
  color: #0b0b0b;
  background: linear-gradient(135deg, oklch(85% 0.16 90), oklch(82% 0.15 195));
}
.bey-bar {
  margin-top: 0.4cqw;
  width: 10cqw;
  height: 1.6cqw;
  border-radius: 999px;
  background: oklch(28% 0.03 280 / 0.8);
  border: 1px solid oklch(60% 0.05 280 / 0.25);
  overflow: hidden;
}
.bey-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, oklch(70% 0.2 25), oklch(75% 0.19 350));
  transition: width 0.4s;
}
.bey.host .bey-bar-fill { background: linear-gradient(90deg, oklch(85% 0.16 90), oklch(82% 0.15 195)); }
.bey-power {
  margin-top: 0.3cqw;
  font-family: var(--font-mono);
  font-size: 1.8cqw;
  font-weight: 700;
  color: oklch(85% 0.16 90);
}
.bey-win {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 4.4cqw;
  font-weight: 700;
  color: oklch(85% 0.16 90);
  background: oklch(10% 0.02 280 / 0.55);
  z-index: 10;
  text-align: center;
  animation: winIn 0.35s ease-out, pulse 0.6s ease-in-out 0.35s infinite;
}
@keyframes winIn {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}
</style>
