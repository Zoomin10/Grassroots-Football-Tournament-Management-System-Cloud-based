#!/usr/bin/env bash
set -euo pipefail

# Always run from repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

DB="${LOCAL_DB_NAME:-users}"

echo "Rebuilding local database: $DB"
sudo -v

# 1) Drop + recreate DB owned by current user (uses OS postgres, not DB auth)
# Try a forced drop first to avoid "being accessed by other users"
if sudo -u postgres dropdb --if-exists --force "$DB" >/dev/null 2>&1; then
  echo "Dropped DB (forced): $DB"
else
  # Fallback if --force isn't supported
  sudo -u postgres dropdb --if-exists "$DB" || true
fi

sudo -u postgres createdb -O "$USER" "$DB"
echo "Created DB owned by $USER: $DB"

# 2) Apply schema + seed as the normal user (no superuser / no password prompts)
psql -d "$DB" -v ON_ERROR_STOP=1 -f db/schema.sql
psql -d "$DB" -v ON_ERROR_STOP=1 -f db/seed.sql

# 3) Quick counts
psql -d "$DB" -c "
select 'tournaments' t, count(*) c from public.tournaments
union all select 'leagues', count(*) from public.leagues
union all select 'teams', count(*) from public.teams
union all select 'matches', count(*) from public.matches;
"

echo "✅ Done."
