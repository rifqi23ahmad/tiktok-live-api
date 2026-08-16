# Finance Baseline + Runway Guardrails — Tiktok Stream

**Owner:** CFO
**Issue:** IKI-458
**Approved source:** CFO proposal IKI-79 WS1, CEO-approved for `tiktokstrem` only
**Date:** 2026-08-15
**Status:** Published baseline for pre-revenue operations
**FX planning rate:** 1 USD ≈ Rp 16.300

## 1. Executive summary

Tiktok Stream is pre-revenue. The finance baseline therefore controls committed burn, not revenue plan variance.

| Baseline number | Value |
| --- | ---: |
| Committed monthly recurring costs | **$0 / month** |
| Reserved/planned monthly recurring costs | **$99 / month** |
| Monthly hard cap | **$150 / month** |
| Single autonomous spend | **$0 — every real-money spend requires a gate** |
| CFO approval threshold | **Any spend commitment > $0** |
| Runway yellow trigger | **< 9 months** |
| Runway red trigger | **< 6 months** |
| Runway hard-stop trigger | **< 3 months** |

The hard cap is a ceiling, not a spend authorization. Each line below is a reserve, not a standing purchase order.

## 2. Known recurring costs

All figures are monthly unless stated. "Committed" means already approved and billable. "Reserved" means the maximum we should budget for, but it still needs a CFO spend-request approval before it becomes committed.

| Line | Vendor / service | Committed | Reserved | Notes |
| --- | --- | ---: | ---: | --- |
| TikTool / API | TikTool data layer | $0 | $49 | Community tier is free and covers demo/dev. Pro tier reserved for internal unmasked leaderboard testing, captions QA, and higher request limits. |
| Hosting | Vercel / Nuxt hosting + domain | $0 | $20 | Local/dev is free. Reserve is for a production-grade deployment, custom domain, and preview capacity if/when a publish gate is opened. |
| AI / model credits | Tarogo API + any TTS/caption credit usage | $0 | $20 | Covers AI host chat, TTS/comment reading, and caption/model test loops. Do not auto-scale; request increase at the cap. |
| Tools / SaaS | Analytics, email, ops, collaboration | $0 | $10 | No paid tool is currently required. Reserve prevents ad-hoc subscriptions from creeping outside budget. |
| **Total recurring** | — | **$0** | **$99** | Planned pre-revenue run rate if all reserves are used. |

### 2.1 Why committed is $0 today

The product currently runs on free tiers and local development. Billing, paid production hosting, and paid data-layer tiers are not authorized yet. Keeping committed spend at $0 preserves runway until the first revenue conversion is proven.

### 2.2 Variable and future costs

These are revenue-linked or phase-gated and are not part of pre-revenue burn:

| Cost | Assumption | Action |
| --- | --- | --- |
| Global card processing | ~2.9% + $0.30 per successful charge | Validate Stripe terms before Phase 2 billing. |
| Indonesia processing | Midtrans / QRIS / Xendit fees | Validate local provider fees and settlement before Phase 2 billing. |
| Manual rev-share collection | ~$5–15 / account / month | Enforce Performance thresholds: ≥100.000 diamond gross/month per account, or ≥50.000 when aggregated per agency, min invoice $25. |
| Gift payout conversion | 1 diamond ≈ $0.005 gross / ≈ $0.0025 net | Confirm with 3–5 real streamer payout statements before Performance ledger go-live. |

## 3. Pricing snapshot for cashflow assumptions

Near-term monetization is subscription-led. These are the R4-supported price anchors, not yet a committed revenue forecast.

| Tier | USD monthly | IDR monthly | USD annual | IDR annual |
| --- | ---: | ---: | ---: | ---: |
| Free | $0 | Rp 0 | — | — |
| Pro | $19 | Rp 149.000 | $15 | Rp 119.000 |
| Studio / Agency | $99 | Rp 799.000 | $79 | Rp 649.000 |

Performance rev-share, when enabled: **15% of net gift value**, threshold **≥100.000 diamond gross/month** (or ≥50.000 when aggregated per agency), minimum invoice **$25**.

## 4. Department budget ceilings

These are monthly ceilings inside the $150 hard cap. A department may not exceed its ceiling without CFO review; exceeding the company hard cap requires CEO/Board approval.

| Department / cost center | Monthly ceiling | Primary allowed use |
| --- | ---: | --- |
| Engineering & Infrastructure | $110 | TikTool/API, hosting, AI/model credits, tools, staging/infra |
| Product & Design | $15 | Product research tools, design/prototyping SaaS |
| Marketing | $10 | Pre-launch content/SEO tooling only; no paid ads without separate gate |
| Research | $5 | Market/competitor research access |
| Finance & Governance | $5 | Finance/ops tooling |
| Contingency | $5 | Unplanned, CFO-approved small needs |
| **Company total** | **$150** | Hard cap; token spend is logged separately and is not real-money spend |

Important: ceilings do not pre-approve spending. A spend request must still pass the CFO threshold rule below.

## 5. Spend-request threshold rule

**Threshold: any real-money commitment greater than $0 requires CFO approval.**

This applies to:

- One-time purchases and recurring subscriptions.
- API/model quota increases beyond the current free/paid quota.
- Hosting/domain/DB/email/analytics and any other SaaS.
- Paid tools, ads, domains, sponsorships, and external services.
- Anything that can bill a card or create an account-level charge.

Required fields on every spend request:

1. Requestor and department.
2. Vendor / service and URL.
3. Amount and billing frequency (one-time, monthly, annual).
4. Business purpose tied to the north star or a named issue.
5. Expected impact: revenue, margin, cost avoidance, or activation risk removed.
6. Cancellation or offboarding terms.
7. Total commitment, not just first payment.

CFO decision logic:

| Case | Approver |
| --- | --- |
| Spend commitment = $0 | No CFO approval required; log the free tier/resource. |
| Spend commitment > $0 and within requesting department ceiling, non-card | CFO |
| Spend commitment > $0 and would exceed department ceiling, or multi-month total > $100 | CFO + CEO/Board |
| Anything that bills a card | Board only |
| Recurring subscription with total commitment > $50 or term > 3 months | CFO + CEO/Board |
| Emergency, time-sensitive spend | CFO first; Board notified same day |

All approvals must be recorded in the related issue or spend log before the charge is made. No retroactive approval.

## 6. Runway guardrails

Runway months are calculated from the monthly finance pack:

```
Runway months = closing cash / average net monthly burn
```

If actual burn is zero or negative, report `n/a` and show the expected next-spend date.

| State | Trigger | Required action |
| --- | --- | --- |
| Green | Runway ≥ 9 months | Normal operations; CFO reviews budget-vs-actual monthly. |
| Yellow | Runway 6–8 months | CEO/Board review; no new recurring commitments; CFO freezes unused reserves. |
| Red | Runway 3–5 months | Board decision required; freeze all non-essential spend; CFO produces weekly runway update. |
| Hard stop | Runway < 3 months | Only Board-approved continuation; pause new spend and evaluate bridge or shut-down. |

Guardrail application: pre-revenue, use the worst of reported cash and planned $150 hard cap when actual cash is not yet reported.

## 7. Monthly finance-pack template

CFO posts this pack by the second business day of each month, or after a material spend event.

### 7.1 Cash snapshot

| Field | Formula / source | Amount |
| --- | --- | ---: |
| Opening cash | prior closing cash | $— |
| Receipts | revenue + funding + other inflows | $— |
| Disbursements | approved spend paid this period | $— |
| Net cash flow | receipts − disbursements | $— |
| Closing cash | opening cash + net cash flow | $— |

### 7.2 Burn

| Field | Value |
| --- | ---: |
| Gross burn | total disbursements |
| Net burn | disbursements − receipts |
| Recurring burn | subscription/API/hosting/AI/tools |
| One-time burn | projects, purchases, setup |
| Average 3-month net burn | trailing monthly average |

### 7.3 Runway

| Field | Value |
| --- | ---: |
| Runway months | closing cash / average net burn |
| Cash-zero date | estimated from average burn |
| Guardrail state | Green / Yellow / Red / Hard stop |
| Trigger crossed | yes/no + date |

### 7.4 Budget vs actual

| Department | Ceiling | Actual | Variance | Note |
| --- | ---: | ---: | ---: | --- |
| Engineering & Infrastructure | $110 | $— | $— | — |
| Product & Design | $15 | $— | $— | — |
| Marketing | $10 | $— | $— | — |
| Research | $5 | $— | $— | — |
| Finance & Governance | $5 | $— | $— | — |
| Contingency | $5 | $— | $— | — |
| **Total** | **$150** | **$—** | **$—** | — |

### 7.5 Risk and approvals

- Outstanding spend requests and approval state.
- Upcoming renewal/cancel-by dates.
- Any line at >80% of reserve.
- Board/CEO actions required.
- One-line CFO call: continue / reduce / pause.

## 8. Sources and next validation

- `docs/monetisasi.md` — monetization model and tier hypothesis.
- `docs/research/r4-pricing-benchmark-wtp.md` — price benchmarks, WTP, rev-share economics.
- `README.md` — TikTool pricing matrix: Community $0, Basic $19, Pro $49, Ultra $149, Global Agency $399.
- `docs/AUTOPILOT_MODE.md` — Board-set budget ceiling and money gates.
- `docs/revenue-layer-ba-requirements-iki-130.md` — billing provider options and finance risks.

Still to validate before Phase 2 billing: Stripe/Midtrans/QRIS/Xendit terms, IDR WTP, and real diamond payout conversion.

## Changelog

- 2026-08-15 — Initial finance baseline published under IKI-458.
