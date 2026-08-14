import { ref } from 'vue'
import {
  SFX_SOUNDS,
  SFX_EVENTS,
  sfxEvent,
  playSfx,
  ensureSfxContext
} from '~/utils/sfx'

const STORAGE_KEY = 'stream-studio:sfx'

// Module-scoped singleton: every widget + the toolbar share one SFX state.
const muted = ref(false)
const eventMap = ref<Record<string, string>>({})

// last-played timestamps for per-event throttle (a single gift fans out to
// many widgets at once; we only want one sound per event per beat).
const lastPlayed = new Map<string, number>()
const EVENT_THROTTLE_MS = 140

function defaultMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const e of SFX_EVENTS) map[e.id] = e.default
  return map
}

function load() {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      if (typeof parsed.muted === 'boolean') muted.value = parsed.muted
      if (parsed.map && typeof parsed.map === 'object') {
        eventMap.value = { ...defaultMap(), ...parsed.map }
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
}

function persist() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ muted: muted.value, map: eventMap.value }))
  } catch {
    /* ignore */
  }
}

// Resumes the AudioContext from a user gesture (autoplay policy).
export function unlockSfx() {
  ensureSfxContext()
}

export function useSfx() {
  if (Object.keys(eventMap.value).length === 0) {
    eventMap.value = defaultMap()
    load()
  }

  function setMuted(v: boolean) {
    muted.value = v
    persist()
  }

  function toggleMute() {
    setMuted(!muted.value)
  }

  function setEventSound(eventId: string, soundId: string) {
    eventMap.value = { ...eventMap.value, [eventId]: soundId }
    persist()
  }

  function resetMapping() {
    eventMap.value = defaultMap()
    persist()
  }

  function preview(soundId: string) {
    playSfx(soundId)
  }

  function trigger(eventId: string, opts?: { enabled?: boolean }) {
    if (muted.value) return
    if (opts && opts.enabled === false) return
    const now = Date.now()
    const last = lastPlayed.get(eventId) || 0
    if (now - last < EVENT_THROTTLE_MS) return
    lastPlayed.set(eventId, now)
    const soundId = eventMap.value[eventId] || sfxEvent(eventId).default
    playSfx(soundId)
  }

  return {
    muted,
    eventMap,
    sounds: SFX_SOUNDS,
    events: SFX_EVENTS,
    setMuted,
    toggleMute,
    setEventSound,
    resetMapping,
    preview,
    trigger,
    unlock: unlockSfx
  }
}
