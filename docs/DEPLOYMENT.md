# Deployment

## Prerequisites

- Docker & Docker Compose v2+
- Node.js 18+ (for local builds)
- PostgreSQL 16 (production)
- Redis 7 (production)

## Production Deployment

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/smart-no-dues.git
cd smart-no-dues
cp .env.example .env
# Edit .env with production values
```

### 2. Build & Start

```bash
docker compose build
docker compose up -d
```

### 3. Verify

```bash
curl http://localhost:3000/api/health
curl http://localhost/api/health  # via nginx
```

### 4. Database Migrations

```bash
docker compose exec backend npx prisma migrate deploy
```

## Rollback

```bash
docker compose down
docker compose up -d backend=backend:previous-tag
```
