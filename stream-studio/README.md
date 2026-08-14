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

## Widgets

| Widget | Interaksi penonton |
| --- | --- |
| Gift Alert + Combo | gift masuk → alert bertingkat + combo meter |
| Goal Bar | progress target diamond |
| Mini-Game | Marble Race / Gift War berbasis gift |
| Poll / Prediction | vote lewat chat + tebak pemenang PK |
| Gift Leaderboard | top gifter on-screen |
| Chat → Efek | emoji melayang, hujan, shoutout, hype meter |
| Viewer Characters | penonton jadi beyblade yang beradu di arena (gift/like = kekuatan), plus arena/race/war |
| Team Battle | pilih kubu lewat chat, ronde + countdown + selebrasi |
| Poin Loyalty + Shop | kumpulkan poin, tukar lewat `!spin` / `!spot` / `!party` |
| Roda Keberuntungan | gift = tiket undian, roda berputar saat ambang tercapai |

## Efek Suara (SFX)

Setiap widget bisa memicu suara pada event interaktif (gift masuk, reaksi avatar, marble race, hasil poll, penonton join, dst.). Suara disintesis langsung lewat [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — tanpa file audio, jadi ringan dan jalan di browser source.

- **Library suara** — `app/utils/sfx.ts` berisi katalog suara (`SFX_SOUNDS`) dan event (`SFX_EVENTS`) yang data-driven, bukan hardcode per widget.
- **Pemetaan event → suara** — `app/composables/useSfx.ts` (singleton) memetakan event ke suara, dengan default yang masuk akal + throttle anti-tumpuk. Mapping disimpan di `localStorage`.
- **Kontrol di builder** — tombol `🔊 SFX` di toolbar untuk mute global + memilih/memutar suara per event; toggle `🔊 Efek suara widget` di inspector untuk mute per widget.
- **Browser source** — overlay yang dipublikasikan (`/overlay?config=…`) menyediakan tombol `🔇 Suara mati` / `🔊 Suara aktif`. Karena browser source biasanya auto-mute, streamer perlu klik sekali (atau aktifkan audio source di OBS) untuk menyalakan suara.


## Publikasi multi-widget

Tombol **🔗 Publish** di builder menghasilkan URL `/overlay?config=…` yang menyimpan seluruh tata letak kanvas (posisi, ukuran, dan props tiap widget) dalam satu parameter. URL itu merender **semua** widget secara bersamaan sebagai browser source — bukan lagi satu overlay tunggal (`avatar-arena.html`). Overlay standalone `avatar-arena.html` tetap tersedia untuk satu arena saja.


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
