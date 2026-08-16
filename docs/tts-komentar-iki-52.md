# TTS Komentar Penonton — Baca Komentar untuk Host (IKI-52)

**Pemilik:** CTO
**Isu:** IKI-52 — TTS baca komentar penonton untuk host (Text-to-Speech komentar masuk)
**Parent:** IKI-51 — tambahkan Fitur Untuk translate Text to spech aja
**Terkait:** IKI-41 — Host AI Text-to-Speech (suara host)

Komentar penonton yang masuk sekarang **dibacakan untuk host** lewat Text-to-Speech browser, jadi host tidak perlu membaca chat. Fitur ini melengkapi TTS host (IKI-41) yang membacakan balasan AI.

---

## Cara kerja

- Setiap komentar penonton (`chat`) yang masuk lewat `useTikTokStream` diucapkan lewat `speak()` → Web Speech API (`window.speechSynthesis`).
- Format ucapan: `<nickname>: <komentar>` (emoji dibuang supaya tidak dibaca aneh oleh mesin TTS).
- Suara default bahasa Indonesia (`id-ID`), bisa diubah per widget (EN, MY, JP, KR, AR).
- Komentar baru menggantikan ucapan sebelumnya — `speak()` memanggil `cancel()` sebelum bicara.
- Tanpa API key tambahan — pakai mesin TTS bawaan browser (OBS browser source / Chrome).

## Toggle & pengaturan

| Setting | Default | Fungsi |
|---|---|---|
| `commentTts` | `true` | Nyalakan/matikan pembacaan komentar penonton. |
| `commentVoice` | `id-ID` | Bahasa/aksen suara pembacaan komentar. |

Dapat diubah di InspectorPanel (pilih widget Avatar Arena → "Baca komentar penonton" + "Bahasa komentar"), konsisten dengan kontrol `tts`/`aiVoice` yang ada.

## Implementasi

- `app/components/widgets/AvatarArena.vue` — `speakComment` memanggil `speak(line, { lang: commentVoice })` saat `commentTtsOn`; watcher `stream.messages.value[0]` membaca komentar apa pun modenya (beyblade/arena/race/war). `speakable()` membuang emoji (`EMOJI_RE`) sebelum diucapkan.
- `app/composables/useWidgetRegistry.ts` — defaultProps ditambah `commentTts: true`, `commentVoice: 'id-ID'`.
- `app/components/builder/InspectorPanel.vue` — kontrol toggle + pilih bahasa komentar.
- `app/utils/tts.ts` — tidak diubah; modul `speak()`/`cancel()` yang sudah ada dipakai langsung (SSR-safe, tanpa API key).

## Verifikasi

1. `cd stream-studio && npm run build` — lulus.
2. Demo (tanpa API key): buka overlay / builder → widget Avatar Arena → jalankan mode demo. Komentar demo masuk dan diucapkan (selama `commentTts` aktif dan browser punya voice `id-ID`).
3. Komentar baru memutus ucapan sebelumnya (karena `cancel()` di `speak()`).
4. Jika browser tidak punya suara Indonesia, fallback ke voice default — overlay tetap jalan, hanya suara tidak ada.

## Catatan

- TTS memakai mesin bawaan browser; ketersediaan suara `id-ID` bergantung OS. Tanpa voice, `speak()` gagal senyap — tidak memecah overlay.
- Autoplay policy: di OBS browser source (Chromium) speechSynthesis jalan normal. Di browser biasa, suara bisa butuh interaksi pertama (klik).
- Komentar dengan perintah bot (`!sapa`, `!spin`, dst.) tetap dibacakan; host bisa mematikan lewat toggle jika berisik.
