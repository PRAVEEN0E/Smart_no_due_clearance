#!/bin/bash
# =============================================================================
# Smart No Due Clearance - Database Backup Script
# =============================================================================
# Usage: ./scripts/backup.sh [output-dir]
# Requires: pg_dump (PostgreSQL client), configured .env file
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment
if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
fi

BACKUP_DIR="${1:-$PROJECT_DIR/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/sndc_backup_$TIMESTAMP.sql"
BACKUP_GZ="$BACKUP_FILE.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database backup..."

if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL not set in .env"
    exit 1
fi

# Extract connection details from DATABASE_URL
pg_dump "$DATABASE_URL" \
    --no-owner \
    --no-acl \
    --format=custom \
    --compress=9 \
    --file="$BACKUP_FILE" 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Backup completed: $BACKUP_FILE"

# Cleanup old backups
find "$BACKUP_DIR" -name "sndc_backup_*.sql*" -mtime +"$RETENTION_DAYS" -delete
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Cleaned up backups older than $RETENTION_DAYS days"

# Print backup size
ls -lh "$BACKUP_FILE"
