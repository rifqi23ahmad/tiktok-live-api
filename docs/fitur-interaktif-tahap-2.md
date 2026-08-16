# Fitur Interaktif Tahap 2 — Stream Studio

**Pemilik:** CTO
**Tanggal:** 2026-08-14
**Isu:** IKI-27 — Add next layer of interactive features to Stream Studio to grow viewers

Dokumen ini menjelaskan lapisan fitur interaktif berikutnya yang ditambahkan ke Stream Studio (di atas 7 widget v1). Setiap fitur ditulis dengan alasan mengapa ia menaikkan penonton (viewer-growth rationale).

---

## Ringkasan

Tesis produk: **interaktivitas = lebih banyak penonton**. Fitur v1 menangani reaksi satu-arah (alert, goal, leaderboard, efek chat, avatar). Tahap 2 menambahkan fitur yang menciptakan **alasan untuk kembali** (retention) dan **alasan untuk berkompetisi** (competition & social identity) — dua pendorong viewer count yang lebih kuat daripada reaksi biasa.

| # | Fitur | Widget | Kategori | Pendorong utama |
|---|---|---|---|---|
| 1 | Team Battle | `team-battle` | Battles / team wars | Kompetisi + identitas sosial + FOMO |
| 2 | Poin Loyalty + Shop | `loyalty-points` | Streak/leaderboard + loyalty redeemable | Habit & retensi, partisipasi berulang |
| 3 | Roda Keberuntungan | `lucky-wheel` | Deeper game mode (undian) | Antisipasi + peluang → lonjakan gift |

---

## 1. Team Battle (`team-battle`)

**Cara kerja:**
- Penonton memilih kubu dengan mengetik kata kunci (default `merah` / `biru`, bisa diubah).
- Keanggotaan kubu **persisten** antar ronde → penonton punya identitas.
- Gift dari anggota kubu mengisi skor kubunya. Gift dari penonton yang belum join otomatis terbagi (hash) agar bar tetap hidup.
- Ronde berjalan otomatis dengan **countdown** (default 60 detik, bisa 0 = tanpa batas). Saat ronde berakhir muncul selebrasi pemenang, lalu auto-lanjut (bisa dimatikan).
- Perintah `!mulai` / `!start` untuk mulai ulang manual.

**Kenapa menaikkan penonton:** Battle menciptakan sisi ("kubu saya menang"), FOMO (ikut sebelum ronde selesai), dan dorongan gift (gift-mu adalah senjata kubu). Ini adalah mekanik inti dari stream game-show yang terbukti menahan penonton lebih lama, dan penonton yang tahan lama = jangkauan lebih luas.

---

## 2. Poin Loyalty + Shop (`loyalty-points`)

**Cara kerja:**
- Penonton mengumpulkan poin dari **semua** aktivitas: chat (+1), like, follow (+20), gift (+2/diamond) — inklusif, bukan cuma sultan.
- Leaderboard "Poin Penonton" menampilkan fans teratas, dengan badge 🔥 untuk yang paling aktif.
- Poin bisa **ditukar** lewat perintah chat:
  - `!spin` (20 poin) — putar slot bonus poin (5–100).
  - `!spot` (30 poin) — spotlight avatar di layar 5 detik.
  - `!party` (40 poin) — hujan konfeti.
  - `!poin` — cek saldo sendiri.

**Kenapa menaikkan penonton:** Sistem poin menciptakan **habit loop** — penonton kembali untuk mengumpulkan dan menukar poin. Karena poin didapat dari chat, penonton terdorong mengirim lebih banyak chat → sinyal engagement naik → algoritma TikTok mendorong stream ke lebih banyak penonton. Ini versi "loyalty/redeemable system" yang diminta di scope.

---

## 3. Roda Keberuntungan (`lucky-wheel`)

**Cara kerja:**
- Setiap gift menjadi **tiket undian** berbobot sesuai jumlah diamond (gift besar = peluang besar).
- Saat total diamond sejak putaran terakhir mencapai **ambang** (default 1000), roda berputar.
- Pemenang diundi berbobot, dan roda mendarat di segmen hadiah (bisa diubah: `💎 x2`, `🎁 10 💎`, `🔥 Shoutout`, `⭐ 50 💎`, `💔 Zonk`, `🏆 100 💎`).

**Kenapa menaikkan penonton:** Mekanik undian menciptakan **antisipasi** dan **peluang** yang mendorong lonjakan gift saat mendekati ambang. Elemen "Zonk" membuat roda terasa adil dan lucu (shareable). Penonton yang sudah memberi gift kembali untuk melihat apakah menang → retensi.

---

## Implementasi

- Tiga komponen baru: `app/components/widgets/TeamBattle.vue`, `LoyaltyPoints.vue`, `LuckyWheel.vue`.
- Terdaftar di `useWidgetRegistry.ts` (tipe + default props), dirender di `WidgetRenderer.vue`, dan dikonfigurasi di `InspectorPanel.vue`.
- Mode demo diperkaya (`useTikTokStream.ts`) dengan komentar interaktif (`merah`, `biru`, `!spin`, `!poin`, `!party`) agar ketiga fitur terlihat langsung tanpa API key.
- Semua widget membaca stream lewat composable yang sama (`useTikTokStream`) dan mengikuti pola unit `cqw`/`cqh` + `oklch` seperti widget v1.

## Verifikasi

1. `cd stream-studio && npm run build` — build Nuxt lulus tanpa error.
2. Mode demo (`/live` → Mode Demo, atau `/builder` dengan status Demo): ketiga widget menampilkan interaksi dari data demo.
3. Widget v1 dan fitur in-flight (IKI-1 SDK, IKI-3 testing) tidak tersentuh — perubahan terbatas pada file di bawah `stream-studio/app` + `README.md` + dokumen ini.
