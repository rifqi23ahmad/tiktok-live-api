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
  nickname: string
  avatarUrl: string
  giftName: string
  diamondCount: number
  repeatCount: number
  repeatEnd: boolean
}

export interface ChatEvent {
  id: string
  user: string
  nickname: string
  avatarUrl: string
  comment: string
}

export interface LikeEvent {
  id: string
  user: string
  nickname: string
  avatarUrl: string
  likeCount: number
  totalLikes: number
}

export interface MemberEvent {
  id: string
  user: string
  nickname: string
  avatarUrl: string
}

export interface FollowEvent {
  id: string
  user: string
  nickname: string
  avatarUrl: string
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

// Deterministic placeholder avatar when a profile photo is unavailable.
// Uses a local SVG data URI so the arena works offline and in demo mode.
const AVATAR_PALETTE = ['#ff6b6b', '#fca311', '#06d6a0', '#118ab2', '#8338ec', '#ff70a6', '#f4a261', '#2a9d8f']

export function fallbackAvatar(name: string): string {
  const seed = (name || 'anon').trim() || 'anon'
  const h = hashStr(seed)
  const bg = AVATAR_PALETTE[h % AVATAR_PALETTE.length]
  const initial = seed.charAt(0).toUpperCase()
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>` +
    `<rect width='96' height='96' rx='48' fill='${bg}'/>` +
    `<text x='48' y='60' font-family='Arial, sans-serif' font-size='42' font-weight='700' fill='#fff' text-anchor='middle'>${initial}</text>` +
    `</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

// Extract a usable avatar URL from any TikTok user object shape.
// Handles: profilePictureUrl (string | {urlList}), avatarThumb (object), avatarUrl, avatar.
export function avatarUrlFrom(user: any): string {
  if (!user || typeof user !== 'object') return ''
  const candidates = [user.profilePictureUrl, user.avatarUrl, user.avatar]
  for (const c of candidates) {
    if (typeof c === 'string' && c) return c
    if (c && Array.isArray(c.urlList) && c.urlList[0]) return c.urlList[0]
  }
  const thumb = user.avatarThumb
  if (thumb && Array.isArray(thumb.urlList) && thumb.urlList[0]) return thumb.urlList[0]
  if (typeof thumb === 'string' && thumb) return thumb
  return ''
}

// Normalize a raw TikTok user object into a StreamUser.
export function normalizeUser(raw: any): StreamUser {
  const u = raw || {}
  return {
    uniqueId: u.uniqueId || u.unique_id || u.displayId || '',
    nickname: u.nickname || u.uniqueId || u.displayId || '',
    avatarUrl: avatarUrlFrom(u)
  }
}
