#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/restore-db.sh <DATABASE_URL> [dump.sql]
#    ./scripts/restore-db.sh "postgresql://postgres:...@.../railway"
#
# Examples:
#   ./scripts/restore-db.sh "$DATABASE_URL"
#   ./scripts/restore-db.sh "postgresql://user:pass@host:port/db" railway_backup.sql 
# above assumes that a dump was created to "railway_backup" so above command restore schema and data in postgrea tables

DB_URL="${1:-}"
DUMP_FILE="${2:-}"

if [[ -z "$DB_URL" ]]; then
  echo "❌ Missing DATABASE_URL"
  echo "Usage: ./scripts/restore-db.sh <DATABASE_URL> [dump.sql]"
  exit 1
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEMA_FILE="$ROOT_DIR/db/schema.sql"

if [[ ! -f "$SCHEMA_FILE" ]]; then
  echo "❌ Schema file not found: $SCHEMA_FILE"
  exit 1
fi

echo "✅ Applying schema: $SCHEMA_FILE"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$SCHEMA_FILE"

if [[ -n "$DUMP_FILE" ]]; then
  if [[ ! -f "$DUMP_FILE" ]]; then
    echo "❌ Dump file not found: $DUMP_FILE"
    exit 1
  fi

  echo "✅ Restoring dump: $DUMP_FILE"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$DUMP_FILE"
fi

echo "🎉 Done."