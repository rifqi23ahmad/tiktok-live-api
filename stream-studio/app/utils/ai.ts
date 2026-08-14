// AI host brain for Stream Studio widgets.
//
// The host can greet new viewers and answer chat comments via the Tarogo
// deepseek models. Responses are short (stream-safe) Indonesian one-liners.
//
// Calls go through the Nitro server route `/api/host-chat`, which proxies to
// Tarogo server-side (Tarogo has no CORS headers, so a direct browser call
// would be blocked). Keys/models are configurable per widget via settings.

const DEFAULT_API_KEY = 'sk-ai-f6cef349666bdaa2'
const DEFAULT_MODEL = 'deepseek-v4-flash@deepseek'
const PROXY_PATH = '/api/host-chat'
const MAX_CHARS = 80

export interface HostAiConfig {
  apiKey?: string
  model?: string
  endpoint?: string
}

function systemPrompt(host: string): string {
  return (
    `Kamu adalah ${host}, host TikTok LIVE yang energik, ramah, dan lucu. ` +
    `Kamu menyapa dan membalas penonton dengan singkat dan natural. ` +
    `Gunakan bahasa Indonesia gaul yang ringan, maksimal 20 kata, tanpa tanda kutip, ` +
    `tanpa hashtag, dan minim emoji. Jawab hanya isi balasan, tanpa awalan seperti "${host}:".`
  )
}

async function complete(cfg: HostAiConfig, host: string, user: string): Promise<string | null> {
  const apiKey = cfg.apiKey?.trim() || DEFAULT_API_KEY
  const model = cfg.model?.trim() || DEFAULT_MODEL
  const endpoint = cfg.endpoint?.trim() || PROXY_PATH
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timeout = controller ? setTimeout(() => controller.abort(), 15000) : null
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        model,
        messages: [
          { role: 'system', content: systemPrompt(host) },
          { role: 'user', content: user }
        ]
      }),
      signal: controller?.signal
    })
    if (!res.ok) return null
    const data = await res.json()
    const text = data?.text ?? data?.choices?.[0]?.message?.content ?? data?.content
    if (typeof text !== 'string' || !text.trim()) return null
    return text.trim().slice(0, MAX_CHARS)
  } catch {
    return null
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export async function hostGreet(
  cfg: HostAiConfig,
  host: string,
  viewer: string
): Promise<string | null> {
  return complete(
    cfg,
    host,
    `Penonton @${viewer} baru saja join. Sapa dia dengan ramah dan semangat dalam bahasa Indonesia (maks 20 kata).`
  )
}

export async function hostAnswer(
  cfg: HostAiConfig,
  host: string,
  viewer: string,
  comment: string
): Promise<string | null> {
  return complete(
    cfg,
    host,
    `Penonton @${viewer} berkomentar: "${comment}". Balas dengan singkat, lucu, dan ramah dalam bahasa Indonesia (maks 20 kata).`
  )
}
