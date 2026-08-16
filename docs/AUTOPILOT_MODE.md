# Autopilot Mode v1 — IKISAE Runs Itself

**Status:** ready to activate (paste configs into the Paperclip platform)
**Owner:** CEO (execution) · Board (budget + direction only)
**Project:** Tiktok Stream
**Date:** 2026-08-15

---

## 1. What this changes

Today the agents are `wakeOnDemand` — they only act when the CEO/Board pings them.
Autopilot flips them to a **scheduled heartbeat loop**: each role wakes on a timer,
checks its Ready queue, pulls the next item, and works — without the Board pushing a
single task. The Board keeps exactly two jobs: **set the direction once** and
**hold the budget + approval gates**.

This is not a new process. It is `docs/PERPETUAL_BACKLOG_FLOW.md` plus the timers and
standing mandate that make it run unattended.

---

## 2. The three switches

### 2.1 Enable heartbeats (the "on terus" part)

Flip these roles from `wakeOnDemand` to a scheduled heartbeat. Recommended cadence is
below; it keeps everyone moving like a real company without burning cycles on empty
ticks (every tick is an LLM call).

| Role | Agent ID | Heartbeat | Why |
|---|---|---|---|
| CEO | `4dd0d6b1-e7d2-47f2-b9d6-ea79fe3414ed` | 30 min | Triage gate, assign approved work, clear blockers |
| Scrum Master | (from hire package) | 30 min | Process health, blocker review, retro/planning pulse |
| CTO | `562c9551-e144-47e2-acb3-6d916c26859f` | 30 min | Route work to engineers, unblock technical work |
| CPO | `4a2012b5-1877-4296-92a7-9448e0e5c97e` | 30 min | Product queue, PM delegation, review handoffs |
| PM | `3ef44a59-e25c-47ca-8982-8ebb7b639906` | 30 min | Backlog priority, delegate to researchers/designer |
| CFO | `5418cfd0-eb48-4e23-b1d8-d58331262aed` | 1 hr | Finance/business queue (lower churn) |
| QA Lead | `e8cdc51e-e211-481a-9334-892352767e96` | 30 min | Pull/route test work, sign-off |

IC roles (engineers, researchers, designer, QA engineer) stay `wakeOnDemand` — the
leads wake them by assigning work, which is exactly how a real company works (you
don't pay an engineer to idle-scan; the manager hands them the ticket).

### 2.2 Standing CEO mandate (the "bikin ide sendiri" part, safely)

Paste into the CEO's AGENTS.md:

```markdown
## Standing mandate (Autopilot Mode)

You run Tiktok Stream toward the north star without waiting for the Board.

North star: TikTok LIVE streamers (starting Indonesia) adopt Stream Studio and keep
their audience more engaged, longer — then monetize.

You may, on your own authority:
- Advance the roadmap and re-prioritize the backlog as new evidence arrives.
- Self-initiate work that advances the north star (ideas, features, experiments).
- Approve any change that is reversible and does not spend real money.

You may NOT, without a Board approval gate (see §4):
- Spend real money (Tarogo API beyond quota, paid tools, ads, domains).
- Deploy to production or publish externally.
- Delete data, rotate/remove secrets, or change shared infra.

Every heartbeat, you choose ONE of: triage new proposals → unblock something →
delegate to a lead. If nothing is pending, you pull the next item from the backlog
yourself and start it. Do not idle-loop; always leave durable progress + a next action.
```

### 2.3 Idle behavior (the "nggak ada kerjaan" part)

Without this rule, agents on a timer will drift into slop. Every role already follows
"scope to assigned work only". Add this global rule so "no work" means "find work in
the Ready queue", not "invent busywork":

```markdown
## Idle rule

If you wake and have nothing assigned: pull the highest-priority Ready item from your
team's queue. If the queue is empty, refill it with ONE candidate (title, owner,
impact, effort, acceptance criteria) and stop. Never generate unrequested artifacts
just to look busy.
```

---

## 3. Budget & approval gates (the rails)

"Token unlimited" covers the LLM calls. It does **not** cover real spend or
irreversible actions. The gates below are what stop the company from hurting itself
while you're away.

### 3.1 Money gates (Board approval required)

| Spend | Gate |
|---|---|
| Tarogo API beyond monthly quota | CFO + Board |
| Paid tools / ads / domains / SaaS | CFO + Board |
| Anything that bills a card | Board only |

### 3.2 Irreversible / external gates

| Action | Gate |
|---|---|
| Deploy to production | CTO + Board |
| Publish externally (store, PH, PR, social) | CMO + Board |
| Delete data / drop tables / rotate secrets | Security Engineer + Board |
| Change shared infra / CI / domains | CTO + Board |

### 3.3 Default budget ceiling (set once)

```markdown
## Budget ceiling (Board-set, do not exceed)

- Monthly hard cap: as set by Board in the finance baseline (IKI-79).
- Single autonomous spend (no gate): Rp 0 — all spend goes through a gate.
- Token spend: unlimited, but log tokens-per-heartbeat so runaway loops are visible.
```

---

## 4. What the Board still does (the minimum)

Autopilot removes *task* work, not *governance* work. The Board's total job becomes:

1. **Set the north star + budget once** (already drafted above).
2. **Review the weekly recap** (CEO posts one every Monday).
3. **Hit approve/reject on gates** — only when something requests a gate.
4. **Step in on a red flag**: runaway spend, drift off north star, or a repeated
   blocker that keeps the whole queue stuck.

That is ~15 minutes/week, plus gate approvals as they come.

---

## 5. Daily pulse (what actually runs each day)

```
Every 30 min:
  CEO        → triage / assign / unblock (or pull next item)
  SM         → blocker review, keep WIP ≤ 1 per person
  CTO/CPO/PM → route work to leads/ICs, review done handoffs

On assignment:
  IC (engineer/researcher/designer/QA) wakes, does the work, posts result

End of each week:
  SM  → retro with one owned experiment
  CEO → weekly recap to Board (shipped, blocked, spent, next)
```

---

## 6. Paste-ready config (the platform part)

The heartbeat lives in each agent's `runtimeConfig`. Set the leads to enabled and
keep ICs on `wakeOnDemand`. Confirm the exact schedule field name against the
Paperclip platform docs (the hire package used `heartbeat.enabled` +
`wakeOnDemand`; schedule key may be `interval` / `cron` / `schedule`).

```jsonc
// Example: CEO
{
  "name": "CEO",
  "role": "executive",
  "reportsTo": null,
  "runtimeConfig": {
    "heartbeat": {
      "enabled": true,
      "wakeOnDemand": false,
      "interval": "30m"
    }
  }
}
```

```jsonc
// Example: IC stays pull-based
{
  "name": "Frontend Engineer",
  "runtimeConfig": {
    "heartbeat": { "enabled": false, "wakeOnDemand": true }
  }
}
```

---

## 7. Activation checklist

- [ ] Enable heartbeat on: CEO, SM, CTO, CPO, PM, CFO, QA Lead (interval per §2.1).
- [ ] Paste the Standing CEO Mandate (§2.2) into CEO AGENTS.md.
- [ ] Paste the Idle Rule (§2.3) into every lead's AGENTS.md.
- [ ] Confirm money + irreversible gates (§3.1–3.2) are enforced by the platform.
- [ ] Set the budget ceiling (§3.3) once.
- [ ] Resolve the standing blockers in `PERPETUAL_BACKLOG_FLOW.md` (§ IKI-54, IKI-67,
      IKI-58/59) so the queue can actually flow — a company with a stuck queue is not
      a company, it's a loop.

---

## 8. Kill switch (keep this)

If Autopilot ever needs to stop, revert §2.1: set leads back to
`{ "enabled": false, "wakeOnDemand": true }`. The rest of the process stays intact —
you just stop the timer.
