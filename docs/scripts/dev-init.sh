#!/usr/bin/env bash
# Bootstrap the hyperchess dev environment from scratch (Path A of docs/04).
# Usage: ./docs/scripts/dev-init.sh   (run from the workspace root)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "==> 1/4 starting postgres (docker compose)"
docker compose -f docs/docker-compose.yml up -d db
until docker compose -f docs/docker-compose.yml exec db pg_isready -U hyperchessuser -d hyperchess >/dev/null 2>&1; do
  echo "    waiting for postgres..."; sleep 1
done

echo "==> 2/4 hyperchess .env"
if [ ! -f hyperchess/.env ]; then
  cp docs/env.example hyperchess/.env
  echo "    created hyperchess/.env"
else
  echo "    hyperchess/.env already exists, leaving it alone"
fi

echo "==> 3/4 node deps + prisma"
(cd hyperchess && pnpm install && npx prisma migrate deploy && npx prisma generate)

echo "==> 4/4 rust build check"
if command -v cargo >/dev/null 2>&1; then
  (cd warp-websockets && cargo build)
else
  echo "    cargo not found — install rustup to run the websocket server"
fi

cat <<'EOF'

Done. To run the stack (3 terminals):
  1. cd warp-websockets && make dev          # ws relay :8000
  2. cd hyperchess && pnpm dev               # app :5173
  3. (db already running in docker)

Health checks:
  curl http://localhost:8000/health
  open http://localhost:5173
EOF
