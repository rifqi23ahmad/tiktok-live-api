# Beyblade Arena — Viewer Characters (IKI-38)

**Pemilik:** CTO
**Isu:** IKI-38 — Beyblade-style battle mode for Viewer Characters (AvatarArena)

Transformasi widget Viewer Characters menjadi arena pertarungan ala beyblade, plus perbaikan limit "1 permainan per live".

## Mekanik

- **Penonton jadi beyblade** — avatar penonton berputar seperti gasing di dalam stadium melingkar dan saling berbenturan.
- **Gift menambah kekuatan** — setiap gift menambah `power` (damage) beyblade penonton, dan memulihkan sebagian HP.
- **Like menambah kekuatan** — like juga menambah `power` dan HP dalam jumlah kecil.
- **Komentar tampil di beyblade** — komentar chat dirender di atas gasing yang sedang berputar (teks di-counter-rotate agar tetap terbaca).
- **Host ikut bermain** — host adalah pemain permanen dengan `power` dasar lebih tinggi (30 vs 10) dan HP lebih besar (160 vs 100), ditandai badge 👑.
- **Benturan** — tiap beberapa detik dua beyblade bentrok; yang lebih kuat mengurangi HP yang lemah. HP habis = beyblade "burst" (terlempar keluar). Yang tersisa terakhir menang, lalu arena reset.

## Implementasi

- `app/components/widgets/AvatarArena.vue` — mode `beyblade` (default) dengan state, loop benturan, dan render stadium.
- `public/avatar-arena.html` — versi standalone vanilla JS dari mode yang sama.
- `app/composables/useWidgetRegistry.ts` — default mode widget diubah ke `beyblade`.
- `app/components/builder/InspectorPanel.vue` — opsi `Beyblade Arena` ditambahkan ke selector mode.
- `app/utils/sfx.ts` — event suara baru `clash` dan `burst`.

## Perbaikan limit 1 permainan per live

Sebelumnya URL publikasi hanya menunjuk ke satu overlay (`avatar-arena.html`), sehingga berapa pun widget yang disusun di kanvas, hanya satu yang tampil. Sekarang:

- `app/utils/overlay.ts` — encode/decode seluruh layout kanvas menjadi satu parameter URL (base64url).
- `app/pages/overlay.vue` — halaman browser source yang merender semua instance widget sekaligus (posisi/ukuran/props) dan auto mode demo / connect.
- `app/components/builder/BuilderToolbar.vue` — URL publish sekarang `/overlay?config=…` berisi semua widget.

## Verifikasi

1. `cd stream-studio && npm run build` — lulus.
2. Demo (tanpa API key): `/overlay?config=…` menampilkan beberapa widget bersamaan; mode beyblade terlihat (stadium, host, benturan, komentar).
3. `avatar-arena.html?demo=1&mode=beyblade` menampilkan arena beyblade standalone.
