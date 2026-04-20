#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────
# ForThePeople.in — Neon database migration runbook (Codespace-friendly)
#
# Dumps the OLD Neon project (owned by jayanthmbjtemp@gmail.com) and
# restores into the NEW Neon project (owned by forthepeople1547@gmail.com).
#
# Reads URLs from environment variables ONLY — never put credentials in this
# file, the repo, or a committed .env.
#
# Required before running:
#   export OLD_NEON_URL="postgresql://..."            # from old .env.local
#   export NEW_NEON_DIRECT_URL="postgresql://..."     # direct (non-pooled)
#
# Exit behaviour:
#   -e        : any command failure aborts the script immediately
#   -u        : referencing an unset variable aborts
#   -o pipefail : failures in pipes aren't silently swallowed
# ─────────────────────────────────────────────────────────────────────────
set -euo pipefail

: "${OLD_NEON_URL:?OLD_NEON_URL must be set}"
: "${NEW_NEON_DIRECT_URL:?NEW_NEON_DIRECT_URL must be set}"

DUMP_PATH="/tmp/ftp-backup-$(date +%Y%m%d-%H%M%S).dump"

echo "=== Dumping from OLD Neon ==="
echo "  → $DUMP_PATH"
pg_dump "$OLD_NEON_URL" \
  --no-owner \
  --no-privileges \
  --format=custom \
  -f "$DUMP_PATH"
ls -lh "$DUMP_PATH"

echo ""
echo "=== Restoring into NEW Neon ==="
pg_restore \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  -d "$NEW_NEON_DIRECT_URL" \
  "$DUMP_PATH"

echo ""
echo "=== Row counts on NEW Neon (spot-check) ==="
psql "$NEW_NEON_DIRECT_URL" -c "
  SELECT 'District' AS table_name, COUNT(*) AS row_count FROM \"District\"
  UNION ALL SELECT 'NewsItem',     COUNT(*) FROM \"NewsItem\"
  UNION ALL SELECT 'InfraProject', COUNT(*) FROM \"InfraProject\"
  UNION ALL SELECT 'Supporter',    COUNT(*) FROM \"Supporter\"
  ORDER BY table_name;
"

echo ""
echo "=== Migration complete ==="
echo "Dump retained at $DUMP_PATH (the Codespace will recycle this on shutdown)."
echo "Next: swap DATABASE_URL in Vercel env + local .env files, then redeploy."
