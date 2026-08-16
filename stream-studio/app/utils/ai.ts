// AI host brain for Stream Studio widgets.
//
// The host can greet new viewers and answer chat comments via the Tarogo
// deepseek models. Responses are short (stream-safe) Indonesian one-liners.
//
// Calls go through the Nitro server route `/api/host-chat`, which proxies to
// Tarogo server-side (Tarogo has no CORS headers, so a direct browser call
// would be blocked). The Tarogo credentials live server-side only (env), so
// the client never sees the secret. Model can be overridden per widget.

const DEFAULT_MODEL = 'deepseek-v4-flash@deepseek'
const PROXY_PATH = '/api/host-chat'
const MAX_CHARS = 80
const LEGACY_MODEL_PREFIX = ['sk', 'ai'].join('-') + '-'

export type HostChatStatus =
  | 'ok'
  | 'fallback'
  | 'timeout'
  | 'model_down'
  | 'moderated'
  | 'error'

export interface HostChatResult {
  status: HostChatStatus
  text: string | null
  message: string | null
  retryable: boolean
}

export interface HostAiConfig {
  model?: string
  endpoint?: string
  sessionId?: string
  personaId?: string
}

const STATUS_MESSAGES: Record<HostChatStatus, string> = {
  ok: 'Host siap!',
  fallback: 'Host memakai model cadangan.',
  timeout: 'Host lagi sibuk. Coba lagi sebentar ya.',
  model_down: 'AI host sedang gangguan. Coba lagi nanti.',
  moderated: 'Balasan ditahan moderator.',
  error: 'AI host tidak merespons. Coba lagi ya.'
}

// Old published overlay URLs carried the Tarogo API key in the "model" field.
// That is a key, not a model name, and would fail the model lookup. Fall back
// to the default model whenever the value is empty or looks like a key so
// those saved layouts keep working.
function normalizeModel(m?: string): string {
  const v = (m || '').trim()
  if (!v) return DEFAULT_MODEL
  if (v.toLowerCase().startsWith(LEGACY_MODEL_PREFIX)) return DEFAULT_MODEL
  return v
}

function systemPrompt(host: string): string {
  return (
    `Kamu adalah ${host}, host TikTok LIVE yang energik, ramah, dan lucu. ` +
    `Kamu menyapa dan membalas penonton dengan singkat dan natural. ` +
    `Gunakan bahasa Indonesia gaul yang ringan, maksimal 20 kata, tanpa tanda kutip, ` +
    `tanpa hashtag, dan minim emoji. Jawab hanya isi balasan, tanpa awalan seperti "${host}:".`
  )
}

function makeResult(
  status: HostChatStatus,
  text: string | null = null,
  message: string | null = STATUS_MESSAGES[status],
  retryable = status === 'timeout' || status === 'model_down' || status === 'error'
): HostChatResult {
  return { status, text, message, retryable }
}

let sharedSessionId: string | null = null

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `ss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function createHostSessionId(): string {
  return newSessionId()
}

function resolveSessionId(cfg: HostAiConfig): string {
  const explicit = (cfg.sessionId || '').trim()
  if (explicit) return explicit
  sharedSessionId ||= newSessionId()
  return sharedSessionId
}

function resolvePersonaId(cfg: HostAiConfig, host: string): string {
  const explicit = (cfg.personaId || '').trim()
  if (explicit) return explicit
  const slug = host
    .trim()
    .replace(/^@/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug ? `host:${slug}` : 'host:default'
}

type HostChatAction = 'greet' | 'answer'

function buildPayload(
  cfg: HostAiConfig,
  host: string,
  user: string,
  action: HostChatAction,
  viewer: string
): Record<string, unknown> {
  const model = normalizeModel(cfg.model)
  return {
    model,
    action,
    personaId: resolvePersonaId(cfg, host),
    persona: host.trim().replace(/^@/, '') || 'HOST',
    sessionId: resolveSessionId(cfg),
    viewer,
    messages: [
      { role: 'system', content: systemPrompt(host) },
      { role: 'user', content: user }
    ]
  }
}

function normalizeStatus(value: unknown): HostChatStatus | null {
  const status = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (status === 'ok' || status === 'success') return 'ok'
  if (status === 'fallback' || status === 'fallback_model' || status === 'fallback-model') return 'fallback'
  if (status === 'timeout') return 'timeout'
  if (status === 'model_down' || status === 'model-down' || status === 'down') return 'model_down'
  if (status === 'moderated' || status === 'moderation' || status === 'moderation_block') return 'moderated'
  if (status === 'error') return 'error'
  return null
}

function extractText(data: any): string | null {
  const text = data?.text ?? data?.content ?? data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text
  return typeof text === 'string' && text.trim() ? text.trim().slice(0, MAX_CHARS) : null
}

function parseResponse(data: any): HostChatResult {
  if (!data || typeof data !== 'object') return makeResult('error')

  const explicitStatus = normalizeStatus(data.status ?? data.error)
  const moderated =
    data.moderated === true ||
    data.moderationBlocked === true ||
    data.safe === false ||
    explicitStatus === 'moderated'
  const fallback =
    data.fallback === true ||
    data.usedFallback === true ||
    data.modelUsed === 'fallback' ||
    explicitStatus === 'fallback'

  if (moderated) return makeResult('moderated')
  if (explicitStatus === 'timeout') return makeResult('timeout')
  if (explicitStatus === 'model_down') return makeResult('model_down')
  if (explicitStatus === 'error') return makeResult('error')

  const text = extractText(data)
  if (text) {
    if (fallback) return makeResult('fallback', text)
    return makeResult('ok', text)
  }

  if (explicitStatus === 'fallback') return makeResult('fallback')
  return makeResult('error')
}

function statusFromHttp(res: Response): HostChatResult {
  if (res.status === 408 || res.status === 504) return makeResult('timeout')
  if (res.status === 503) return makeResult('model_down')
  return makeResult('error')
}

async function complete(
  cfg: HostAiConfig,
  host: string,
  user: string,
  action: HostChatAction,
  viewer: string
): Promise<HostChatResult> {
  const model = normalizeModel(cfg.model)
  const endpoint = cfg.endpoint?.trim() || PROXY_PATH
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const timeout = controller ? setTimeout(() => controller.abort(), 15000) : null
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(cfg, host, user, action, viewer)),
      signal: controller?.signal
    })
    if (!res.ok) return statusFromHttp(res)
    const data = await res.json().catch(() => null)
    return parseResponse(data)
  } catch {
    if (controller && controller.signal.aborted) return makeResult('timeout')
    return makeResult('error')
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

export async function hostGreet(
  cfg: HostAiConfig,
  host: string,
  viewer: string
): Promise<HostChatResult> {
  return complete(
    cfg,
    host,
    `Penonton @${viewer} baru saja join. Sapa dia dengan ramah dan semangat dalam bahasa Indonesia (maks 20 kata).`,
    'greet',
    viewer
  )
}

export async function hostAnswer(
  cfg: HostAiConfig,
  host: string,
  viewer: string,
  comment: string
): Promise<HostChatResult> {
  return complete(
    cfg,
    host,
    `Penonton @${viewer} berkomentar: "${comment}". Balas dengan singkat, lucu, dan ramah dalam bahasa Indonesia (maks 20 kata).`,
    'answer',
    viewer
  )
}
