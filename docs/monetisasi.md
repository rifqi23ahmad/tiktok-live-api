# Monetisasi — Stream Studio / Tiktok Stream

**Pemilik:** CTO
**Tanggal:** 2026-08-14
**Status:** Usulan model + backlog task (harga final menunggu validasi riset).

Dokumen ini menutup item #4 timeline (monetization scope). Isinya memilih model, menetapkan struktur tier, dan memecahnya jadi task konkret dengan pemilik. Semua angka harga ditandai sebagai hipotesis — bukan data — dan harus divalidasi sebelum dipasang di halaman pricing (lihat bagian 8).

---

## 1. Ringkasan Keputusan

Kita tidak memilih salah satu antara *revenue share* atau *premium tier* — kita pakai keduanya, tapi tidak sekaligus.

1. **Mesin utama (sekarang–pra-rilis): premium tier self-serve.** Studio tetap gratis (mode demo + 3 widget dasar), lalu jual langganan bulanan untuk fitur premium. Ini model yang bisa langsung ditegakkan (feature gating + watermark), tidak butuh kepercayaan manual, dan tidak menunggu volume diamond besar dulu.
2. **Mesin kedua (fase berikutnya): gift rev-share "Performance"** untuk streamer/agency volume tinggi yang lebih suka bayar dari hasil, bukan bayar di depan. Ditagih dari nilai gift yang terukur lewat telemetry overlay kita.

Alasan tidak memilih rev-share sebagai satu-satunya model: kita tidak bisa memotong pembayaran TikTok streamer secara otomatis. Rev-share murni berarti menagih manual berdasarkan kepercayaan, dan itu hanya layak untuk agency yang sudah punya hubungan, bukan untuk streamer perorangan yang jumlahnya jauh lebih banyak.

---

## 2. Konteks Ekonomi Gift TikTok LIVE

Yang bisa kita ukur dan yang tidak menentukan pilihan model.

| Fakta | Implikasi |
| --- | --- |
| Overlay membaca `diamondCount` tiap gift secara real-time (`useTikTokStream.ts` / `useStreamSession.ts` sudah menyimpan total diamond per sesi). | Kita punya telemetry diamond akurat di sisi produk sendiri — ini bahan baku rev-share. |
| Diamond adalah unit *di dalam* TikTok, bukan uang. Konversi ke rupiah/dolar diatur TikTok dan berubah per region/waktu. | Kita tidak tahu nilai uang pasti per diamond tanpa data payout streamer. Patokan publik sering dipakai: 1 diamond ≈ US$0.005, tapi ini rentang, bukan angka tetap. |
| TikTok mengambil potongan sebelum streamer menarik dana (lazim disebut ±50% dari nilai koin). | Rev-share harus dihitung dari *payout* streamer, bukan nilai kotor gift, supaya tidak makan margin streamer. |
| Tidak ada API resmi untuk memotong dana streamer otomatis. | Penagihan rev-share wajib lewat invoice/kesepakatan, bukan auto-debit dari TikTok. |

Kesimpulan teknis: telemetry diamond sudah ada, tapi konversi diamond→uang dan mekanisme penagihan belum ada. Itu sebabnya premium tier (yang tidak bergantung pada nilai diamond) lebih dulu, rev-share menyusul setelah dua hal itu dibereskan.

---

## 3. Dua Model dan Analisisnya

### 3.1 Premium tier (langganan self-serve)

**Cara kerja:** studio gratis untuk pemakaian dasar, berbayar untuk fitur lanjutan dan batas yang dinaikkan.

| Kekuatan | Kelemahan |
| --- | --- |
| Bisa ditegakkan otomatis (feature gating, watermark) — tidak butuh kepercayaan manual. | Butuh billing (Stripe/midtrans/QRIS) dan sistem entitlement. |
| Pendapatan bisa diprediksi (langganan bulanan/tahunan). | Streamer kecil yang belum menghasilkan dari live mungkin enggan bayar di depan. |
| Cocok dengan produk yang sudah punya nilai jelas (7 widget + mini-game + recap analytics). | Perlu halaman pricing + keputusan harga yang tervalidasi. |

### 3.2 Gift rev-share "Performance"

**Cara kerja:** streamer tidak bayar di depan; kita menagih persentase dari nilai gift yang terukur lewat overlay, per bulan.

| Kekuatan | Kelemahan |
| --- | --- |
| Sejalan dengan value prop ("overlay ini menaikkan gift") — bayar dari hasil. | Tidak bisa auto-debit dari payout TikTok → penagihan manual, rawan telat bayar. |
| Menurunkan hambatan masuk untuk streamer volume tinggi. | Butuh konversi diamond→uang yang jelas dan threshold minimum supaya biaya penagihan tidak makan margin. |
| Cocok untuk agency yang menangani banyak streamer (satu invoice). | Risiko: kita mengukur diamond kotor, sementara nilai riil streamer = diamond setelah potongan TikTok. |

**Verdict:** rev-share bukan model yang salah, tapi model yang lebih rumit secara operasional. Ia layak hanya untuk segmen volume tinggi (agency), setelah premium tier berjalan.

---

## 4. Struktur Tier (hipotesis, belum divalidasi)

Value metric yang kita pilih: **tingkat fitur + kapasitas**, bukan jumlah seat atau per diamond. Untuk streamer, nilai datang dari widget premium dan analitik, bukan dari banyaknya akun. Batas yang dinaikkan seiring tier adalah fitur overlay dan kapasitas workspace, bukan request API (itu sudah ditangani lapisan data TikTool).

| Tier | Harga (hipotesis) | Isi | Untuk siapa |
| --- | --- | --- | --- |
| **Gratis** | $0 | 3 widget dasar (Gift Alert, Goal Bar, Chat Effects), watermark "Stream Studio", 1 project tersimpan, template community, mode demo tanpa API key. | Streamer yang coba-coba. |
| **Pro** (rekomendasi) | $19/bln · $15/bln tahunan | Semua 7 widget + Mini-Game + Avatar Arena + Poll/Prediction, tanpa watermark, project tanpa batas, recap analytics lanjutan, branding custom, template prioritas. | Streamer aktif yang mau layar lengkap. |
| **Studio / Agency** | $99/bln · $79/bln tahunan | Semua Pro + workspace multi-streamer, seat tim, deploy batch & whitelabel, akses mode rev-share "Performance", dukungan prioritas. | Talent manager / agency. |

Catatan harga: angka di atas disetel sejajar dengan rentang harga lapisan data TikTool (Basic $19, Pro $49, Ultra $149) supaya pembeli tidak merasa bayar dobel. Semua angka adalah titik awal untuk divalidasi (bagian 8). Diskon tahunan 20% (bukan 17%) dipilih karena lebih bulat dan mudah dikomunikasikan; ini pun bagian dari validasi.

---

## 5. Model Gift Rev-Share "Performance" (fase berikutnya)

Spesifikasi awal supaya bisa di-scope jadi task:

- **Siapa:** agency/streamer dengan rata-rata ≥ 50.000 diamond/bulan (patokan awal — lihat bagian 8).
- **Berapa:** 15% dari nilai gift yang terukur lewat overlay, dihitung dari diamond × konversi standar, bukan dari payout manual.
- **Cara hitung:** ledger per bulan dari telemetry `useStreamSession` (total diamond per sesi, sudah tersimpan). Konversi pakai rate standar yang dipublikasikan di dashboard; nilai ini perkiraan, ditandai jelas ke pengguna.
- **Penagihan:** invoice bulanan. Belum ada auto-debit dari TikTok (tidak ada API-nya), jadi ini kesepakatan manual.
- **Escape hatch:** streamer bisa pindah ke Pro flat kapan saja. Rev-share bukan pengganti Pro, melainkan opsi untuk volume tinggi.

Mengapa 15% dan bukan lebih: patokan yang sering dipakai untuk tool yang menaikkan pendapatan kreator ada di kisaran 10–20%. 15% diletakkan di tengah. Ini hipotesis, harus diuji willingness-to-pay.

---

## 6. Backlog Task (konkret, ada pemilik)

| # | Task | Pemilik | Prioritas | Bergantung pada |
| --- | --- | --- | --- | --- |
| 1 | Riset benchmark harga competitor + willingness-to-pay (Van Westendorp) ke 5–10 streamer/agency | Market Research Analyst | high | — |
| 2 | Validasi konversi diamond→USD + threshold minimum rev-share yang tidak merugi | Market Research Analyst | medium | #1 |
| 3 | Halaman `/pricing` (struktur tier, copy, FAQ, tombol CTA) | CMO (copy) + Designer (visual) | high | #1 |
| 4 | Data model entitlement: tier, feature flags, watermark | CTO | high | — (independen) |
| 5 | Implementasi feature gating + watermark di stream-studio | CTO | high | #4 |
| 6 | Integrasi billing (Stripe / midtrans / QRIS) + langganan & diskon tahunan | CTO | high | #4, #3 |
| 7 | Ledger rev-share: agregasi diamond per bulan + faktur + rate konversi | CTO | medium | #2, #6 |
| 8 | Opsi "Performance" di onboarding agency + alur pindah Pro↔Performance | CTO | medium | #7 |

Urutan yang disarankan: #1 (validasi harga) dan #4 (model entitlement) bisa jalan paralel sekarang. #3, #5, #6 menyusul begitu #1 memberi angka. #7–#8 dikerjakan setelah premium tier hidup.

---

## 7. Hubungan dengan Lapisan Data TikTool

Monetisasi studio berdiri di atas langganan TikTool yang sudah ada. Ini penting supaya tidak bentrok:

- Streamer yang pakai Pro kita tetap butuh API key TikTool (Community gratis cukup untuk 1 stream; Pro TikTool untuk stream paralel). Biaya TikTool adalah biaya pembeli, bukan margin kita.
- Kita tidak menjual ulang akses data TikTool; kita menjual studio (builder + widget + recap). Keduanya beda lapisan dan beda invoice.
- Untuk agency, satu langganan Studio bisa dipasangkan dengan satu key TikTool Global Agency; kita tidak perlu jadi reseller.

---

## 8. Asumsi yang Harus Divalidasi Sebelum Harga Final

Daftar ini adalah gerbang sebelum halaman pricing dipublikasikan. Tidak ada yang boleh dipasang tanpa jawaban:

1. **Willingness-to-pay** streamer Indonesia vs global (pasar lokal mungkin butuh tier rupiah yang lebih rendah dari USD).
2. **Konversi diamond→USD riil** di region target (angka 1 diamond ≈ US$0.005 harus dikonfirmasi dari payout streamer sungguhan).
3. **Threshold minimum rev-share** yang membuat biaya penagihan + risiko telat bayar masih menguntungkan.
4. **Banding harga** terhadap alternatif: Streamlabs Ultra, overlay custom sekali bayar, tool overlay TikTok lain (jika ada).
5. **Provider billing** yang didukung di region target (Stripe tidak tersedia di semua negara; QRIS/midtrans untuk Indonesia).

---

## 9. Perubahan Setelah Dokumen Ini

- `docs/monetisasi.md` (dokumen ini) — model + backlog.
- Child issue riset harga → Market Research Analyst (benchmark + WTP), dibuat oleh CTO.
- Task engineering (#4–#8) tetap backlog milik CTO; dibuat jadi issue terpisah setelah validasi harga selesai.
