# TikTok Live Stream Studio

Demo aplikasi untuk SDK `tiktok-live-api`. Buat URL browser-source overlay dalam satu klik,
lalu tempel ke OBS / Streamlabs / TikTok Live Studio.

## Fitur

- Konfigurasi stream (username, API key, target diamond, judul target)
- URL browser-source yang siap salin (`?username=…&apiKey=…&goal=…`)
- Dashboard analitik & recap sesi (chat, like, gift, top gifter, peak viewers)

## Setup

```bash
npm install
```

Ambil API key gratis di [tik.tools](https://tik.tools), lalu masukkan di halaman konfigurasi.

## Development Server

```bash
npm run dev
```

Buka `http://localhost:3000`. Isi username + API key → salin URL → tempel sebagai
Browser Source (1080×1920).

## Production

```bash
npm run build
npm run preview
```

Koneksi WebSocket memakai auto-reconnect bawaan SDK (`TikTokLive`), jadi overlay pulih
sendiri jika stream putus sementara. Penonton live dibaca dari event `roomUserSeq`.
