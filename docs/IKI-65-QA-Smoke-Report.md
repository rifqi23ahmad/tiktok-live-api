# IKI-65 QA Smoke Test — Stream Studio Integrated Overlays & AI Host

- Issue: IKI-65
- Owner: QA Engineer
- Date: 2026-08-15
- Status: PASS — no critical blockers

## Scope

- `stream-studio` production build (`npm run build`) succeeded.
- Local smoke test executed against the running Stream Studio dev server at `http://127.0.0.1:3000`.
- Published overlay URL decoded and opened in headless Chromium.
- Avatar Arena modes exercised through the published overlay config and Vue component state.
- Comment TTS exercised with a deterministic browser `SpeechSynthesis` stub.
- `/api/host-chat` tested with and without a Tarogo key.
- Client/server build outputs scanned for the configured `TAROGO_API_KEY` value.

## Pass/Fail Matrix

| ID | Check | Result | Evidence |
| --- | --- | --- | --- |
| SMK-01 | Builder loads with starter layout | PASS | 7 widget boxes |
| SMK-02 | Inspector opens for Avatar Arena | PASS | Viewer Characters + Beyblade Arena controls visible |
| SMK-03 | Publish URL contains full layout | PASS | 7 instances encoded |
| SMK-04 | Publish URL contains no Tarogo secret | PASS | no secret or legacy key prefix |
| SMK-05 | Published overlay opens and renders widgets | PASS | 7 overlay widgets rendered |
| SMK-06 | Beyblade mode renders host in overlay | PASS | 1 host bey rendered |
| SMK-07-beyblade | AvatarArena beyblade mode renders | PASS | `.stadium` present |
| SMK-07-arena | AvatarArena arena mode renders | PASS | `.arena-stage` present |
| SMK-07-marble | AvatarArena marble mode renders | PASS | `.track` present |
| SMK-07-war | AvatarArena war mode renders | PASS | `.war-bar` present |
| SMK-08 | Member join spawns viewer bey | PASS | `@QAOne` nameplate present |
| SMK-09 | Chat renders on beyblade top | PASS | comment state and DOM both show `Halo semua 🔥` |
| SMK-10 | Gift adds bey power | PASS | power `10 -> 160`, crown true |
| SMK-11 | Like triggers aggro + target | PASS | target `host`, aggroUntil set |
| SMK-12 | Like-driven clash damages host | PASS | host HP `160 -> 105.9`, clash pair emitted |
| SMK-13 | Comment TTS speaks and new line replaces old | PASS | 2 speaks, cancel before replacement, `en-US` |
| SMK-14 | Comment TTS toggle off suppresses speech | PASS | 0 speak calls |
| SMK-15 | `/api/host-chat` responds or safe-fails with key | PASS | returned stream-safe text |
| SMK-16 | Client bundle/publish output has no Tarogo secret | PASS | 0 secret hits |
| SMK-17 | Server bundle has no baked Tarogo secret | PASS | 0 secret hits |
| SMK-18 | `/api/host-chat` safe-fails without key | PASS | `{"text":null,"error":"no-tarogo-key"}` |

## Blockers

- Critical blockers: none.
- Non-critical observation: Tarogo response language is model-dependent and can drift from the requested Indonesian prompt. It still satisfies the smoke criterion (responds or fails safely), but should be watched in production copy QA.

## Security Notes

- The configured `TAROGO_API_KEY` is not present in `.output/public`, `.nuxt/dist/client`, or the generated publish URL.
- The server route keeps the key server-side; the no-key route returns a safe JSON error instead of a client error/secret.

## Test Artifacts

- Automated Playwright smoke script: `${PAPERCLIP_RUN_SCRATCH_DIR}/qa_smoke.py` (run-owned scratch; not committed).

