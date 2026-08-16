# Revenue Layer PM Discovery — Pricing, Provider, Activation Metrics

**Owner:** Product Manager (PM)
**Issue:** IKI-125
**Parent plan:** IKI-110 — Revenue Layer Execution Spec (`docs/revenue-layer-execution-spec-iki-110.md`)
**Date:** 2026-08-15
**Status:** PM artifact complete; ready for CPO review and delegation to BA/PO/CTO

## 1. Executive Summary

The CPO plan is adopted as the product baseline: **Free / Pro / Agency**, with Pro `$19/mo` global and `Rp 149.000/mo` Indonesia, Agency `$99/mo` global and `Rp 799.000/mo` Indonesia, and a `20%` annual discount. This artifact adds the PM-level discovery required by IKI-110: competitive pricing synthesis, billing provider recommendation, activation event contract, and open validation risks.

Decisions:

- **Pricing:** keep the CPO tier structure unchanged; the R4 benchmark supports Pro at `$19` and Agency at `$99`. Add IDR as a market-specific price, not a currency conversion artifact.
- **Provider:** recommend **Stripe Billing for global USD cards** plus **Midtrans for Indonesia cards/e-wallets/bank transfer**, with **QRIS through Midtrans** for IDR checkout. Wrap both behind a provider abstraction; use Paddle/Lemon Squeezy only as a merchant-of-record fallback.
- **Activation:** instrument the 10 events from IKI-110 §7 against the existing builder/overlay/stream touchpoints. Add `watermark.shown` as supporting telemetry because the watermark-removal metric requires it.
- **Risks:** WTP, diamond conversion, billing-provider/finance sign-off, manual billing cost, and the Streamlabs anchor remain open and are explicitly flagged in §5.

This is discovery and measurement definition only. **No billing is implemented in this task.**

---

## 2. Competitor + Pricing Synthesis

### 2.1 Competitive pricing landscape

| Product / alternative | Price / model | What it means for Studio |
| --- | --- | --- |
| **TikFinity** — closest direct competitor | Free core + coins for premium features | Free is the default competitor. Studio Free must be useful enough to generate published overlays and word of mouth, per IKI-110 §2. |
| **StreamElements** | Free, monetized through tips/merch/brand services | Validates free entry, but does not anchor a paid Studio price. |
| **Streamlabs** | Free + paid Ultra for premium themes/multistream | Likely premium anchor near `$19`; exact Ultra price is unverified and is an open risk (§5). |
| **TikTok LIVE Studio** | Free native tool | Sets the floor at `$0`; Studio must win on TikTok-native gift widgets and mini-games, not basic scenes. |
| **LivePix** | `5%` Pix / `7%` card and international transaction fee | Relevant for Phase 2 Performance rev-share. Supports the R4 correction to charge rev-share from **net streamer value**, not gross diamonds. |
| **Open-source TikTok LIVE libraries** | Free + self-maintenance | Competes for developers, not non-technical streamers; not a pricing anchor. |
| **Custom overlay freelancers** | `$10–200` one-time, usually `$30–80` | Supports messaging "cheaper than hiring a designer," but one-time overlays lack real-time gift interactivity. |
| **TikTool data layer (internal)** | Community free, Basic `$19`, Pro `$49`, Ultra `$149`, Global Agency `$399/mo` | Internal anchor. Studio must not feel like double-paying on top of TikTool data. |

Sources: `docs/research/r4-pricing-benchmark-wtp.md` §1, `docs/research/competitor-teardown-r1.md`.

### 2.2 Pricing decision

| Tier | CPO price | PM recommendation | Rationale |
| --- | --- | --- | --- |
| Free | `$0` | Keep `$0` | Acquisition weapon against TikFinity; 3 basic widgets, watermark, demo mode. IKI-110 §2 and §3. |
| Pro | `$19/mo` global · `Rp 149.000/mo` ID | Keep; lock IDR only after Van Westendorp | `$19` sits on two anchors: Streamlabs Ultra and TikTool Basic. IDR at ±50% of USD fits Indonesian purchasing power. IKI-110 §1. |
| Agency | `$99/mo` global · `Rp 799.000/mo` ID | Keep; position below TikTool Global Agency `$399` | Agency value is multi-streamer operations, not data resale. `$99` is defensible under the `$399` agency-data anchor. IKI-110 §3. |
| Annual discount | `20%` | Keep | `$15`/`$79` USD and `Rp 119.000`/`Rp 649.000` ID; rounded and communicable. |

**Price lock gates:**

- IDR prices are directional until 5–10 Van Westendorp interviews per segment are completed.
- Global `$19` is defensible now, but Streamlabs Ultra exact price should be re-fetched.
- No price should be hardcoded before the CPO/CEO sign-off gate in IKI-110 §9 Phase 0.

---

## 3. Billing Provider Recommendation

**Recommendation:** Start with **Stripe Billing** for global card subscriptions and **Midtrans** for Indonesian card, e-wallet, bank transfer, and **QRIS**. Treat Xendit as the Indonesia fallback and Paddle/Lemon Squeezy as the merchant-of-record fallback if tax/compliance ownership needs to be offloaded.

| Provider | Role | Reason |
| --- | --- | --- |
| **Stripe Billing** | Global USD default | Recurring subscriptions, webhooks, dunning, card handling. |
| **Midtrans** | Indonesia IDR default | Local cards, e-wallets, bank transfer, QRIS; high mobile-first checkout conversion. |
| **QRIS via Midtrans** | Indonesia instant payment | Best fit for mobile-first Indonesian streamers; must be part of IDR checkout. |
| **Xendit** | Indonesia fallback | Use if Midtrans commercial terms or approval fail. |
| **Paddle / Lemon Squeezy** | Merchant-of-record fallback | Reduces tax/compliance burden if own MoR is delayed. |

**Architecture requirement (product boundary, not implementation):**

- A `BillingProvider` abstraction must keep plan, price, discount, tax, and invoice data separate from `Entitlement`.
- Entitlement is server-authoritative and must not read raw plan data from the client or from a billing webhook without validation.
- First live market can start with Stripe global + Midtrans/QRIS IDR, then add providers without changing entitlement logic.

This aligns with IKI-110 §6 and §8 acceptance criteria 5–7.

**Open decision:** final provider terms, tax treatment, and price lock are finance-owned. The CFO role is currently terminated, so the provider decision remains open until the board/CEO names a finance owner. This must not block product spec or Phase 0/1 product work.

---

## 4. Activation Metrics and Dashboard Event Contract

### 4.1 North-star metric

**Weekly published overlays that go live at least once.**

A workspace counts only when an overlay URL is published and that published URL is later opened with real stream credentials (`apiKey !== 'demo'`).

### 4.2 Event dictionary

All events are product-owned, server-side or product-telemetry emitted. The current app has no analytics/telemetry module, so this is the contract for Phase 1 instrumentation.

| Event | Definition | Trigger / current code touchpoint | Required properties |
| --- | --- | --- | --- |
| `studio.visit` | Studio page or route view | `/` (`stream-studio/app/pages/index.vue`), `/builder`, `/gallery`, `/live`; route-level view | `workspace_id?`, `user_id?`, `path`, `referrer`, `region`, `utm_*` |
| `builder.started` | Builder opened and initialized | `stream-studio/app/pages/builder.vue` `onMounted` | `workspace_id?`, `user_id?`, `plan`, `region`, `template?` |
| `widget.added` | First widget successfully added to canvas | `stream-studio/app/components/builder/WidgetPalette.vue` click/drag → `useStudio().addWidget`; `CanvasStage.vue` drop | `workspace_id?`, `user_id?`, `widget_type`, `source` (`click`/`drag`), `widget_count` |
| `stream.connected` | Demo or live stream connection established | `stream-studio/app/pages/live.vue` `connect()`/`startDemo()`; `useTikTokStream.ts` `connect()` `ws.onopen` and `startDemo()` | `workspace_id?`, `user_id?`, `mode` (`live`/`demo`), `username_present`, `api_key_present` |
| `overlay.published` | Publish URL generated/copied/previewed | `stream-studio/app/components/builder/BuilderToolbar.vue` Publish → `publishUrl` via `encodeOverlayConfig` | `workspace_id?`, `user_id?`, `plan`, `widget_count`, `has_credentials`, `demo`, `publish_id?` |
| `overlay.live` | Published URL opened with real stream credentials | `stream-studio/app/pages/overlay.vue` `onMounted`; `cfg.apiKey !== 'demo'` and credentials present | `workspace_id?`, `user_id?`, `plan`, `publish_id?`, `widget_count`, `has_credentials` |
| `upgrade.clicked` | Pricing/CTA or locked feature upgrade path opened | Future `/pricing` page, watermark CTA, locked-widget CTA, sidebar/nav CTA | `workspace_id?`, `user_id?`, `plan`, `source` (`watermark`/`pricing`/`locked_widget`/`nav`) |
| `checkout.started` | Checkout flow entered | Future pricing/checkout UI | `workspace_id?`, `user_id?`, `plan`, `target_plan`, `billing_cycle`, `currency`, `region`, `provider?` |
| `checkout.completed` | Checkout completed and entitlement activation started | Future billing webhook/provider callback after payment success | `workspace_id?`, `user_id?`, `plan`, `target_plan`, `billing_cycle`, `currency`, `region`, `provider`, `amount` |
| `tier.changed` | Active plan/entitlement changed | Future entitlement service after checkout, downgrade, or admin change | `workspace_id?`, `user_id?`, `from_plan`, `to_plan`, `reason` (`upgrade`/`downgrade`/`admin`/`churn`) |

Supporting event:

| Event | Definition | Trigger | Required properties |
| --- | --- | --- | --- |
| `watermark.shown` | Free watermark rendered | `stream-studio/app/pages/overlay.vue` when watermark layer is visible for a Free entitlement | `workspace_id?`, `user_id?`, `plan`, `publish_id?` |

`watermark.shown` is not part of the activation funnel; it is required to compute the watermark-removal upgrade rate below.

### 4.3 Dashboard metrics

| Metric | Formula | Required events | Query notes |
| --- | --- | --- | --- |
| Activation rate | `overlay.live` / `builder.started` within 7 days | `builder.started`, `overlay.live` | Unique workspaces; count a workspace once per cohort window. |
| Time to value | median minutes from first `studio.visit` to first `overlay.published` | `studio.visit`, `overlay.published` | Exclude demo-only sessions from "value" reporting if desired; keep demo separately. |
| Free→Pro conversion | Pro upgrades / activated Free workspaces over 30 days | `tier.changed`, `overlay.live` | Denominator = Free workspaces with `overlay.live` in prior 30 days. |
| Watermark-removal upgrade rate | upgrades where `watermark.shown` preceded checkout / activated Free workspaces | `watermark.shown`, `upgrade.clicked`, `checkout.completed`, `tier.changed` | Coalesce by `workspace_id` and timestamp order. |
| Pro retention | Pro workspaces with an `overlay.live` event in the following 30 days / Pro workspaces | `overlay.live`, `tier.changed` | Monthly cohort retention. |
| Agency workspace activation | agencies with ≥2 streamers connected and ≥1 batch publish | `stream.connected`, `overlay.published` (Phase 3 batch publish event) | Requires Phase 3 multi-streamer/batch deploy; define `stream.connected` per managed stream. |
| Performance eligibility | Agency aggregate `≥100.000 diamond gross/month` | Phase 4 diamond ledger; not available in current client-only `useTikTokStream.ts` | Phase 2 only; diamond counter must become server-side ledger before use. |

### 4.4 Implementation guardrails

- Events must be queryable from product telemetry, not only present in UI logs. IKI-110 §8 criterion 9.
- The overlay diamond counter in `stream-studio/app/composables/useTikTokStream.ts` is client-side and **not** a billing ledger.
- Do not emit `checkout.completed` or `tier.changed` from the client as truth; those must come from the provider webhook/server authority.
- The publish URL currently encodes config as a client-readable query string (`stream-studio/app/utils/overlay.ts`). Activation telemetry must not trust that payload for paid status; entitlement comes from the server response.

---

## 5. Open Pricing Validation Risks

These are explicit risks, not blockers for the current PM artifact. Each has an owner/action before the relevant phase gate.

| # | Risk | Evidence | Impact if unresolved | Owner / action | Gate |
| --- | --- | --- | --- | --- | --- |
| 1 | **WTP is not yet primary data** | R4 provides secondary estimates and a Van Westendorp instrument, not completed interviews. | IDR price could be too high/low; `$19` could miss segment willingness. | UX Researcher executes 5–10 interviews per segment (ID/global, streamer/agency) via R2 protocol before IDR lock. | Before `/pricing` price lock and Phase 2 billing. |
| 2 | **Diamond→USD conversion remains Medium confidence** | `1 diamond ≈ US$0.005 gross / ≈ US$0.0025 net` is public consensus, not payout screenshots. | Performance rev-share ledger could over/under-charge and trigger disputes. | UX Researcher/finance owner obtains 3–5 real payout statements; validate both ID and global. | Before Phase 4 Performance ledger. |
| 3 | **Billing provider/finance sign-off is open** | CFO role terminated; provider terms, tax, and price lock are not owned. | Phase 2 could start against unapproved provider/fee/tax assumptions. | CEO/board names finance owner; BA provides provider comparison; CTO feasibility signs provider abstraction. | Before Phase 2 billing integration. |
| 4 | **Streamlabs Ultra anchor is unverified** | R4 lists the exact Ultra price as Low–Medium confidence. | Weakens the `$19` competitive anchor. | Re-fetch Streamlabs pricing or app-store listing before final price freeze. | Before final global price lock. |
| 5 | **Manual billing cost for Performance is estimated** | R4 assumes ±US$5/invoice/month. | The rev-share threshold/minimum invoice could be wrong. | Finance owner validates real manual billing cost. | Before Phase 4 Performance threshold freeze. |
| 6 | **IDR FX assumption is directional** | R4 uses `1 USD ≈ Rp 16.300`. | IDR price could drift from intended purchasing power. | Reconfirm FX during WTP interviews and at price lock. | Before IDR price lock. |
| 7 | **Free tier may not win against TikFinity** | Direct competitor is free. | Paid conversion has no healthy activation base. | Product/PO must prioritize free-to-live activation and instrument the funnel before scaling paid acquisition. | Phase 1 instrumented launch. |
| 8 | **Current publish URL is client-readable and unsigned** | `stream-studio/app/utils/overlay.ts` base64-encodes config in query param. | Paid status/watermark could be stripped if entitlement is trusted from the URL. | CTO enforces server-authoritative entitlement and watermark per IKI-110 §4–§5. | Phase 1 entitlement/watermark implementation. |

---

## 6. Routing and Next Actions

- **CPO:** review this artifact and confirm the pricing/provider/risk dispositions.
- **BA:** create business requirements, use cases, business rules, and provider comparison for Midtrans/Stripe/QRIS/MoR fallback.
- **PO:** create detailed backlog, user stories, acceptance criteria, and the `/pricing` + activation instrumentation sprint items from IKI-110 §8 and this event contract.
- **CTO:** feasibility review of IKI-110 §4–§8, especially entitlement authority, watermark enforcement, provider abstraction, and server-side event capture.
- **UX Researcher:** execute Van Westendorp WTP and diamond payout validation from `docs/research/r4-pricing-benchmark-wtp.md` §2–§3.
- **CEO/board:** name the finance owner for provider terms, tax, and price lock.

**No implementation is requested from this task.**

## 7. Source Documents

- `docs/revenue-layer-execution-spec-iki-110.md` — CPO plan/spec (authoritative baseline)
- `docs/monetisasi.md` — monetization model and initial backlog
- `docs/research/r4-pricing-benchmark-wtp.md` — competitive benchmark, WTP instrument, rev-share economics
- `docs/research/competitor-teardown-r1.md` — competitor teardown
- `docs/research/feedback-mining-r3.md` — Indonesian purchasing-power signal
- `docs/research/r2-creator-jtbd-interview-plan.md` — WTP interview protocol
- `stream-studio/app/pages/builder.vue`, `BuilderToolbar.vue`, `WidgetPalette.vue`, `live.vue`, `overlay.vue` — activation touchpoints
- `stream-studio/app/composables/useStudio.ts`, `useTikTokStream.ts`, `useWidgetRegistry.ts` — builder/stream state
