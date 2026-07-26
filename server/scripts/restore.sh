#!/bin/bash
# =============================================================================
# Smart No Due Clearance - Database Restore Script
# =============================================================================
# Usage: ./scripts/restore.sh <backup-file>
# Requires: pg_restore (PostgreSQL client), configured .env file
# =============================================================================

set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup-file>"
    echo "Example: $0 backups/sndc_backup_20260720_120000.sql"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -f "$PROJECT_DIR/.env" ]; then
    source "$PROJECT_DIR/.env"
fi

if [ -z "${DATABASE_URL:-}" ]; then
    echo "ERROR: DATABASE_URL not set in .env"
    exit 1
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting database restore from: $BACKUP_FILE"
echo "WARNING: This will OVERWRITE the existing database!"
read -p "Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 1
fi

pg_restore \
    --clean \
    --if-exists \
    --no-owner \
    --no-acl \
    --dbname="$DATABASE_URL" \
    --jobs=4 \
    "$BACKUP_FILE" 2>&1

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Restore completed successfully."
