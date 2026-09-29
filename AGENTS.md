# Vue SPA Guidance

## Stack and Purpose

- Vue 3 SPA using Vite 7, Pinia, Vue Router, Axios, Tailwind CSS, Laravel Echo, and Pusher JS.
- Consumes the Talk Proposals Laravel API through Sanctum cookie authentication.

## Commands

- Setup: `npm install`
- Development: `npm run dev`
- Production build: `npm run build`
- Tests: `npm test`

## Architecture and Boundaries

- Keep API access in `src/api`, shared state in `src/stores`, routing in `src/router`, and realtime lifecycle logic in `src/composables`.
- Channel names and event names must match the Laravel broadcasting contract exactly.
- Realtime initialization must be idempotent and every listener/channel/timer must have deterministic cleanup.
- Speakers must not subscribe to reviewer/admin-wide channels.

## Change Rules

- Preserve the existing Vue/JavaScript stack, routes, UI, Sanctum flow, and user-facing behavior.
- Do not migrate to TypeScript, add Redis/chat functionality, or redesign unrelated UI.
- Treat `VITE_*` values as browser-visible configuration, while keeping machine-specific `.env` files untracked.
- Never print or commit environment values.

## Verification

- Add focused tests when changing lifecycle or authorization-sensitive client behavior.
- Run the available focused tests, `npm run build`, and `git diff --check`.
- Inspect the repository diff and status before committing.
