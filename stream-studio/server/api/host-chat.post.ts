// Server-side proxy for the AI host brain (IKI-40 / IKI-47).
//
// The Tarogo endpoint does not send CORS headers, so the widget cannot call it
// directly from the browser (browser-source overlays would be blocked). This
// Nitro route proxies the call server-side and injects the Tarogo credentials
// from server config — the secret never reaches the client bundle or the
// published overlay URL.
//
// Credentials come from env (see .env.example / nuxt.config.ts runtimeConfig):
//   TAROGO_API_KEY      — Bearer token for api.tarogo.ai
//   TAROGO_API_ENDPOINT — optional override of the chat-completions endpoint

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const messages = Array.isArray(body?.messages) ? body.messages : []
  if (messages.length === 0) return { text: null }

  const model = (body?.model && String(body.model).trim()) || 'deepseek-v4-flash@deepseek'

  const config = useRuntimeConfig()
  const apiKey = (config.tarogoApiKey as string) || process.env.TAROGO_API_KEY || ''
  const endpoint =
    (config.tarogoEndpoint as string) ||
    process.env.TAROGO_API_ENDPOINT ||
    'https://api.tarogo.ai/chat/completions'

  if (!apiKey) {
    return { text: null, error: 'no-tarogo-key' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages, stream: false }),
      signal: controller.signal
    })
    if (!res.ok) return { text: null }
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text
    return { text: typeof text === 'string' ? text.trim().slice(0, 80) : null }
  } catch {
    return { text: null }
  } finally {
    clearTimeout(timer)
  }
})
