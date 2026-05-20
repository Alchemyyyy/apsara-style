#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   DATABASE_URL=postgresql://... BACKUP_DIR=./backups ./scripts/backup_postgres.sh
# Optional:
#   KEEP_DAYS=14

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required"
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

OUT_FILE="$BACKUP_DIR/apsara_style_${TIMESTAMP}.dump"
echo "Creating backup: $OUT_FILE"
pg_dump --format=custom --no-owner --no-privileges --dbname="$DATABASE_URL" --file="$OUT_FILE"

echo "Pruning backups older than $KEEP_DAYS days in $BACKUP_DIR"
find "$BACKUP_DIR" -type f -name "apsara_style_*.dump" -mtime +"$KEEP_DAYS" -delete

echo "Backup completed."

