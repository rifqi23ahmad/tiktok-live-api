import { computed, ref } from 'vue'
import type { GiftEvent, ChatEvent, LikeEvent, MemberEvent, FollowEvent } from '~/utils/stream'
import { uid, normalizeUser, fallbackAvatar } from '~/utils/stream'

export type StreamMode = 'idle' | 'live' | 'demo'

// Module-scoped singleton: every widget and panel shares one live feed.
const username = ref('')
const apiKey = ref('')
const mode = ref<StreamMode>('idle')
const connected = ref(false)
const error = ref<string | null>(null)
const viewers = ref(0)

const gifts = ref<GiftEvent[]>([])
const messages = ref<ChatEvent[]>([])
const likes = ref<LikeEvent[]>([])
const members = ref<MemberEvent[]>([])
const follows = ref<FollowEvent[]>([])
const battle = ref<any>(null)
const battleArmies = ref<any>(null)
const poll = ref<any>(null)

let ws: WebSocket | null = null
let demoTimer: ReturnType<typeof setInterval> | null = null

// ---------- derived ----------

const gifters = computed<Array<[string, number]>>(() => {
  const map = new Map<string, number>()
  for (const g of gifts.value) {
    map.set(g.user, (map.get(g.user) || 0) + g.diamondCount)
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
})

const totalDiamonds = computed(() =>
  gifts.value.reduce((sum, g) => sum + g.diamondCount, 0)
)

const totalLikes = computed(() => likes.value.reduce((sum, l) => sum + l.likeCount, 0))

// ---------- ingest ----------

function pushGift(raw: any) {
  const d = raw?.data ?? raw
  const user: string = d?.user?.uniqueId || 'anon'
  const nickname: string = d?.user?.nickname || user
  const avatarUrl: string = normalizeUser(d?.user).avatarUrl || fallbackAvatar(user)
  const repeatCount = d?.repeatCount || 1
  const diamondCount = (d?.diamondCount || 0) * repeatCount
  if (diamondCount <= 0) return
  gifts.value = [
    {
      id: uid(),
      user,
      nickname,
      avatarUrl,
      giftName: d?.giftName || 'Gift',
      diamondCount,
      repeatCount,
      repeatEnd: !!d?.repeatEnd
    },
    ...gifts.value
  ].slice(0, 200)
}

function pushChat(raw: any) {
  const d = raw?.data ?? raw
  const user: string = d?.user?.uniqueId || 'anon'
  const nickname: string = d?.user?.nickname || user
  const avatarUrl: string = normalizeUser(d?.user).avatarUrl || fallbackAvatar(user)
  messages.value = [
    { id: uid(), user, nickname, avatarUrl, comment: d?.comment || '' },
    ...messages.value
  ].slice(0, 200)
}

function pushLike(raw: any) {
  const d = raw?.data ?? raw
  const user: string = d?.user?.uniqueId || 'anon'
  const nickname: string = d?.user?.nickname || user
  const avatarUrl: string = normalizeUser(d?.user).avatarUrl || fallbackAvatar(user)
  likes.value = [
    { id: uid(), user, nickname, avatarUrl, likeCount: d?.likeCount || 1, totalLikes: d?.totalLikes || 0 },
    ...likes.value
  ].slice(0, 100)
}

function pushMember(raw: any) {
  const d = raw?.data ?? raw
  const user: string = d?.user?.uniqueId || 'anon'
  const nickname: string = d?.user?.nickname || user
  const avatarUrl: string = normalizeUser(d?.user).avatarUrl || fallbackAvatar(user)
  members.value = [
    { id: uid(), user, nickname, avatarUrl },
    ...members.value
  ].slice(0, 50)
}

function pushFollow(raw: any) {
  const d = raw?.data ?? raw
  const user: string = d?.user?.uniqueId || 'anon'
  const nickname: string = d?.user?.nickname || user
  const avatarUrl: string = normalizeUser(d?.user).avatarUrl || fallbackAvatar(user)
  follows.value = [
    { id: uid(), user, nickname, avatarUrl },
    ...follows.value
  ].slice(0, 50)
}

function handleMessage(msg: any) {
  const evt = msg?.event || 'unknown'
  switch (evt) {
    case 'gift': {
      const d = msg.data || {}
      // Skip intermediate streak ticks (repeatEnd marks the end of a combo).
      if (d.giftType === 1 && !d.repeatEnd) break
      pushGift(msg)
      break
    }
    case 'chat':
      pushChat(msg)
      break
    case 'like':
      pushLike(msg)
      break
    case 'member':
      pushMember(msg)
      break
    case 'follow':
      pushFollow(msg)
      break
    case 'roomUserSeq':
      viewers.value = msg.data?.viewerCount || 0
      break
    case 'battle':
      battle.value = msg.data
      break
    case 'battleArmies':
      battleArmies.value = msg.data
      break
    case 'poll':
      poll.value = msg.data
      break
    default:
      break
  }
}

// ---------- live connection ----------

function connect(u?: string, key?: string) {
  stopDemo()
  if (u !== undefined) username.value = u
  if (key !== undefined) apiKey.value = key

  const cleanId = username.value.trim().replace(/^@/, '')
  const k = apiKey.value.trim()
  if (!cleanId) {
    error.value = 'Masukkan username TikTok.'
    return
  }
  if (!k) {
    error.value = 'Masukkan API key (atau pakai mode demo).'
    return
  }
  if (ws) return

  mode.value = 'live'
  error.value = null
  connected.value = false

  const url = `wss://api.tik.tools?uniqueId=${encodeURIComponent(cleanId)}&apiKey=${encodeURIComponent(k)}`
  try {
    ws = new WebSocket(url)
  } catch (e: any) {
    error.value = e?.message || 'WebSocket error'
    return
  }

  ws.onopen = () => {
    connected.value = true
    error.value = null
  }
  ws.onmessage = (evt) => {
    try {
      handleMessage(JSON.parse(evt.data))
    } catch {
      /* ignore malformed */
    }
  }
  ws.onclose = () => {
    connected.value = false
    ws = null
  }
  ws.onerror = () => {
    error.value = 'WebSocket error — periksa username / API key.'
  }
}

function disconnect() {
  if (ws) {
    ws.close()
    ws = null
  }
  connected.value = false
  if (mode.value === 'live') mode.value = 'idle'
}

// ---------- demo mode ----------

const DEMO_NAMES = ['rizky_99', 'bunga.batch', 'dimasGokil', 'sitiGemoy', 'bang_tirex', 'mawar.mei', 'udin_petot', 'kepo.kw']
const DEMO_GIFTS = ['Rose', 'TikTok', 'Lion', 'Galaxy', 'Money Gun', 'Finger Heart', 'Fireworks', 'Mystery Box']
const DEMO_COMMENTS = [
  'gas gas gas 🔥',
  'cek kodam dong',
  'hujan hujan 🌧️',
  '!sapa halo semua',
  'wkwkwk 🤣',
  'love you ❤️',
  'mantap keren goks',
  'salam dari jakarta 👋'
]

function startDemo() {
  disconnect()
  mode.value = 'demo'
  connected.value = true
  error.value = null
  viewers.value = 320 + Math.floor(Math.random() * 900)

  if (demoTimer) clearInterval(demoTimer)
  demoTimer = setInterval(() => {
    const roll = Math.random()
    const user = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)]
    if (roll < 0.45) {
      const giftName = DEMO_GIFTS[Math.floor(Math.random() * DEMO_GIFTS.length)]
      const diamondCount = [1, 1, 1, 5, 10, 10, 20, 100, 500, 1500][Math.floor(Math.random() * 10)]
      const repeatCount = diamondCount <= 5 ? 1 + Math.floor(Math.random() * 5) : 1
      pushGift({ user: { uniqueId: user, nickname: user }, giftName, diamondCount, repeatCount, repeatEnd: true })
    } else if (roll < 0.85) {
      pushChat({ user: { uniqueId: user, nickname: user }, comment: DEMO_COMMENTS[Math.floor(Math.random() * DEMO_COMMENTS.length)] })
    } else if (roll < 0.9) {
      pushLike({ user: { uniqueId: user, nickname: user }, likeCount: 1 + Math.floor(Math.random() * 15) })
      viewers.value += Math.floor(Math.random() * 20) - 8
    } else if (roll < 0.96) {
      pushFollow({ user: { uniqueId: user, nickname: user } })
    } else {
      pushMember({ user: { uniqueId: user, nickname: user } })
    }
  }, 1100)
}

function stopDemo() {
  if (demoTimer) {
    clearInterval(demoTimer)
    demoTimer = null
  }
  if (mode.value === 'demo') {
    mode.value = 'idle'
    connected.value = false
  }
}

function reset() {
  disconnect()
  stopDemo()
  gifts.value = []
  messages.value = []
  likes.value = []
  members.value = []
  follows.value = []
  battle.value = null
  battleArmies.value = null
  poll.value = null
  viewers.value = 0
  error.value = null
}

export function useTikTokStream() {
  return {
    username,
    apiKey,
    mode,
    connected,
    error,
    viewers,
    gifts,
    messages,
    likes,
    members,
    follows,
    battle,
    battleArmies,
    poll,
    gifters,
    totalDiamonds,
    totalLikes,
    connect,
    disconnect,
    startDemo,
    stopDemo,
    reset
  }
}
