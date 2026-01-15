# Clears Railway back to a “clean environment” (schema stays)
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

# Safety latch
: "${CONFIRM_RAILWAY_CLEAR:?Set CONFIRM_RAILWAY_CLEAR=yes to proceed}"
[[ "$CONFIRM_RAILWAY_CLEAR" == "yes" ]] || { echo "Aborted."; exit 1; }

DOCKER=(docker)
if ! docker ps >/dev/null 2>&1; then DOCKER=(sudo docker); fi
if [[ "${DOCKER[0]}" == "sudo" ]]; then sudo -v; fi

echo "Using: ${DOCKER[*]}"
echo "⚠️ Clearing Railway tables..."

"${DOCKER[@]}" run --rm -i \
  -e PGSSLMODE=require \
  -e DATABASE_URL="$RAILWAY_DATABASE_URL" \
  postgres:17 \
  sh -lc 'psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<SQL
BEGIN;

TRUNCATE TABLE
  public.registration_players,
  public.registrations,
  public.matches,
  public.teams,
  public.leagues,
  public.tournaments
RESTART IDENTITY CASCADE;

COMMIT;
SQL'

echo "✅ Railway cleared."

