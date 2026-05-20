# Operations Runbook

## Health Checks

- Liveness:
  - `GET /api/health`
  - Expected: `200` with `status: "ok"`
- Readiness (DB connectivity):
  - `GET /api/health/ready`
  - Expected: `200` with `status: "ready"` and `db: "ok"`
  - If DB unavailable: `503` with `status: "not_ready"`

## Monitoring Basics

- Track:
  - Error rate on `/api/admin/*`
  - Latency p95 for upload endpoint `/api/admin/uploads/images`
  - Readiness failures (`/api/health/ready` status 503)
- Alert examples:
  - Readiness failing for > 3 consecutive checks
  - 5xx rate > 2% for 5 minutes
  - Upload failures > 5% for 5 minutes

## Backup (PostgreSQL)

Use script:

```bash
cd server
DATABASE_URL='postgresql://...' BACKUP_DIR=./backups KEEP_DAYS=14 ./scripts/backup_postgres.sh
```

Recommended schedule:

- Daily full backup via cron.
- Example (runs at 2:30 AM server time):

```cron
30 2 * * * cd /path/to/repo/server && DATABASE_URL='postgresql://...' BACKUP_DIR=/var/backups/apsara KEEP_DAYS=14 ./scripts/backup_postgres.sh >> /var/log/apsara_backup.log 2>&1
```

## Upload Storage

- `UPLOAD_STORAGE=local` (default): serves files from `/uploads`.
- `UPLOAD_STORAGE=cloudinary`: requires Cloudinary env vars.

Keep a separate retention policy for local uploads directory if using local mode.

