// Serialization for the published multi-widget overlay.
//
// The builder layout (every widget instance + its position + props) is encoded
// into a single URL query param and decoded by /overlay, which renders all of
// them concurrently. This fixes the old "one game per live" limit where the
// publish URL only pointed at a single fixed overlay (avatar-arena.html).

export interface OverlayWidget {
  id: string
  type: string
  x: number
  y: number
  w: number
  h: number
  props: Record<string, any>
}

export interface OverlayConfig {
  username?: string
  apiKey?: string
  demo?: boolean
  instances?: OverlayWidget[]
}

// UTF-8 safe, URL-safe base64 (props may contain emoji / unicode).
export function encodeOverlayConfig(cfg: OverlayConfig): string {
  const json = JSON.stringify(cfg)
  const bytes = new TextEncoder().encode(json)
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeOverlayConfig(s: string): OverlayConfig | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4)
    const bin = atob(padded)
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
    const parsed = JSON.parse(new TextDecoder().decode(bytes))
    return parsed && typeof parsed === 'object' ? (parsed as OverlayConfig) : null
  } catch {
    return null
  }
}
