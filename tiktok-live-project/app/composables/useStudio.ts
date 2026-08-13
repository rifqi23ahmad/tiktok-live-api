import { ref, computed } from 'vue'

const CONFIG_KEY = 'streamstudio:config'
const SESSION_KEY = 'streamstudio:session'

const DEFAULT_API_KEY = 'demo_tiktokliveapi_public_2026'

interface StreamConfig {
  username: string
  apiKey: string
  goal: number
  goalTitle: string
}

interface Gifter {
  diamonds: number
  gifts: number
}

interface SessionWidgets {
  goal: { diamonds: number; target: number; complete: boolean }
  leaderboard: { gifts: number }
  alert: { triggers: number; topTier: number }
  likes: { total: number }
  hype: { chats: number; peak: number; onFire: number }
  commands: Record<string, number>
}

interface TimelineBucket {
  t: number
  chat: number
  like: number
  gift: number
  diamonds: number
}

export interface Session {
  id: string
  username: string
  startedAt: number
  endedAt: number | null
  counts: {
    chat: number
    like: number
    gift: number
    member: number
    follow: number
    diamonds: number
    totalLikes: number
  }
  viewers: { current: number; peak: number }
  topGifters: Record<string, Gifter>
  widgets: SessionWidgets
  timeline: TimelineBucket[]
  feed: { t: number; type: string; text: string }[]
  commands: Record<string, number>
}

function emptySession(username: string): Session {
  return {
    id: globalThis.crypto?.randomUUID?.() || String(Date.now()),
    username,
    startedAt: Date.now(),
    endedAt: null,
    counts: { chat: 0, like: 0, gift: 0, member: 0, follow: 0, diamonds: 0, totalLikes: 0 },
    viewers: { current: 0, peak: 0 },
    topGifters: {},
    widgets: {
      goal: { diamonds: 0, target: 0, complete: false },
      leaderboard: { gifts: 0 },
      alert: { triggers: 0, topTier: 0 },
      likes: { total: 0 },
      hype: { chats: 0, peak: 0, onFire: 0 },
      commands: {}
    },
    timeline: [],
    feed: [],
    commands: {}
  }
}

function load<T>(key: string, fallback: T): T {
  if (!import.meta.client) return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, val: unknown) {
  if (!import.meta.client) return
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* quota / private mode — ignore */
  }
}

// ---------------------------------------------------------------------------
// Stream config (shared across pages, persisted)
// ---------------------------------------------------------------------------
const config = ref<StreamConfig>(load<StreamConfig>(CONFIG_KEY, {
  username: '',
  apiKey: DEFAULT_API_KEY,
  goal: 5000,
  goalTitle: 'Target Hari Ini'
}))

export function useStreamConfig() {
  const saveConfig = () => save(CONFIG_KEY, config.value)

  const browserSourceUrl = computed(() => {
    const params = new URLSearchParams({
      username: config.value.username || 'demo',
      apiKey: config.value.apiKey || 'demo',
      goal: String(config.value.goal || 5000),
      goalTitle: config.value.goalTitle || 'Target Hari Ini'
    })
    const origin = import.meta.client ? window.location.origin : ''
    return `${origin}/overlay.html?${params.toString()}`
  })

  const hasConfig = computed(() => !!config.value.username?.trim())

  return { config, saveConfig, browserSourceUrl, hasConfig }
}

// ---------------------------------------------------------------------------
// Live analytics session (written by dashboard, read by recap, persisted)
// ---------------------------------------------------------------------------
const session = ref<Session | null>(load<Session | null>(SESSION_KEY, null))

function timelineBucket(s: Session) {
  const now = Date.now()
  const minute = now - (now % 60000)
  let bucket = s.timeline[s.timeline.length - 1]
  if (!bucket || bucket.t !== minute) {
    bucket = { t: minute, chat: 0, like: 0, gift: 0, diamonds: 0 }
    s.timeline.push(bucket)
    if (s.timeline.length > 120) s.timeline.shift()
  }
  return bucket
}

function pushFeed(s: Session, type: string, text: string) {
  s.feed.unshift({ t: Date.now(), type, text })
  if (s.feed.length > 30) s.feed.pop()
}

export function useStreamSession() {
  const active = computed(() => session.value && !session.value.endedAt ? session.value : null)

  const persist = () => save(SESSION_KEY, session.value)

  function start(username: string, goal: number) {
    session.value = emptySession(username.trim().replace(/^@/, ''))
    session.value.widgets.goal.target = goal || 5000
    persist()
  }

  function end() {
    if (session.value && !session.value.endedAt) {
      session.value.endedAt = Date.now()
      persist()
    }
  }

  function clear() {
    session.value = null
    if (import.meta.client) localStorage.removeItem(SESSION_KEY)
  }

  function record(eventType: string, data: any) {
    const s = session.value
    if (!s || s.endedAt) return
    const bucket = timelineBucket(s)
    const user: string = data?.user?.uniqueId || ''

    switch (eventType) {
      case 'chat': {
        const comment: string = data?.comment || ''
        s.counts.chat++
        bucket.chat++
        s.widgets.hype.chats++
        const hype = Math.min(100, s.widgets.hype.chats)
        s.widgets.hype.peak = Math.max(s.widgets.hype.peak, hype)

        // detect chat commands (aligns with overlay semantics)
        const c = comment.trim()
        const lower = c.toLowerCase()
        let cmd: string | null = null
        if (lower === '!hujan' || lower === '!rain') cmd = '!hujan'
        else if (lower.startsWith('!sapa ')) cmd = '!sapa'
        else if (/\b(cek\s*kodam|kodam|!kodam)\b/i.test(lower)) cmd = 'cek kodam'
        else if (/\b(cek\s*nasib|nasib|ramal|!nasib)\b/i.test(lower)) cmd = 'cek nasib'
        if (cmd) {
          s.commands[cmd] = (s.commands[cmd] || 0) + 1
          s.widgets.commands[cmd] = (s.widgets.commands[cmd] || 0) + 1
        }

        pushFeed(s, 'chat', `💬 @${user}: ${c.slice(0, 60)}`)
        break
      }
      case 'like': {
        const count = data?.likeCount || 1
        s.counts.like++
        s.counts.totalLikes += count
        bucket.like += count
        s.widgets.likes.total = s.counts.totalLikes
        pushFeed(s, 'like', `❤️ @${user} +${count} likes`)
        break
      }
      case 'gift': {
        if (data?.giftType === 1 && !data?.repeatEnd) break
        const diamonds = (data?.diamondCount || 0) * (data?.repeatCount || 1)
        if (diamonds <= 0) break
        s.counts.gift++
        s.counts.diamonds += diamonds
        bucket.gift++
        bucket.diamonds += diamonds
        s.widgets.leaderboard.gifts++
        s.widgets.goal.diamonds += diamonds
        s.widgets.goal.complete = s.widgets.goal.diamonds >= s.widgets.goal.target

        const tier = diamonds >= 1000 ? 4 : diamonds >= 100 ? 3 : diamonds >= 10 ? 2 : 1
        s.widgets.alert.triggers++
        s.widgets.alert.topTier = Math.max(s.widgets.alert.topTier, tier)

        const g = s.topGifters[user] || (s.topGifters[user] = { diamonds: 0, gifts: 0 })
        g.diamonds += diamonds
        g.gifts++

        pushFeed(s, 'gift', `🎁 @${user} → ${data?.giftName || 'Gift'} (${diamonds.toLocaleString('id-ID')} 💎)`)
        break
      }
      case 'member':
        s.counts.member++
        pushFeed(s, 'member', `👋 @${user} joined`)
        break
      case 'follow':
        s.counts.follow++
        pushFeed(s, 'follow', `➕ @${user} followed`)
        break
      case 'roomUserSeq': {
        const vc = data?.viewerCount || 0
        s.viewers.current = vc
        s.viewers.peak = Math.max(s.viewers.peak, vc)
        break
      }
    }
  }

  const topGifters = computed(() => {
    const s = session.value
    if (!s) return []
    return Object.entries(s.topGifters)
      .map(([name, g]) => ({ name, ...g }))
      .sort((a, b) => b.diamonds - a.diamonds)
  })

  const avgDiamondsPerGift = computed(() => {
    const s = session.value
    if (!s || s.counts.gift === 0) return 0
    return Math.round(s.counts.diamonds / s.counts.gift)
  })

  const durationMs = computed(() => {
    const s = session.value
    if (!s) return 0
    return (s.endedAt || Date.now()) - s.startedAt
  })

  return { session, active, persist, start, end, clear, record, topGifters, avgDiamondsPerGift, durationMs }
}
