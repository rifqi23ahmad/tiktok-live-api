// Server-side proxy for the AI host brain.
//
// The Tarogo endpoint does not send CORS headers, so the widget cannot call it
// directly from the browser (browser-source overlays would be blocked). This
// Nitro route proxies the call server-side and keeps the default key out of
// the client bundle.

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const messages = Array.isArray(body?.messages) ? body.messages : []
  if (messages.length === 0) return { text: null }

  const apiKey = (body?.apiKey && String(body.apiKey).trim()) || 'sk-ai-f6cef349666bdaa2'
  const model = (body?.model && String(body.model).trim()) || 'deepseek-v4-flash@deepseek'

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch('https://api.tarogo.ai/chat/completions', {
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
