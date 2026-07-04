# Architecture proposal

## The core tension

A multiplayer chess game needs an **authoritative server**: something that owns
game state, validates moves, and enforces turns/clocks. Today nothing does —
the Rust relay is a dumb pipe, and all chess rules live in browser TypeScript
(`moves.ts`, `directions.ts`). Whoever validates moves must have the rules, so
the architecture question is really: **where do the rules live, and how many
runtimes must know them?**

## Option A — Unified Node server ⭐ recommended (most feasible)

Fold realtime into the SvelteKit/Node process; retire warp-websockets (or shelve
it until scale demands it).

```
Browser ⇄ HTTPS + WSS ⇄ Node (server.js: SvelteKit handler + `ws` upgrade)
                              │  auth (sessions)      — Postgres
                              │  rooms / games CRUD   — Postgres
                              └  game engine = the SAME moves.ts/directions.ts
```

- `server.js` already exists as a custom Express server — attaching a `ws`
  WebSocketServer to the same HTTP server (`server.on('upgrade', ...)`) is ~50
  lines. Session cookie is validated at upgrade time — auth for free, no CORS,
  one origin, one deploy unit.
- **The killer argument: code reuse.** Move validation is already written in
  TypeScript. Import it server-side and you have server-authoritative chess
  *today*, with zero duplication. Any other option means porting/duplicating the
  rules or compiling them.
- Game state: in-memory `Map<gameId, GameState>` + write-through to Postgres
  (rooms, move list). Restart-safe, single process is plenty for hundreds of
  concurrent games.
- Cost: one fewer language in prod; the Rust repo becomes a learning artifact.
- Risk: none of substance at this project's scale. Node handles chess-move-sized
  messages trivially.

## Option B — Rust becomes the authoritative game server

Grow warp-websockets into rooms + game state + move validation (chess rules in
Rust, e.g. hand-ported since hyperchess has custom rules).

- Pros: performance headroom, type-safe game core, keeps the Rust investment.
- Cons: **rules duplicated** in TS (client prediction/highlights) and Rust
  (authority) — every rule change lands twice; needs auth bridging (Rust must
  validate hyperchess sessions → shared secret/JWT or DB access); warp is in
  maintenance mode → realistically a rewrite on axum + tokio-tungstenite.
- Choose this if the Rust server is itself a goal (learning, portfolio), not for
  feasibility.

## Option C — Shared rules via WASM (the elegant middle)

Write the rules once in Rust as a `hyperchess-core` crate → compile to WASM for
the browser (and optionally for a Node host), native for the Rust server.

- Pros: single source of truth for rules, works with either A or B topology.
- Cons: biggest up-front cost — a full port of existing TS rules, WASM build
  pipeline, bindings. Only worth it if you expect the rules to get complex
  (variants, engines) or want the Rust server long-term.

## Recommendation

**Option A now; keep Option C as the growth path.** You're one developer with
working TS rules, finished auth, and a half-built lobby. Option A is the only
path where "server validates moves" is an import statement instead of a port.
When/if you want Rust back in the loop, extract the rules to a crate (Option C)
rather than duplicating them.

### Target shape (Option A)

```
hyperchess/
├── src/lib/game/           # pure rules: moves.ts, directions.ts (+ vitest)
├── src/lib/server/
│   ├── auth.ts             # session module (post-Lucia)
│   ├── ws/                 # upgrade handler, topic registry, heartbeat
│   └── game/               # authoritative GameManager (uses lib/game)
├── prisma/schema.prisma    # + Room, Game, Move models
└── server.js               # express + sveltekit handler + ws upgrade
```

Message protocol (zod-validated, versioned):

```ts
type ClientMsg = {v:1} & ({type:'join_room', roomId} | {type:'move', gameId, from, to, seq} | {type:'ping'})
type ServerMsg = {v:1} & ({type:'rooms_snapshot'|'room_added'|...} | {type:'move_applied'|'move_rejected', ...} | {type:'pong'})
```

### Deployment (Option A)

One container (app) + Postgres. Compose in prod on any VPS/Fly.io/Railway;
WSS terminated by Caddy/Traefik or the platform. The `docs/docker-compose.yml`
collapses to two services.

## What about scaling later?

Chess is tiny traffic per game. A single Node process + Postgres serves
thousands of concurrent players. The first real scaling step (much later) is
sticky-session horizontal scaling with a Redis pub/sub backplane — and that's
exactly the moment to reconsider a dedicated realtime tier (Option B/C), with
data to justify it.
