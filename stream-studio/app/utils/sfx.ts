// Sound-effects engine for Stream Studio widgets.
//
// Everything is synthesized with the Web Audio API (no audio files to bundle),
// so it works in the builder, in preview, and in a published browser source.
// The sound catalog below is the "library": a flat, data-driven list that the
// builder maps to interactive events (see useSfx) instead of hardcoding
// one sound per event deep inside each widget.

export type SfxWave = OscillatorType

export interface SfxSoundDef {
  id: string
  name: string
  emoji: string
  // Synthesis recipe. Interpreted by renderSound().
  notes: number[]          // frequencies played in sequence (arp) or together (chord)
  step?: number            // seconds between notes; 0 => chord (all at once)
  wave?: SfxWave
  dur?: number             // per-note duration in seconds
  glideTo?: number         // last note glides to this frequency (sweep)
  noise?: { dur: number; freq: number; gain: number } // optional noise burst
  gain?: number
}

export const SFX_SOUNDS: SfxSoundDef[] = [
  { id: 'pop', name: 'Pop', emoji: '🎈', notes: [520], glideTo: 320, wave: 'square', dur: 0.12, gain: 0.16 },
  { id: 'coin', name: 'Koin', emoji: '🪙', notes: [880, 1318], step: 0.07, wave: 'sine', dur: 0.14, gain: 0.22 },
  { id: 'ding', name: 'Bel', emoji: '🔔', notes: [660], wave: 'triangle', dur: 0.28, gain: 0.22 },
  { id: 'chime', name: 'Lonceng', emoji: '🎐', notes: [660, 880, 990], step: 0.09, wave: 'triangle', dur: 0.24, gain: 0.18 },
  { id: 'sparkle', name: 'Kerlip', emoji: '✨', notes: [1046, 1318, 1568, 2093], step: 0.055, wave: 'sine', dur: 0.16, gain: 0.14 },
  { id: 'whoosh', name: 'Swoosh', emoji: '💨', notes: [400], glideTo: 900, wave: 'sine', dur: 0.22, gain: 0.16, noise: { dur: 0.22, freq: 1800, gain: 0.06 } },
  { id: 'click', name: 'Klik', emoji: '⏱️', notes: [300], wave: 'square', dur: 0.04, gain: 0.1 },
  { id: 'heart', name: 'Hati', emoji: '💗', notes: [523, 659], step: 0.09, wave: 'sine', dur: 0.18, gain: 0.16 },
  { id: 'join', name: 'Join', emoji: '👋', notes: [400], glideTo: 720, wave: 'sine', dur: 0.18, gain: 0.14 },
  { id: 'bounce', name: 'Pantul', emoji: '🟢', notes: [300], glideTo: 140, wave: 'sine', dur: 0.2, gain: 0.2 },
  { id: 'fanfare', name: 'Fanfare', emoji: '🎺', notes: [523, 659, 784, 1046], step: 0.1, wave: 'sawtooth', dur: 0.26, gain: 0.14 },
  { id: 'tada', name: 'Tada', emoji: '🎉', notes: [523, 659, 784, 1046], wave: 'sawtooth', dur: 0.5, gain: 0.14, noise: { dur: 0.4, freq: 2500, gain: 0.08 } },
  { id: 'drumroll', name: 'Drumroll', emoji: '🥁', notes: [180], step: 0.06, wave: 'square', dur: 0.05, gain: 0.1, noise: { dur: 0.5, freq: 500, gain: 0.08 } },
  { id: 'boom', name: 'Dentuman', emoji: '💥', notes: [150], glideTo: 48, wave: 'sine', dur: 0.4, gain: 0.3, noise: { dur: 0.35, freq: 220, gain: 0.16 } }
]

export interface SfxEventDef {
  id: string
  name: string
  emoji: string
  default: string // default sound id
}

export const SFX_EVENTS: SfxEventDef[] = [
  { id: 'gift', name: 'Gift masuk', emoji: '🎁', default: 'coin' },
  { id: 'gift-big', name: 'Gift besar', emoji: '👑', default: 'fanfare' },
  { id: 'combo', name: 'Combo', emoji: '🔥', default: 'pop' },
  { id: 'join', name: 'Penonton join', emoji: '👋', default: 'join' },
  { id: 'reaction', name: 'Reaksi (like)', emoji: '❤️', default: 'sparkle' },
  { id: 'follow', name: 'Follow', emoji: '➕', default: 'heart' },
  { id: 'marble', name: 'Marble melaju', emoji: '🏁', default: 'whoosh' },
  { id: 'win', name: 'Menang', emoji: '🏆', default: 'tada' },
  { id: 'clash', name: 'Benturan beyblade', emoji: '💥', default: 'whoosh' },
  { id: 'burst', name: 'Beyblade kalah', emoji: '🌀', default: 'boom' },
  { id: 'score', name: 'Kubu bertambah', emoji: '⚔️', default: 'coin' },
  { id: 'poll-vote', name: 'Vote masuk', emoji: '📊', default: 'ding' },
  { id: 'poll-result', name: 'Hasil poll', emoji: '🏁', default: 'fanfare' },
  { id: 'hype', name: 'Hype ON FIRE', emoji: '🔥', default: 'boom' },
  { id: 'shoutout', name: 'Shoutout', emoji: '📣', default: 'chime' },
  { id: 'spin', name: 'Roda berputar', emoji: '🎡', default: 'drumroll' },
  { id: 'wheel-win', name: 'Roda menang', emoji: '🎉', default: 'tada' },
  { id: 'redeem', name: 'Tukar poin', emoji: '💰', default: 'coin' },
  { id: 'goal-complete', name: 'Target tercapai', emoji: '🎯', default: 'fanfare' }
]

export function sfxSound(id: string): SfxSoundDef {
  return SFX_SOUNDS.find((s) => s.id === id) || SFX_SOUNDS[0]
}

export function sfxEvent(id: string): SfxEventDef {
  return SFX_EVENTS.find((e) => e.id === id) || { id, name: id, emoji: '🔊', default: 'pop' }
}

// ---------------------------------------------------------------------------
// Web Audio synthesis
// ---------------------------------------------------------------------------

let ctx: AudioContext | null = null

export function ensureSfxContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || (window as any).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function scheduleTone(
  ac: AudioContext,
  wave: SfxWave,
  freq: number,
  when: number,
  dur: number,
  gain: number,
  glideTo?: number
) {
  const t0 = ac.currentTime + when
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = wave
  osc.frequency.setValueAtTime(freq, t0)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), t0 + dur)
  g.gain.setValueAtTime(0.0001, t0)
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(g).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.06)
}

function scheduleNoise(
  ac: AudioContext,
  when: number,
  dur: number,
  freq: number,
  gain: number
) {
  const t0 = ac.currentTime + when
  const len = Math.max(1, Math.floor(ac.sampleRate * dur))
  const buf = ac.createBuffer(1, len, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = ac.createBufferSource()
  src.buffer = buf
  const filt = ac.createBiquadFilter()
  filt.type = 'bandpass'
  filt.frequency.value = freq
  filt.Q.value = 1
  const g = ac.createGain()
  g.gain.value = gain
  src.connect(filt).connect(g).connect(ac.destination)
  src.start(t0)
}

export function renderSfx(sound: SfxSoundDef) {
  const ac = ensureSfxContext()
  if (!ac) return
  const wave = sound.wave || 'sine'
  const dur = sound.dur || 0.18
  const gain = sound.gain ?? 0.18
  const step = sound.step ?? 0

  sound.notes.forEach((freq, i) => {
    const when = i * step
    const glide = i === sound.notes.length - 1 ? sound.glideTo : undefined
    scheduleTone(ac, wave, freq, when, dur, gain, glide)
  })

  if (sound.noise) {
    scheduleNoise(ac, 0, sound.noise.dur, sound.noise.freq, sound.noise.gain)
  }
}

// Play a sound by id (used by preview buttons + the composable).
export function playSfx(id: string) {
  renderSfx(sfxSound(id))
}
