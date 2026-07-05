# Improvement plan

Ordered by leverage: each tier unblocks the next. Items marked 🔴 are the ones
I'd do first.

## Tier 0 — unbreak deployability (hours)

- 🔴 Replace hardcoded `localhost:8000` / `127.0.0.1` with env vars on both
  sides; bind warp to `0.0.0.0`; fix `EXPOSE 8080→8000`; base image
  `buster-slim → bookworm-slim` (details in [04-dev-setup-from-scratch.md](04-dev-setup-from-scratch.md)).
- 🔴 Commit an `.env.example` to hyperchess (see `docs/env.example`).
- 🔴 Adopt the docker-compose file; delete/rewrite `postgres.md` around it.
- Remove the `NODE_ENV==='development' → adapter-static` conditional in
  `svelte.config.js`; keep adapter-node. Move the static demo to a separate
  build config if you still want gh-pages.
- Pin docker images (`node:20-slim` instead of `node:latest`; `rust:1.79`).
- `git remote remove hyperchess` in warp-websockets (leftover remote that
  pollutes `git log --all`).

## Tier 1 — finish the multiplayer core (the actual missing feature)

- ✅ **Room listing snapshot** (done, feat/room-persistence): `room` table via
  Prisma, `GET /api/rooms` snapshot served in the lobby's server load, and
  `POST /api/rooms` / `DELETE /api/rooms/[id]` persist and broadcast
  `room_added` / `room_removed` deltas on the ROOMS topic (fan-out via the
  in-process registry, no HTTP hop). Zod-validated payload; owner identity from
  the session; one open room per owner. Covered by unit + e2e tests.
- 🔴 **MATCH flow**: joining a room creates a match topic (`MATCH:<roomId>`),
  both players subscribe, and *moves* are published as structured messages
  (`{type:'move', from, to, piece, seq}`). The client stores/`moves.ts` already
  compute legality — wire them to incoming messages.
- **Server-side move validation** (README's own TODO): see architecture doc for
  where this logic should live.
- Fix `user_id` type: `String` end-to-end; delete `getDigitsFromString`.
- Single registration path (drop the server-load registration or the client one).
- Define a versioned message schema with zod (already a dependency) and a Rust
  mirror (serde) — stop double-JSON-encoding `message`.
- Reconnect + heartbeat: client-side exponential backoff; actually send the
  `"ping"` the server already tolerates; TTL-sweep dangling clients in warp.

## Tier 2 — auth & security hardening

- 🔴 **Migrate off Lucia v2** (deprecated upstream). Given the schema is only 3
  tables, the cheapest durable path is Lucia's own "roll your own" guidance:
  a ~200-line session module over Prisma. Alternatives: Better Auth (batteries
  included), or Auth.js if you ever want OAuth providers. Keep the same
  `auth_user` table, re-hash passwords on first login if changing hash formats.
  - ⚠️ Known trap surfaced during room-persistence work: the config sets the
    Lucia **v1** option `transformDatabaseUser`, which v2 ignores in favour of
    `getUserAttributes`. So `session.user` only carries `userId` — `username`
    and `name` are `undefined`. Server code must re-fetch the user from Prisma
    (as the lobby load and the room service do). Fix when migrating.
- Remove the manual `secure: false` session cookie in `login/+page.server.ts`
  (it's even commented "prod: disable this").
- Re-enable CSRF (`csrf.checkOrigin`) and drop wildcard CORS in `hooks.server.ts`
  + `server.js` — with everything behind one origin (see architecture doc) you
  won't need CORS at all.
- Protect the warp endpoints: at minimum a shared-secret header checked on
  `/register`, `/publish`, `/add_topic`, `/remove_topic` (only SvelteKit should
  call them); the browser-facing part is only `/ws/<uuid>`, which is fine since
  uuids are unguessable — *if* registration is gated.
- Rate limiting on signup/login and publish.
- Turn off Lucia `debugMode`, strip `console.log`s of sessions/keys (they leak
  into server logs).

## Tier 3 — stack refresh (you mentioned Svelte <5 deliberately)

- Svelte 4 → 5 (runes) + SvelteKit 1 → 2 + Vite 5/6. Mechanical for most of the
  codebase; Threlte needs the v8 upgrade for Svelte 5 support (`@threlte/core@8`,
  three ≥ 0.16x). Do this *after* Tier 1 so you're migrating a working game.
- Prisma 5 → 6 (or consider Drizzle if you want lighter cold starts).
- Rust deps bump (tokio/warp current), or swap warp → axum if you grow the
  server (warp is in maintenance mode; axum is where the ecosystem went).
- ESLint 8 + `.eslintrc.cjs` → ESLint 9 flat config; Prettier 2 → 3.

## Tier 4 — quality infrastructure

- Tests: `vitest` for move logic (`moves.ts`/`directions.ts` are pure functions
  begging for unit tests); `cargo test` for handler logic; one Playwright smoke
  (signup → create room → see room in second browser).
- CI per repo (see [07-cicd-and-repo-strategy.md](07-cicd-and-repo-strategy.md)).
- `scene-transformed.glb` (4.5 MB) at the repo root: move under `static/models/`
  or Git LFS; it currently ships in every clone and docker build context.
- Structured logging: `pino` (Node) / `tracing` (Rust).
- Healthchecks: `/healthcheck` exists in server.js; add DB ping to it.

## Tier 5 — game features (once multiplayer works)

- Persist finished games (move list) → replay/analysis.
- Ratings (Glicko-2) — `rating` fields already exist in the UI types.
- Spectators = extra subscribers on the match topic (the pub/sub model already
  supports this nicely).
- Clocks: server-authoritative time control (`time` field already in RoomPayload).
- Matchmaking queue as an alternative to the room table.
