#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

: "${RAILWAY_DATABASE_URL:?RAILWAY_DATABASE_URL is not set (put it in .env)}"

if echo "$RAILWAY_DATABASE_URL" | grep -Eq 'localhost|127\.0\.0\.1|/var/run/postgresql'; then
  echo "Refusing: RAILWAY_DATABASE_URL looks like a local connection."
  exit 1
fi

mkdir -p db/dumps

DOCKER=(docker)
if ! docker ps >/dev/null 2>&1; then
  DOCKER=(sudo docker)
fi
if [[ "${DOCKER[0]}" == "sudo" ]]; then
  sudo -v
fi

echo "Using: ${DOCKER[*]}"
echo "Dumping schema to db/dumps/schema.sql ..."

"${DOCKER[@]}" run --rm -i \
  -e PGSSLMODE=require \
  -e DATABASE_URL="$RAILWAY_DATABASE_URL" \
  postgres:17 \
  sh -lc 'pg_dump "$DATABASE_URL" --schema-only --no-owner --no-privileges --clean --if-exists' \
  > db/dumps/schema.raw.sql

sed '/transaction_timeout/d;/^\\restrict /d;/^\\unrestrict/d' db/dumps/schema.raw.sql > db/dumps/schema.sql
rm -f db/dumps/schema.raw.sql

echo "Dumping data to db/dumps/seed.sql ..."

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
    --table=public.matches \
    --table=public.registrations \
    --table=public.registration_players' \
  > db/dumps/seed.raw.sql

tmp="$(mktemp)"

sed '/transaction_timeout/d;/^\\restrict /d;/^\\unrestrict/d;/DISABLE TRIGGER/d;/ENABLE TRIGGER/d' db/dumps/seed.raw.sql \
| awk '
  /^INSERT INTO / {print; next}
  /^SELECT pg_catalog\.setval/ {print; next}
  {next}
' > "$tmp"

cat > db/dumps/seed.sql <<'EOF'
BEGIN;
TRUNCATE TABLE
  public.registration_players,
  public.registrations,
  public.matches,
  public.teams,
  public.leagues,
  public.tournaments
RESTART IDENTITY CASCADE;

EOF

cat "$tmp" >> db/dumps/seed.sql

cat >> db/dumps/seed.sql <<'EOF'

COMMIT;
EOF

rm -f "$tmp" db/dumps/seed.raw.sql

echo "✅ Wrote:"
echo " - db/dumps/schema.sql"
echo " - db/dumps/seed.sql"
ls -lh db/dumps/schema.sql db/dumps/seed.sql
