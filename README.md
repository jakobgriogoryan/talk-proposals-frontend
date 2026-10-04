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

The Vite configuration explicitly allows `talkproposals.test` and reserves port
5173 instead of silently switching ports. Without logging in, domain health
checks should return `200` for `/login`, `204` for `/sanctum/csrf-cookie`, and
JSON `401` for `/api/user`.

### Compile and Minify for Production

```sh
npm run build
```
