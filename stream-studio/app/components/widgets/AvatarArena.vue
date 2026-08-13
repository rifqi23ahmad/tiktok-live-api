<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTikTokStream } from '~/composables/useTikTokStream'
import { hashStr, fmtNum } from '~/utils/stream'

const props = defineProps<{ settings: Record<string, any> }>()

const stream = useTikTokStream()

const mode = computed<'arena' | 'marble' | 'war'>(() => {
  const m = props.settings.mode
  if (m === 'marble') return 'marble'
  if (m === 'war') return 'war'
  return 'arena'
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
  clearTimers(c.key)
  charTimers.set(c.key, setTimeout(() => patchChar(c.key, { followBadge: false }), 4200))
}

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
  if (r.pos >= 100 && r.user) {
    raceWinner.value = r.user
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
    <div v-else class="war">
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
</style>
