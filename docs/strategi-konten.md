# Strategi Konten — Stream Studio / Tiktok Stream

**Pemilik:** CMO
**Tanggal:** 2026-08-14
**Tujuan bisnis:** Akuisisi streamer TikTok LIVE ke Stream Studio, konversi jadi pemakaian overlay (publish URL + sambungkan API key).

Dokumen ini adalah peta konten untuk fase pertumbuhan. Semua klaim ditulis mengikuti panduan anti-slop (`docs/panduan-konten-anti-ai-slop.md`): bukti spesifik, tidak ada superlatif kosong, tidak ada angka karangan.

---

## 1. Fokus dan ICP

Konten menyasar satu orang: **streamer TikTok LIVE** yang layarnya polos dan ingin penonton lebih aktif (gift, tahan lebih lama). Persona sekunder: talent manager agency yang menangani banyak streamer.

Kalimat yang kita jawab berulang kali: *"Bagaimana bikin layar TikTok LIVE saya rame dan bikin penonton mau kasih gift, tanpa ngoding?"*

---

## 2. Tiga Content Pillar

| Pillar | Proporsi | Fungsi | Contoh topik |
|---|---|---|---|
| **Cara bikin overlay TikTok LIVE** | 40% | Searchable — menangkap demand orang yang googling/nyari cara setup overlay | setup browser source di OBS, goal bar diamond, alert gift bertingkat |
| **Mekanik gift & engagement TikTok LIVE** | 35% | Searchable + shareable — edukasi soal diamond, tier gift, PK | cara kerja diamond, gimana top gifter didorong, prediksi pemenang PK |
| **Di balik layar produk (build in public)** | 25% | Shareable — membangun brand & kepercayaan kreator | widget yang lagi dibangun, keputusan desain, hasil demo live |

Rationale: dua pillar pertama menangkap orang yang sudah aktif mencari solusi (search), pillar ketiga membangun audiens yang mengenal dan mempercayai kita sebelum butuh produk.

---

## 3. Topic Cluster per Pillar

### Pillar 1 — Cara bikin overlay TikTok LIVE
```
Overlay TikTok LIVE (hub)
├── Setup browser source di OBS (panduan langkah demi langkah)
├── Cara pasang Stream Studio dalam 4 langkah (dari dashboard ke live)
├── Goal bar diamond: cara atur target & milestone
├── Alert gift bertingkat: cara atur tier & combo meter
└── Leaderboard top sultan: cara atur max row & judul
```

### Pillar 2 — Mekanik gift & engagement
```
Mekanik gift TikTok LIVE (hub)
├── Apa itu diamond dan cara dihitung (pengantar untuk streamer baru)
├── Cara kerja tier gift (kenapa alert harus bertingkat)
├── Marble Race & Gift War: mini-game yang membuat penonton kasih gift
├── Poll / prediksi pemenang PK lewat chat
├── Avatar Arena: mengubah penonton jadi karakter di layar
└── Kenapa overlay Twitch tidak cocok untuk TikTok LIVE (comparison)
```

### Pillar 3 — Build in public
```
Di balik layar (serial)
├── Kenapa kami membangun overlay khusus TikTok LIVE (bukan port Twitch)
├── Keputusan desain: kanvas 9:16 dan mengapa bukan 16:9
├── Mode demo tanpa API key: alasan di balik keputusan ini
└── Test live overlay di stream sungguhan (rekam hasilnya)
```

---

## 4. Keyword Map by Buyer Stage

| Stage | Modifier | Keyword yang dituju | Konten |
|---|---|---|---|
| Awareness | cara, apa itu | "cara bikin overlay tiktok live", "apa itu diamond tiktok live", "overlay tiktok live gratis" | Panduan pengantar, definisi |
| Consideration | vs, alternatif | "overlay tiktok live vs twitch", "alternatif streamelements untuk tiktok", "tools overlay tiktok" | Comparison, daftar tools |
| Decision | cara pakai, setup, review | "cara pasang overlay tiktok di obs", "stream studio overlay" | Tutorial setup 4 langkah |
| Implementation | template, contoh | "template overlay tiktok live", "contoh overlay goal bar" | Template gallery, demo |

Catatan: volume search belum diukur (belum ada akses Ahrefs/SEMrush/GSC). Angka volume **tidak** boleh dipakai sampai ada data nyata. Urutan prioritas di bawah ini memakai penilaian kualitatif, bukan angka search.

---

## 5. Prioritas Topik (10 pertama)

Penilaian: Customer Impact 40% · Content-Market Fit 30% · Search Potential 20% · Resources 10%.

| # | Topik | Searchable/Shareable | Tipe | Stage | Skor (perkiraan) |
|---|---|---|---|---|---|
| 1 | Cara pasang overlay TikTok LIVE di OBS dalam 4 langkah | Searchable | Use-case / tutorial | Decision | Tinggi |
| 2 | Kenapa overlay Twitch tidak cocok untuk gift TikTok LIVE | Both | Comparison | Consideration | Tinggi |
| 3 | Apa itu diamond TikTok LIVE dan cara menghitungnya | Searchable | Pengantar | Awareness | Tinggi |
| 4 | Marble Race & Gift War: mini-game yang memicu gift | Shareable | Use-case + demo | Awareness | Tinggi |
| 5 | Alert gift bertingkat: kenapa tier penting | Both | Edukasi | Consideration | Sedang |
| 6 | Poll / tebak pemenang PK lewat chat | Both | Use-case | Awareness | Sedang |
| 7 | Avatar Arena: penonton jadi karakter di layar | Shareable | Demo | Awareness | Sedang |
| 8 | Mode demo tanpa API key: kenapa kami buat | Shareable | Build in public | - | Sedang |
| 9 | Goal bar diamond: atur target & milestone | Searchable | Tutorial | Implementation | Sedang |
| 10 | Kanvas 9:16 vs 16:9 untuk overlay live | Shareable | Build in public | - | Rendah |

Aturan skor: 1-3 dibangun dulu (menangkap demand + menampilkan diferensiasi). 4-7 menyusul. 8-10 dibuat saat sudah ada produk yang bisa ditunjukkan.

---

## 6. Format Produksi

Prioritas format mengikuti medium tempat ICP berada:

1. **Video pendek (TikTok/Reels/Shorts)** — demo overlay + hasil di layar, 15–60 detik. (Detail di `docs/rencana-tiktok.md`.)
2. **Tutorial teks + gambar** di blog/docs — untuk konten searchable yang panjang.
3. **Thread/pos platform streamer** — potongan insight mekanik gift.

Setiap konten panjang (blog/tutorial) dipotong jadi "content atom" untuk video pendek (lihat sistem repurposing di `docs/rencana-tiktok.md`).

---

## 7. Repurposing System

Satu tutorial/panduan → banyak output:

| Sumber (pillar content) | Output turunan |
|---|---|
| Panduan setup OBS 4 langkah | TikTok tutorial 30 dtk, thread X, carousel |
| Post "overlay Twitch vs TikTok" | Kutipan bold (15 dtk), thread, pos LinkedIn |
| Demo Marble Race | Klip hasil (30 dtk), before/after, kutipan data |

Alur: buat pillar content → ekstrak 5–10 "atom" (kutipan, angka, demo, cerita) → adaptasi per platform → jadwalkan 1–2 minggu.

---

## 8. Langkah Berikutnya

1. Terbitkan 3 konten pertama (setup OBS, comparison Twitch vs TikTok, pengantar diamond) — milik CMO/penulis konten.
2. Rekam demo overlay sungguhan sebagai bahan video pendek.
3. Bangun halaman `/docs` atau `/blog` di situs produk untuk konten searchable.
4. Ukur: mana konten yang mendatangkan streamer yang benar-benar publish overlay.

Catatan: karena produk masih pra-rilis dan belum ada data traffic/customer, prioritas topik di atas adalah hipotesis yang harus dikoreksi setelah data pertama masuk.
