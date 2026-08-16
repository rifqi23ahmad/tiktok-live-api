# Website Ikisae — Rencana 5 Sprint (10 Jam)

**Issue koordinasi:** IKI-53
**Target selesai aktual:** sebelum 2026-08-15 11:11 WIB
**Pemilik akhir:** CEO; eksekusi didelegasikan ke CTO, CMO, dan PM.
**Gate rilis:** tidak ada `git commit`/`merge` sampai board eksplisit menyetujui.

## Prinsip lintas tim
- Setiap pemilik sprint melapor di child issue masing-masing.
- Sprint 5 mengintegrasikan hasil Sprint 1-4.
- Blocker/eskalasi naik ke IKI-53 bila butuh keputusan.
- Semua perubahan harus reviewable: diff, laporan audit, dan checklist QA/release.
- CEO menunggu wake event dari child issue; tidak melakukan pekerjaan implementasi.

## Sprint 1 — Technical Audit & Foundation
- Issue: IKI-55
- Owner: CTO
- Scope: audit frontend, API stability, build/lint, lalu critical fixes.
- Child tracks: IKI-70 frontend, IKI-71 backend, IKI-72 build/lint, IKI-73 QA gate.
- Output: laporan audit + perbaikan kritikal terverifikasi.

## Sprint 2 — Landing Conversion & Messaging
- Issue: IKI-58
- Owner: CPO (interim; CMO terminated, board hiring action IKI-111)
- Rejection 2026-08-14: prior deliverable salah target ke `wa-gateway`; board: jangan ubah proyek `wa-gateway`.
- Scope: value proposition landing page, CTA, bukti sosial, pricing, FAQ, dan pesan yang mengonversi untuk Tiktok Stream (`stream-studio/app/pages/index.vue` + komponen Nuxt terkait).
- Larangan: tidak mengakses/mengubah `wa-gateway`, `bimbel-mapa`, atau `Edusae`.
- Sumber kebenaran: dokumen dan implementasi Tiktok Stream, bukan copy Ikisae/wa-gateway.
- Output: copy/landing revisions reviewable + work product di `tiktokstrem/docs`.
- Child rework: IKI-140 -> CPO.

## Sprint 3 — Onboarding & Activation
- Issue: IKI-56
- Owner: PM
- Scope: kurangi friksi daftar/login → hubungkan WhatsApp/Telegram → transaksi pertama.
- Child tracks: IKI-60 research, IKI-67 design, IKI-69 implementation.
- Output: alur onboarding yang lebih pendek dengan empty states dan first-run setup yang memberi nilai.

## Sprint 4 — SEO & Content Distribution
- Issue: IKI-59
- Owner: CMO
- Scope: SEO teknis/on-page dan rencana distribusi konten untuk mendatangkan traffic.
- Output: perbaikan SEO + playbook distribusi konten.

## Sprint 5 — Integration, QA, Release Readiness
- Issue: IKI-57
- Owner: CTO
- Scope: integrasi widget/builder + AI host, keamanan, build/lint, QA smoke test, checklist rilis.
- Child tracks: IKI-61 FE, IKI-62 BE, IKI-63 Tarogo, IKI-64 Security, IKI-65 QA, IKI-66 build/lint, IKI-68 release readiness.
- Output: diff reviewable + checklist rilis untuk approval board.

## Acceptance Criteria
- Lima sprint memiliki child issue yang berjalan dengan owner jelas.
- Tidak ada commit/merge tanpa approval board.
- Sprint 1-4 selesai dan hasilnya terintegrasi di Sprint 5.
- Sprint 5 menghasilkan diff reviewable, hasil QA/build/security, dan rekomendasi rilis.
- CEO menutup IKI-53 setelah semua sprint selesai dan board menyetujui rilis.
