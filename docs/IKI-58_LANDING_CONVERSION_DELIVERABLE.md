> **STATUS: REJECTED by Board (2026-08-14).**
> Alasan: `ini beda project dan jangan diubah project wa-gateway`.
> Dokumen ini mencatat deliverable lama yang salah target ke `wa-gateway`. Rework resmi ada di IKI-140 (landing Tiktok Stream). Jangan pakai copy/daftar file ini sebagai deliverable aktif.

# IKI-58 — Sprint 2 Landing Conversion & Messaging

**Owner:** CMO
**Status:** Ready for board/CEO review
**Date:** 2026-08-15

## Scope

Meningkatkan konversi landing page Ikisae pada hero, value proposition, CTA, social proof, pricing, dan FAQ, dengan sumber kebenaran `docs/MARKETING_RESEARCH_REPORT.md` di repo `wa-gateway`.

## Deliverables

Perubahan diterapkan langsung di repo aplikasi Ikisae: `/Users/user/Documents/wa-gateway`.

### Hero & CTA
- `frontend/src/app/components/landing/HeroSection.tsx`
- `frontend/src/app/components/landing/HeroSection.module.css`
- Menegaskan dual support WhatsApp + Telegram, nilai gratis, dan menambah CTA sekunder ke `/#pricing`.
- Menambahkan proof bullets: WhatsApp & Telegram, 20 transaksi gratis/bulan, 30 chat AI gratis/bulan, tanpa kartu kredit.

### Social proof
- `frontend/src/app/components/landing/SocialProof.tsx` (file baru)
- `frontend/src/app/LandingClient.tsx`
- Menampilkan klaim berbasis fakta produk, bukan testimoni palsu: WA + Telegram, tanpa install aplikasi, dashboard web, komunitas WhatsApp.

### Value proposition
- `frontend/src/app/components/landing/FeaturesBento.tsx`
- `frontend/src/app/components/landing/FeaturesBento.module.css`
- Menambah blok “Fitur Terlengkap” untuk Hutang & Piutang, Multi-Rekening, Budget, dan AI Chat.
- Mempertegas section title/subtitle landing.

### Pricing & FAQ
- `frontend/src/app/i18n/landing.ts`
- `frontend/src/app/page.tsx`
- Free tier: 20 transaksi & 30 chat AI/bulan.
- Pro: Rp30rb/bulan.
- FAQ diarahkan ke objection konversi: gratis, dual channel, tanpa install, fitur, keamanan data, upgrade Pro.
- Metadata description diperbarui agar menyebut hutang/piutang, budget, free tier, dan harga Pro.

### Final CTA
- `frontend/src/app/LandingClient.tsx`
- Menambah CTA penutup sebelum footer dengan primary `/register` dan secondary `/#pricing`.

## Verification

- `npx tsc --noEmit --incremental false --pretty false` di `frontend`: hanya error pre-existing/unrelated di `src/app/api/finance/transfer/route.ts`; tidak ada error pada file yang diubah.
- ESLint pada file yang diubah: 0 error/warning.
- `git diff --check` pada file yang diubah: bersih.

## Release gate

Belum commit/merge. Menunggu review board/CEO sebelum Sprint 5 integrasi, sesuai `docs/WEBSITE_5_SPRINT_PLAN.md`.
