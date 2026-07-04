# CI/CD pipeline strategies & handling the two GitHub repos

Two questions, one decision: the repo layout determines which pipeline shape
you can have.

## Part 1 — the two separated repos: your options

### Option 1 — Monorepo ⭐ recommended

Merge both into one repo (`hyperchess`), preserving history:

```bash
cd hyperchess
git remote add warp ../warp-websockets
git fetch warp
# history-preserving subtree merge into ws-server/
git merge -s ours --no-commit --allow-unrelated-histories warp/main
git read-tree --prefix=ws-server/ -u warp/main
git commit -m "merge warp-websockets as ws-server/ (history preserved)"
```

Result:

```
hyperchess/
├── app/            # (optionally move the SvelteKit app down a level)
├── ws-server/      # the rust service, full history intact via the merge
├── docs/
├── docker-compose.yml
└── .github/workflows/ci.yml   # one pipeline, path-filtered
```

Why it fits *this* project: one developer, tightly coupled services (a message
schema change always touches both), no independent consumers of the Rust server,
and you already tried to couple them ad-hoc (warp-websockets has hyperchess as a
git remote; there was a "prepare submodule hyperchess" commit). A monorepo makes
cross-cutting changes one atomic commit and one PR, and compose/CI live at the
root naturally. Archive the old `warp-websockets` GitHub repo with a pointer.

If the architecture proposal's Option A is adopted (retire the Rust relay),
this gets even simpler — the monorepo question almost answers itself.

### Option 2 — Meta/workspace repo + two source repos

Keep both repos; add a third small `hyperchess-infra` repo holding
docker-compose, docs, and deploy workflows, referencing published images.
Fits teams with separate ownership — overkill for one person, and cross-repo
changes need coordinated PRs + image version bumps.

### Option 3 — Git submodules

A parent repo pinning both as submodules. **Not recommended**: submodule pin
juggling is constant friction for a solo dev, and you already backed away from
this once in 2023.

### Option 4 — Status quo (two independent repos)

Workable only if the Rust server stays a generic, hyperchess-agnostic pub/sub
relay with a stable API. The moment it learns about rooms/matches/auth, the
coupling argument wins and you're back to Option 1.

## Part 2 — pipeline strategies

### Stage 1 — CI (do this first, it's missing entirely)

Monorepo single workflow with path filters:

```yaml
# .github/workflows/ci.yml (sketch)
on: [push, pull_request]
jobs:
  changes:
    # dorny/paths-filter → outputs app / ws booleans
  app:
    needs: changes
    if: needs.changes.outputs.app == 'true'
    steps: [pnpm install, prisma generate, pnpm check, pnpm lint, pnpm build, vitest]
  ws:
    needs: changes
    if: needs.changes.outputs.ws == 'true'
    steps: [cargo fmt --check, cargo clippy -D warnings, cargo test, cargo build --release]
```

(Two-repo variant: the same two jobs, one workflow per repo, no path filters.)

The existing `.github/workflows/static.yml` (gh-pages demo) should be retired or
kept as a separate manual-trigger workflow — it predates auth and builds a
static app that can't do sessions.

### Stage 2 — integration test job (the "pipeline integrating both")

This is the main strategy for continuously validating the *pair*:

```yaml
integration:
  needs: [app, ws]
  steps:
    - docker compose -f docker-compose.yml -f docker-compose.ci.yml up -d --build
    - curl --retry 10 --retry-connrefused http://localhost:8000/health
    - curl --retry 10 --retry-connrefused http://localhost:3000/healthcheck
    - # smoke: register a ws client, publish, assert delivery (small node script
      # with the `ws` package, or `websocat`)
    - # later: playwright against :3000 (signup → create room → second browser sees it)
```

Compose is the contract: the same file developers run is what CI boots. This is
the highest-value pipeline you can add, because the historical failure mode of
this project is exactly "each half works alone."

### Stage 3 — image publishing (CD half)

On merge to main (or tags): build & push both images to **GHCR**
(`ghcr.io/snk-js/hyperchess-app`, `.../hyperchess-ws`) with
`docker/build-push-action`, tagged `sha` + `latest`. GHCR is free for public
repos and needs no extra secrets (`GITHUB_TOKEN`).

### Stage 4 — deploy

Pick per taste; all consume the GHCR images:

- **VPS + compose** (simplest): a `deploy` job SSHes in and runs
  `docker compose pull && docker compose up -d`; Caddy in front for TLS/WSS.
  Or Watchtower for pull-based auto-updates.
- **Fly.io / Railway**: both handle WebSockets and Postgres add-ons well;
  `flyctl deploy` in the workflow. Good free/hobby tiers.
- Migrations: keep `prisma migrate deploy` as the app container's entry step
  (as in `docs/docker-compose.yml`) so deploys are self-migrating.

### Two-repo pipeline coordination (only if you reject the monorepo)

- Each repo publishes its image on main.
- The infra repo's deploy workflow is triggered by `repository_dispatch` from
  either source repo's publish workflow, then deploys `latest` of both.
- Contract safety: version the WS message schema (`v` field) and add a tiny
  contract test in the infra repo that boots compose and exercises
  register/publish/deliver. This replaces the atomic-commit guarantee you lose
  by not being in a monorepo.

## Suggested order of operations

1. Adopt compose for dev (works today for the DB; full stack after the Tier-0
   env-var fixes in [05-improvement-plan.md](05-improvement-plan.md)).
2. Merge repos (subtree merge above) — or consciously decide against it.
3. Add Stage 1 CI (lint/check/build/test both halves).
4. Add Stage 2 compose integration smoke test.
5. Add GHCR publishing, then a deploy target when you actually want it live.
