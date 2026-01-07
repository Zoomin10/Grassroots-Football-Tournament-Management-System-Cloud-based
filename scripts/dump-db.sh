#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/dump-db.sh <DATABASE_URL> [output.sql]
#
# Example:
#   ./scripts/dump-db.sh "$DATABASE_URL" railway_backup.sql

DB_URL="${1:-}"
OUT_FILE="${2:-db_dump_$(date +%Y%m%d_%H%M%S).sql}"

if [[ -z "$DB_URL" ]]; then
  echo "❌ Missing DATABASE_URL"
  echo "Usage: ./scripts/dump-db.sh <DATABASE_URL> [output.sql]"
  exit 1
fi

echo "✅ Dumping to: $OUT_FILE"
pg_dump "$DB_URL" > "$OUT_FILE"
echo "🎉 Dump created: $OUT_FILE"