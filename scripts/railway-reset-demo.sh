#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

: "${RAILWAY_DATABASE_URL:?RAILWAY_DATABASE_URL is not set}"
[[ -f db/seed.sql ]] || { echo "Missing db/seed.sql"; exit 1; }

# Guardrail: refuse obvious local URLs
if echo "$RAILWAY_DATABASE_URL" | grep -Eq 'localhost|127\.0\.0\.1|/var/run/postgresql'; then
  echo "Refusing: RAILWAY_DATABASE_URL looks local."
  exit 1
fi

# Guardrail: require it to look like Railway
if ! echo "$RAILWAY_DATABASE_URL" | grep -Eq 'railway|rlwy\.net'; then
  echo "Refusing: RAILWAY_DATABASE_URL does not look like Railway."
  exit 1
fi

echo "🚨 This will RESET Railway to the DEMO dataset in db/seed.sql"
echo "    It will TRUNCATE: matches, teams, leagues, tournaments"
echo
read -r -p "Type RESET_RAILWAY_DEMO to continue: " CONFIRM
[[ "$CONFIRM" == "RESET_RAILWAY_DEMO" ]] || { echo "Aborted."; exit 1; }

export PGSSLMODE=require

# Clear tables
psql "$RAILWAY_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
TRUNCATE TABLE public.matches, public.teams, public.leagues, public.tournaments
RESTART IDENTITY CASCADE;
COMMIT;
SQL

# Load demo data
psql "$RAILWAY_DATABASE_URL" -v ON_ERROR_STOP=1 -f db/seed.sql

echo "✅ Railway reset to demo dataset."
