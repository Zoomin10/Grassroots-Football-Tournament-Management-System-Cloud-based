#!/usr/bin/env bash
set -euo pipefail

# Always run from repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

: "${RAILWAY_DATABASE_URL:?RAILWAY_DATABASE_URL is not set}"

# Guardrails: refuse if URL doesn't look like Railway
if ! echo "$RAILWAY_DATABASE_URL" | grep -Eq 'rlwy\.net|railway'; then
  echo "Refusing: RAILWAY_DATABASE_URL does not look like Railway."
  exit 1
fi

echo "⚠️  This will DELETE ALL DATA in Railway tables:"
echo "    public.matches, public.teams, public.leagues, public.tournaments"
echo
read -r -p 'Type RESET_RAILWAY_SCHEMA_ONLY to continue: ' CONFIRM
if [[ "$CONFIRM" != "RESET_RAILWAY_SCHEMA_ONLY" ]]; then
  echo "Aborted."
  exit 1
fi

export PGSSLMODE=require

psql "$RAILWAY_DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
BEGIN;
TRUNCATE TABLE public.matches, public.teams, public.leagues, public.tournaments
RESTART IDENTITY CASCADE;
COMMIT;
SQL

echo "✅ Railway schema preserved; data cleared."
