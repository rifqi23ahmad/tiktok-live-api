# CTO Feasibility Review — IKI-110 Sections 4–8

**Reviewer:** CTO  
**Issue:** IKI-131  
**Date:** 2026-08-15  
**Spec reviewed:** `docs/revenue-layer-execution-spec-iki-110.md`

## Verdict

**Conditional sign-off.** Sections 4–8 are technically feasible against the current `stream-studio` codebase if the architecture changes below are included in the implementation plan. This review does not authorize implementation or billing integration.

## Current Baseline

The current app is a Nuxt 4 single app with no auth, session, database, or project persistence. The server API surface is one proxy endpoint (`stream-studio/server/api/host-chat.post.ts:14`).

Key touchpoints verified:

- `stream-studio/app/composables/useWidgetRegistry.ts:3` defines the widget type union; `:25` defines the 10-widget catalog.
- `stream-studio/app/composables/useStudio.ts:20` adds widgets with no entitlement check.
- `stream-studio/app/components/builder/WidgetPalette.vue:19` lists and adds all widgets directly.
- `stream-studio/app/components/builder/WidgetRenderer.vue:17` renders every widget type without a tier gate.
- `stream-studio/app/components/builder/BuilderToolbar.vue:29` builds the publish URL client-side from raw state.
- `stream-studio/app/utils/overlay.ts:26` base64-encodes the config without a signature.
- `stream-studio/app/pages/overlay.vue:27` decodes the config from the query string and renders it.
- `stream-studio/app/data/templates.ts:11` and `stream-studio/app/pages/gallery.vue:5` expose all templates as public files.

## Section Feasibility

### Section 4 — Watermark

**Verdict:** Feasible with revision.

The proposed watermark layer and entitlement field are directionally correct, but the spec's "mirrored client-side" wording cannot be the enforcement boundary. The published overlay currently trusts an unsigned query parameter, so `watermark: false` can be removed by editing the URL or browser source.

Required revision:

- Publish returns a signed overlay token with `tier`, `entitlement`, and `watermark`.
- The `/overlay` route validates the token server-side and injects the watermark into the rendered overlay for Free tiers.
- Client-side mirroring remains only for builder/preview UX, not enforcement.
- Remove the current raw TikTool API key from the publish config before introducing signed entitlement tokens.

### Section 5 — Feature Gating and Entitlement Model

**Verdict:** Feasible with revision.

The proposed `Entitlement` record is a reasonable normalized model. The current code has no server authority and no persistence, so this section is the largest hidden build.

Required revision:

- Add a `tier` or `requiredPlan` field to `WidgetDef` so the catalog is gating-aware.
- Enforce at the shared add path in `useStudio.ts:20`, the palette click/drag path, the canvas drop path, the duplicate path, the renderer, and the overlay route.
- Make `loadClassicPreset()` tier-aware; it currently adds seven widgets, several of which are Pro under the tier matrix.
- Introduce a signed-in workspace and server-side saved-project model before the Free one-project limit can be enforced.
- Reject locked widget types from tampered saved configs server-side, not only in the builder.

### Section 6 — Billing and Provider Options

**Verdict:** Architecturally sound as a future design.

The provider abstraction recommendation is correct: keep plan, price, discount, tax, and invoice data separate from product entitlement. Stripe plus Midtrans/QRIS is a viable first-market combination, provided both providers sync into one canonical entitlement source with idempotent webhooks.

No billing integration is authorized. Finance/provider sign-off remains a separate gate before Phase 2.

### Section 7 — Activation Metrics

**Verdict:** Feasible with a new product telemetry pipeline.

The event list and definitions are usable. No product-owned telemetry, event store, or query path exists in `stream-studio` today. The diamond counter in `useTikTokStream.ts` is client-side and must not be treated as a billing or analytics ledger.

Required addition:

- Define an event schema and stable event/version field.
- Emit from server-side routes and product-owned client calls, with workspace/session identifiers.
- Make events queryable for the listed rates and time-to-value calculations.
- Keep checkout/tier events out of production until billing exists.

### Section 8 — High-Level Engineering Acceptance Criteria

**Verdict:** Feasible with two revisions.

All ten gates are valid. Add:

- Gates 2, 3, and 10 require signed config plus server-side validation/injection, not a client-only `watermark` boolean.
- Gate 7 must define the entitlement sync window explicitly; "defined sync window" should be a concrete SLA before coding.

## Required Architecture Changes

1. Add identity and workspace authority: auth session, workspace, plan assignment, and entitlement resolution.
2. Add signed overlay config or server-rendered overlay validation.
3. Add a shared entitlement module consumed by both client gating and server enforcement.
4. Add server-side project persistence with the Free one-project limit.
5. Add server-side watermark enforcement on the published overlay.
6. Add a product telemetry pipeline with queryable event storage.
7. Define a billing provider interface without implementing a provider.

## Effort Estimate

Estimate for the Phase 1 work represented by Sections 4, 5, 7, and the product parts of 8. Billing integration is not included and remains gated by finance sign-off.

| Workstream | Effort |
| --- | --- |
| Auth, workspace, entitlement authority | 8–12 engineering days |
| Widget tier metadata and add/render gating | 4–6 engineering days |
| Watermark, signed overlay, server rendering | 4–7 engineering days |
| Server-side projects and Free limit | 6–10 engineering days |
| Activation telemetry pipeline and instrumentation | 6–10 engineering days |
| Pricing page and provider abstraction design | 3–5 engineering days |
| QA and security review | 4–6 engineering days |
| **Phase 1 total** | **35–56 engineering days** |

With two engineers and one QA, Phase 1 lands in roughly four to six weeks. Phase 2 billing integration should be re-estimated after finance/provider sign-off.

## Risks

- "Non-removable" watermark is a server-rendered enforcement boundary, not an absolute guarantee against a user who modifies their own browser source.
- The current publish URL embeds the user's raw TikTool API key in the config query. This must be corrected before revenue-layer token work.
- No auth or persistence exists today, so the entitlement and project-limit work is foundational, not a thin feature patch.
- Finance/provider sign-off blocks billing execution, not this spec or Phase 1.

## Recommendation

Send this review to the CEO with the Section 4, 5, 7, and 8 revisions. Once the spec is approved, route implementation backlog creation to the Engineering Manager. Do not start billing integration.
