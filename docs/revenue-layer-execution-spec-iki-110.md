# Revenue Layer Execution Spec — Free / Pro / Agency

**Owner:** CPO  
**Issue:** IKI-110  
**Status:** CPO plan/spec — planning only, no implementation or billing integration  
**Date:** 2026-08-15  
**Source material:** `docs/monetisasi.md`, `docs/research/r4-pricing-benchmark-wtp.md`, current `stream-studio` implementation

## 1. Executive Decision

1. The revenue layer ships as **three self-serve tiers**: Free, Pro, Agency.
2. The primary near-term revenue engine is **premium subscription** with automatic feature gating and watermark enforcement. Gift rev-share "Performance" remains a later Agency-only option, not part of the initial billing cut.
3. The monetisasi.md tier structure survives the pricing benchmark. We adopt the R4 final recommendation, including Indonesia pricing:
   - Free: `$0`
   - Pro: `$19/mo` global, `Rp 149.000/mo` Indonesia
   - Agency: `$99/mo` global, `Rp 799.000/mo` Indonesia
   - Annual discount: `20%` (`$15/mo` / `Rp 119.000/mo` for Pro; `$79/mo` / `Rp 649.000/mo` for Agency)
4. This spec **does not authorize engineering implementation or billing integration**. The next executable step after this plan is CTO feasibility review, followed by CEO sign-off of the spec before coding starts.

## 2. Product Strategy

- **Free is an acquisition weapon, not an afterthought.** TikFinity is free, so Free must be useful enough to generate published overlays and word of mouth.
- **Pro is the default upgrade.** It unlocks the complete interactive builder without watermark and removes the most painful limitation: single-project storage.
- **Agency is an operational multi-account tier.** It packages the same builder with multi-streamer workspaces, seat/team controls, batch publishing, whitelabel, and an eventual Performance rev-share option for high-volume rosters.
- **Do not couple Studio billing with TikTool data billing.** Studio sells the builder, widgets, and recap analytics; the customer brings their own TikTool API key.

## 3. Tier Matrix

| Capability | Free | Pro | Agency |
| --- | --- | --- | --- |
| Price | `$0` | `$19/mo` global · `Rp 149.000/mo` ID | `$99/mo` global · `Rp 799.000/mo` ID |
| Widgets in builder | 3 basic: Gift Alert, Goal Bar, Chat Effects | All 10 current widgets | All Pro widgets |
| Premium widgets | Locked | Included | Included |
| Projects saved | 1 | Unlimited | Unlimited |
| Templates | Community templates | Priority + custom template saving | All Pro templates |
| Watermark | "Stream Studio" visible | None | None |
| Demo mode | Included | Included | Included |
| Live TikTok connection | Community key supported | Community/Pro key supported | Pro/Global Agency key supported |
| Multi-streamer workspace | No | No | Yes |
| Team seats | No | No | Yes |
| Batch deploy / whitelabel | No | No | Yes |
| Custom branding | No | Yes | Yes + whitelabel |
| Advanced recap analytics | No | Yes | Yes + roster rollup |
| Performance rev-share option | No | No | Phase 2, eligible only |
| Support | Community/docs | Priority email/chat | Dedicated onboarding + priority |

Engineering note: current code exposes 10 widget definitions in `stream-studio/app/composables/useWidgetRegistry.ts`; gating must be implemented at the palette/add/render layers, not by hiding marketing text only.

## 4. Watermark Strategy

- Free tier always renders a visible, non-removable **"Stream Studio"** watermark on published overlays and in preview/builder.
- Pro and Agency published overlays render no watermark.
- Watermark is enforced from the entitlement payload/server response and mirrored client-side for immediate UX.
- Implementation shape, subject to CTO review:
  - Add a single `watermark` overlay layer at the top level of the published overlay page.
  - Include `tier`, `entitlement`, and `watermark: boolean` in the overlay config response; do not trust a query param alone for paid status.
  - Watermark position should be fixed, small, legible, and non-intrusive, with the same brand mark on all templates.
  - Demo mode follows the active workspace tier: Free shows watermark, Pro/Agency does not.
- Acceptance criterion: removing `?config=` or editing client code must not remove a Free-tier watermark in production.

## 5. Feature Gating and Entitlement Model

### 5.1 Entitlement model

Recommended normalized entitlement record:

```ts
type StudioPlan = 'free' | 'pro' | 'agency'

interface Entitlement {
  plan: StudioPlan
  region: 'ID' | 'GLOBAL'
  featureFlags: {
    allWidgets: boolean
    unlimitedProjects: boolean
    customBranding: boolean
    multiStreamer: boolean
    batchDeploy: boolean
    whitelabel: boolean
    advancedRecap: boolean
    performanceRevShare: boolean
  }
  limits: {
    savedProjects: number | null
    teamSeats: number | null
  }
  watermark: boolean
}
```

### 5.2 Enforcement rules

- Enforcement is **server-side authoritative**. The UI may hide locked features, but the published overlay and any API/server endpoint must reject or degrade unauthorized usage.
- Free gating:
  - `savedProjects = 1`
  - `allWidgets = false`
  - `watermark = true`
  - Locked widgets cannot be added to the canvas, duplicated, or rendered from a saved config.
- Pro gating:
  - `savedProjects = null` (unlimited)
  - `allWidgets = true`
  - `watermark = false`
  - Multi-streamer, batch deploy, whitelabel, and Performance remain false.
- Agency gating:
  - All Pro flags plus `multiStreamer`, `batchDeploy`, `whitelabel`, and Phase 2 `performanceRevShare`.
- TikTool API key remains customer-supplied and is not the Studio entitlement source.

### 5.3 Gating touchpoints in current code

The CPO spec intentionally stays at product level; detailed stories belong to PO. For feasibility, CTO should validate these touchpoints:

- `stream-studio/app/composables/useWidgetRegistry.ts` — widget catalog needs tier metadata.
- `stream-studio/app/components/builder/WidgetPalette.vue` — lock premium widget interactions.
- `stream-studio/app/composables/useStudio.ts` — enforce project/instance limits.
- `stream-studio/app/components/builder/BuilderToolbar.vue` — publish URL must carry only signed/validated entitlement, never raw plan trust.
- `stream-studio/app/pages/overlay.vue` — render watermark and reject locked widget types.
- `stream-studio/app/pages/gallery.vue` — template availability by tier.

## 6. Billing and Provider Options

No billing integration is authorized in this plan. These options are for CTO feasibility and separate finance sign-off.

| Option | Fit | Notes |
| --- | --- | --- |
| **Stripe Billing** | Global card subscriptions | Strong default for USD global plan, recurring billing, webhooks, dunning. |
| **Midtrans** | Indonesia cards, e-wallets, bank transfer | Strong default for IDR plan and local payment UX. |
| **QRIS via Midtrans/Xendit** | Indonesia instant payments | High conversion for mobile-first Indonesian streamers; should be in IDR checkout. |
| **Xendit** | Indonesia + regional alternative | Viable fallback if Midtrans commercial terms or approval fail. |
| **Lemon Squeezy / Paddle** | Merchant of record | Reduces tax/compliance burden; acceptable fallback if own MoR is delayed. |

**Recommendation for CTO review:** architect an abstraction layer so the first live market can start with Stripe global + Midtrans/QRIS IDR, then add providers without changing entitlement logic. Keep plan, price, discount, tax, and invoice data separate from product entitlement.

**Provider decision is an open assumption** until the terminated CFO role is replaced or the board names a finance owner. Do not let this block the product spec.

## 7. Activation Metrics

North-star metric: **weekly published overlays that go live at least once**.

Activation funnel:

1. `studio.visit`
2. `builder.started` — builder opened
3. `widget.added` — first widget added
4. `stream.connected` — demo or live connection
5. `overlay.published` — publish URL generated
6. `overlay.live` — published URL opened with real stream creds
7. `upgrade.clicked` — pricing/CTA opened
8. `checkout.started`
9. `checkout.completed`
10. `tier.changed` — plan changed

Core product metrics:

- **Activation rate:** `overlay.live` / `builder.started` within 7 days.
- **Time to value:** median minutes from first visit to `overlay.published`.
- **Free→Pro conversion:** Pro upgrades / activated Free users over 30 days.
- **Watermark-removal upgrade rate:** upgrades where `watermark` was shown before checkout.
- **Pro retention:** Pro users with an `overlay.live` event in the following 30 days.
- **Agency workspace activation:** agencies with at least 2 streamers connected and 1 batch publish.
- **Performance eligibility:** Agency accounts above `>=100.000 diamond gross/month` aggregate; Phase 2 only.

All metric events must be emitted from server-side or product-owned telemetry; the overlay's diamond counter is already present via `useTikTokStream.ts`, but it is client-side and not a billing ledger.

## 8. High-Level Engineering Acceptance Criteria

Detailed user stories and Gherkin belong to PO. These are CPO-level gates for the eventual engineering work:

1. A server authority can return an immutable `Entitlement` for every signed-in workspace.
2. Free users can publish an overlay with watermark; Pro/Agency publish overlays without watermark.
3. Premium widgets are not renderable or addable on Free, including from tampered saved config.
4. Free project storage limit is enforced server-side.
5. Pricing page supports USD/IDR toggle and the three approved tiers with annual discount.
6. Checkout/provider integration is behind a provider abstraction; no billing provider is hardcoded in entitlement code.
7. Upgrade/downgrade changes entitlements within a defined sync window and preserves saved projects.
8. Rev-share "Performance" is **not enabled** in the first release and remains Agency-gated in Phase 2.
9. Activation events listed in Section 7 are emitted and queryable, not just present in UI logs.
10. The published overlay cannot be stripped of watermark by removing a URL parameter.

## 9. Roadmap Phases

| Phase | Scope | Gate | Owner |
| --- | --- | --- | --- |
| 0 | This spec + delegated product artifacts + CTO feasibility review | CEO spec approval, CTO feasibility signed | CPO |
| 1 | Entitlement model, feature gating, watermark, pricing page, activation events | Phase 0 gate | CTO/Engineering |
| 2 | Billing integration for Pro/Agency, annual discounts, upgrade flow | Finance/provider sign-off | CTO/Engineering |
| 3 | Agency multi-streamer, seats, batch deploy, whitelabel | Phase 2 live | CTO/Product |
| 4 | Performance rev-share ledger, eligibility, invoice rollover | R4 diamond conversion validated, finance sign-off | CTO/Finance |

## 10. Open Assumptions and Sign-off Routing

- **Finance/pricing validation:** terminated CFO means final provider terms, tax, and price lock remain open. Route to CEO/board as a separate finance sign-off. This does not block product specification.
- **Diamond conversion:** `1 diamond ≈ US$0,005 gross / ≈ US$0,0025 net` remains an estimate. Must be confirmed before Performance rev-share is implemented.
- **Willingness-to-pay:** IDR prices require Van Westendorp validation before final lock.
- **Provider fees:** manual billing cost and provider fees require finance validation before Phase 2.
- **CTO feasibility:** required before implementation begins.

## 11. Delegated Work

- PM: product discovery, pricing/provider recommendation, activation metric definition.
- PO: detailed backlog, user stories, and acceptance criteria.
- BA: business requirements, use cases, business rules, and provider comparison.
- CTO: feasibility review and engineering effort estimate for Sections 4–8.

Child issue links are reported in the IKI-110 issue thread after creation.
