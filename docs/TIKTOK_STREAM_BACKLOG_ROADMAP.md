# Tiktok Stream — Product Backlog & Flow Roadmap

**Owner:** CPO
**Date:** 2026-08-15
**Source issue:** IKI-114
**Parent:** IKI-89
**Scope:** `tiktokstrem` workspace only
**Status:** Proposed for CEO triage; no implementation in this issue

---

## 1. North Star

**Metric:** Weekly Published Overlay Sessions (WPOS)

- Definition: unique live sessions per week where a streamer successfully publishes or runs at least one Stream Studio overlay.
- Why: this is the point where setup effort turns into actual product usage and observable viewer interaction.
- Secondary guardrails: demo → publish conversion, time-to-first-published-overlay, weekly active overlay instances, premium-tier trial starts.

**Product thesis:** a TikTok LIVE host should be able to go from no-code overlay to a more engaging live session in under 15 minutes, and feel the product is working because viewer participation visibly increases.

---

## 2. Current State

Stream Studio is a Nuxt 4 / Vue 3 no-code overlay builder for TikTok LIVE. It currently has:

- Pages: `/`, `/builder`, `/gallery`, `/live`, `/overlay`.
- Demo mode that works without an API key.
- Multi-widget publish through `/overlay?config=...`; one canvas layout encoded in a single browser-source URL.
- Self-contained templates: Hallmark Classic, Goal Crusher, Alert Pop.
- Web Audio SFX without audio assets.

Shipped interactive widgets:

| Widget | Interaction |
| --- | --- |
| Gift Alert + Combo | tiered gift alerts + combo meter |
| Goal Bar | diamond goal progress |
| Mini-Game | Marble Race / Gift War |
| Poll / Prediction | chat votes and PK predictions |
| Gift Leaderboard | top gifter on screen |
| Chat → Effects | floating emoji, rain, shoutout, hype meter |
| Viewer Characters / Avatar Arena | beyblade arena, audience arena, avatar race, avatar war |
| Team Battle | team selection, rounds, countdown, celebration |
| Poin Loyalty + Shop | points from chat/like/follow/gift; redeem via commands |
| Roda Keberuntungan | gift-weighted lucky wheel |

Shipped enabling features:

- AI host greets and replies to comments using Tarogo.
- Host TTS (`IKI-41`) and comment TTS (`IKI-52`) using browser speech synthesis.
- Multi-widget overlay rendering from a single publish URL (`IKI-38`).

Planned but not shipped:

- Persistent layouts and short publish URLs.
- Onboarding and activation instrumentation.
- Premium tier, feature gating, watermark, billing.
- Agency rev-share "Performance" ledger.
- Content engine from the TikTok content plan.
- Recap analytics mentioned in the monetization plan.

---

## 3. All Flows

| Stage | Actor | Current path | Main gap |
| --- | --- | --- | --- |
| Awareness | Host/streamer | TikTok content, SEO, product link | Content plan exists but demo content not produced |
| Consideration | Host/streamer | Landing page → product value prop → CTA | CTA-to-builder conversion not instrumented |
| Activation | Host | Builder → template → demo or connect TikTok → publish URL → OBS | No short/saved URL, no funnel events, no guided onboarding |
| Engagement | Host + viewers | Live events feed widgets: chat, gift, like, follow, member | Strong widget coverage; no persistence of preferences/sessions |
| Retention | Host + viewers | Loyalty points, leaderboard, AI host, arena/games | No cross-session identity or saved layouts |
| Monetization | Host/agency | Free usage planned → premium self-serve → rev-share | Pricing unvalidated, no entitlement/billing |
| Distribution | Host/agency | Publish URL, templates, gallery | Long config URL; no shareable project link |
| Release | Team | Sprint 5 QA/build/security release gate | Release readiness still being closed |

---

## 4. Consolidated Proposed Interactive Products

| Product | Status | Impact | Effort |
| --- | --- | --- | --- |
| Gift Alert, Goal Bar, Mini-Game, Poll, Leaderboard, Chat Effects | Shipped v1 | High for activation | Already built |
| Avatar Arena / Beyblade, Audience Arena, Race, War | Shipped | High for engagement | Already built |
| Team Battle | Shipped | High for engagement/gift velocity | Already built |
| Poin Loyalty + Shop | Shipped | High for retention/chat volume | Already built |
| Roda Keberuntungan | Shipped | Medium-high for gift spikes | Already built |
| AI Host + Host TTS + Comment TTS | Shipped | High for host usability | Already built |
| Multi-widget publish URL | Shipped | High for product usability | Already built |
| Persistent layouts + short publish URLs | Proposed | High | Medium |
| Onboarding activation v2 | Proposed | High | Medium |
| Premium feature gating + billing | Proposed | High | Large |
| Recap analytics | Proposed | Medium | Medium |
| Agency rev-share "Performance" ledger | Proposed | Medium | Large |
| Content engine: demo videos + 14-day content calendar | Proposed | Medium | Small |

---

## 5. Prioritization

Ordering uses business impact first, then time-to-value and dependencies. P0 means the shortest path to the north-star metric or to removing a hard blocker on monetization.

| Rank | Initiative | Impact | Effort | Dependencies | Disposition |
| --- | --- | --- | --- | --- | --- |
| 1 | Pricing validation & tier freeze | High | S | None | **Ready** |
| 2 | Onboarding activation v2: first published overlay < 15 min | High | M | Discovery now; build after Sprint 5 release readiness | **Ready** |
| 3 | Persistent layouts + short publish URLs | High | M | After release chain clears | **Ready** |
| 4 | Premium feature gating + billing | High | L | Pricing validation + `/pricing` page | Later |
| 5 | Content engine: produce 3 demo videos and start 14-day calendar | Medium | S | None | Later |
| 6 | Recap analytics | Medium | M | Session data model | Later |
| 7 | Agency rev-share "Performance" ledger | Medium | L | Premium billing + diamond conversion validation | Later |

---

## 6. Next 3 Ready Candidates

### Candidate 1 — Pricing validation & tier freeze

- **Title:** Validate Stream Studio pricing, diamond conversion, and billing provider; freeze initial tiers.
- **Owner:** Product Manager (PM)
- **Impact:** Removes the largest revenue-risk assumption before building `/pricing`, entitlement, and billing. Prevents engineering work against unvalidated willingness-to-pay.
- **Rough effort:** S — 2–3 working days.
- **Acceptance criteria:**
  - Benchmark at least 5 comparable products/pricing alternatives.
  - Run willingness-to-pay interviews with 5–10 streamers or agency contacts.
  - Validate `1 diamond ≈ US$0.005` using at least 2 real streamer payout data points or clearly flag it as unresolved.
  - Recommend billing provider for Indonesia + global target segments (e.g. Midtrans/QRIS vs Stripe).
  - Publish a one-page pricing recommendation: final tiers, prices, feature gates, and open questions.

### Candidate 2 — Onboarding activation v2: first published overlay under 15 minutes

- **Title:** Ship guided setup and funnel instrumentation for first published overlay.
- **Owner:** Product Owner (PO)
- **Impact:** Directly improves demo → publish conversion and time-to-first-published-overlay, the main activation drivers for WPOS.
- **Rough effort:** M — 4–6 working days including design/engineering.
- **Acceptance criteria:**
  - Four-step guided setup is visible in the builder: template, connect or demo, configure, publish to OBS/Streamlabs.
  - OBS/Streamlabs browser-source checklist is included.
  - Funnel events are recorded: landing → builder open → template selected → connected/demo → published.
  - Demo mode works without an API key in step one.
  - Build/lint and QA smoke pass.

### Candidate 3 — Persistent layouts + short publish URLs

- **Title:** Add server-side layout storage and `/overlay/:id` short URLs.
- **Owner:** CTO
- **Impact:** Removes the long encoded-URL friction, enables sharing/repeat use, and is a prerequisite for retention analytics and easier collaboration.
- **Rough effort:** M — 4–6 working days including backend, frontend, and QA.
- **Acceptance criteria:**
  - Server-side layout storage is implemented.
  - `/overlay/:id` renders a saved layout.
  - Users can create, list, rename, duplicate, and delete layouts.
  - Demo mode works without login.
  - No secrets are stored in layout payload or public URL.
  - Build/lint and QA smoke pass.

---

## 7. Routing Decision

- CPO proposes these 3 Ready candidates; CEO triages, approves/reorders, then creates and assigns child issues.
- No implementation should start before CEO approval.
- `docs/monetisasi.md`, `docs/rencana-tiktok.md`, `docs/fitur-interaktif-tahap-2.md`, `docs/beyblade-arena-iki-38.md`, `docs/tts-host-iki-41.md`, and `docs/tts-komentar-iki-52.md` remain the detailed source documents.
