# Stream Studio

No-code overlay builder untuk TikTok LIVE. Pilih template, sambungkan stream, tempel browser source URL ke OBS / Streamlabs.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Pages

- `/` — dashboard
- `/builder` — no-code overlay builder (pilih template + konfigurasi + preview + browser source URL)
- `/gallery` — template gallery
- `/live` — koneksi WebSocket TikTok LIVE langsung (chat, gift, like, member)

## Templates (`public/templates/`)

| File | Nama | Isi |
| --- | --- | --- |
| `overlay-classic.html` | Hallmark Classic | overlay lengkap (alert, goal, leaderboard, chat effects, hype, kodam/nasib, PK) |
| `overlay-goal.html` | Goal Crusher | goal bar + top supporter + alert minimal |
| `overlay-alert.html` | Alert Pop | alert gift + emoji chat melayang |

Semua template self-contained dan membaca query param: `?username=&apiKey=&goal=&goalTitle=&demo=1`.

## Stack

- [Nuxt](https://nuxt.com) 4 (Vue 3)
- [`tiktok-live-nuxt`](https://www.npmjs.com/package/tiktok-live-nuxt) — WebSocket TikTok LIVE (`useTikTokLive`)
- API key dari [tik.tools](https://tik.tools)
