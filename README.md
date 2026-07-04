# hyperchess

3D multiplayer chess — SvelteKit + Threlte (Three.js), Lucia auth over Postgres/Prisma,
and an in-process WebSocket pub/sub for rooms/matches (same origin as the app; the
former external Rust relay lives in [ws-server/](ws-server/), deprecated).

Full analysis, architecture and roadmap: [docs/](docs/README.md).

[localhost-5173 (1).webm](https://github.com/snk-js/hyperchess/assets/34718184/eb851a8d-d12c-4477-8984-bc07f4f4de6b)

## Quickstart (dev)

```bash
# 1. database (host port 5433)
docker compose up -d db

# 2. env + deps + schema
cp .env.example .env
pnpm install
npx prisma migrate deploy && npx prisma generate

# 3. run
pnpm dev            # http://localhost:5173 (ws served on the same origin)
```

## Full stack in Docker

```bash
docker compose up --build     # app on :3000 (self-migrating), db on :5433
```

## Current state

- ✅ Auth (signup/login/logout), rooms lobby broadcast over `/ws/<clientId>`
- 🚧 Match move sync + server-side move validation — next up (docs/05, Tier 1)
- Piece replacement instability from the original prototype still applies

## Scripts

- `pnpm dev` / `pnpm build` / `pnpm preview` — vite; preview also serves the ws endpoint
- `pnpm check` / `pnpm lint` — svelte-check / prettier+eslint
- `pnpm model-pipeline:run` — GLB → Threlte components
