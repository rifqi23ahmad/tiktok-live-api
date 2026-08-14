// Text-to-speech for the AI host (Stream Studio).
//
// Speaks the host's greeting/reply lines using the browser's built-in Web
// Speech API, so it works in the overlay (OBS browser source / Chrome) with
// no extra API key. Voice availability depends on the OS; we pick the best
// Indonesian voice we can find and fail silently when speech is unavailable.

export interface TtsOptions {
  lang?: string
  rate?: number
  pitch?: number
  voiceURI?: string
}

let muted = false

function engine(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null
  if (!('speechSynthesis' in window)) return null
  return window.speechSynthesis
}

export function ttsSupported(): boolean {
  return engine() !== null
}

export function setTtsMuted(v: boolean): void {
  muted = v
  if (v) cancel()
}

export function isTtsMuted(): boolean {
  return muted
}

let cachedVoices: SpeechSynthesisVoice[] | null = null

function voices(): SpeechSynthesisVoice[] {
  const s = engine()
  if (!s) return []
  if (cachedVoices && cachedVoices.length) return cachedVoices
  cachedVoices = s.getVoices()
  if (cachedVoices.length === 0) {
    // Chrome loads voices async; warm the cache when they arrive.
    const refresh = () => {
      cachedVoices = s.getVoices()
    }
    try {
      s.addEventListener('voiceschanged', refresh)
    } catch {
      ;(s as any).onvoiceschanged = refresh
    }
  }
  return cachedVoices
}

export function pickVoice(lang = 'id-ID', voiceURI?: string): SpeechSynthesisVoice | null {
  const list = voices()
  if (!list.length) return null
  if (voiceURI) {
    const exact = list.find((v) => v.voiceURI === voiceURI)
    if (exact) return exact
  }
  const want = (lang || '').toLowerCase()
  const base = want.split('-')[0]
  return (
    list.find((v) => v.lang.toLowerCase() === want) ||
    list.find((v) => v.lang.toLowerCase().startsWith(base)) ||
    list.find((v) => v.default) ||
    list[0]
  )
}

export function listVoices(): SpeechSynthesisVoice[] {
  return voices()
}

export function cancel(): void {
  engine()?.cancel()
}

export function speak(text: string, opts: TtsOptions = {}): void {
  const s = engine()
  if (!s || muted) return
  const clean = (text || '').trim()
  if (!clean) return
  const lang = opts.lang || 'id-ID'
  const voice = pickVoice(lang, opts.voiceURI)
  const u = new SpeechSynthesisUtterance(clean)
  if (voice) u.voice = voice
  u.lang = voice?.lang || lang
  u.rate = opts.rate ?? 1
  u.pitch = opts.pitch ?? 1
  s.cancel() // replace whatever the host was saying with the new line
  s.speak(u)
}
