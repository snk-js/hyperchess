# Dev environment from scratch

> **Updated 2026-07-04** after the Option A migration: the external Rust relay is
> retired; WebSockets are served in-process on the same origin as the app. The
> original two-service instructions are preserved in git history and in the
> workspace-level docs snapshot.

## Prerequisites

- Docker (Desktop with WSL2 backend is fine)
- Node 20+ (dev verified on 25; the Docker image pins 20) and pnpm 8
  (`npm i -g pnpm@8` — Node ≥25 no longer bundles corepack)

## Local dev (app native, db in Docker)

```bash
docker compose up -d db        # postgres 16 on host port 5433
cp .env.example .env
pnpm install
npx prisma migrate deploy && npx prisma generate
pnpm dev                       # http://localhost:5173
```

The vite dev server also serves the WebSocket endpoint `/ws/<clientId>` (see the
`hyperchessWs` plugin in [vite.config.ts](../vite.config.ts)), so there is
nothing else to start. `pnpm preview` behaves the same way.

Sanity checks:

```bash
curl -X POST localhost:5173/api/ws -d '{"user_id":"u1","topic":"ROOMS"}'
# → {"message":"success","result":{"url":"ws://localhost:5173/ws/<uuid>", ...}}
docker compose exec db psql -U hyperchessuser -d hyperchess -c '\dt'
```

## Full stack in Docker

```bash
docker compose up --build
# app on :3000 (runs `prisma migrate deploy` on start), db data in the pgdata volume
```

## How the ws endpoint is wired

- [src/lib/server/ws/registry.js](../src/lib/server/ws/registry.js) — in-process
  client/topic registry (globalThis singleton, 60s sweep of never-connected clients).
- [src/lib/server/ws/attach.js](../src/lib/server/ws/attach.js) — `ws`-package
  upgrade handler for `/ws/<clientId>`; attached by vite (dev/preview) and by
  [server.js](../server.js) (production).
- API routes `api/ws`, `api/publish`, `api/add`, `api/remove` call the registry
  directly — no HTTP hop, no CORS, no external service.

## Ports

| Port | What |
|---|---|
| 5173 | vite dev (HTTP + WS) |
| 3000 | production/express (HTTP + WS) |
| 5433 | compose Postgres (host side; 5432 inside the network) |
