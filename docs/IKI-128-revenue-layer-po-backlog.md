# IKI-128 — Revenue Layer PO Backlog & Acceptance Criteria

**Owner:** Product Owner
**Parent:** IKI-110 — Revenue Layer product plan (Free/Pro/Agency execution spec)
**Status:** PO deliverable — planning only, no implementation
**Date:** 2026-08-15
**Sources:** `docs/revenue-layer-execution-spec-iki-110.md` sections 3–9, `docs/monetisasi.md`, `docs/research/r4-pricing-benchmark-wtp.md`

## 1. Purpose and boundaries

This document is the PO-owned product backlog for IKI-110. It converts the CPO execution spec into prioritized, testable user stories with Gherkin acceptance criteria.

It does **not** authorize engineering implementation, billing integration, or final price lock. Prices remain R4 recommendations until Van Westendorp and finance/provider validation complete.

## 2. Prioritization model

- **Priority P0** = CPO Phase 1, required before any paid tier can safely go live.
- **Priority P1** = CPO Phase 2, billing and subscription lifecycle.
- **Priority P2** = CPO Phase 3, Agency-only operational capabilities.
- **Priority P3** = CPO Phase 4, Performance rev-share, explicitly deferred.
- Within a phase, stories are ordered by dependency: entitlement authority first, then enforcement surfaces.

## 3. Prioritized product backlog

| ID | Story | CPO Phase | Priority | Depends on |
| --- | --- | --- | --- | --- |
| RLS-01 | Server-authoritative entitlement record | 1 | P0 | — |
| RLS-02 | Free/Pro/Agency widget gating | 1 | P0 | RLS-01 |
| RLS-03 | Saved-project limit enforcement | 1 | P0 | RLS-01 |
| RLS-04 | Template availability by tier | 1 | P0 | RLS-01 |
| RLS-05 | Pro entitlement unlocks | 1 | P0 | RLS-01 |
| RLS-06 | Watermark enforcement | 1 | P0 | RLS-01 |
| RLS-07 | Demo mode follows workspace tier | 1 | P0 | RLS-06 |
| RLS-08 | Pricing page | 1 | P0 | RLS-01 |
| RLS-09 | Activation event telemetry | 1 | P0 | RLS-01 |
| RLS-10 | Billing provider abstraction | 2 | P1 | RLS-08 |
| RLS-11 | Pro/Agency checkout | 2 | P1 | RLS-10 |
| RLS-12 | Upgrade/downgrade lifecycle | 2 | P1 | RLS-10, RLS-11 |
| RLS-13 | Performance rev-share release guard | 2 | P1 | RLS-10 |
| RLS-14 | Agency multi-streamer workspace | 3 | P2 | RLS-12 |
| RLS-15 | Agency team seats | 3 | P2 | RLS-14 |
| RLS-16 | Agency batch deploy | 3 | P2 | RLS-14 |
| RLS-17 | Agency whitelabel | 3 | P2 | RLS-14 |
| RLS-18 | Agency roster analytics | 3 | P2 | RLS-14 |
| RLS-19 | Performance eligibility | 4 | P3 | RLS-12 |
| RLS-20 | Performance ledger and invoicing | 4 | P3 | RLS-19 |

## 4. Detailed user stories and Gherkin

### RLS-01 — Server-authoritative entitlement record

**User story:** As a signed-in workspace, I want the server to return a single immutable entitlement record so every gating decision uses one source of truth and cannot be changed by the client.

**Gherkin:**

```gherkin
Feature: Server-authoritative entitlement

  Scenario: Free workspace entitlement
    Given a signed-in workspace with plan "free" and region "GLOBAL"
    When the entitlement endpoint is queried
    Then the response contains plan "free"
    And region "GLOBAL"
    And watermark true
    And featureFlags.allWidgets false
    And featureFlags.customBranding false
    And featureFlags.multiStreamer false
    And featureFlags.batchDeploy false
    And featureFlags.whitelabel false
    And featureFlags.advancedRecap false
    And featureFlags.performanceRevShare false
    And limits.savedProjects 1

  Scenario: Pro workspace entitlement
    Given a signed-in workspace with plan "pro" and region "ID"
    When the entitlement endpoint is queried
    Then the response contains plan "pro"
    And watermark false
    And featureFlags.allWidgets true
    And featureFlags.customBranding true
    And featureFlags.advancedRecap true
    And featureFlags.multiStreamer false
    And featureFlags.batchDeploy false
    And featureFlags.whitelabel false
    And featureFlags.performanceRevShare false
    And limits.savedProjects null

  Scenario: Agency workspace entitlement
    Given a signed-in workspace with plan "agency" and region "ID"
    When the entitlement endpoint is queried
    Then the response contains plan "agency"
    And watermark false
    And featureFlags.allWidgets true
    And featureFlags.customBranding true
    And featureFlags.advancedRecap true
    And featureFlags.multiStreamer true
    And featureFlags.batchDeploy true
    And featureFlags.whitelabel true
    And featureFlags.performanceRevShare false
    And limits.savedProjects null

  Scenario: Client-supplied plan is not trusted
    Given a Free workspace
    When an overlay config request includes a tampered plan value of "pro"
    Then the server returns the Free entitlement
    And watermark remains true
```

### RLS-02 — Free/Pro/Agency widget gating

**User story:** As a Free user, I want only Gift Alert, Goal Bar, and Chat Effects to be addable and renderable, so premium widgets are a clear upgrade incentive and cannot be bypassed.

**Gherkin:**

```gherkin
Feature: Widget gating

  Scenario: Free palette shows only basic widgets
    Given a Free workspace opens the builder
    When the widget palette is displayed
    Then Gift Alert, Goal Bar, and Chat Effects are available
    And every other widget is shown as locked

  Scenario: Free user cannot add a premium widget
    Given a Free workspace opens the builder
    When the user attempts to add a premium widget
    Then the widget is not added to the canvas
    And a locked or upgrade prompt is shown

  Scenario: Free user cannot render a premium widget from a tampered config
    Given a Free workspace
    And an overlay config contains a premium widget type
    When the overlay page attempts to render the config
    Then the premium widget is rejected
    And the published overlay does not render the premium widget

  Scenario: Pro and Agency can add all widgets
    Given a workspace with plan "pro" or "agency"
    When the user opens the widget palette
    Then all 10 widgets are available
    And premium widgets can be added and rendered
```

### RLS-03 — Saved-project limit enforcement

**User story:** As a Free user, I want my one saved project to remain available, while the platform blocks additional projects, so project limits are enforced consistently instead of only being hidden in the UI.

**Gherkin:**

```gherkin
Feature: Saved project limits

  Scenario: Free user saves first project
    Given a Free workspace with no saved projects
    When the user saves a project
    Then the project is saved
    And the workspace now has 1 saved project

  Scenario: Free user cannot save a second project
    Given a Free workspace with 1 saved project
    When the user attempts to save or duplicate another project
    Then the save is rejected
    And an upgrade prompt is shown

  Scenario: Pro user saves unlimited projects
    Given a Pro workspace with 5 saved projects
    When the user saves another project
    Then the project is saved
    And the workspace now has 6 saved projects
```

### RLS-04 — Template availability by tier

**User story:** As a user, I want template availability to match my plan, so Free users get community templates while Pro/Agency unlock priority and custom templates.

**Gherkin:**

```gherkin
Feature: Template gating

  Scenario: Free template access
    Given a Free workspace opens the gallery
    When the gallery is displayed
    Then community templates are available
    And priority templates are shown as locked
    And custom template saving is unavailable

  Scenario: Pro template access
    Given a Pro workspace opens the gallery
    Then community and priority templates are available
    And the user can save a custom template

  Scenario: Agency template access
    Given an Agency workspace opens the gallery
    Then all Pro templates are available
    And the user can save custom templates
```

### RLS-05 — Pro entitlement unlocks

**User story:** As a Pro subscriber, I want custom branding and advanced recap analytics enabled, so the paid tier delivers the promised value beyond widget unlocks.

**Gherkin:**

```gherkin
Feature: Pro entitlements

  Scenario: Pro custom branding
    Given a Pro workspace
    When the user edits overlay branding
    Then custom branding controls are available
    And the published overlay uses the custom branding

  Scenario: Pro advanced recap analytics
    Given a Pro workspace
    When the user opens recap analytics
    Then advanced recap analytics are available
    And the dashboard is not limited to the Free summary view

  Scenario: Free does not receive Pro unlocks
    Given a Free workspace
    Then custom branding controls are locked
    And advanced recap analytics are locked
```

### RLS-06 — Watermark enforcement

**User story:** As a product owner, I want Free overlays to always show a visible non-removable "Stream Studio" watermark while Pro/Agency overlays show none, so the watermark drives paid conversion and cannot be stripped client-side.

**Gherkin:**

```gherkin
Feature: Watermark enforcement

  Scenario: Free preview and builder show watermark
    Given a Free workspace
    When the user opens the builder or preview
    Then a visible "Stream Studio" watermark is displayed

  Scenario: Free published overlay shows watermark
    Given a Free workspace publishes an overlay
    When the published overlay URL is opened
    Then a visible "Stream Studio" watermark is displayed

  Scenario: Pro published overlay has no watermark
    Given a Pro workspace publishes an overlay
    When the published overlay URL is opened
    Then no "Stream Studio" watermark is displayed

  Scenario: Agency published overlay has no watermark
    Given an Agency workspace publishes an overlay
    When the published overlay URL is opened
    Then no "Stream Studio" watermark is displayed

  Scenario: Removing config URL parameter does not remove Free watermark
    Given a Free workspace has a published overlay URL
    When the URL is opened without its config query parameter
    Then the overlay still shows the "Stream Studio" watermark
```

### RLS-07 — Demo mode follows workspace tier

**User story:** As a prospect evaluating the product, I want demo mode to match the active workspace tier, so the preview accurately shows what Free versus paid overlays look like.

**Gherkin:**

```gherkin
Feature: Demo mode watermark and gating

  Scenario: Free demo mode
    Given a Free workspace starts demo mode
    Then the demo overlay shows the "Stream Studio" watermark
    And premium widgets remain locked

  Scenario: Pro demo mode
    Given a Pro workspace starts demo mode
    Then the demo overlay shows no watermark

  Scenario: Agency demo mode
    Given an Agency workspace starts demo mode
    Then the demo overlay shows no watermark
```

### RLS-08 — Pricing page

**User story:** As a prospect or current user, I want a clear pricing page with three tiers, monthly/annual toggle, and USD/IDR toggle, so I can compare plans and start an upgrade in my local currency.

**Gherkin:**

```gherkin
Feature: Pricing page

  Scenario: Default pricing display
    Given a visitor opens /pricing
    Then Free, Pro, and Agency tiers are displayed
    And Pro shows $19/mo or Rp 149.000/mo according to the selected region
    And Agency shows $99/mo or Rp 799.000/mo according to the selected region

  Scenario: Annual discount
    When the visitor switches to annual billing
    Then Pro shows $15/mo or Rp 119.000/mo
    And Agency shows $79/mo or Rp 649.000/mo
    And the annual total or discount is clearly communicated

  Scenario: Currency and region selection
    When the visitor toggles currency from USD to IDR
    Then all paid prices change to the approved IDR prices
    And the toggle state persists for the checkout session

  Scenario: Upgrade CTA
    When a signed-in Free user clicks the Pro upgrade CTA
    Then the upgrade flow or checkout starts
    And the user is not asked for a TikTool API key as part of Studio billing

  Scenario: Performance is not offered for purchase in release one
    Then no visitor can start a Performance rev-share checkout
```

### RLS-09 — Activation event telemetry

**User story:** As a product/data owner, I want the activation funnel events emitted from server-side or product-owned telemetry and queryable, so the team can measure activation and conversion without trusting UI logs.

**Gherkin:**

```gherkin
Feature: Activation events

  Scenario: Activation funnel events are emitted
    Given product telemetry is enabled
    When a user performs each funnel action
    Then studio.visit, builder.started, widget.added, stream.connected,
      overlay.published, overlay.live, upgrade.clicked, checkout.started,
      checkout.completed, and tier.changed events are emitted in order

  Scenario: Events include queryable identifiers
    Given an activation event is emitted
    Then the event includes workspace id, plan, region, timestamp,
      and event name
    And the event does not require reading client-side UI logs

  Scenario: Watermark exposure is captured for upgrade measurement
    Given a Free user sees a watermark and later starts checkout
    Then the upgrade event can be attributed to watermark exposure
```

### RLS-10 — Billing provider abstraction

**User story:** As the engineering/finance team, I want checkout behind a provider abstraction so we can start with Stripe global and Midtrans/QRIS Indonesia without hardcoding any provider into entitlement logic.

**Gherkin:**

```gherkin
Feature: Billing provider abstraction

  Scenario: Entitlement code has no provider dependency
    Given the entitlement module is inspected
    Then it does not import or hardcode Stripe, Midtrans, Xendit,
      Lemon Squeezy, or Paddle

  Scenario: Region routes to a configured provider adapter
    Given a configured provider map
    When checkout starts for a GLOBAL region customer
    Then the configured global provider adapter is used
    When checkout starts for an ID region customer
    Then the configured ID provider adapter is used

  Scenario: Plan, price, discount, tax, and invoice data are separate
    Given the billing configuration
    Then plan, price, discount, tax, and invoice data are not embedded
      in the product entitlement record
```

### RLS-11 — Pro/Agency checkout

**User story:** As a prospect, I want to complete a Pro or Agency purchase in USD or IDR with monthly or annual billing, so I can become a paid subscriber through a supported provider.

**Gherkin:**

```gherkin
Feature: Pro/Agency checkout

  Scenario: Pro monthly checkout in USD
    Given a GLOBAL region customer selects Pro monthly
    When checkout is completed successfully
    Then the workspace becomes Pro
    And checkout.completed is emitted

  Scenario: Pro annual checkout in IDR
    Given an ID region customer selects Pro annual
    When checkout is completed successfully
    Then the workspace becomes Pro
    And the charged amount is Rp 119.000 per month equivalent or the approved annual total

  Scenario: Agency checkout
    Given a customer selects Agency
    When checkout is completed successfully
    Then the workspace becomes Agency
    And Agency entitlements are enabled

  Scenario: Failed checkout does not grant entitlement
    Given checkout fails or is cancelled
    Then the workspace remains on its previous plan
    And no paid entitlement is granted
```

### RLS-12 — Upgrade/downgrade lifecycle

**User story:** As a subscriber, I want plan changes to update my entitlements within a defined sync window and preserve saved projects, so I can upgrade or downgrade without losing work.

**Gherkin:**

```gherkin
Feature: Upgrade and downgrade

  Scenario: Upgrade from Free to Pro
    Given a Free workspace with 1 saved project
    When the user completes a Pro upgrade
    Then the workspace becomes Pro within the defined sync window
    And watermark is removed
    And all widgets are available
    And the saved project is preserved

  Scenario: Downgrade from Pro to Free preserves data
    Given a Pro workspace with multiple saved projects
    When the user downgrades to Free
    Then the workspace becomes Free within the defined sync window
    And saved projects are not deleted
    And Free watermark and gating are applied
    And the Free one-project creation limit is enforced going forward

  Scenario: Downgrade does not grant Agency-only features
    Given an Agency workspace downgrades to Pro
    Then multiStreamer, batchDeploy, whitelabel, and roster rollup are disabled
    And Pro entitlements remain available
```

### RLS-13 — Performance rev-share release guard

**User story:** As a CPO, I want Performance rev-share to be non-purchasable and disabled in the first release, so we do not ship an unvalidated billing ledger.

**Gherkin:**

```gherkin
Feature: Performance release guard

  Scenario: Performance is disabled for all plans in release one
    Given any workspace plan
    When the entitlement endpoint is queried
    Then featureFlags.performanceRevShare is false

  Scenario: Performance is not available in checkout
    Given the pricing page and checkout in release one
    Then no Performance rev-share purchase path is enabled
```

### RLS-14 — Agency multi-streamer workspace

**User story:** As an Agency subscriber, I want one workspace that can connect multiple streamers, so I can manage a roster from a single account.

**Gherkin:**

```gherkin
Feature: Agency multi-streamer workspace

  Scenario: Agency adds multiple streamers
    Given an Agency workspace
    When the user connects a second streamer
    Then the streamer is added to the workspace

  Scenario: Non-Agency cannot use multi-streamer
    Given a Pro workspace
    When the user attempts to connect a second streamer
    Then the action is blocked
    And an Agency upgrade prompt is shown
```

### RLS-15 — Agency team seats

**User story:** As an Agency owner, I want team seats so different staff members can manage the roster with defined roles or limits.

**Gherkin:**

```gherkin
Feature: Agency team seats

  Scenario: Agency owner adds a seat
    Given an Agency workspace
    When the owner adds a team member
    Then the team member can access the workspace

  Scenario: Non-Agency cannot add seats
    Given a Pro workspace
    When the user attempts to add a team member
    Then the action is blocked
```

### RLS-16 — Agency batch deploy

**User story:** As an Agency owner, I want batch deploy so I can publish or update overlays across multiple streamers without repeating the same manual work.

**Gherkin:**

```gherkin
Feature: Agency batch deploy

  Scenario: Batch deploy across streamers
    Given an Agency workspace with at least 2 streamers
    When the owner runs a batch deploy
    Then the selected overlays are deployed to all selected streamers

  Scenario: Batch deploy is Agency-only
    Given a Pro workspace
    Then batch deploy controls are unavailable
```

### RLS-17 — Agency whitelabel

**User story:** As an Agency owner, I want whitelabel so published overlays and shared artifacts carry the agency brand instead of Stream Studio branding.

**Gherkin:**

```gherkin
Feature: Agency whitelabel

  Scenario: Agency whitelabel branding
    Given an Agency workspace
    When the owner configures whitelabel branding
    Then published overlays use the whitelabel brand

  Scenario: Pro does not receive whitelabel
    Given a Pro workspace
    Then whitelabel controls are unavailable
```

### RLS-18 — Agency roster analytics

**User story:** As an Agency owner, I want roster rollup analytics so I can see performance across all streamers in one dashboard.

**Gherkin:**

```gherkin
Feature: Agency roster analytics

  Scenario: Agency roster rollup
    Given an Agency workspace with multiple streamers
    When the owner opens analytics
    Then a roster rollup is displayed
    And individual streamer drill-down is available

  Scenario: Pro sees only its own advanced analytics
    Given a Pro workspace
    Then roster rollup is unavailable
```

### RLS-19 — Performance eligibility

**User story:** As a Phase 4 Agency subscriber, I want Performance eligibility based on validated diamond thresholds, so rev-share is offered only to accounts that are operationally profitable.

**Gherkin:**

```gherkin
Feature: Performance eligibility

  Scenario: Eligible agency aggregate threshold
    Given an Agency workspace with aggregate diamond telemetry of at least 100,000 diamond gross/month
    When Performance eligibility is evaluated
    Then the workspace is eligible

  Scenario: Ineligible agency
    Given an Agency workspace below the approved threshold
    Then Performance is not offered

  Scenario: Pro is never eligible in Phase 4 entry state
    Given a Pro workspace
    Then Performance is not offered
```

### RLS-20 — Performance ledger and invoicing

**User story:** As a Phase 4 Agency subscriber, I want a Performance ledger calculated from net gift value with a minimum invoice and rollover, so I pay from results while the business covers collection costs.

**Gherkin:**

```gherkin
Feature: Performance ledger and invoicing

  Scenario: Ledger uses net gift value
    Given approved diamond conversion is configured
    When the ledger is calculated
    Then the Performance fee is 15% of net gift value
    And the calculation does not use gross diamond value as the fee base

  Scenario: Minimum invoice rollover
    Given a Performance account's monthly fee is below US$25
    Then no invoice is issued for that month
    And the balance rolls over to the next month

  Scenario: Escape hatch to Pro
    Given a Performance account
    When the user switches to Pro flat
    Then the workspace becomes Pro
    And no further Performance fees accrue
```

## 5. Traceability to CPO spec phases and gates

| CPO Phase | Scope | Backlog stories |
| --- | --- | --- |
| 0 | Spec, PO/BA artifacts, CTO feasibility | This document plus IKI-110 delegated artifacts |
| 1 | Entitlement, gating, watermark, pricing, activation | RLS-01 through RLS-09 |
| 2 | Billing integration, annual discounts, upgrade flow | RLS-10 through RLS-13 |
| 3 | Agency multi-streamer, seats, batch deploy, whitelabel | RLS-14 through RLS-18 |
| 4 | Performance rev-share ledger and eligibility | RLS-19 through RLS-20 |

Mapping to CPO Section 8 engineering acceptance gates:

| CPO gate | Covered by |
| --- | --- |
| 1. Server returns immutable Entitlement | RLS-01 |
| 2. Free watermark; Pro/Agency none | RLS-06 |
| 3. Premium widgets blocked on Free, including tampered config | RLS-02 |
| 4. Free project limit server-side | RLS-03 |
| 5. Pricing page USD/IDR + three tiers + annual discount | RLS-08 |
| 6. Provider abstraction; no hardcoded provider | RLS-10 |
| 7. Upgrade/downgrade sync and project preservation | RLS-12 |
| 8. Performance not enabled first release | RLS-13 |
| 9. Activation events emitted and queryable | RLS-09 |
| 10. Free watermark cannot be stripped by URL param | RLS-06 |

## 6. Open decisions and assumptions

- **IDR price lock:** R4 Pro Rp 149.000 and Agency Rp 799.000 remain directional until Van Westendorp interviews complete.
- **Diamond conversion:** `1 diamond ≈ US$0,005 gross / ≈ US$0,0025 net` is an estimate and must be validated before RLS-19/RLS-20.
- **Billing providers:** Stripe + Midtrans/QRIS are recommendations only; final provider choice is a finance/board sign-off, not a blocker for Phase 1 stories.
- **Downgrade data behavior:** RLS-12 preserves saved projects and enforces the Free creation limit going forward; exact read-only/active behavior for multiple projects after downgrade should be confirmed with CTO/BA.
- **TikTool boundary:** Studio billing and entitlement never include the customer-supplied TikTool API key.

## 7. Out of scope for this deliverable

- Engineering implementation or code changes.
- Billing integration or provider configuration.
- Final tax, provider fee, and price validation.
- Running the Van Westendorp interviews or diamond payout confirmation.
