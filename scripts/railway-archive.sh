# Archives current Railway state (schema + data) so you can always roll back. 

#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ -f .env ]]; then
  set -a; source .env; set +a
fi

: "${RAILWAY_DATABASE_URL:?RAILWAY_DATABASE_URL is not set (put it in .env)}"

# Guardrails
if echo "$RAILWAY_DATABASE_URL" | grep -Eq 'localhost|127\.0\.0\.1|/var/run/postgresql'; then
  echo "Refusing: RAILWAY_DATABASE_URL looks local."
  exit 1
fi
if ! echo "$RAILWAY_DATABASE_URL" | grep -Eq 'railway|rlwy\.net'; then
  echo "Refusing: RAILWAY_DATABASE_URL does not look like Railway."
  exit 1
fi

mkdir -p db/archives

TS="$(date -u +"%Y%m%d-%H%M%S")"
OUT_DIR="db/archives/${TS}"
mkdir -p "$OUT_DIR"

DOCKER=(docker)
if ! docker ps >/dev/null 2>&1; then DOCKER=(sudo docker); fi
if [[ "${DOCKER[0]}" == "sudo" ]]; then sudo -v; fi

echo "Using: ${DOCKER[*]}"
echo "Archiving Railway -> ${OUT_DIR}"

# Schema
"${DOCKER[@]}" run --rm -i \
  -e PGSSLMODE=require \
  -e DATABASE_URL="$RAILWAY_DATABASE_URL" \
  postgres:17 \
  sh -lc 'pg_dump "$DATABASE_URL" --schema-only --no-owner --no-privileges --clean --if-exists' \
  > "${OUT_DIR}/schema.raw.sql"

sed '/transaction_timeout/d;/^\\restrict /d;/^\\unrestrict/d' "${OUT_DIR}/schema.raw.sql" > "${OUT_DIR}/schema.sql"
rm -f "${OUT_DIR}/schema.raw.sql"

# Data (include new tables!)
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
  > "${OUT_DIR}/data.raw.sql"

sed '/transaction_timeout/d;/^\\restrict /d;/^\\unrestrict/d;/DISABLE TRIGGER/d;/ENABLE TRIGGER/d' "${OUT_DIR}/data.raw.sql" \
| awk '
  /^INSERT INTO / {print; next}
  /^SELECT pg_catalog\.setval/ {print; next}
  {next}
' > "${OUT_DIR}/data.sql"
rm -f "${OUT_DIR}/data.raw.sql"

echo "✅ Archive written:"
echo " - ${OUT_DIR}/schema.sql"
echo " - ${OUT_DIR}/data.sql"
ls -lh "${OUT_DIR}/schema.sql" "${OUT_DIR}/data.sql"
