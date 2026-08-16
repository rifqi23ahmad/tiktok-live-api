# Panduan Konten Anti "AI Slop"

**Untuk dibagikan ke seluruh staff yang menyentuh konten** — teks produk, README, UI copy, overlay, caption, materi marketing, dan postingan sosial.

Dokumen ini dibuat karena produk kita sudah bagus secara teknis, tapi teks di sekelilingnya masih terbaca seperti "AI slop" — tulisan yang kedengaran mulus, generik, dan bisa ditulis siapa pun (atau mesin apa pun). Slop membuat orang mempercayai kita lebih sedikit, bukan lebih banyak.

---

## 1. Apa itu AI slop, dan kenapa merugikan kita

**AI slop** = teks yang *terlihat* bagus tapi *tidak berarti apa-apa*. Ciri utamanya bukan "ditulis AI", melainkan: kata-kata besar tanpa bukti, kalimat yang bisa dipindah ke produk pesaing tanpa mengubah apa pun, dan pujian kosong terhadap diri sendiri.

Untuk bisnis konten, slop itu mahal:

- **Menurunkan kepercayaan.** Pembaca (dan algoritma) sudah terlatih mengenali pola "paling lengkap", "seamless", "revolutionary". Begitu terbaca, kredibilitas kita turun.
- **Tidak membedakan kita.** Kalau pesaing bisa menempel nama produknya ke kalimat kita dan tetap masuk akal, kalimat itu tidak berharga.
- **Membuang perhatian.** Konten kita bersaing melawan ribuan streamer lain. Slop tidak menghentikan orang untuk scroll.

Prinsip dasarnya satu: **tulis hal yang hanya bisa kita tulis.** Setiap kalimat harus mengandung fakta, angka, nama, atau sudut pandang yang spesifik ke produk kita.

---

## 2. Tanda-tanda slop yang masih ada di repo kita (dengan bukti)

Berikut pola yang benar-benar ditemukan di file kita sendiri, supaya jelas ini bukan teori:

| Tanda slop | Contoh nyata di repo kita | Kenapa buruk |
| --- | --- | --- |
| **Superlatif kosong** | `README.md:15` — *"the most complete, production-managed TikTok LIVE API"* | "Paling lengkap" tanpa bukti. Klaim #1 tidak bisa dipertahankan. |
| **Angka tanpa sumber** | `README.md:28` — *"99.9% uptime, no reverse engineering, no maintenance required"* | Angka presisi tanpa metodologi = angka yang dibuat-buat. |
| **Pengulangan filler** | `README.md:84` — *"That's it. No complex setup, no protobuf, no reverse engineering, no breakages when TikTok updates."* | Satu ide diulang 4× dalam satu kalimat. |
| **Buzzword hampa** | `stream-studio/app/utils/stream.ts:3` & `data/templates.ts:16` — *"battle-tested"* | "Sudah teruji di medan tempur" tanpa menyebutkan apa dan oleh siapa. |
| **Emoji berlebihan di judul** | `README.md` — 18 baris mengandung 🚀💬🎁❤️➕👀✅📊📡📦✨, termasuk judul `## 🚀 Try It Now - Live Demo` | Emoji sebagai hiasan, bukan makna. Bikin dokumen teknis terlihat seperti iklan. |
| **Kebocoran proses AI** | `overlay/overlay.html:13`, `stream-studio/public/templates/overlay-classic.html:14`, `tiktok-live-project/public/overlay.html:13` — *"pre-emit critique: P4 H5 E4 S4 R4 V4"* | Catatan internal AI bocor ke file produksi. Ini tanda paling jelas. |
| **Keyword stuffing untuk SEO** | commit `238908c` — *"chore(seo): keyword-rich metadata + stronger README H1 and positioning"* | Menjejalkan kata kunci demi mesin, bukan manusia. |

Pola-pola ini bukan dosa besar satu per satu, tapi kalau menumpuk, keseluruhan dokumen terbaca seperti mesin yang berusaha terdengar hebat.

---

## 3. Aturan menulis yang bukan slop

### 3.1 Ganti klaim dengan bukti

- ❌ "Paling lengkap, production-managed."
- ✅ "Mendukung 54 tipe event (chat, gift, battle, captions) lewat satu WebSocket; daftar lengkap ada di bawah."

Aturannya: **setiap kata sifat superlatif harus diikuti oleh fakta yang membuatnya benar.** Kalau tidak ada faktanya, hapus kata sifatnya.

### 3.2 Tulis angka yang bisa diverifikasi

- ❌ "99.9% uptime."
- ✅ "SLI uptime kami: lihat halaman status tik.tools untuk angka terkini." — atau hapus angkanya kalau tidak punya sumber.

Angka presisi tanpa metodologi lebih merusak daripada tidak menyebut angka sama sekali.

### 3.3 Satu ide, satu kalimat

- ❌ "No complex setup, no protobuf, no reverse engineering, no breakages."
- ✅ "Setup tanpa konfigurasi tambahan. Perubahan TikTok tidak merusak koneksi kamu."

Pilih satu klaim terkuat, lalu buktikan. Jangan menumpuk tiga klaim lemah.

### 3.4 Hapus emoji dekoratif di teks teknis

Emoji boleh di UI dan konten sosial yang memang butuh warna, tapi di README, docs, dan judul teknis, emoji yang tidak menambah makna harus dihapus.

- ❌ `## 🚀 Try It Now - Live Demo`
- ✅ `## Live Demo` atau `## Coba langsung`

### 3.5 Bersihkan artefak proses sebelum commit

Tidak boleh ada catatan internal ("pre-emit critique", TODO yang tidak jelas, self-review score) yang bocor ke file produksi. Tambahkan ke proses review: cari komentar/string yang tidak masuk akal untuk pembaca eksternal.

### 3.6 Spesifik itu mahal, dan itu bagus

- ❌ "battle-tested."
- ✅ "Template ini dipakai di overlay/ versi sebelumnya dan port tanpa perubahan perilaku."

Kalau kita tidak bisa menyebutkan detailnya, berarti klaimnya tidak layak ditulis.

---

## 4. Sebelum → Sesudah (contoh dari file kita sendiri)

**README pembuka (sekarang):**

> `tiktok-live-api` is the most complete, production-managed TikTok LIVE API for Node.js and TypeScript.

**Usulan:**

> `tiktok-live-api` connects to any TikTok LIVE stream over one WebSocket. You get chat, gifts, likes, follows, viewer counts, and battle events in real time — plus AI live captions with 60+ language translation.

Kenapa lebih baik: mengganti "paling lengkap" dengan daftar konkret yang bisa dicek pembaca di 5 detik.

**Pitch (sekarang):**

> The premium managed alternative for TikTok LIVE data. What you get out of the box: ...

**Usulan:**

> tik.tools handles TikTok's signing and protocol updates so you don't have to. Connect with an API key — no sign server, no protobuf.

Kenapa lebih baik: "premium" diganti dengan penjelasan apa yang sebenarnya dibeli pembaca.

---

## 5. Checklist sebelum publish

Sebelum menekan commit/merger/post, jalankan daftar ini:

- [ ] Tidak ada superlatif tanpa bukti ("paling", "terbaik", "premium", "revolutionary").
- [ ] Tidak ada angka tanpa sumber atau metodologi.
- [ ] Tidak ada satu ide yang diulang dalam satu kalimat.
- [ ] Tidak ada emoji dekoratif di judul/docs teknis.
- [ ] Tidak ada catatan internal / artefak proses AI yang bocor.
- [ ] Setiap klaim bisa dijawab pertanyaan "bukti apa?" dengan menunjuk ke fakta, angka, atau demo.
- [ ] Kalimat tetap masuk akal kalau nama produknya diganti nama pesaing? Kalau ya, tulis ulang supaya spesifik.
- [ ] Test pembaca 5 detik: orang bisa menyebutkan satu hal konkret yang membuat produk ini berbeda, tanpa membaca paragraf dua kali.

---

## 6. Pembagian peran

| Peran | Tanggung jawab konten |
| --- | --- |
| Engineer / CTO | README, docs teknis, komentar kode, pesan error — bersihkan artefak AI & superlatif |
| Designer | UI copy, label tombol, empty state — tulis spesifik, bukan placeholder |
| CMO / konten | Caption, sosial media, materi marketing — bukti & sudut pandang, bukan pujian |
| PM | Menegakkan checklist ini di review, menjadi gerbang terakhir sebelum publish |

---

## 7. Penutup

Tidak perlu terdengar jenius. Perlu terdengar **benar dan spesifik**. Slop mencoba membuat kita tampak hebat dan justru membuat kita tampak generik; menulis yang konkret dan jujur adalah cara termurah untuk tampil berbeda dari ribuan konten lain di feed.

> Rule of thumb: **Jika kalimatmu bisa ditempel ke produk pesaing tanpa berubah, jangan tulis.**
