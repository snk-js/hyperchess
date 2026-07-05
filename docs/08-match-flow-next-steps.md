# MATCH flow — status & next steps

*Branch `feat/match-flow` (stacked on `feat/game-rules` → `feat/room-persistence`).
Server core is done and tested; the client 3D wiring is the remaining work.*

## Done (server core — verified)

Server-authoritative match with turns, colours, captures, and king-capture win.

- **`game` table** (`prisma/schema.prisma` + migration `20260705165733_add_game`):
  `id, roomId, whitePlayerId, blackPlayerId, board (Json), turn, status,
  winnerId, moves (Json), timestamps`. Applied to the dev DB.
- **`src/lib/server/game/logic.ts`** (pure): `assignColors` and `decideMove`
  (enforces turn order, piece ownership, legality via `$lib/game/rules`, capture
  detection, king-capture → win). 9 unit tests.
- **`src/lib/server/game/service.ts`** (DB + broadcast): `joinRoom`
  (creates the game, closes the room, announces `game_started` on ROOMS),
  `getGame`, `applyPlayerMove` (validates, persists, broadcasts `move_applied`
  on `MATCH:<gameId>`).
- **Routes**: `POST /api/rooms/[id]/join`, `GET /api/games/[id]`,
  `POST /api/games/[id]/move`.
- **Protocol** (`src/lib/async/websockets/types.ts`): `RoomDelta` gains
  `game_started`; new `MatchDelta` (`move_applied`).
- **e2e verified** (two logged-in players over HTTP + WS): create → join →
  both get `game_started` → subscribe `MATCH:<id>` → white moves (both receive
  `move_applied`, turn flips) → out-of-turn / opponent-piece / illegal all
  rejected (409) → participant GET ok, unauth 401.

### Move protocol (as built)

```
Owner creates room (picks side) ──▶ ROOMS: room_added
Joiner POST /api/rooms/:id/join  ──▶ ROOMS: room_removed + game_started {game}
  both clients then POST /api/add {client_id, topic:"MATCH:<gameId>"}
Player POST /api/games/:id/move {from:[x,y,z], to:[x,y,z]}
  server validates ──▶ MATCH:<gameId>: move_applied {from,to,turn,board,status,winnerId,captured}
```

## Next steps (client 3D wiring — NOT started)

This is the part that needs the running app + human eyes (can't be click-tested
headlessly). All server pieces it needs already exist.

1. **Join from the lobby** — `Table.svelte` `onSelected` currently opens a
   confirm modal that only `console.log`s. On confirm, `POST
   /api/rooms/[id]/join`, take `game.id` from the response, subscribe the socket
   to `MATCH:<id>` (via the existing `/api/add`), store the game, set
   `playing = true`.
2. **Owner side** — the owner learns the game started from the `game_started`
   delta on ROOMS (already handled shape-wise in `roomsEventHandler` — add a
   `case 'game_started'`): subscribe to `MATCH:<id>`, load `GET /api/games/[id]`,
   set `playing = true`.
3. **Game store** — add `src/lib/store/game.ts` holding `{ gameId, myColor,
   turn, status, board }`. Seed it from `GET /api/games/[id]`; hydrate the 3D
   board (`$lib/store` `board`) from `game.board` instead of the hardcoded
   `putPieces` when in a match.
4. **Send moves** — in `CubeStatus.svelte`, `addToMovePiece` currently calls the
   local `movePiece`. In a match, instead `POST /api/games/[id]/move {from,to}`
   and let the `move_applied` delta drive the board (don't apply optimistically,
   or apply then reconcile).
5. **Apply remote moves** — a `matchEventHandler` for `MATCH:<id>` messages:
   on `move_applied`, apply `movePiece(from,to)` (and clear the captured square),
   update turn/status; on `status:'finished'`, show win/lose.
6. **Turn/colour gating** — only allow selecting your own pieces and only on your
   turn; the server already rejects violations, this is just UX.
7. **Reconcile client highlights with captures** — `$lib/utils/moves.ts` (client
   highlight geometry) still models empty-only moves; point it at
   `$lib/game/rules.ts` so capturable squares highlight. (Server already allows
   captures.)

## Follow-ups / known gaps

- **No check/checkmate** — the win condition is literally capturing the king
  (deliberate for now; documented). Real check detection is a later rules pass.
- **No pawn promotion, no castling, no en passant** — not modelled.
- **Reconnect** — `GET /api/games/[id]` returns full state for rehydration, but
  the client doesn't yet resubscribe to `MATCH` on reload.
- **Abandonment / resign / draw** — no lifecycle beyond active→finished-by-king.
- **Spectators** — trivial to add later (extra subscribers on the MATCH topic).
- The two Lucia v2 traps still apply (see `docs/05`): `session.user` has only
  `userId`; non-GET `validate()` needs a matching `Origin` header.
