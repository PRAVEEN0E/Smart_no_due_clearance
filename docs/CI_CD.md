# CI/CD Pipeline

## CI (Continuous Integration)

Triggered on push/PR to `main` and `develop`.

**Stages:**
1. Lint - ESLint
2. Type check - TypeScript (if applicable)
3. Unit tests - vitest (Node 18/20/22 matrix)
4. Integration tests - connecting to PG + Redis services
5. Build - frontend (Vite) + backend
6. Security audit - `npm audit`
7. Load test - autocannon

## CD (Continuous Deployment)

Triggered on version tags (`v*`).

**Stages:**
1. Build Docker images (backend + frontend)
2. Push to GitHub Container Registry (GHCR)
3. Deploy to staging (auto)
4. Manual approval gate
5. Deploy to production
6. Smoke test
7. Slack notification

## Secrets Required

| Secret | Purpose |
|--------|---------|
| `STAGING_HOST` | Staging server hostname |
| `STAGING_USER` | SSH user for staging |
| `STAGING_SSH_KEY` | SSH private key for staging |
| `PROD_HOST` | Production server hostname |
| `PROD_USER` | SSH user for production |
| `PROD_SSH_KEY` | SSH private key for production |
| `PROD_DOMAIN` | Production domain for smoke test |
| `SLACK_WEBHOOK_URL` | Slack notifications |
