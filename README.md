# talk-proposals-frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

### Default theme

Set `VITE_DEFAULT_THEME=light` or `VITE_DEFAULT_THEME=dark` in the frontend `.env`.
Missing or invalid values fall back to light. This controls the default only:
a saved browser preference takes priority, and the theme toggle still works.
An invalid saved preference uses the environment default.

Restart Vite after changing `.env`; production deployments require a new build.
This is public frontend configuration, not a Laravel backend setting.

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Local domain development

Open `http://talkproposals.test` through local Nginx while Laravel runs on
`127.0.0.1:8000` and Vite runs on `127.0.0.1:5173` in separate terminals.
Both processes must stay running; this setup serves the current source with
hot reload, not an older `dist` build.

Nginx must route `/api` and `/sanctum` to Laravel, and all other requests to
Vite, preserving the browser's `Host` and forwarding WebSocket upgrades for
hot reload. The optional `api.talkproposals.test` host should also route to
Laravel. Map both domain names to `127.0.0.1` in the local hosts file.

Configure Laravel's stateful domains to include `talkproposals.test` and
`api.talkproposals.test`, its session cookie domain to `.talkproposals.test`,
and disable secure-only cookies for this HTTP-only local setup. Clear Laravel's
configuration cache after changing local configuration. Do not mix this cookie
setup with browsing the frontend through `127.0.0.1:5173`.

Set `DEV_ALLOWED_HOSTS=talkproposals.test` in the frontend `.env` for this local
domain. A clean checkout has no machine-specific allowed host. `DEV_PORT` defaults
to 5173 and reserves it instead of silently switching ports; `DEV_API_TARGET`
defaults to `http://localhost:8000` for `/api` and `/sanctum`. Custom HTTPS targets
must have a trusted certificate (TLS verification is not disabled). These `DEV_*`
settings configure Vite only and are not exposed in the browser bundle.
Set the backend's `CORS_ALLOWED_ORIGINS` to the browser origins you actually use
when developing across origins. Without logging in, domain health
checks should return `200` for `/login`, `204` for `/sanctum/csrf-cookie`, and
JSON `401` for `/api/user`.

### Compile and Minify for Production

```sh
npm run build
```

### Shared dropdowns and workflow checks

`AppSelect` provides consistent native single-select controls for roles, proposal
statuses, and review ratings. It preserves numeric option values, native keyboard
behavior, labels, validation states, and light/dark colors. `TagMultiSelect` owns
search and dismissal behavior and emits new selection arrays instead of mutating
parent state.

Proposal submissions omit absent PDF uploads and optional tags. Editing with no
tags sends the explicit multipart empty-list marker; omitting tags preserves the
existing selection. CSRF preparation failures stop mutations, and a 419 response
can trigger at most one recovery attempt. Proposal detail requests discard stale
responses after navigation or unmount.

Run `npm test` and `npm run build`. Manual browser checks:

- Check status, rating, registration role, and tag controls in both themes and at mobile widths; labels and arrows must not overlap text.
- Open tags, search, select with keyboard, press Escape, and click outside. Escape restores focus to the trigger; Tab can leave the picker.
- Submit without a PDF, edit a proposal to remove all tags, and navigate between proposals while requests are pending.
- With a persistently invalid CSRF session, confirm one retry and one terminal notification, not an endless request loop.

### Response caching

`src/api/cache.js` centralizes cached GET requests and successful mutation
invalidation. Proposal mutations invalidate all proposal views; review mutations
also invalidate proposal ratings and matching review pages. Failed mutations
leave valid cache entries intact. A cache generation prevents requests that began
before invalidation from storing outdated responses after they finish.

Authentication identity or role changes and logout clear cached responses. An
unchanged user refresh retains them. Cache getters are read-only and expire entries
at the exact TTL boundary; `clearExpired()` removes expired entries explicitly.
Coverage lives in `tests/apiCache.test.js`.

### Authentication initialization

`fetchUser()` shares one in-flight request per auth store. Concurrent callers
receive the same success or failure without polling timers, and failures do not
prevent a later retry. User checks started before a login/logout or identity
change cannot overwrite the current session. The router guard awaits this shared
request without an arbitrary timer cutoff, then applies existing guest/role
restrictions. Tests: `tests/authInitialization.test.js`.

### Workflow regression safeguards

API requests retain their originating authentication session version through CSRF
retries. A delayed `401` from an older session cannot clear a fresh login, and a
scheduled login redirect is discarded when the session changes. Speaker, reviewer,
and admin lists apply only the latest request's results and loading state.

Realtime events invalidate proposal and matching review caches before consumers
refresh. Status events reload the authoritative filtered list instead of merging
partial broadcast payloads; the top-rated slider refreshes on proposal events and
cleans up its listeners, requests, and timers on unmount.

Both proposal details and the edit form download PDFs through the authenticated
API via `src/utils/proposalDownload.js`. Resource `file_path` values are not used
as direct browser links. Blob error responses are displayed rather than downloaded,
and temporary object URLs are released even when a browser download fails.

Regression tests: `tests/csrfRetry.test.js`, `tests/proposalListRequests.test.js`,
`tests/useRealtime.test.js`, `tests/topRatedRealtime.test.js`, and
`tests/proposalDownloads.test.js`.

### Review and maintainability safeguards

`useProposalList` owns shared filter serialization, pagination and latest-request
state; role-specific views inject their existing API methods. Editing observes
route changes and ignores stale loads and saves, including after unmount.

Review ratings come from the API, not an invented fallback. Failed option loads
disable submission and provide Retry. Rejected PDFs block submission until the
selection is corrected or explicitly cleared. The PDF limit is a named client
mirror of the backend contract, not a deployment environment setting.

Without `VITE_PUSHER_APP_KEY`, Echo uses its native null broadcaster and opens no
Pusher connection. Set the public key and cluster to enable realtime; never put
the Pusher secret in a `VITE_*` variable. Admin status mutations refresh filtered
results even when realtime is unavailable. Notification timers are cancelled on
removal, clearing and store disposal. Themes still work when localStorage is blocked.

Frontend tests exist under `tests/` and use Vitest with a Vue custom renderer.
Run `npm test` for unit/component regressions and `npm run build` for compilation.
These are not browser end-to-end tests; keep the manual checks above for native
file dialogs, downloads and dropdown behavior.

## Continuous integration and quality checks

`.github/workflows/ci.yml` runs on pull requests, pushes to `main`, and manual
dispatch. The `Frontend quality` check uses Node 22, locked dependencies and no
private environment values or running backend. Use Node 22.13+ locally (or a
compatible version listed in `package.json`) for ESLint 10.

```sh
npm ci
npm run lint
npm test
npm run build
npm audit --omit=dev --audit-level=high
```

ESLint checks JavaScript and Vue correctness, including tests and configuration;
warnings fail CI. `npm run lint:fix` applies supported automatic fixes. Component
names retain the existing route-based convention; formatting-only Vue rules are
not enabled. Tests are unit/component regressions, not browser end-to-end tests.

Actions are pinned to verified release commits, credentials are not persisted,
and permissions are read-only. Checks continue after an earlier check fails,
without suppressing job failures. After publishing, configure branch protection
to require `Frontend quality`. No branch protection changes or deployment are
performed by this workflow.

The security gate covers production dependencies. A full `npm audit` currently
also reports a build-tool advisory through Tailwind 3's `braces` dependency
([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)).
Do not run `npm audit fix --force`: npm proposes a Tailwind 4 migration that can
break the current styling. Resolving the development dependency advisory needs
a separately verified tooling update; this is not a claim that the full dependency
tree is advisory-free. Automatic deployment is deferred until a target and
rollback strategy are agreed.
