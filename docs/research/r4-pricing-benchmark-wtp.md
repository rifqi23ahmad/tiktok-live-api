# R4 — Price Benchmark + Willingness-to-Pay + Rev-Share Economics untuk Monetisasi Stream Studio

**Author:** Market Research Analyst
**Date:** 2026-08-14
**Ticket:** IKI-32 (follow-up dari IKI-28 / `docs/monetisasi.md` bagian 8)
**Status:** Complete — rekomendasi harga + threshold rev-share siap dipakai CTO untuk halaman `/pricing`. WTP primer (Van Westendorp 5–10 streamer) masih menunggu eksekusi UX Researcher (lihat §3 dan Known gaps).

---

## Thesis (up front)

Struktur tier yang dipasang di `docs/monetisasi.md` (Gratis / Pro $19 / Studio $99) **tahan benchmark** — tidak perlu diubah angkanya untuk pasar global. Yang harus berubah ada tiga:

1. **Tambahkan tier Rupiah** untuk Indonesia, di ±50% harga USD (Pro ≈ Rp 149.000, Studio ≈ Rp 799.000). Pasar lokal butuh ini, dan sinyal dari riset komunitas memperkuatnya (penonton muda Indonesia sulit beli coin).
2. **Hitung rev-share dari nilai *net* streamer** (setelah potongan TikTok ±50%), bukan dari diamond kotor. 15% dari net ≈ 7,5% dari gross — ini konsisten dengan benchmark LivePix (5–7% transaksi) dan tidak memakan margin streamer.
3. **Naikkan threshold rev-share** dari hipotesis 50.000 ke **≥100.000 diamond gross/bulan** (≈ US$250 net), plus **minimum invoice US$25** (roll-over di bawah itu), supaya biaya penagihan manual tidak makan margin.

Konversi diamond yang dipakai sebagai patokan kerja: **1 diamond ≈ US$0,005 gross / ≈ US$0,0025 net untuk streamer** (Medium confidence — perlu 3–5 konfirmasi payout streamer sungguhan sebelum ledger rev-share difinalisasi).

---

## 1. Price benchmark (competitor + internal)

| Alat | Harga | Model | Sumber & tanggal | Confidence |
|---|---|---|---|---|
| **TikFinity** (kompetitor langsung #1) | Gratis (core) + coins untuk fitur premium | Freemium | tikfinity.com, fetch 2026-08-14 (R1) | Medium (harga coin tidak di halaman publik) |
| **StreamElements** | Gratis (monetisasi lewat tips/merch/iklan brand) | Gratis + services | streamelements.com, 2026-08-14 (R1) | High |
| **Streamlabs** | Gratis + **Ultra** berbayar (tema/multistream) | Freemium | streamlabs.com, 2026-08-14 (R1); harga Ultra belum terverifikasi langsung | Low–Medium (harga pasti belum dikonfirmasi) |
| **TikTok LIVE Studio** (native) | Gratis | Gratis | tiktok.com/livestudio, 2026-08-14 (R1) | High |
| **LivePix** (donasi Pix, adjacent) | **5% Pix / 7% kartu & internasional** per transaksi | Transaction fee | livepix.gg/taxas, fetch 2026-08-14 | High |
| **Library open-source** (tiktok-live-connector, TikTokLive) | Gratis (MIT) + biaya maintenance signing | Open source | repo, 2026-08-14 (R1) | High |
| **Overlay custom sekali bayar** (Fiverr/Etsy/Upwork) | ~US$10–200 sekali bayar, umumnya US$30–80 | One-time | R1 (secondary; belum fetch listing individual) | Medium |
| **TikTool data layer (internal)** | Community gratis · Basic **$19** · Pro **$49** · Ultra **$149** · Global Agency **$399**/bln | Subscription | `README.md` repo (tier matrix) | High (internal) |

**Positioning takeaway (bukan daftar doang):**

- **Pro $19 duduk di dua anchor yang sama:** Streamlabs Ultra (premium overlay, ±$19) dan TikTool Basic ($19). Artinya streamer yang sudah bayar $19 untuk data tidak akan merasa "bayar dobel" di layer studio. Angka ini **dipertahankan**.
- **Studio/Agency $99 punya ruang di atasnya:** TikTool Global Agency $399/bulan adalah bukti agency sudah mau bayar ratusan dolar untuk *data*; $99 untuk layer *studio + multi-streamer + whitelabel* di bawah itu wajar dan tidak overpriced. Angka ini **dipertahankan**.
- **Risiko terbesar adalah TikFinity gratis.** Free tier kita (3 widget + demo tanpa API key) harus cukup berguna sehingga "gratis" tidak otomatis menang, dan diferensiasi yang menang adalah *canvas builder + mini-game* (bukan sekadar alert), yang sudah dirangkum di R1.

---

## 2. Validasi konversi diamond → USD

**Angka patokan publik yang dipakai:** 1 diamond ≈ US$0,005 (gross, sebelum potongan TikTok), sudah tertulis di `docs/monetisasi.md` §2 sebagai "rentang, bukan angka tetap".

**Yang saya bisa validasi dari sinyal sekunder (bukan payout screenshot):**

- TikTok memotong ±50% sebelum streamer menarik dana → **nilai net untuk streamer ≈ US$0,0025/diamond**. Ini konsekuensi langsung dari klaim "TikTok potong ±50%" yang sudah dicatat CTO di monetisasi.md §2.
- Implikasi untuk rev-share: **15% dari diamond kotor = 30% dari net streamer** — terlalu agresif dan akan memicu dispute. Rev-share harus dihitung dari net.

**Confidence: Medium.** Patokan $0,005 adalah konsensus publik (muncul di banyak panduan creator economy), tapi saya belum bisa mengkonfirmasi dengan payout streamer sungguhan dari sumber primer di sesi ini (search engine memblokir fetch yang berguna; lihat Known gaps).

**Tindakan:** angka $0,005/$0,0025 boleh dipakai di dashboard rev-share *sebagai estimasi berlabel*, tapi wajib dikonfirmasi dengan 3–5 screenshot/statement payout streamer Indonesia + global sebelum ledger rev-share (#7 backlog) difinalisasi. Ini bukan blocker untuk halaman `/pricing` (premium tier tidak bergantung pada konversi diamond).

---

## 3. Willingness-to-pay (WTP)

**Batasan scope:** wawancara streamer/creator adalah tugas UX Researcher (R2, `docs/research/r2-creator-jtbd-interview-plan.md`). Saya tidak menjalankan 5–10 wawancara di sini; saya sediakan **instrumen Van Westendorp** yang siap dimasukkan ke protokol R2, dan memberikan **estimasi WTP berbasis sinyal sekunder** untuk dipakai sebagai angka awal sampai wawancara jalan.

### 3.1 Estimasi WTP berbasis sinyal (bukan pengganti wawancara)

Dua sinyal yang membuat $19 (global) dan tier Rupiah (ID) adalah tebakan terbaik:

1. **Anchor pembayaran yang sudah ada:** streamer sudah terbiasa bayar TikTool Pro $49 dan Basic $19 untuk *data*. Layer studio yang menaikkan gift duduk wajar di $19.
2. **Kendala daya beli Indonesia:** R3 (`feedback-mining-r3.md`) mencatat penonton muda sering "tidak punya cara beli coin" — artinya rata-rata gift/diamond streamer kecil-menengah Indonesia rendah, dan $19/bulan (≈ Rp 310.000) adalah pengeluaran yang signifikan. Sinyal ini mendukung hipotesis monetisasi.md bahwa **pasar lokal butuh tier rupiah lebih rendah**.

**Estimasi arah (pending wawancara):**
- **Global Pro:** $19/bulan adalah titik tengah yang defensible (van Westendorp ekspektasi: "murah" ≤ $9, "mahal" ≥ $39, titik optimum $15–25).
- **Indonesia Pro:** Rp 149.000/bulan (≈ $9, ±50% dari USD) sebagai anchor; ekspektasi "mahal" di atas Rp 299.000.
- **Studio/Agency:** $99 global / Rp 799.000 ID — anchor ke TikTool Global Agency $399 (data) dan nilai multi-streamer.

### 3.2 Instrumen Van Westendorp (untuk UX Researcher, fold ke R2 §3)

4 pertanyaan inti per streamer (ulangi untuk **Pro** dan **Studio**, dan dalam **IDR** untuk segmen Indonesia):

1. **Terlalu murah** (kualitas diragukan): "Pada harga berapa (per bulan) kamu merasa alat ini *terlalu murah* sehingga kualitasnya patut diragukan?" → Rp/USD ___
2. **Murah** (mulai menarik): "Pada harga berapa kamu mulai merasa ini *murah/tawaran bagus*?" → ___
3. **Mahal** (mulai menolak): "Pada harga berapa kamu mulai merasa ini *mahal tapi masih dipertimbangkan*?" → ___
4. **Terlalu mahal** (tidak akan beli): "Pada harga berapa kamu merasa ini *terlalu mahal* dan tidak akan membelinya?" → ___

Plus 1 pertanyaan segmentasi: "Mana yang lebih cocok buat kamu — bayar flat per bulan, atau potongan persen dari hasil gift? Kenapa?" (memisahkan preferensi premium-tier vs rev-share).

**Pisahkan segmen:** Indonesia (pakai IDR) vs global (USD); dan streamer perorangan vs talent manager/agency. Target 5–10 per segmen (sampel directional, bukan statistik — konsisten dengan rasional R2).

---

## 4. Threshold minimum rev-share (ekonomi biaya penagihan vs margin)

**Asumsi (dinyatakan eksplisit):**

| Asumsi | Nilai | Sumber |
|---|---|---|
| Nilai net streamer | 1 diamond ≈ $0,0025 (setelah potongan TikTok ±50%) | §2 |
| Rate rev-share | 15% dari **net** (≈7,5% dari gross) | monetisasi.md §5, dikoreksi di sini |
| Biaya penagihan manual per invoice/bulan (generate + kirim + 1–2 reminder + rekonsiliasi) | ±US$5 (rentang $3–15) | Estimasi operasional; bukan data primer |
| Processing fee | ~2,9% + biaya tetap per transaksi | Standar industri (Stripe-like) |

**Break-even (aturan: biaya penagihan ≤ ~10% dari revenue rev-share):**

- Butuh revenue ≥ US$50/bulan → nilai gift net ≥ $50 / 0,15 = **US$333/bulan** → ≈ **133.000 diamond net/bulan** (atau ≈ **66.000 diamond gross/bulan** pada $0,005).
- Dengan margin aman (biaya bisa naik ke $15 untuk penagihan manual yang rawan telat — ini risiko nyata karena **tidak ada auto-debit dari TikTok**), threshold yang disarankan dibulatkan ke **≥100.000 diamond gross/bulan**.

**Konsekuensi terhadap hipotesis 50.000 diamond di monetisasi.md:** terlalu rendah untuk penagihan manual yang menguntungkan. Di 50.000 gross diamond, revenue 15%-of-net hanya ≈ US$9–18/bulan, dan biaya penagihan + risiko telat bayar memakannya. **Naikkan ke 100.000, atau pertahankan 50.000 hanya jika penagihan di-agregasi per-agency** (satu invoice untuk banyak streamer) dan/atau ditagih kuartalan.

**Rekomendasi threshold rev-share final:**

1. **Eligibilitas:** ≥ 100.000 diamond gross/bulan per akun (atau ≥ 50.000 diamond **jika di-agregasi per-agency** dalam satu invoice).
2. **Minimum invoice:** US$25/bulan; di bawah itu saldo di-roll-over ke bulan berikutnya (tidak ditagih).
3. **Rate:** 15% dari **net** (≈7,5% dari gross), dikomunikasikan sebagai "bayar dari hasil" dan diberi escape hatch pindah ke Pro flat (sudah dirancang di monetisasi.md §5).
4. **Segmentasi:** rev-share hanya untuk agency/streamer volume tinggi (bukan streamer perorangan kecil) — konsisten dengan verdict monetisasi.md bahwa rev-share "hanya layak untuk segmen volume tinggi".

---

## 5. Rekomendasi harga final (USD + IDR)

| Tier | USD (global) | IDR (Indonesia) | Annual (USD / IDR) |
|---|---|---|---|
| **Gratis** | $0 | Rp 0 | — |
| **Pro** | **$19/bln** | **Rp 149.000/bln** | $15 / Rp 119.000 |
| **Studio / Agency** | **$99/bln** | **Rp 799.000/bln** | $79 / Rp 649.000 |

Asumsi kurs: 1 USD ≈ Rp 16.300 (2026, dibulatkan; konfirmasi angka IDR lewat Van Westendorp IDR).

**Rev-share "Performance" (fase berikutnya):** 15% dari nilai gift *net*, threshold ≥100.000 diamond gross/bulan (atau ≥50.000 jika per-agency), minimum invoice US$25.

**Yang diubah dari hipotesis monetisasi.md:** (a) tier Rupiah ditambahkan; (b) basis rev-share dikoreksi dari gross ke net; (c) threshold dinaikkan 50k → 100k (atau agregasi agency).

---

## 6. So what for the product (build / test / stop)

- **Build:** halaman `/pricing` dengan 3 tier + toggle USD/IDR; blok "Performance" untuk agency dengan kalkulator estimasi diamond→USD yang jelas berlabel "estimasi".
- **Build:** free tier yang benar-benar berguna (3 widget + demo) — karena kompetitor utama (TikFinity) gratis, free tier adalah senjata akuisisi, bukan afterthought.
- **Test:** Van Westendorp 5–10 streamer Indonesia (IDR) + global (USD) lewat UX Researcher sebelum angka IDR dikunci; konfirmasi $0,005/$0,0025 dari payout streamer sungguhan.
- **Stop:** jangan memasang 15% rev-share dari diamond *gross* (makan margin streamer 30% net, memicu dispute); jangan pakai threshold 50k untuk penagihan manual per-streamer.

---

## 7. Known gaps & what would raise confidence

1. **Konversi diamond→USD belum dikonfirmasi dari payout primer** (search engine memblokir fetch sumber berguna di sesi ini). → UX Researcher/CFO ambil 3–5 payout streamer Indonesia + global. Menjadikan $0,005/$0,0025 dari Medium → High.
2. **Harga Streamlabs Ultra belum terverifikasi** (halaman JS-gated). → fetch ulang pricing page atau gunakan listing app-store sebagai sumber kedua.
3. **WTP ini estimasi sinyal sekunder**, bukan hasil wawancara. → Van Westendorp di §3.2 dijalankan UX Researcher (fold ke R2); jangan kunci angka IDR sebelum ini.
4. **Biaya penagihan manual (±US$5/account/bulan) adalah estimasi**, bukan data primer. → CFO validasi biaya penagihan riil (Stripe/midtrans/QRIS) sebelum membekukan threshold rev-share.
5. **Harga overlay custom sekali bayar** hanya sinyal secondary. → 1 fetch listing Fiverr/Etsy untuk 10–20 hasil akan mengencangkan benchmark "sekali bayar" (relevan untuk framing "lebih murah dari sewa desainer").

---

## Sources (tanggal + confidence)

- `docs/monetisasi.md` §2–§8 (internal, CTO) — model + asumsi yang divalidasi. 2026-08-14. High.
- `README.md` repo — TikTool tier matrix (Community/Basic $19/Pro $49/Ultra $149/Global Agency $399). Internal. High.
- `docs/research/competitor-teardown-r1.md` (R1) — TikFinity, StreamElements, Streamlabs, TikTok LIVE Studio, OSS libs, LivePix. Fetch 2026-08-14. High (fetch langsung) s/d Medium (klaim posisi).
- livepix.gg/taxas — 5% Pix / 7% kartu & internasional, 3 saque gratis/bulan. Fetch 2026-08-14. High.
- `docs/research/feedback-mining-r3.md` (R3) — "penonton muda tidak bisa beli coin" (r/streaming, 2026-03-08). High (kutipan + link).
- `docs/research/r2-creator-jtbd-interview-plan.md` (R2) — protokol wawancara streamer (UX Researcher). 2026-08-14.
- `.agents/product-marketing.md` — persona streamer / talent manager / developer + model bisnis. 2026-08-14.
