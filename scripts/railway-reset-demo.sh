# 1 button reset : archive -> clear -> restore
#!/usr/bin/env bash
set -euo pipefail

echo "🚨 This will: ARCHIVE current Railway -> CLEAR -> RESTORE demo seed."
echo
read -r -p "Type RESET_RAILWAY_DEMO to continue: " CONFIRM
[[ "$CONFIRM" == "RESET_RAILWAY_DEMO" ]] || { echo "Aborted."; exit 1; }

./scripts/railway-archive.sh
CONFIRM_RAILWAY_CLEAR=yes ./scripts/railway-clear.sh
CONFIRM_RAILWAY_RESTORE=yes ./scripts/railway-restore-demo.sh

echo "✅ Railway reset to demo dataset."
