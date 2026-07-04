# warp-websockets — repository analysis

*Analyzed 2026-07-04, at commit `de45a99` ("add get topics by user_id route", 2023-12-03), branch `main`, remote `git@github.com:snk-js/warp-websockets.git`.*

## What it is

A small **Rust pub/sub WebSocket relay** (277 lines across 3 files) built on
**warp 0.3 + tokio 1**. It is a fork/adaptation of Mario Zupan's
`warp-websockets-example` (the upstream author is still in `Cargo.toml` and the
2020–2022 commits are his); your commits (Nov–Dec 2023) added topic management
routes for the hyperchess lobby.

## History

- 2020–2022 (upstream): original example, RwLock refactor, dependency bumps.
- `dabfb95` 2023-11-04 — "update to production requirements" (dockerfile, etc.).
- `d665357` 2023-11-17 — add `/add_topic`, `/remove_topic`.
- `de45a99` 2023-12-03 — add `POST /topics` (get topics by user_id). **HEAD.**

Note: the local clone has the **hyperchess repo added as a second remote**
(`hyperchess → git@github.com:snk-js/hyperchess.git`), which makes `git log --all`
show both histories interleaved. Probably left over from an integration
experiment; safe to remove (`git remote remove hyperchess`).

## Architecture

State is a single in-memory map, no persistence:

```rust
type Clients = Arc<RwLock<HashMap<String /* client uuid */, Client>>>;
pub struct Client {
    pub user_id: usize,
    pub topics: Vec<String>,
    pub sender: Option<UnboundedSender<Result<Message, warp::Error>>>,
}
```

### HTTP/WS API

| Route | Method | Purpose |
|---|---|---|
| `/health` | GET | 200 OK |
| `/register` | POST `{user_id, topic}` | Creates client uuid, returns `{"url": "ws://127.0.0.1:8000/ws/<uuid>"}` |
| `/register/{id}` | DELETE | Unregister client |
| `/ws/{id}` | WS upgrade | Connects the socket, stores sender; incoming JSON `{topics: [...]}` replaces the client's topic list; `"ping"` ignored |
| `/publish` | POST `{topic, user_id?, message}` | Fan-out `message` to clients subscribed to `topic` (optionally filtered by user_id) |
| `/add_topic` | POST `{client_id, topic}` | Append topic |
| `/remove_topic` | DELETE `{client_id, topic}` | Remove topic |
| `/topics` | POST `{user_id}` | List topics across that user's clients |

CORS: `allow_any_origin()`.

## Issues found

1. **Binds to loopback**: `warp::serve(routes).run(([127, 0, 0, 1], 8000))` —
   inside a container this is unreachable from other containers *and* from the
   host. Must become `0.0.0.0` (ideally env-configurable) for any Docker use.
2. **Dockerfile port mismatch**: `EXPOSE 8080` but the server listens on **8000**.
   Also `debian:buster-slim` is EOL (no security updates since mid-2024) and the
   build stage runs `make` (debug/`build` target compiles `--release`, fine, but
   there's no dependency-layer caching, so every build recompiles everything).
3. **Hardcoded WS URL in the register response** (`ws://127.0.0.1:8000/ws/…`) —
   the *server* decides what hostname the *browser* should dial. Breaks the moment
   the service isn't on the client's own machine. Should be derived from an env
   var (public URL) or built client-side from the returned uuid only.
4. **No authentication/authorization at all** — anyone who can reach the port can
   register, publish to any topic, or enumerate a user's topics. Fine on
   localhost, unacceptable exposed. At minimum: shared secret between SvelteKit
   and this service; ideally validate hyperchess session tokens.
5. **`user_id: usize`** forces the hyperchess side into the lossy
   `getDigitsFromString(uuid)` hack. Should be a `String` (the actual auth user id).
6. **Clients leak** if registered but the WS is never opened (hyperchess's
   server-side load registers once, the browser registers again). No TTL/sweep.
7. **Unbounded channels** (`mpsc::unbounded_channel`) — a slow client can grow
   memory without bound.
8. `client_msg` replaces the **entire** topic list from any raw WS message —
   overlaps confusingly with `/add_topic`/`remove_topic` HTTP routes.
9. No tests (Makefile has a `test` target but `src` has none), no CI, no logging
   framework (bare `println!`/`eprintln!`).
10. Old dependencies (tokio 1.19, warp 0.3, rust 1.73 in docker) — fine
    functionally, but worth a bump pass.

## Verdict

It does its job as a **dumb topic relay** for local development and is pleasantly
small. But it has no persistence, no auth, and no knowledge of chess — all game
correctness currently depends on trusting every client. Whether to grow this into
a real authoritative game server or fold realtime into the Node process is the
central architecture decision — see [06-architecture-proposal.md](06-architecture-proposal.md).
