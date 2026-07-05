# hyperchess — repository analysis

*Analyzed 2026-07-04, at commit `a6d592d` ("organize websocket utils and listeners", 2024-03-11), branch `master`, remote `git@github.com:snk-js/hyperchess.git`.*

## What it is

A 3D chess game built with **SvelteKit 1 / Svelte 4** (not Svelte 5), rendered with
**Threlte 7** (Three.js for Svelte) plus Rapier physics, `postprocessing` effects
(glow/glitch), Tailwind + Skeleton UI. It has working local gameplay, a full
username/password auth flow, and a partially-finished multiplayer lobby ("rooms")
that talks to the separate `warp-websockets` Rust server.

## Stack summary

| Layer | Technology |
|---|---|
| Framework | SvelteKit `^1.27`, Svelte `^4.2`, Vite 4, TypeScript 5 |
| 3D | Threlte 7 (`@threlte/core`, `extras`, `rapier`, `theatre`), three `0.153`, postprocessing |
| UI | Tailwind 3, Skeleton labs, svelte-loading-spinners |
| Auth | **Lucia v2** + `@lucia-auth/adapter-prisma` |
| DB | PostgreSQL via **Prisma 5** |
| Prod server | `server.js` — Express wrapping the adapter-node build, port **3000** |
| Package manager | pnpm (`engine-strict=true` in .npmrc) |

## Development timeline (from git history)

1. **Aug–Sep 2023** — core game: board as writable cells (perf refactor), piece
   moves (bishop/knight fixes), hover/highlight, glow effects, gh-pages static deploy.
2. **Oct 2023** — switch to pnpm, Tailwind, WebSocket API skeleton; **Prisma +
   Lucia auth added and finished** (`641bbe7` schema → `bab825b` "finish lucia auth").
3. **Nov 2023** — rooms: Redis tried and **removed** (`31cf487` → `40c72ab`),
   replaced by direct WebSocket connection to the Rust server; create-room via
   server actions; production build adjustments (dockerfile era).
4. **Dec 2023** — loading states, waiting-for-player UI, camera smoothing,
   infinite room-creation bugfix.
5. **Feb–Mar 2024** — multiplayer sync push: session ids, user syncing
   ("nice progress on syncing users"), topic-based pub/sub API, ws utils
   reorganization. **Work stops mid-feature here.**

Branches `feature/lucia-auth` and `feature/integrate-websocket-with-rust-server`
are both fully merged into `master` (no unmerged commits). `gh-pages` holds the old
static demo deploy. Working tree is clean.

## Auth (done ✅)

- Schema: `auth_user`, `auth_session`, `auth_key` (classic Lucia v2 trio), one
  migration `20231023160407_init`. Postgres connection via `DATABASE_URL` env.
- `src/lib/server/lucia.ts` — Lucia configured with the Prisma adapter,
  `debugMode: true` still on.
- `src/hooks.server.ts` — attaches `locals.auth` per request; also appends
  permissive CORS headers (`*`) on `/api` routes.
- `signup/+page.server.ts` — creates user + key (`username` provider) + session.
- `login/+page.server.ts` — `auth.useKey('username', ...)`, creates session and
  **manually sets a second `auth_session` cookie with `secure: false`** (commented
  "prod: disable this").
- `api/logout/+server.ts` — invalidates the session.
- `postgres.md` — manual local Postgres bootstrap notes (has a typo: `pqsl`;
  and mixes placeholder names `myuser`/`hyperchessuser`).

⚠️ **Lucia is deprecated upstream — the whole library, v2 *and* v3** (it's now a
"learning resource," per <https://lucia-auth.com/lucia-v3/migrate>). Upgrading to
v3 is a dead end; the official path is a small roll-your-own session module. See
the Tier 2 plan in [05-improvement-plan.md](05-improvement-plan.md).

## Multiplayer / rooms (half-done 🚧)

Flow as implemented today:

1. `+page.server.ts` load: validates session, fetches user from Prisma, then
   **server-side** calls `api/ws` → Rust `/register` with
   `user_id = getDigitsFromString(uuid)` and topic `ROOMS`, returning `wsUrl` +
   `clientId` to the page.
2. `+page.svelte` calls `registerClient('ROOMS', roomsEventHandler, user)` which
   registers **again** from the browser and opens the WebSocket to the returned
   `ws://127.0.0.1:8000/ws/<client_id>` URL.
3. Creating a room: form action builds a `RoomPayload` (id = `Date.now()`),
   then the client publishes it on topic `ROOMS` via `api/publish` →
   Rust `/publish`; all subscribed clients add the room to their table.
4. `api/add` / `api/remove` proxy `add_topic`/`remove_topic` — used to join/leave
   a `MATCH`-style topic.
5. `roomsEventHandler` adds rooms to the store and flips the sender into
   `playing: true`.

What's missing / broken:

- **No actual game-move sync**: topics exist (`'ROOMS' | 'MATCH' | string`) but
  there is no handler wiring board moves over the `MATCH` topic; the Feb–Mar 2024
  commits were mid-way through this.
- **Rooms are ephemeral & in-memory only** — a page refresh loses the lobby; no
  persistence of rooms or games in Postgres (only auth tables exist).
- `getDigitsFromString(uuid)` maps user UUIDs to a number by stripping
  non-digits — collision-prone and lossy; falls back to `Math.random()` when empty.
- Rust server URL `http://localhost:8000` is **hardcoded in 4 API route files**
  (`api/ws`, `api/publish`, `api/add`, `api/remove`).
- No server-side move validation (explicitly listed as TODO in the README).
- Double registration (server load + client) can leak dangling clients in the
  Rust server's map.

## Game engine notes

- Board logic lives client-side: `src/lib/utils/moves.ts` (99 lines),
  `directions.ts` (133 lines), stores `cellStates`, `turn`, `main`.
- Pieces are individual Svelte components per color/type under
  `components/piece/pieceClasses/`.
- `scene-transformed.glb` (**4.5 MB**) sits in the repo root; `scripts/model-pipeline.js`
  converts GLB → Threlte components via `@threlte/gltf`.
- README's own status: "piece replacement is instable", "needs websockets to
  connect two players", "needs to validate move on the server".

## Build & deploy artifacts

- `dockerfile` — two-stage Node build: pnpm install → `prisma generate` →
  `vite build`, runtime = build output + prod deps + `server.js`, `EXPOSE 3000`.
  Works, but uses `node:latest` (unpinned) and doesn't run migrations.
- `server.js` — Express + wildcard CORS + `/healthcheck` + SvelteKit handler.
- `svelte.config.js` — **adapter is inverted-looking**: `NODE_ENV === 'development'`
  → `adapter-static`, otherwise `adapter-node`. This was for the gh-pages static
  demo; confusing and worth cleaning up. Also `csrf.checkOrigin: false`.
- `.github/workflows/static.yml` — GitHub Pages deploy, triggers only on the
  `gh-pages` branch (legacy static demo, pre-auth).
- **No `.env.example`** — `DATABASE_URL` is the only required var but is
  undocumented outside `postgres.md`.
- No tests of any kind, no CI for lint/check.
