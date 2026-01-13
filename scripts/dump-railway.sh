#!/usr/bin/env bash
set -euo pipefail

# Always run from repo root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Load env
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

: "${RAILWAY_DATABASE_URL:?RAILWAY_DATABASE_URL is not set (put it in .env)}"

# Light guardrail: refuse obvious local URLs
if echo "$RAILWAY_DATABASE_URL" | grep -Eq 'localhost|127\.0\.0\.1|/var/run/postgresql'; then
  echo "Refusing: RAILWAY_DATABASE_URL looks like a local connection."
  exit 1
fi

mkdir -p db

# Choose docker command (use sudo if needed)
DOCKER=(docker)
if ! docker ps >/dev/null 2>&1; then
  DOCKER=(sudo docker)
fi

# If we're using sudo docker, prompt once and cache creds
if [[ "${DOCKER[0]}" == "sudo" ]]; then
  sudo -v
fi

echo "Using: ${DOCKER[*]}"
echo "Dumping schema to db/schema.sql ..."

# --- SCHEMA DUMP ---
"${DOCKER[@]}" run --rm -i \
  -e PGSSLMODE=require \
  -e DATABASE_URL="$RAILWAY_DATABASE_URL" \
  postgres:17 \
sh -lc 'pg_dump "$DATABASE_URL" --schema-only --no-owner --no-privileges --clean --if-exists'

> db/schema.raw.sql

# Remove PG17-only setting that breaks older locals
sed '/transaction_timeout/d' db/schema.raw.sql > db/schema.sql
rm -f db/schema.raw.sql

echo "Dumping data to db/seed.sql ..."

# --- DATA DUMP ---
"${DOCKER[@]}" run --rm -i \
  -e PGSSLMODE=require \
  -e DATABASE_URL="$RAILWAY_DATABASE_URL" \
  postgres:17 \
  sh -lc 'pg_dump "$DATABASE_URL" \
    --data-only \
    --column-inserts \
    --no-owner \
    --no-privileges \
    --table=public.tournaments \
    --table=public.leagues \
    --table=public.teams \
    --table=public.matches' \
> db/seed.raw.sql

# Build a portable seed:
# - remove transaction_timeout (PG17-only)
# - remove trigger disable/enable lines (requires superuser locally)
# - keep only INSERTs + setval (sequence resets)
# - wrap in BEGIN/TRUNCATE/COMMIT so re-running is safe
tmp="$(mktemp)"

sed '/transaction_timeout/d;/DISABLE TRIGGER/d;/ENABLE TRIGGER/d' db/seed.raw.sql \
| awk '
  /^INSERT INTO / {print; next}
  /^SELECT pg_catalog\.setval/ {print; next}
  {next}
' > "$tmp"

cat > db/seed.sql <<'EOF'
BEGIN;
TRUNCATE TABLE public.matches, public.teams, public.leagues, public.tournaments RESTART IDENTITY CASCADE;

EOF

cat "$tmp" >> db/seed.sql

cat >> db/seed.sql <<'EOF'

COMMIT;
EOF

rm -f "$tmp" db/seed.raw.sql

echo "✅ Wrote:"
echo " - db/schema.sql"
echo " - db/seed.sql"

echo "Quick peek:"
ls -lh db/schema.sql db/seed.sql
