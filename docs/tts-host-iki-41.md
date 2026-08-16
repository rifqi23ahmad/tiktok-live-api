# Host AI Text-to-Speech — Suara Host (IKI-41)

**Pemilik:** CTO
**Isu:** IKI-41 — Usulkan Fitur Translate Text To Speech
**Parent:** IKI-40 — AI host sapa penonton & jawab komentar
**Terkait:** IKI-52 — TTS baca komentar penonton untuk host (lihat `tts-komentar-iki-52.md`)

Host AI di Avatar Arena (Beyblade) sekarang **menjawab pakai suara**, bukan cuma teks. Balasan yang dihasilkan Tarogo diucapkan lewat Text-to-Speech (TTS) browser.

---

## Cara kerja

- Host AI (IKI-40) menyapa penonton baru dan menjawab komentar lewat Tarogo deepseek.
- Setiap balasan teks (`speakHost`) juga diucapkan lewat `speak()` → Web Speech API (`window.speechSynthesis`).
- Suara default bahasa Indonesia (`id-ID`), bisa diganti per widget (EN, MY, JP, KR, AR).
- Tanpa API key tambahan — pakai mesin TTS bawaan browser (OBS browser source / Chrome).

## Toggle & pengaturan

| Setting | Default | Fungsi |
|---|---|---|
| `tts` | `true` | Nyalakan/matikan suara host. |
| `aiVoice` | `id-ID` | Bahasa/aksen suara host. |

Dapat diubah di InspectorPanel (pilih widget Avatar Arena → "Suara host" + "Bahasa suara host").

## Implementasi

- `app/utils/tts.ts` — modul TTS mandiri: `speak(text, opts)`, `pickVoice(lang, voiceURI)`, `listVoices()`, `setTtsMuted()`, `cancel()`, `ttsSupported()`. SSR-safe (guard `typeof window`), pilih suara terbaik untuk bahasa yang diminta, dan `cancel()` sebelum bicara agar host tidak menumpuk.
- `app/components/widgets/AvatarArena.vue` — `speakHost` memanggil `speak(text, { lang: aiVoice })` saat `ttsOn`.
- `app/composables/useWidgetRegistry.ts` — defaultProps ditambah `tts: true`, `aiVoice: 'id-ID'`.
- `app/components/builder/InspectorPanel.vue` — kontrol toggle suara + pilih bahasa.

## Verifikasi

1. `cd stream-studio && npm run build` — lulus.
2. Demo (tanpa API key): buka overlay / builder → widget Avatar Arena (mode beyblade) → host menyapa penonton baru dan membalas komentar; balasan tampil di bubble + diucapkan (selama `tts` aktif dan browser punya voice `id-ID`).
3. Jika browser tidak punya suara Indonesia, fallback ke voice default — teks tetap tampil, hanya suara yang tidak ada.

## Catatan

- TTS memakai mesin bawaan browser; ketersediaan suara `id-ID` bergantung OS (macOS/Windows umumnya ada). Tanpa voice, `ttsSupported()`/`speak()` gagal senyap — tidak memecah overlay.
- Autoplay policy: di OBS browser source (Chromium) speechSynthesis jalan normal. Di browser biasa, suara bisa butuh interaksi pertama (klik) untuk diizinkan.
