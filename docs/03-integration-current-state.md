# How the two services integrate today (and where it breaks)

```
┌───────────┐   HTTP (form actions,     ┌──────────────────┐
│  Browser  │──── pages, /api/*) ──────▶│ SvelteKit (3000) │
│           │                           │  - Lucia auth    │──── Prisma ───▶ PostgreSQL
│           │                           │  - proxies to WS │                (auth_* tables)
│           │                           └────────┬─────────┘
│           │                                    │ HTTP: /register, /publish,
│           │                                    │ /add_topic, /remove_topic
│           │                           ┌────────▼─────────┐
│           │◀━━ WebSocket ws://…/ws/id━│  warp-websockets │  (in-memory only)
└───────────┘                           │      (8000)      │
                                        └──────────────────┘
```

- The **browser never talks to the Rust server over HTTP** — SvelteKit API routes
  proxy registration/publish/topic calls. But the **WebSocket itself is dialed
  directly** by the browser using the URL the Rust server returns.
- Postgres is only used for auth (users/sessions/keys). Rooms and games live
  purely in the Rust server's RAM and in Svelte stores.

## Contract between the two

| hyperchess side | warp side |
|---|---|
| `api/ws/+server.ts` → `POST localhost:8000/register` `{user_id: number, topic}` | `register_handler` → `{url: "ws://127.0.0.1:8000/ws/<uuid>"}` |
| `api/publish/+server.ts` → `POST /publish` `{topic, user_id?, message: string}` | fan-out to topic subscribers |
| `api/add` / `api/remove` → `/add_topic`, `/remove_topic` `{client_id, topic}` | mutate topic list |
| browser `new WebSocket(url)` | `ws_handler` + `client_connection` |
| message payloads: `RoomPayloadMessage {payload, topic, sender}` as JSON string | opaque `message` string, not inspected |

## Integration defects (ranked)

1. **Hardcoded endpoints both ways** — `http://localhost:8000` in four SvelteKit
   routes; `ws://127.0.0.1:8000` baked into the Rust register response. Neither
   service can be containerized or deployed without code changes. Fix: env vars
   (`WS_SERVER_INTERNAL_URL` for SvelteKit→Rust, `PUBLIC_WS_URL` for the browser)
   and have the register response return only the uuid.
2. **Loopback bind in Rust** (`127.0.0.1:8000`) — blocks container-to-container
   traffic entirely.
3. **user_id impedance mismatch** — Postgres/Lucia uses UUID strings; Rust wants
   `usize`; `getDigitsFromString` bridges them lossily (collisions possible,
   random fallback).
4. **Double registration** — page server load registers a client, then the
   browser registers again through `registerClient()`; the first uuid is orphaned
   in the Rust map (no TTL cleanup).
5. **No shared trust** — the Rust server accepts anything; hyperchess sessions
   are never verified there. Any client can publish fake rooms/moves.
6. **No schema for messages** — `message` is a double-JSON-encoded string; no
   versioning, no validation (zod is a dependency but unused here).
7. **No reconnect/heartbeat protocol** — client sends nothing periodically;
   the Rust side special-cases the literal string `"ping"` but nobody sends it.
8. **Rooms are not persisted** — a lobby exists only while sockets are open;
   refresh loses everything; two users see different lobbies depending on join
   order (rooms are only pushed on publish, there's no "list rooms" snapshot on
   join).

Item 8 is arguably the biggest *functional* gap for finishing the game: a new
lobby visitor has no way to fetch existing rooms — they only see rooms created
*after* they connected.
