# Runbook

## Incident Response

### 1. API Latency Spikes

1. Check `/api/health` for memory/cache status
2. Check `/api/metrics` for slow endpoints
3. Check database connection pool usage
4. Check Redis for cache misses
5. Scale up: `docker compose up -d --scale backend=3`

### 2. Database Connection Errors

1. Verify PG is running: `docker compose ps postgres`
2. Check connection pool: `SELECT count(*) FROM pg_stat_activity`
3. Restart: `docker compose restart postgres`
4. Verify: `curl http://localhost:3000/api/ready`

### 3. Redis Down

1. Restart: `docker compose restart redis`
2. Verify: `redis-cli ping`
3. Cache will degrade gracefully (all requests fall through to DB)

### 4. Queue Backlog

1. Check queue depth via `/api/health`
2. Inspect BullMQ dashboard (if enabled)
3. Restart workers: `docker compose restart backend`
4. Clear failed jobs if needed via Redis CLI

## Recovery Procedures

### Full System Restart

```bash
docker compose down
docker compose up -d
docker compose logs -f
```

### Database Backup

```bash
docker compose exec postgres pg_dump -U sndc sndc > backup.sql
```

### Database Restore

```bash
docker compose exec -T postgres psql -U sndc sndc < backup.sql
```

## Common Commands

| Command | Purpose |
|---------|---------|
| `docker compose logs -f backend` | Follow backend logs |
| `docker compose exec backend node` | Open Node REPL in container |
| `docker compose exec postgres psql -U sndc` | Open PSQL |
| `docker compose exec redis redis-cli` | Open Redis CLI |
