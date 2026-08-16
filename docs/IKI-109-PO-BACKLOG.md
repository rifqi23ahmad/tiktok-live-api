# IKI-109 PO Backlog — Stream Studio Onboarding & Activation v2

**Artifact:** `docs/IKI-109-PO-BACKLOG.md`  
**Owner:** Product Owner  
**Parent:** IKI-109 Onboarding & Activation v2 — first published overlay under 15 minutes  
**Status:** Ready for implementation contract (PO-owned backlog)  
**Last updated:** 2026-08-15

## 1. Purpose

This document refines the IKI-109 scope into an ordered, implementation-ready Product Backlog for Stream Studio v2 onboarding. It is a product work product only; no code is implemented here.

The v2 outcome is: **a new streamer can go from first visit to a published overlay URL in under 15 minutes**, including a zero-API-key demo path.

## 2. Scope

**In scope**

- Guided 4-step flow:
  1. Choose template
  2. Connect TikTok username/API key **or** choose Demo
  3. Preview
  4. Publish URL
- Demo mode accessible from step 1 without an API key.
- OBS/Streamlabs checklist with copy-paste browser-source instructions.
- Funnel events: `visit` -> `template selected` -> `stream connected` -> `published`.
- Clear validation, error states, and no dead-end path through onboarding.

**Out of scope for IKI-109**

- Persistent layouts and short publish URLs (`/overlay/:id`) — IKI-77.
- Pricing, entitlement, and billing.
- New widget mechanics.
- Server-side API-key proxy/rotation unless explicitly decided by CTO as required for URL integrity.

## 3. Contract inputs and dependencies

This backlog is traceable to the following sources:

- **IKI-109 parent acceptance criteria** — defines the 4-step flow, checklist, funnel events, and demo-from-step-1 requirement.
- **IKI-121 PM — Discovery, funnel metrics & success spec** — expected artifact `docs/IKI-109-PM-DISCOVERY-FUNNEL-SPEC.md`; owns funnel event taxonomy and time-to-publish target.
- **IKI-122 BA — Functional requirements, use cases & business rules** — expected artifact `docs/IKI-109-BA-REQUIREMENTS.md`; owns use cases, validation, edge cases, and mode transitions.
- **IKI-127 CTO — Technical feasibility & engineering delivery** — blocked by PM/BA/PO deliverables; consumes this backlog as the implementation contract.
- **IKI-133 QA — Verification plan & release smoke** — blocked by CTO implementation; verifies against this backlog and the IKI-109 parent AC.

**Coordination note:** IKI-121 and IKI-122 were still `in_progress` at the time of this refinement. This backlog uses their issue descriptions plus the current Stream Studio implementation as the contract. If the final PM/BA artifacts change event property names, target metrics, or validation rules, the PO will reconcile those deltas against the stories below.

## 4. Current-state gaps

The existing `stream-studio` app already has relevant building blocks, but not the required v2 onboarding:

- `/builder` is a drag-and-drop builder, not a guided 4-step flow.
- `/gallery` lists templates, but does not feed a required step-1 selection state.
- `/live` supports username/API key and Demo, but it is a separate page rather than an onboarding step.
- Publish URL generation exists in `BuilderToolbar.vue`, but it is embedded in the builder toolbar and not presented as the final onboarding step.
- `useTikTokStream` already supports `connect()` and `startDemo()`, but there is no onboarding-level state machine or funnel emission.
- No OBS/Streamlabs checklist is currently user-facing in the guided flow.
- No funnel event instrumentation currently emits the required `visit` -> `template selected` -> `stream connected` -> `published` sequence.

## 5. Success model

**North-star / target:** first published overlay in **under 15 minutes** from first visit.

Recommended operational definition, pending PM confirmation:

- **Metric:** time from `onboarding_visit` to `published`.
- **Target:** median <= 15 minutes; P80 <= 20 minutes.
- **Activation threshold:** user has both selected a template and generated/copied a publish URL.

## 6. Funnel event model

The four required funnel events are the minimum instrumentation contract:

| Event | When emitted | Required properties |
| --- | --- | --- |
| `onboarding_visit` | User enters the v2 onboarding entry point | `session_id`, `page`, `event_ts`, `entry_source` |
| `template_selected` | User confirms a template in step 1 | `session_id`, `template_id`, `template_name`, `event_ts` |
| `stream_connected` | User completes live connection or selects Demo | `session_id`, `mode=live\|demo`, `method=username_api_key\|demo`, `template_id`, `event_ts` |
| `published` | User generates the publish URL in step 4 | `session_id`, `template_id`, `mode=live\|demo`, `has_copied_url`, `event_ts` |

Rules:

- Demo selection counts as `stream_connected` with `mode=demo`; it is not a dead end.
- Events are emitted once per meaningful transition; retries do not create duplicate `published` events for the same generated URL unless the user generates a new URL.
- The analytics payload must never include the raw API key, server-side `TAROGO_API_KEY`, or the full encoded publish URL.

## 7. Prioritized Product Backlog

Priority legend:

- **P0** — must ship to satisfy IKI-109.
- **P1** — ship immediately after P0 hardening; required for a robust release.

| Order | ID | Story | Priority | Size | Primary dependency |
| --- | --- | --- | --- | --- | --- |
| 1 | OB-01 | Guided 4-step onboarding shell | P0 | M | BA requirements, design wireframes |
| 2 | OB-02 | Step 1: Choose template | P0 | S | OB-01, template catalog |
| 3 | OB-03 | Step 1: Demo entry without API key | P0 | S | OB-01, `useTikTokStream` |
| 4 | OB-04 | Step 2: Connect live or Demo | P0 | M | OB-03, BA validation rules |
| 5 | OB-05 | Step 3: Preview before publish | P0 | M | OB-02, OB-04 |
| 6 | OB-06 | Step 4: Publish URL and copy action | P0 | M | OB-05, overlay config |
| 7 | OB-07 | OBS/Streamlabs checklist | P0 | S | OB-06, design/content |
| 8 | OB-08 | Funnel event instrumentation | P0 | M | PM funnel spec, analytics adapter |
| 9 | OB-09 | Privacy and secret-leak guard | P0 | S | OB-06, OB-08 |
| 10 | OB-10 | Validation, error, and empty states | P1 | M | BA requirements |
| 11 | OB-11 | Incomplete-onboarding recovery | P1 | S | OB-01 |
| 12 | OB-12 | Funnel self-test and QA diagnostics | P1 | S | OB-08 |

## 8. User stories and acceptance criteria

### OB-01 — Guided 4-step onboarding shell

**Priority:** P0  
**Size:** M  
**User story:** As a first-time streamer, I want one guided 4-step onboarding flow so I can go from visiting Stream Studio to a published overlay without learning the full builder.

**Acceptance criteria:**

- A dedicated v2 onboarding flow presents exactly four steps in order: choose template, connect, preview, publish URL.
- Progress is visible at all times, and completed steps are distinguishable from pending steps.
- The user can move forward only when the current step is complete.
- The user can go back and previously entered data is preserved.
- Deep-linking to a later step without satisfying earlier prerequisites redirects to the first incomplete step.
- The flow has no dead-end state; every error offers recovery or a valid alternative action.

### OB-02 — Step 1: Choose template

**Priority:** P0  
**Size:** S  
**User story:** As a streamer, I want to choose a template first so the next connection, preview, and publish steps operate on a known overlay.

**Acceptance criteria:**

- Step 1 displays the current template catalog: Hallmark Classic, Goal Crusher, and Alert Pop.
- Each option shows a recognizable preview, name, and one-line description.
- A template must be selected before continuing.
- The selected template is persisted across back/next navigation.
- Selecting a template emits `template_selected` with `template_id`.
- No username or API key is required to complete step 1.

### OB-03 — Step 1: Demo entry without API key

**Priority:** P0  
**Size:** S  
**User story:** As a visitor evaluating the product, I want to start Demo mode without an API key from step 1 so I can try the experience with zero setup.

**Acceptance criteria:**

- A Demo entry is visible and usable from step 1 of the onboarding flow.
- Choosing Demo does not require a username, API key, login, or payment.
- Demo selection starts the existing demo feed and records `stream_connected` with `mode=demo`.
- The user can continue to preview and publish while in Demo mode.
- The user can still switch to live connection in step 2 without losing template selection.

### OB-04 — Step 2: Connect live or Demo

**Priority:** P0  
**Size:** M  
**User story:** As a streamer, I want to connect my TikTok username/API key or explicitly choose Demo so my overlay can use either a real live feed or sample events.

**Acceptance criteria:**

- Step 2 presents two clear choices: Live connection and Demo mode.
- Live mode requires TikTok username and API key.
- Username validation strips a leading `@` and rejects an empty value with a clear message.
- API-key validation rejects an empty value for Live and tells the user how to get a key.
- Successful Live connection transitions to `mode=live` and `connected=true`.
- Failed Live connection shows a retry state and preserves the entered values.
- Demo mode remains available without credentials.
- Completing either path emits `stream_connected` with the correct `mode` and `method`.

### OB-05 — Step 3: Preview before publish

**Priority:** P0  
**Size:** M  
**User story:** As a streamer, I want to preview my selected template and connected feed before publishing so I can confirm the overlay looks correct.

**Acceptance criteria:**

- Step 3 renders the selected template/layout in a 9:16 preview.
- Demo mode shows simulated events; Live mode shows live events when connected.
- The preview includes a visible `Live` or `Demo` status indicator.
- The user can return to steps 1 or 2 without losing progress.
- Preview does not generate or record a publish event until the user proceeds to publish.

### OB-06 — Step 4: Publish URL and copy action

**Priority:** P0  
**Size:** M  
**User story:** As a streamer, I want to generate and copy a browser-source URL so I can install my overlay in OBS or Streamlabs.

**Acceptance criteria:**

- Step 4 generates a valid publish URL for the selected template, layout, and Live/Demo mode.
- The URL opens in a working overlay route when previewed.
- A copy action copies the URL to the clipboard and gives visible feedback.
- Demo publish URLs render in Demo mode without requiring credentials.
- Live publish URLs preserve the selected stream configuration.
- Generating the publish URL emits `published`.
- Copying the URL is recorded as `has_copied_url=true` in the `published` event or an equivalent non-duplicative property.

### OB-07 — OBS/Streamlabs checklist

**Priority:** P0  
**Size:** S  
**User story:** As a streamer, I want a copy-paste checklist for OBS and Streamlabs so I can install the published overlay correctly the first time.

**Acceptance criteria:**

- The checklist is visible at the publish step and does not require leaving onboarding.
- It includes separate instructions for OBS Studio and Streamlabs Desktop.
- Instructions cover adding a Browser Source, pasting the URL, recommended 1080x1920 / 9:16 canvas, transparent background, and audio-unmute guidance.
- The checklist provides a direct copy action for the publish URL.
- Instructions are written for a non-technical streamer, with no assumed prior OBS experience.

### OB-08 — Funnel event instrumentation

**Priority:** P0  
**Size:** M  
**User story:** As the product team, I want the four required funnel events recorded with the agreed schema so we can measure and improve time-to-first-published-overlay.

**Acceptance criteria:**

- `onboarding_visit`, `template_selected`, `stream_connected`, and `published` are emitted as specified in Section 6.
- Event properties match the PM funnel taxonomy.
- Demo selection is recorded as a valid `stream_connected` event with `mode=demo`.
- Events fire once per meaningful transition.
- Analytics failure does not block onboarding completion or expose secrets.
- The event schema is shared and versioned for frontend, backend, and QA.

### OB-09 — Privacy and secret-leak guard

**Priority:** P0  
**Size:** S  
**User story:** As a security-conscious user, I want onboarding analytics and publish URLs not to expose my API key or internal service secrets.

**Acceptance criteria:**

- Funnel event payloads contain no raw API key, no `TAROGO_API_KEY`, and no full encoded publish URL.
- The generated publish URL matches the current overlay-security contract approved by the CTO.
- QA verifies no server-side secrets appear in client bundles or analytics payloads.
- Any URL-integrity risk that cannot be resolved in v2 is documented as an explicit CTO-owned follow-up.

### OB-10 — Validation, error, and empty states

**Priority:** P1  
**Size:** M  
**User story:** As a streamer, I want clear feedback for invalid input, connection failure, and empty states so I am never stranded in the flow.

**Acceptance criteria:**

- Invalid username, missing API key, Live connection failure, network failure, and clipboard failure each show a specific, actionable message.
- Empty template, empty feed, and offline states render intentionally rather than as blank screens.
- Next-step controls are disabled only with an explanatory reason, not silently.
- Every error state offers a recovery action: retry, go back, or switch to Demo.

### OB-11 — Incomplete-onboarding recovery

**Priority:** P1  
**Size:** S  
**User story:** As a returning streamer, I want my incomplete onboarding progress preserved so I can resume without starting over.

**Acceptance criteria:**

- Template, connection mode, and any non-secret onboarding state are restored on revisit.
- Secrets are not persisted in browser storage or analytics.
- A returning user can resume from the first incomplete step.
- Clearing local state produces a clean first-run onboarding.

### OB-12 — Funnel self-test and QA diagnostics

**Priority:** P1  
**Size:** S  
**User story:** As QA, I want a deterministic way to inspect emitted funnel events so I can verify the four-step funnel without guessing.

**Acceptance criteria:**

- A debug/diagnostic mode exposes recent event emissions without requiring production analytics access.
- Event names and required properties are visible for QA verification.
- Diagnostic mode can be disabled or isolated from production analytics.
- QA can reproduce all four funnel transitions end-to-end.

## 9. Acceptance-criteria traceability

| IKI-109 acceptance criterion | Covered by |
| --- | --- |
| 4-step flow: choose template -> connect username/API key or demo -> preview -> publish URL | OB-01, OB-02, OB-04, OB-05, OB-06 |
| OBS/Streamlabs checklist with copy-paste browser-source instructions | OB-07 |
| Funnel events recorded: visit -> template selected -> stream connected -> published | OB-08 |
| Demo mode accessible without API key from first step | OB-03, OB-04 |
| Prioritized backlog covers all IKI-109 acceptance criteria | Sections 7-9 |
| Each item has user story and acceptance criteria | Section 8 |
| Implementation order includes frontend/backend/QA dependencies | Section 10 |
| Definition of Ready and Definition of Done are stated | Sections 11-12 |

## 10. Implementation sequencing and dependencies

### Phase 0 — Product/design contract

1. PM finalizes funnel taxonomy and target metric: IKI-121.
2. BA finalizes use cases, validation rules, and edge cases: IKI-122.
3. PO accepts the two artifacts and reconciles this backlog if needed.
4. Design produces wireframes and copy for the 4-step flow, checklist, empty/error states, and mobile/OBS-preview constraints.

**Exit gate:** OB-01 through OB-10 are ready against the Definition of Ready.

### Phase 1 — Backend and analytics foundation

1. Backend/analytics adapter implements the versioned event schema from OB-08.
2. Backend defines the secret-handling and URL-integrity contract for OB-09.
3. Frontend sets up the onboarding route shell and step state machine.

**Exit gate:** Events can be emitted from a test harness; no secrets are in payloads.

### Phase 2 — Vertical slices, ordered by user value

1. OB-01 + OB-02 + OB-03: onboarding shell, template selection, Demo entry.
2. OB-04: live/demo connection.
3. OB-05: preview.
4. OB-06 + OB-07: publish URL and OBS/Streamlabs checklist.
5. OB-08 + OB-09: instrumentation and secret-leak guard.
6. OB-10, OB-11, OB-12: hardening and QA diagnostics.

**Exit gate:** A streamer can complete the Demo path end-to-end, then the Live path end-to-end.

### Phase 3 — QA and release

1. QA executes the IKI-133 verification plan against the IKI-109 parent AC.
2. QA verifies funnel events, Demo-from-step-1, OBS/Streamlabs checklist, publish URL integrity, and build/lint.
3. PO accepts the QA report and updates the final disposition of IKI-109.

### Dependency order

- IKI-121 PM and IKI-122 BA -> this backlog -> IKI-127 CTO -> IKI-133 QA.
- Design wireframes -> Frontend implementation.
- PM funnel schema -> Backend/analytics + Frontend instrumentation + QA verification.
- Existing `useTikTokStream`, `templates.ts`, and overlay config encoder reduce backend work for the Demo path.

## 11. Definition of Ready

A backlog item is Ready when:

- It has a user story, priority, size, and testable acceptance criteria.
- Required design/copy decisions are available or explicitly marked as engineering-deferred.
- Required PM/BA inputs are available and traceable.
- The event schema and secret-handling constraints are defined where applicable.
- Validation, error, and empty states are specified.
- Dependencies are identified and not blocked by unresolved product questions.
- The item can be implemented and verified independently in a vertical slice.

## 12. Definition of Done

A backlog item is Done when:

- All acceptance criteria pass.
- The Stream Studio build and lint pass.
- QA smoke tests pass for the affected flow.
- Funnel events are emitted once with the correct schema and no secret leakage.
- Demo mode is verified from step 1 without an API key.
- OBS/Streamlabs checklist and publish URL copy/paste behavior are verified.
- Documentation and artifact references are updated.
- The change is reviewed by the responsible engineer and accepted by the PO.

## 13. Open questions and assumptions

- **Assumption:** Demo selection is a valid `stream_connected` event with `mode=demo`.
- **Assumption:** "Under 15 minutes" is measured as time from `onboarding_visit` to `published`; PM owns the final target definition.
- **Assumption:** The current template catalog is sufficient for v2; new templates are out of scope.
- **Open:** Final analytics provider and backend event endpoint are PM/CTO decisions.
- **Open:** Live publish URL API-key handling must be confirmed by CTO under the URL-integrity contract.

## 14. Final artifact

This document is saved at:

`docs/IKI-109-PO-BACKLOG.md`
