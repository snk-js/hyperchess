# hyperchess project docs

Analysis of the `hyperchess` (SvelteKit 3D chess) and `warp-websockets` (Rust
pub/sub relay) codebases, produced 2026-07-04 — plus the record of the
restructuring done the same day.

> **Status:** the decisions from these docs have been applied — monorepo merge
> (warp-websockets → [ws-server/](../ws-server/), deprecated), architecture
> **Option A** (in-process WebSockets in the Node app), Tier 0 fixes, working
> docker compose. Docs 01–03 and 07 describe the *pre-merge* state and remain
> as analysis records; doc 04 is updated to the current setup.

| Doc | Contents |
|---|---|
| [01-hyperchess-analysis.md](01-hyperchess-analysis.md) | App analysis: stack, timeline, auth status, multiplayer gaps *(pre-merge record)* |
| [02-warp-websockets-analysis.md](02-warp-websockets-analysis.md) | Rust relay analysis; why it was retired *(pre-merge record)* |
| [03-integration-current-state.md](03-integration-current-state.md) | How the two services used to talk; ranked defects *(pre-merge record — the in-process ws replaced this)* |
| [04-dev-setup-from-scratch.md](04-dev-setup-from-scratch.md) | **Current** from-zero dev setup |
| [05-improvement-plan.md](05-improvement-plan.md) | Tiered backlog — Tier 0 is done; **Tier 1 (multiplayer core) is next** |
| [06-architecture-proposal.md](06-architecture-proposal.md) | Architecture options; Option A (chosen) target shape |
| [07-cicd-and-repo-strategy.md](07-cicd-and-repo-strategy.md) | Repo strategy (monorepo — done) + staged CI/CD plan (still to build) |
| [08-match-flow-next-steps.md](08-match-flow-next-steps.md) | MATCH flow: server core done (PR #7); client 3D wiring steps *(on `feat/match-flow` until the stack merges)* |
| [09-auth-sessions-plan.md](09-auth-sessions-plan.md) | **Mounted plan**: replace deprecated Lucia (v2+v3) with roll-your-own sessions — design, call-site inventory, tests |
| [scripts/dev-init.sh](scripts/dev-init.sh) | One-shot dev bootstrap *(pre-merge paths; superseded by README quickstart)* |

## TL;DR state of the project

- ✅ Local gameplay (pieces move; piece replacement flaky)
- ✅ Auth: Lucia v2 + Prisma + Postgres — works, but Lucia is deprecated (Tier 2 migration planned)
- ✅ Rooms broadcast over in-process `/ws/<clientId>` (same origin, no external relay)
- ✅ Docker: pinned images, self-migrating container, compose (db :5433, app :3000)
- ❌ Room persistence / snapshot for late lobby joiners (Tier 1)
- ❌ Game-move sync over the `MATCH` topic (Tier 1)
- ❌ Server-side move validation (Tier 1 — now just an import of the TS rules)
- ❌ Tests and CI (Tier 4 / docs 07)
