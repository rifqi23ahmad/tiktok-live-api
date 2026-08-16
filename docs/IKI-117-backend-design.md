# IKI-117 — Stream Studio Saved Layouts + Short Publish URL: Backend Design

**Owner:** Backend Lead
**Issue:** IKI-117
**Parent:** IKI-107
**Date:** 2026-08-15
**Status:** Design ready for implementation

## 1. Goal

Replace the current `?config=<base64 JSON>` publish flow with server-side layout storage keyed by a short ID. Published overlays become `/overlay/:id` (plus `?token=...` for private layouts). Demo layouts remain public and login-free. Secrets never enter the layout payload or the publish URL.

## 2. Storage

Use a file-backed Nitro server store for local/self-host. No browser `localStorage` as source of truth.

- Location: `stream-studio/.data/layouts/layouts.json` (already gitignored by `stream-studio/.gitignore`).
- Override: `LAYOUT_STORAGE_DIR` env var, e.g. `/var/lib/stream-studio/layouts`.
- Shape: a single JSON object keyed by layout ID. Low concurrency, single-process local server. Writes are serialized by an in-process promise queue and written atomically with temp file + `rename`.
- Every record stores only non-secret layout data:

```ts
interface StoredLayout {
  id: string
  ownerTokenHash: string
  name: string
  username: string
  demo: boolean
  published: boolean
  instances: LayoutWidget[]
  createdAt: string
  updatedAt: string
}

interface LayoutWidget {
  id: string
  type: WidgetType
  x: number
  y: number
  w: number
  h: number
  props: Record<string, unknown>
}
```

Secrets explicitly forbidden in `instances[].props`, top-level fields, or returned API payloads: `apiKey`, `apikey`, `key`, `secret`, `token`, `authorization`, `password`, `credential`, `accessKey`, `secretKey`, `TAROGO_API_KEY`, and any key whose value looks like a bearer/`sk-` credential.

## 3. Ownership model

- Server generates `ownerToken` = 32 random bytes, base64url-encoded.
- Store only `sha256(ownerToken)` with `timingSafeEqual` comparisons.
- `demo: true` layouts are public: `GET` and `/overlay/:id` work without a token.
- `demo: false` layouts are private: `GET`, `/overlay/:id`, `PUT`, `PATCH`, `DELETE`, `publish`, and `duplicate` require a valid owner token.
- Client keeps `ownerToken` in `localStorage` only as an auth credential. Layout data itself is fetched from and saved to the server.

## 4. API contract

All routes live under `stream-studio/server/api/layouts`.

| Method | Path | Purpose | Auth |
| --- | --- | --- | --- |
| POST | `/api/layouts` | Create layout | none; returns new `ownerToken` |
| GET | `/api/layouts` | List summaries | optional token; returns public layouts + owned private layouts |
| GET | `/api/layouts/:id` | Get full sanitized layout | token required for private |
| PUT | `/api/layouts/:id` | Save full layout | token required |
| PATCH | `/api/layouts/:id` | Rename / partial metadata update | token required |
| POST | `/api/layouts/:id/duplicate` | Duplicate layout | token required for private source |
| DELETE | `/api/layouts/:id` | Delete layout | token required |
| POST | `/api/layouts/:id/publish` | Mark published and return short URL | token required |

Token transport: `x-layout-token` header. Overlay GET may also accept `?token=` so a browser-source URL can carry only the owner token, never layout data.

Response envelope:

```json
{ "layout": { "id": "...", "name": "...", "username": "...", "demo": true, "published": true, "instances": [...] } }
```

Create/duplicate additionally return `ownerToken` once:

```json
{ "layout": { ... }, "ownerToken": "..." }
```

Publish returns:

```json
{ "id": "...", "url": "/overlay/<id>", "token": "<only for private layouts>" }
```

## 5. Validation / sanitization

Server-side `sanitizeLayoutInput` is the single gate for create/save/duplicate.

- Reject bodies over 256 KB, non-object JSON, and non-array `instances`.
- Top-level whitelist: `name`, `username`, `demo`, `instances`.
- `instances` max 100 widgets.
- `type` must be one of the 10 registered widget types.
- `x`, `y`, `w`, `h` must be finite numbers; clamp `x/y` to `0..100`, `w/h` to `1..100`.
- `props` must be a plain JSON object. Recursively allow only string/number/boolean/null/plain array/plain object, max depth 8, max 200 keys total.
- Reject 400 when any forbidden secret key is present. Strip `__proto__`, `constructor`, and `prototype` keys.
- IDs are generated server-side from `crypto.randomUUID()`. Client-provided IDs are ignored/regenerated.
- Returned `layout` objects always pass through `toPublicLayout`, which omits `ownerTokenHash` and any unknown/secret field.

## 6. Frontend integration

- Add `app/composables/useLayouts.ts`:
  - Persist `ownerToken` in `localStorage` (`stream-studio.ownerToken`).
  - Wrap `$fetch` calls for create/list/get/save/rename/duplicate/delete/publish.
  - Export `layoutToPublishPayload(instances, username, demo)` that maps builder state to the sanitized non-secret payload.
- Extract current `app/pages/overlay.vue` rendering into `app/components/overlay/OverlayStage.vue`.
- Add `app/pages/overlay/[id].vue`:
  - Fetch `/api/layouts/:id` using `?token=` from route query.
  - Render `OverlayStage` from persisted data.
  - Demo layout (`demo: true`) calls `startDemo()`.
  - Private layout calls `connect()` using the deployment TikTool key from `useRuntimeConfig().public.tiktool.apiKey`; do not read any key from the URL or saved layout.
- Keep `app/pages/overlay.vue` only as a legacy `?config=` compatibility route, delegating to the same `OverlayStage`.
- Update `BuilderToolbar.vue` Publish to create/save a server layout, then show `/overlay/:id` (with `?token=...` when private) instead of the base64 config URL.

## 7. Verification

- `npm --prefix stream-studio run build`
- `npx --prefix stream-studio nuxi typecheck` if available.
- Manual smoke:
  1. Start dev server, create a demo layout through Publish.
  2. Open returned `/overlay/:id` with no token; overlay renders and demo events flow.
  3. Create a private layout; open without token -> 404/401; with `?token=` -> renders.
  4. Confirm `TAROGO_API_KEY`, `apiKey`, and `sk-*` strings are absent from `/api/layouts` responses, generated URLs, and `.output/public`.
