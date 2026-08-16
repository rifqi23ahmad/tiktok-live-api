# IKI-109 PM: Discovery, Funnel Metrics & Success Spec

**Owner:** Product Manager
**Child issue:** IKI-121
**Parent issue:** IKI-109 — Onboarding & Activation v2 — first published overlay under 15 minutes
**Status:** Ready for BA/PO execution handoff
**Repo scope:** `/Users/user/Documents/Improvement/tiktokstrem/stream-studio`

## 1. Purpose

This document converts the CPO direction for IKI-109 into a product discovery, funnel instrumentation, and success model for Stream Studio. It is a product artifact, not an implementation plan. Engineering should treat the event schema and demo-mode behavior as the contract for v2 onboarding work.

The v2 onboarding target is a simpler 4-step experience:

1. Choose template
2. Connect username/API key **or demo**
3. Preview
4. Publish URL

The success goal is: **first published overlay under 15 minutes**.

## 2. Product objective

Make it possible for a first-time TikTok LIVE creator to go from landing on Stream Studio to a working browser-source overlay in under 15 minutes, without an API key and without reading documentation.

Primary activation event: `overlay_published`.

Supporting objective: make demo mode a first-class entry point, not a fallback hidden inside a publish popover or `/live`.

## 3. Current-state audit

### 3.1 Files audited

- `stream-studio/app/pages/index.vue`
- `stream-studio/app/pages/gallery.vue`
- `stream-studio/app/pages/builder.vue`
- `stream-studio/app/pages/live.vue`
- `stream-studio/app/pages/overlay.vue`
- `stream-studio/app/components/AppSidebar.vue`
- `stream-studio/app/components/builder/BuilderToolbar.vue`
- `stream-studio/app/components/builder/WidgetPalette.vue`
- `stream-studio/app/components/builder/CanvasStage.vue`
- `stream-studio/app/composables/useStudio.ts`
- `stream-studio/app/composables/useTikTokStream.ts`
- `stream-studio/app/data/templates.ts`
- `stream-studio/app/utils/overlay.ts`
- `stream-studio/public/templates/demo.js`
- `docs/research/competitor-teardown-r1.md`

### 3.2 What already works

- `/builder` has a functional drag-and-drop canvas, widget palette, inspector, and 9:16 preview.
- `BuilderToolbar` generates a single publish URL that encodes widget layout, props, username, API key, and demo flag.
- `/overlay` decodes the URL and renders all widgets simultaneously as a transparent browser-source overlay.
- `/live` provides username + API key connection and a demo mode.
- `useTikTokStream` produces a synthetic gift/chat/like/member feed in demo mode.
- `/gallery` lists three static HTML templates with `?demo=1` previews.
- The home page explains the 4-step workflow in text.

### 3.3 Onboarding gaps

| # | Gap | Evidence | Product impact |
| --- | --- | --- | --- |
| 1 | No guided 4-step onboarding | Home page describes steps, but `index.vue` only links to `/builder` and `/gallery`; builder immediately loads `loadClassicPreset()` | First-time users enter a full editor without choosing a template or knowing where they are in the flow |
| 2 | Template choice is disconnected | `/gallery` links to static HTML previews; `/builder` loads a hardcoded classic preset | Users cannot carry a template selection into the builder; two template systems coexist |
| 3 | Connection is a separate page | `BuilderToolbar` links to `/live`; no inline connect step or return-to-builder state | Adds navigation cost and breaks step continuity |
| 4 | Demo is not exposed at step 1 | Demo is available in `/live` and as a publish fallback only | Violates the v2 requirement that demo be accessible from step 1 without API key |
| 5 | Preview is not a distinct step | Canvas preview is always visible; publish popover has a secondary preview button | No explicit pre-publish confirmation moment |
| 6 | Publish is a popover, not a completion step | `BuilderToolbar` opens a popup; no saved URL, history, or confirmation state | Activation cannot be measured reliably |
| 7 | No analytics or session identity | `rg "track|event|analytics|gtag|posthog" stream-studio` finds no instrumentation | Funnel and time-to-first-publish cannot be measured |
| 8 | Time-to-value is unmeasured | No `funnel_visit` timestamp or first-publish timestamp exists | The 15-minute goal has no baseline |
| 9 | API key is embedded in the publish URL | `publishUrl` in `BuilderToolbar.vue` includes `apiKey` in the encoded config | Security/privacy risk; key can leak through copied URLs |
| 10 | Builder state is not persistent | `useStudio` uses module-scoped refs; reload loses layout | First-time users can lose work before publishing |

### 3.4 Audit conclusion

The underlying engine is capable enough to support a 4-step flow, but the current UI is a power-user builder with disconnected gallery/connection pages. The v2 work should be a **linear onboarding wrapper**, not a rewrite of the builder. Instrumentation is currently absent and must be added as part of v2.

## 4. Competitor context

Based on `docs/research/competitor-teardown-r1.md`, the relevant competitors are:

| Tool | Strong at | Weak at | Implication for Stream Studio |
| --- | --- | --- | --- |
| TikFinity | TikTok gift alerts, TTS, action integrations | Desktop/config-panel setup; no visual canvas | Stream Studio's no-code canvas and demo-first path is the main wedge |
| StreamElements / Streamlabs | Mature drag-and-drop overlay editor | Twitch-first mechanics; weak TikTok gift/diamond support | Copy editor ergonomics, but lead with TikTok-native mechanics |
| TikTok LIVE Studio | Native broadcast destination | Limited custom overlay design | Overlay must remain OBS/browser-source compatible |
| Stream Studio current | TikTok-gift-native widgets, canvas builder, publish URL | Disconnected onboarding and no measurement | Close the onboarding gap to own the "TikTok-native visual builder" position |

The competitor research already identifies demo mode as a key zero-friction advantage. The v2 flow should make that advantage visible in step 1.

## 5. Target v2 onboarding model

### 5.1 Happy path

1. **Visit** — user lands on `/` or a campaign URL.
2. **Choose template** — user picks a template from a unified template picker. Each card has two primary actions:
   - `Pakai template` — enter live mode
   - `Coba demo` — start demo mode immediately, no username/API key
3. **Connect stream** — live users enter TikTok username and API key; demo users see a pre-selected demo state. The step ends on `stream_connected`.
4. **Preview** — user sees the template rendered in the 9:16 preview. The CTA is `Lanjut ke publish`.
5. **Publish URL** — user sees the browser-source URL, copies it, and gets a completion state. The step ends on `overlay_published`.

### 5.2 Demo path

Demo is a parallel path from step 1:

`Visit -> Choose template -> Coba demo -> Preview -> Publish demo URL`

No username, API key, signup, or email is required at any point in this path. The publish URL must use `demo: true` and must not include an API key.

### 5.3 Required UX states

- Step indicator visible on every onboarding step.
- Back/next navigation with state preserved.
- Demo badge whenever the session is in demo mode.
- Publish completion state with copy URL and a clear `Selesai` action.
- Error states for live connection failures with retry and a `Lanjut dengan demo` fallback.

## 6. Funnel event taxonomy

### 6.1 Event naming conventions

- Lower snake case: `funnel_visit`, `template_selected`, `stream_connected`, `overlay_published`.
- One event per meaningful user action; no property bloat.
- Every event includes a common context object: `session_id`, `anonymous_id`, `page_url`, `referrer`, `utm_source`, `utm_medium`, `utm_campaign`, `locale`, `device_category`, `app_version`, and `client_timestamp`.
- Do not send raw API keys in any event property. Hash or omit credentials.

### 6.2 Core funnel events

#### `funnel_visit`

**Trigger:** the first onboarding-relevant page view in a session: `/`, `/onboarding`, or any campaign landing page.

**Properties:**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `funnel_step` | string | yes | `"visit"` |
| `entry_page` | string | yes | Normalized path, e.g. `/` |
| `landing_template` | string | no | Template ID if the URL preselects one |
| `is_new_session` | boolean | yes | True when `session_id` is first seen |

#### `template_selected`

**Trigger:** user selects a template from the template picker, including the `Coba demo` action on a template card.

**Properties:**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `template_id` | string | yes | `classic`, `goal`, `alert`, or future template ID |
| `template_name` | string | yes | Human-readable name |
| `selection_source` | string | yes | `onboarding`, `gallery`, `home`, or `campaign` |
| `mode` | string | yes | `live` or `demo` |
| `time_since_visit_ms` | number | yes | Milliseconds from `funnel_visit` |

#### `stream_connected`

**Trigger:** the stream enters a successful connected state:
- Live mode: WebSocket opens successfully.
- Demo mode: demo feed starts successfully.

**Properties:**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `connection_mode` | string | yes | `live` or `demo` |
| `username_present` | boolean | yes | True if a username was provided |
| `api_key_present` | boolean | yes | True if an API key was provided; do not send the key |
| `template_id` | string | yes | Template active at connection time |
| `widget_count` | number | yes | Number of widgets in the loaded layout |
| `time_since_template_selected_ms` | number | yes | Milliseconds from `template_selected` |
| `connection_attempts` | number | yes | Number of connect attempts in this session |

#### `overlay_published`

**Trigger:** the publish URL is successfully generated and shown to the user in the final publish step. This is the activation event.

**Properties:**

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `template_id` | string | yes | Template ID used |
| `connection_mode` | string | yes | `live` or `demo` |
| `widget_count` | number | yes | Number of widgets in the published layout |
| `publish_method` | string | yes | `copy_url`, `preview`, or `direct` |
| `has_credentials` | boolean | yes | True when live username/API key were used |
| `time_since_stream_connected_ms` | number | yes | Milliseconds from `stream_connected` |
| `time_to_first_publish_ms` | number | yes | Milliseconds from `funnel_visit` to first `overlay_published` |

### 6.3 Supporting events

| Event | Trigger | Key properties |
| --- | --- | --- |
| `funnel_step_viewed` | User opens any onboarding step | `funnel_step`, `template_id`, `connection_mode` |
| `demo_started` | Demo mode starts | `entry_point`, `template_id` |
| `stream_connection_failed` | Live connect fails | `error_code`, `attempt`, `username_present` |
| `preview_opened` | User opens the publish preview | `template_id`, `connection_mode` |
| `publish_url_copied` | User copies the publish URL | `template_id`, `connection_mode` |

### 6.4 Measurement notes

- `session_id` must be generated once per browser tab/session and stored in memory/localStorage.
- `anonymous_id` should be persisted in localStorage to link future visits until a real account exists.
- Timestamps must use a monotonic client clock or server `received_at` to avoid device-clock drift.
- Deduplicate `overlay_published` per `session_id` for time-to-first-publish metrics.
- Exclude bot/internal traffic with a `traffic_type` property set by the collector.

## 7. Demo mode spec

### 7.1 Access

Demo mode must be accessible from all of these surfaces:

- Template picker step 1: primary/secondary CTA on every template card.
- Home hero: `Coba demo tanpa API key` CTA.
- Global header: persistent `Demo` badge/link when not connected.
- `/live`: existing `Mode Demo` button.

### 7.2 Behavior

1. Starting demo sets `mode = 'demo'` and `connected = true`.
2. The synthetic event loop in `useTikTokStream.ts` runs exactly as today.
3. Preview and publish work identically to live mode.
4. Published demo URL uses `demo: true` and must omit `apiKey`.
5. User can switch to live mode later by entering username/API key; this does not lose the selected template.

### 7.3 Instrumentation

- `template_selected` with `mode = "demo"` when demo is chosen from step 1.
- `demo_started` when the synthetic feed starts.
- `stream_connected` with `connection_mode = "demo"` after successful demo start.

## 8. Success model

### 8.1 Primary metric

**Time to first published overlay (`TFFP`)**

- Definition: milliseconds from the first `funnel_visit` to the first `overlay_published` in the same session.
- Segment: first-time sessions that select a template.

### 8.2 Measurable target

| Metric | Target | Guardrail |
| --- | --- | --- |
| First published overlay under 15 minutes | ≥60% of template-selected sessions publish within 900,000 ms | Do not ship if below 40% after baseline |
| Median time to first publish | ≤8 minutes | Revisit onboarding copy if p50 exceeds 15 minutes |
| p90 time to first publish | ≤15 minutes | Investigate step drop-off if p90 exceeds 25 minutes |
| Visit → template selected | ≥30% | Revisit template picker if below 20% |
| Template selected → stream connected | ≥70% | Revisit demo/connect UI if below 50% |
| Stream connected → published | ≥60% | Revisit preview/publish UI if below 40% |

The first two weeks after instrumentation are baseline calibration. After baseline, freeze the primary target for the first onboarding optimization cycle.

### 8.3 Non-goals for measurement

- Do not optimize for vanity metrics such as page views or total widget interactions in this cycle.
- Do not use `overlay_published` count alone; it must always be interpreted with the session denominator.

## 9. Prioritized recommendations

### P0 — required for IKI-109

1. Add the linear 4-step onboarding wrapper.
2. Unify template selection with the builder; the selected template must load into the canvas.
3. Expose demo mode from step 1 with no API key.
4. Implement the four core funnel events plus `stream_connection_failed`.
5. Make publish a final completion step with generated URL, copy action, and `overlay_published`.
6. Remove the API key from the public publish URL; use demo flag/session token or another safe mechanism.

### P1 — next cycle

7. Persist builder state and published overlay configs.
8. Add saved-overlay history and re-publish flow.
9. Add onboarding checklist and time-to-value dashboard for the team.

### P2 — later

10. A/B test demo-first vs live-first entry.
11. Add `funnel_step_viewed` and drop-off reports per step.

## 10. Handoff

The Business Analyst should translate the target v2 model and event taxonomy into business rules, edge cases, and functional requirements. The Product Owner should break the P0 recommendations into backlog items and acceptance criteria. Engineering should treat this document as the product contract for analytics events and demo behavior.

## 11. Final artifact path

`docs/IKI-109-PM-DISCOVERY-FUNNEL-SPEC.md`
