// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['tiktok-live-nuxt'],

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'Stream Studio — No-Code Overlay Builder',
      htmlAttrs: { lang: 'id' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Build interactive TikTok LIVE overlays without code. Pick a template, connect your stream, and publish a browser source URL.' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&display=swap' }
      ]
    }
  },

  // TikTok LIVE API — default key is the public demo key (rate-limited).
  // Override with TIKTOOL_API_KEY env var or a real key from https://tik.tools
  tiktool: {
    apiKey: process.env.TIKTOOL_API_KEY || 'demo_tiktokliveapi_public_2026'
  }
})
