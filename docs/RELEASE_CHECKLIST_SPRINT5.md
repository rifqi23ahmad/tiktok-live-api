# Sprint 5 Release Checklist — Stream Studio Release Candidate

- Issue: IKI-68
- Parent: IKI-57 Sprint 5 — Integration, QA, Release Readiness
- Owner: DevOps Engineer
- Date: 2026-08-15
- Branch: `main`
- Base commit: `ba96074b3ad1625572ff0e3d429ea989bd70a588`
- Status: **READY FOR BOARD REVIEW**
- Commit/merge: **not performed, pending explicit board approval**

## 1. Reviewable diff

The release candidate consists of the following tracked working-tree changes only:

```text
 stream-studio/app/components/builder/InspectorPanel.vue      |  16 +++
 stream-studio/app/components/widgets/AvatarArena.vue         | 147 ++++++++++++++++-----
 stream-studio/app/composables/useWidgetRegistry.ts           |   2 +-
 stream-studio/app/utils/ai.ts                                |  14 +-
 stream-studio/nuxt.config.ts                                 |   5 +-
 stream-studio/server/api/host-chat.post.ts                   |  12 +-
 6 files changed, 157 insertions(+), 39 deletions(-)
```

Changed files for board review:

- `stream-studio/app/components/builder/InspectorPanel.vue`
- `stream-studio/app/components/widgets/AvatarArena.vue`
- `stream-studio/app/composables/useWidgetRegistry.ts`
- `stream-studio/app/utils/ai.ts`
- `stream-studio/nuxt.config.ts`
- `stream-studio/server/api/host-chat.post.ts`

Untracked `docs/` and `.agents/` workspace files are **not part of the tracked release diff**. This checklist itself is a workspace-only release artifact.

## 2. Environment variables

| Variable | Scope | Required | Notes |
| --- | --- | --- | --- |
| `TAROGO_API_KEY` | server-side only | recommended | Bearer token for Tarogo AI host chat. Read at request time from `runtimeConfig` or `process.env`. Never placed in client bundles or publish URLs. |
| `TAROGO_API_ENDPOINT` | server-side only | optional | Override for Tarogo chat-completions endpoint. Defaults to `https://api.tarogo.ai/chat/completions`. |
| `NUXT_TAROGO_API_KEY` | server runtime override | optional | Nuxt runtime-config override path named in source comments. |
| `TIKTOOL_API_KEY` | TikTok LIVE data API | optional | Falls back to public demo key in `stream-studio/nuxt.config.ts`; production should use a real key from `https://tik.tools`. |
| `TIKTOK_USERNAME` | example apps only | optional | Used by repository examples, not the Stream Studio release path. |

`stream-studio/.env` is gitignored and must never be committed. `stream-studio/.env.example` is the safe template with empty values.

## 3. Secret handling

- The Tarogo key is resolved server-side in `stream-studio/server/api/host-chat.post.ts` and is not included in `runtimeConfig.public`.
- Old overlay URLs that carried a key in the `model` field are normalized to the default model by `stream-studio/app/utils/ai.ts`.
- `/api/host-chat` returns a safe `no-tarogo-key` error when no key is configured.
- QA verified no configured `TAROGO_API_KEY` appears in `.output/public`, `.nuxt/dist/client`, or generated publish URLs.
- Strict diff scan on the reviewable diff returned no private keys, bearer values, long `sk-*` values, AWS keys, GitHub tokens, Slack tokens, API-key values, passwords, or secret values.

## 4. Build steps

From the repository root:

```bash
npm --prefix stream-studio run build
```

Release output:

- Exit code: `0`
- Nuxt: `4.5.2`
- Nitro: `2.13.4`
- Vite: `8.2.1`
- Vue: `3.5.41`
- Nitro preset: `node-server`
- Output: `stream-studio/.output`
- Preview: `node .output/server/index.mjs`

Build/lint verification report: `docs/IKI-66-Build-Lint-Verification.md`.

## 5. QA results

- Smoke test status: **PASS**, no critical blockers.
- Report: `docs/IKI-65-QA-Smoke-Report.md`.
- 18 smoke checks passed, covering builder load, inspector controls, publish URL integrity, overlay rendering, Avatar Arena modes, member/gift/like interactions, comment TTS, and `/api/host-chat` safe behavior.
- Non-critical observation: Tarogo response language can drift from the requested Indonesian prompt and should be monitored in production copy QA.

## 6. Rollback plan

Pre-approval (no commit/merge has happened):

- Discard unwanted working-tree changes with `git restore <file>` after board review.
- Restore the previously committed state from `ba96074b3ad1625572ff0e3d429ea989bd70a588`.

Post-approval deployment:

- Roll back the release commit/merge with `git revert <release-commit>` and redeploy.
- If an artifact-based deployment is used, redeploy the previous tagged/versioned build.
- Environment rollback: remove or restore `TAROGO_API_KEY` in `stream-studio/.env` and restart the Nitro server.
- No database migrations or persistent schema changes are included in this release.

## 7. Board approval gate

- [ ] Board has reviewed the six tracked source changes.
- [ ] Secret scan accepted.
- [ ] Build/QA evidence accepted.
- [ ] Rollback plan accepted.
- [ ] Explicit approval to commit/merge has been given.

The executing agent must not run `git commit`, `git merge`, or any push/release action before that explicit approval.
