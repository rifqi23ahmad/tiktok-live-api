// Normalized stream event types + shared helpers.
// Ported from overlay/overlay.html so the builder and widgets speak the
// same vocabulary as the battle-tested static overlay.

export interface StreamUser {
  uniqueId?: string
  nickname?: string
  avatarUrl?: string
}

export interface GiftEvent {
  id: string
  user: string
  giftName: string
  diamondCount: number
  repeatCount: number
  repeatEnd: boolean
}

export interface ChatEvent {
  id: string
  user: string
  comment: string
}

export interface LikeEvent {
  id: string
  user: string
  likeCount: number
  totalLikes: number
}

export interface MemberEvent {
  id: string
  user: string
}

export type GiftTier = 1 | 2 | 3 | 4

export function tierOf(diamonds: number): GiftTier {
  if (diamonds >= 1000) return 4
  if (diamonds >= 100) return 3
  if (diamonds >= 10) return 2
  return 1
}

export const tierEmoji: Record<GiftTier, string> = {
  1: '🎁',
  2: '💝',
  3: '🚀',
  4: '👑'
}

export const tierColor: Record<GiftTier, string> = {
  1: 'oklch(75% 0.1 250)',
  2: 'oklch(78% 0.15 195)',
  3: 'oklch(75% 0.19 350)',
  4: 'oklch(85% 0.16 90)'
}

export const tierHold: Record<GiftTier, number> = {
  1: 2200,
  2: 3000,
  3: 4200,
  4: 6000
}

export function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export const EMOJI_RE = /\p{Extended_Pictographic}/gu

export function fmtNum(n: number): string {
  return n.toLocaleString('id-ID')
}
