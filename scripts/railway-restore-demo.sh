# Restores the repo’s known demo dataset (db/demo/seed.sql) into Railway
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

: "${RAILWAY_DATABASE_URL:?RAILWAY_DATABASE_URL is not set}"

# Guardrails
if echo "$RAILWAY_DATABASE_URL" | grep -Eq 'localhost|127\.0\.0\.1|/var/run/postgresql'; then
  echo "Refusing: RAILWAY_DATABASE_URL looks local."
  exit 1
fi
if ! echo "$RAILWAY_DATABASE_URL" | grep -Eq 'railway|rlwy\.net'; then
  echo "Refusing: RAILWAY_DATABASE_URL does not look like Railway."
  exit 1
fi

: "${DEMO_SEED_FILE:=db/demo/seed.sql}"
[[ -f "$DEMO_SEED_FILE" ]] || { echo "Missing demo seed: $DEMO_SEED_FILE"; exit 1; }

: "${CONFIRM_RAILWAY_RESTORE:?Set CONFIRM_RAILWAY_RESTORE=yes to proceed}"
[[ "$CONFIRM_RAILWAY_RESTORE" == "yes" ]] || { echo "Aborted."; exit 1; }

DOCKER=(docker)
if ! docker ps >/dev/null 2>&1; then DOCKER=(sudo docker); fi
if [[ "${DOCKER[0]}" == "sudo" ]]; then sudo -v; fi

echo "Using: ${DOCKER[*]}"
echo "🚀 Restoring demo seed -> Railway from ${DEMO_SEED_FILE}"

"${DOCKER[@]}" run --rm -i \
  -e PGSSLMODE=require \
  -e DATABASE_URL="$RAILWAY_DATABASE_URL" \
  -v "$REPO_ROOT/$DEMO_SEED_FILE:/seed.sql:ro" \
  postgres:17 \
  sh -lc 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /seed.sql'

echo "✅ Demo restored."
