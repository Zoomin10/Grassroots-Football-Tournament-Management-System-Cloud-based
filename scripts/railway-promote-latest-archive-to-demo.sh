#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

mkdir -p db/demo

LATEST_DIR="$(ls -1dt db/archives/* 2>/dev/null | head -n 1)"
if [[ -z "${LATEST_DIR:-}" ]]; then
  echo "❌ No archives found in db/archives"
  exit 1
fi

SCHEMA_SRC="${LATEST_DIR}/schema.sql"
DATA_SRC="${LATEST_DIR}/data.sql"

[[ -f "$SCHEMA_SRC" ]] || { echo "❌ Missing: $SCHEMA_SRC"; exit 1; }
[[ -f "$DATA_SRC" ]] || { echo "❌ Missing: $DATA_SRC"; exit 1; }

echo "Using latest archive: $LATEST_DIR"

# Promote schema
cp "$SCHEMA_SRC" db/schema.sql

# Build demo seed with safe wrapper
cat > db/demo/seed.sql <<'EOF'
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

cat "$DATA_SRC" >> db/demo/seed.sql

cat >> db/demo/seed.sql <<'EOF'

COMMIT;
EOF

echo "✅ Updated demo files:"
echo " - db/schema.sql"
echo " - db/demo/seed.sql"
ls -lh db/schema.sql db/demo/seed.sql
