import type { GiftTier } from '~/utils/stream'

export type WidgetType =
  | 'gift-alert'
  | 'goal-bar'
  | 'mini-game'
  | 'poll-prediction'
  | 'gift-leaderboard'
  | 'chat-effects'
  | 'avatar-arena'
  | 'team-battle'
  | 'loyalty-points'
  | 'lucky-wheel'

export interface WidgetDef {
  type: WidgetType
  name: string
  icon: string
  description: string
  defaultW: number // % of canvas width
  defaultH: number // % of canvas height
  defaultProps: Record<string, any>
}

export const widgetDefs: WidgetDef[] = [
  {
    type: 'gift-alert',
    name: 'Gift Alert + Combo',
    icon: '🎁',
    description: 'Animasi alert saat gift masuk, bertingkat sesuai nilai, lengkap dengan combo meter.',
    defaultW: 78,
    defaultH: 30,
    defaultProps: { showCombo: true, minTier: 1 as GiftTier }
  },
  {
    type: 'goal-bar',
    name: 'Goal Bar',
    icon: '🎯',
    description: 'Progress target diamond interaktif dengan milestone saat tercapai.',
    defaultW: 82,
    defaultH: 16,
    defaultProps: { target: 5000, title: 'Target Hari Ini' }
  },
  {
    type: 'mini-game',
    name: 'Mini-Game',
    icon: '🏁',
    description: 'Mini-game berbasis gift: Marble Race (gift dorong bola) & Gift War (dua kubu).',
    defaultW: 86,
    defaultH: 40,
    defaultProps: { game: 'marble' as 'marble' | 'war' }
  },
  {
    type: 'poll-prediction',
    name: 'Poll / Prediction',
    icon: '📊',
    description: 'Penonton vote lewat chat. Hasil real-time dalam bentuk bar persentase.',
    defaultW: 80,
    defaultH: 30,
    defaultProps: {
      question: 'Siapa menang?',
      options: ['Tim A', 'Tim B'],
      keysA: ['a', '1'],
      keysB: ['b', '2']
    }
  },
  {
    type: 'gift-leaderboard',
    name: 'Gift Leaderboard',
    icon: '🏆',
    description: 'Top gifter on-screen, update otomatis setiap gift masuk.',
    defaultW: 48,
    defaultH: 38,
    defaultProps: { maxRows: 5, title: 'Top Sultan' }
  },
  {
    type: 'chat-effects',
    name: 'Chat → Efek',
    icon: '💬',
    description: 'Emoji chat melayang, hujan emoji, shoutout !sapa, dan hype meter.',
    defaultW: 60,
    defaultH: 34,
    defaultProps: { floatEmoji: true, rain: true, hype: true }
  },
  {
    type: 'avatar-arena',
    name: 'Viewer Characters (Avatar Arena)',
    icon: '🌀',
    description: 'Penonton jadi beyblade yang beradu di arena. Gift/like tambah kekuatan, komentar tampil di beyblade, host ikut main, sapa penonton pakai AI & jawab pakai suara (TTS). Plus Audience Arena, Avatar Race & Avatar War.',
    defaultW: 88,
    defaultH: 48,
    defaultProps: { mode: 'beyblade' as 'beyblade' | 'arena' | 'marble' | 'war', ai: true, aiKey: '', tts: true, aiVoice: 'id-ID' }
  },
  {
    type: 'team-battle',
    name: 'Team Battle',
    icon: '⚔️',
    description: 'Penonton pilih kubu lewat chat, gift mereka isi kubu. Ronde berjalan otomatis dengan countdown + selebrasi pemenang.',
    defaultW: 82,
    defaultH: 42,
    defaultProps: {
      teamA: 'Kubu Merah',
      teamB: 'Kubu Biru',
      keyA: ['merah'],
      keyB: ['biru'],
      roundSec: 60,
      auto: true
    }
  },
  {
    type: 'loyalty-points',
    name: 'Poin Loyalty + Shop',
    icon: '💰',
    description: 'Penonton kumpulkan poin dari chat/like/follow/gift, lalu tukarkan lewat perintah (!spin, !spot, !party).',
    defaultW: 60,
    defaultH: 42,
    defaultProps: { title: 'Poin Penonton', maxRows: 5, chatPts: 1, followPts: 20, giftMul: 2, spinCost: 20 }
  },
  {
    type: 'lucky-wheel',
    name: 'Roda Keberuntungan',
    icon: '🎡',
    description: 'Setiap gift jadi tiket undian. Saat ambang diamond tercapai, roda berputar dan pemenang (bobot sesuai gift) diundi.',
    defaultW: 62,
    defaultH: 58,
    defaultProps: {
      title: 'Roda Keberuntungan',
      threshold: 1000,
      segments: ['💎 x2', '🎁 10 💎', '🔥 Shoutout', '⭐ 50 💎', '💔 Zonk', '🏆 100 💎']
    }
  }
]

export function widgetDef(type: WidgetType): WidgetDef {
  return widgetDefs.find((w) => w.type === type)!
}
