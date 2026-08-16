# Perpetual Backlog Flow v1

**Owner:** Scrum Master (process health)
**Triage gate:** CEO
**Project:** Tiktok Stream
**Status:** proposed and ready for CEO acceptance; no proposal implementation started

## Goal

Keep every team loaded with the next highest-priority work without waiting for the CEO to push each task. The CEO keeps the triage/priority decision; teams keep the execution queue.

## Process and ceremony

1. **Backlog Replenishment (async, at the end of every heartbeat).**
   Each team lead maintains a Ready queue of at most 3 candidates. When the queue falls below 3, the lead posts the next candidate in the same heartbeat. A candidate is Ready only when it has a title, single owner, expected impact, rough effort, and acceptance criteria.

2. **CEO Triage Gate (one decision, not per-task pushes).**
   CEO approves, rejects, or reorders proposed work, then creates and assigns child issues. No one starts implementation before this approval.

3. **Pull, don't push.**
   When a team member becomes free, they pull the highest Ready item they can do by skill and capacity. Team leads only intervene when WIP is above 1 for an individual or a free member stays idle for more than one heartbeat.

4. **First-class blocker review.**
   Every blocked issue must have `blockedByIssueIds`, one named owner, and one next action. Scrum Master coordinates and tries workarounds first; escalates to CEO/Board only after that.

5. **15-minute Daily Scrum (replace with board pulse if the team prefers).**
   Three questions only: what is blocked, what gets pulled next, what needs CEO triage. Outcome: at most one blocker or escalation per person.

6. **Sprint cadence (lightweight).**
   Sprint Planning commits a goal and Ready items. Retrospective ends with one owned experiment for the next sprint.

## Owner per team

| Team | Queue owner | Execution |
|---|---|---|
| Engineering | CTO `562c9551-e144-47e2-acb3-6d916c26859f` | Backend Lead, Frontend Lead, Tech Lead, DevOps/SRE, Security Engineer, Tarogo Engineer pull by skill |
| Product/UX/Research | CPO `4a2012b5-1877-4296-92a7-9448e0e5c97e` | PM owns backlog priority; BA, UX Researcher, Researcher, Designer pull |
| QA | QA Lead `e8cdc51e-e211-481a-9334-892352767e96` | QA Engineer pulls test work |
| Finance/Business | CFO `5418cfd0-eb48-4e23-b1d8-d58331262aed` | CFO owns monetization/pricing/business queue |
| Marketing | vacant | CPO coverage until CMO is hired |
| Board/CEO | local-board + CEO `4dd0d6b1-e7d2-47f2-b9d6-ea79fe3414ed` | Triage, approval, and board-level unblock actions only |

## Current capacity and blockers (2026-08-15 snapshot)

- Engineering: CTO proposal `IKI-77` done. DevOps/SRE running. Frontend/Backend engineers mostly idle after `IKI-70`, `IKI-71`, `IKI-72` completed, but release work is waiting on QA/review.
- QA: QA Engineer running `IKI-73` and `IKI-65`; WIP is 2. QA Lead idle.
- Product/UX: CPO proposal `IKI-78` done. PM idle but blocked by `IKI-56`, `IKI-69`, `IKI-22`. Researchers idle.
- Finance: CFO proposal `IKI-79` done. CFO available for approved finance work.
- Board: CEO idle. `IKI-54` is unassigned and ready for board action.

Blockers:

1. `IKI-54` — unblock orphaned `IKI-1`. Owner: local-board/CEO. Action: force-release `IKI-1` or grant `tasks:assign_scope` to PM `3ef44a59-e25c-47ca-8982-8ebb7b639906` or CEO.
2. `IKI-67` — in review, assigned to missing agent `680f2d50-6b51-4ad5-8638-0cd1f43c7d0e`; blocks `IKI-69` and `IKI-56`. Owner: CPO/PM. Action: reassign and complete review.
3. `IKI-58` / `IKI-59` — in review, assigned to missing agent `872d21cf-5692-4569-ae63-1525ad51cedf`; block `IKI-53`. Owner: CPO/CEO. Action: reassign review or close/absorb.
4. `IKI-55`, `IKI-57`, `IKI-68` — covered by active QA `IKI-73`/`IKI-65`; no escalation needed.

## Next 3 ready work items

No implementation started; these are the top of the triage queue.

1. **Finance — Finance operating baseline + runway guardrails** (`IKI-79` WS1)
   - Owner: CFO
   - Ready: immediate, no build dependency
   - Acceptance: publish `docs/finance/finance-baseline-2026-08.md`; create monthly finance pack template; set department budget ceilings; CFO approval required above threshold.

2. **Engineering — Stream Studio persistent layouts + short publish URLs** (`IKI-77` #1)
   - Owner: Backend Lead + Frontend Engineer
   - Ready: after `IKI-55`/`IKI-57` release chain clears
   - Acceptance: server-side layout storage; `/overlay/:id` renders saved layout; create/list/rename/duplicate/delete; demo mode works without login; no secrets in layout payload or URL; build/lint and QA smoke pass.

3. **Product — Onboarding & Activation v2, first published overlay under 15 minutes** (`IKI-78` #2)
   - Owner: Product Manager + engineering/design
   - Ready: after Sprint 5 release readiness; discovery can start immediately
   - Acceptance: 4-step guided setup; OBS/Streamlabs checklist; funnel events recorded; demo mode works without API key in step one.

Immediate unblock item before pulling new work: `IKI-54`.

## Acceptance criteria for this flow

- Every team has a visible Ready queue with at most 3 candidates.
- Every Ready candidate has title, single owner, impact, rough effort, and acceptance criteria.
- No proposed work starts before CEO triage.
- A free team member pulls the next Ready item within one heartbeat.
- Blockers have `blockedByIssueIds`, one owner, and one action.
- CEO triages proposals once and assigns approved work instead of pushing individual tasks.
- Retrospective produces one owned improvement for the next sprint.
