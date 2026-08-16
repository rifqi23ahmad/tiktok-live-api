# Product Marketing Context

**Document version:** v1
**Last updated:** 2026-08-14

## Product Overview

**One-liner:**
Stream Studio adalah builder overlay TikTok LIVE tanpa kode: susun widget drag-and-drop, hubungkan stream, tempel URL sebagai browser source di OBS/Streamlabs.

**What it does:**
Stream Studio membaca event TikTok LIVE secara real-time (chat, gift, like, follow, jumlah penonton) lewat WebSocket, lalu menampilkannya sebagai overlay interaktif di layar streamer. Streamer menyusun widget di kanvas 9:16, mengatur propertinya, dan mempublikasikan hasilnya sebagai satu URL yang ditanam di OBS atau Streamlabs.

**Product category:**
Interactive overlay studio untuk live streaming (bukan tool Twitch/YouTube — ini spesifik untuk mekanik gift TikTok LIVE).

**Product type:**
Aplikasi web (Nuxt 4 + Vue 3), self-hostable. Pakai API key gratis dari tik.tools sebagai lapisan data.

**Business model:**
Produk studio gratis (punya mode demo tanpa API key). Monetisasi lewat lapisan data TikTool (free Community tier, lalu Basic/Pro/Ultra/Global Agency berbayar), dan ke depan lewat revenue share gift / tier premium studio.

## Target Audience

**Target companies:**
- Streamer TikTok LIVE perorangan (micro s/d mid-size) yang ingin layar lebih interaktif.
- Creator agency / manajemen talenta yang menangani banyak streamer.
- Developer yang membangun overlay untuk klien streamer.

**Decision-makers:**
- Streamer (sekaligus user + buyer, sering satu orang).
- Owner / talent manager agency.
- (Untuk jalur SDK) developer / engineer.

**Primary use case:**
Streamer ingin layar LIVE-nya memicu lebih banyak gift dan penonton bertahan lebih lama, tanpa menyewa desainer atau menulis kode.

**Jobs to be done:**
- Bikin overlay profesional dalam hitungan menit, bukan hari.
- Mengubah gift dan chat menjadi permainan yang bisa ditonton dan diikuti penonton.
- Menonjolkan dan membalas top gifter di layar secara otomatis.
- Menyambungkan overlay ke TikTok LIVE tanpa reverse-engineering yang gampang rusak.

**Use cases:**
- Marble Race / Gift War: penonton mendorong bola/kubu dengan gift.
- Poll / Prediksi pemenang PK lewat chat (tebak kunci seperti "a" / "b").
- Avatar Arena: penonton yang join tampil sebagai karakter dari foto profil, ikut balapan/perang.
- Goal bar target diamond + leaderboard top supporter + alert gift bertingkat.

## Personas

| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| Streamer (user + buyer) | Penonton bertahan, gift naik, layar terlihat keren | Tidak bisa ngoding, tidak punya desainer, overlay Twitch tidak cocok untuk mekanik gift TikTok | Overlay interaktif yang memicu gift, jadi tanpa kode dalam 4 langkah |
| Talent manager / agency | Konsistensi dan skala di banyak streamer | Setup overlay manual per streamer lambat dan tidak konsisten | Satu builder yang bisa dipakai ulang untuk banyak streamer |
| Developer overlay | Hemat waktu vs menulis integrasi sendiri | TikTok sering ganti protokol, integrasi cepat rusak | Lapisan data SDK + API key, tanpa maintenance signing sendiri |

## Problems & Pain Points

**Core problem:**
Overlay TikTok LIVE yang interaktif (alert gift, goal, mini-game, leaderboard) biasanya butuh desainer + developer, sementara tool overlay populer (StreamElements, Streamlabs) dibuat untuk mekanik Twitch/YouTube — bukan mekanik gift TikTok LIVE.

**Why alternatives fall short:**
- StreamElements / Streamlabs: kuat di Twitch/YouTube (follow, subs, bits), lemah di event gift TikTok LIVE (diamond, tier gift, PK).
- Bikin sendiri pakai library open-source TikTok LIVE: cepat rusak setiap TikTok ganti protokol, butuh ngoding, dan tidak ada UI drag-and-drop.
- Jasa desainer overlay custom: mahal, sekali pakai, lambat revisi.

**What it costs them:**
- Waktu (hari–minggu) untuk setup overlay, waktu yang seharusnya dipakai live.
- Uang untuk desainer/developer.
- Pendapatan gift yang hilang karena layar tidak memicu penonton memberi gift.

**Emotional tension:**
Streamer melihat layar pesaing lebih hidup dan penontonnya lebih aktif, lalu merasa ketinggalan dan tidak profesional. Ada rasa takut "kalau layar saya jelek, penonton pindah".

## Competitive Landscape

**Direct:** StreamElements / Streamlabs (overlay builder untuk live streaming) — falls short karena berpusat pada Twitch/YouTube; tidak punya event gift/diamond/PK TikTok LIVE yang spesifik.
**Secondary:** Library open-source TikTok LIVE (tiktok-live-connector, TikTokLive Python) — falls short karena self-host, butuh coding, dan signing rawan rusak saat TikTok update.
**Indirect:** Jasa desain overlay freelance / fitur bawaan TikTok — falls short karena statis (desain), tidak real-time-interaktif, dan tidak scale.

## Differentiation

**Key differentiators:**
- Widget dibuat untuk mekanik gift TikTok LIVE (diamond goal, tier gift, leaderboard top sultan), bukan port widget Twitch.
- Mini-game berbasis gift (Marble Race, Gift War) dan Avatar Arena yang membuat penonton jadi partisipan, bukan sekadar penonton.
- Builder drag-and-drop kanvas 9:16 + publish jadi satu URL browser source (OBS/Streamlabs).
- Mode demo tanpa API key — coba penuh sebelum daftar.

**How we do it differently:**
Kami memecah masalahnya jadi dua lapisan: lapisan data (SDK `tiktok-live-api` + TikTool, yang menangani signing/protokol) dan lapisan studio (builder no-code). Streamer tidak menyentuh dua-duanya — cukup username + API key gratis, atau mode demo.

**Why that's better:**
Signing dan perubahan protokol TikTok ditangani di sisi TikTool, jadi overlay tidak rusak saat TikTok update. Builder-nya visual, jadi tidak perlu ngoding.

**Why customers choose us:**
Karena ini satu-satunya jalur overlay TikTok LIVE yang menggabungkan (1) widget gift-native, (2) mini-game penonton, dan (3) no-code, dalam satu builder yang bisa langsung dipakai.

## Objections

| Objection | Response |
|-----------|----------|
| "Butuh API key, ribet." | Mode demo jalan tanpa API key. API key gratis dari tik.tools (Community tier: 5.000 request/hari). |
| "Saya tidak bisa ngoding." | Tidak perlu. Drag-and-drop widget, publish jadi URL, tempel di OBS. |
| "Overlay Twitch sudah cukup." | Widget Twitch tidak mengenal gift/diamond/PK TikTok LIVE. Leaderboard dan goal di sini membaca diamond sungguhan. |
| "Takut TikTok ganti sistem lalu overlay rusak." | Signing/protokol ditangani TikTool, bukan di sisi streamer. |

**Anti-persona:**
Streamer Twitch/YouTube-only yang tidak pernah live di TikTok. Developer yang hanya butuh SDK mentah (mereka tetap dilayani lewat `tiktok-live-api`, bukan lewat studio).

## Switching Dynamics

**Push:** Overlay saat ini tidak membaca gift TikTok; desainer mahal dan lambat; library DIY rusak saat TikTok update.
**Pull:** Builder no-code + widget gift-native + mini-game penonton + mode demo gratis.
**Habit:** Streamer sudah terbiasa dengan OBS/Streamlabs dan tidak mau ganti tool streaming; solusi kami tidak menggantikan OBS — kami menyisip lewat browser source.
**Anxiety:** Takut setup lama dan hasil tidak sesuai; dijawab dengan mode demo + template jadi.

## Customer Language

**How they describe the problem:**
- "Layar saya polos, penonton cepat bosan."
- "Gift masuk tapi tidak ada yang disorot di layar."
- "Saya mau mainin penonton biar rame, tapi nggak ngerti coding."

**How they describe us:**
- "Tool yang bikin layar TikTok rame tanpa ngoding."
- "Overlay yang baca gift beneran."

**Words to use:**
rame / interaktif / gift / diamond / penonton jadi main / tanpa ngoding / pasang di OBS / mode demo / leaderboard top sultan / goal.

**Words to avoid:**
premium / revolusioner / terbaik / paling lengkap / seamless / game-changer / scale your business (klaim tanpa bukti).

**Glossary:**
| Term | Meaning |
|------|---------|
| Diamond | Satuan nilai gift di TikTok LIVE |
| Gift tier | Tingkatan nilai gift yang menentukan besar animasi alert |
| PK | Pertarungan dua streamer (live battle) |
| Browser source | Sumber layar di OBS/Streamlabs yang menampilkan URL |
| Top Sultan | Leaderboard gifter teratas di overlay |

## Brand Voice

**Tone:** Santai, langsung, bahasa streamer. Seperti rekan sesama kreator, bukan vendor korporat.
**Style:** Kalimat pendek, bukti konkret, pakai istilah yang dipakai streamer (gift, diamond, PK, sultan).
**Personality:** Praktis, jujur, suka bermain, hormat ke kreator.

## Proof Points

**Metrics:**
- 7 widget v1 dirilis: Gift Alert + Combo, Goal Bar, Mini-Game, Poll/Prediction, Gift Leaderboard, Chat → Efek, Viewer Characters (Avatar Arena).
- 3 template jadi: Hallmark Classic, Goal Crusher, Alert Pop.
- Alur kerja 4 langkah: susun widget → hubungkan stream → atur & pratinjau → publikasikan.

**Customers:**
Belum ada (pra-rilis). Gunakan mode demo sebagai bukti yang bisa dicoba sendiri.

**Testimonials:**
Belum ada.

**Value themes:**
| Theme | Proof |
|-------|-------|
| Tanpa ngoding | Drag-and-drop widget ke kanvas 9:16 |
| Interaktif & memicu gift | Mini-game Marble Race/Gift War, Avatar Arena, goal bar diamond |
| Cepat dipakai | Template jadi + publish URL browser source |
| Aman dari update TikTok | Signing/protokol di sisi TikTool (lapisan SDK) |

## Goals

**Business goal:** Akuisisi streamer TikTok LIVE ke produk studio, mengubah perhatian penonton jadi gift (dan ke depannya revenue share / tier premium).

**Conversion action:** Streamer mempublikasikan overlay (ambil URL browser source) dan menyambungkan API key.

**Current metrics:**
Belum terukur (pra-rilis). Baseline awal yang diusulkan untuk dilacak: jumlah streamer yang publish overlay, jumlah overlay aktif, durasi sesi live dengan overlay.

## Changelog

- v1 (2026-08-14) — Initial context. Disusun dari kode yang sudah ada (7 widget, 3 template, mode demo) sebagai dasar aktivasi growth & marketing.
