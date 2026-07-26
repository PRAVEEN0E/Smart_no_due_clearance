# Production Readiness Checklist

A comprehensive checklist to ensure the Smart No Due Clearance system is production-ready. Each item includes rationale to guide the deployment process.

---

## Pre-Deployment

Before deploying, all environment configuration must be validated. Missing or misconfigured variables are the leading cause of production incidents.

- [ ] **Environment variables configured (.env)** — Ensure `.env.production` or equivalent contains all required variables. Do not rely on defaults.
- [ ] **DATABASE_URL points to production database** — Verify the connection string targets the production PostgreSQL instance, not staging or local. A single-character mistake here can cause data corruption or downtime.
- [ ] **JWT_SECRET is a strong random 64-char hex string** — Generate via `openssl rand -hex 32`. Weak secrets allow token forgery and account takeover.
- [ ] **BOOTSTRAP_SECRET is a strong random 32-char hex string** — Generate via `openssl rand -hex 16`. This protects the initial admin bootstrap endpoint from unauthorized access.
- [ ] **SENTRY_DSN configured** — Error tracking is only effective if the DSN points to the correct Sentry project. Without it, production errors go undetected.
- [ ] **FRONTEND_URL and ALLOWED_ORIGINS set to production domain** — CORS will block legitimate requests if these do not match the actual deployment domain. Include both apex (`example.com`) and `www.example.com` if applicable.
- [ ] **CLOUDINARY credentials configured** — File uploads (student documents, receipts) will fail if Cloudinary API keys are missing or invalid.
- [ ] **REDIS_URL configured (production Redis)** — Caching, BullMQ queues, and session management depend on Redis. Use a production-grade instance with persistence enabled.
- [ ] **NODE_ENV=production** — Setting this enables Express production mode (faster error handling, view caching, reduced logging verbosity). Without it, performance and security defaults are relaxed.

## Database

Database issues are the hardest to debug post-deployment. Proactive verification prevents extended downtime.

- [ ] **Run prisma migrate deploy to apply all migrations** — Unlike `prisma migrate dev`, this applies migrations in order without confirmation prompts. Run this as part of the deployment pipeline, never manually in production.
- [ ] **Verify indexes are created (especially on Evaluation, FeeRecord)** — Missing indexes cause full table scans as data grows. Confirm via `\di` in psql that composite indexes exist on foreign key columns and frequently filtered fields.
- [ ] **Test database connection pooling settings** — Prisma uses connection pooling internally. Verify the pool size matches workload expectations (default 5–10 connections per instance). Too few connections cause request queuing; too many overwhelm the database.
- [ ] **Configure backup schedule (daily recommended)** — Use `pg_dump` or managed-service snapshots. Schedule during off-peak hours. Retain at least 7 daily backups. Document the backup command and location.
- [ ] **Test backup restore procedure** — A backup that cannot be restored is worthless. Perform a full restore on a staging environment and verify data integrity with row counts and sample queries.
- [ ] **Database SSL enforced** — Set `sslmode=require` in DATABASE_URL to prevent man-in-the-middle attacks. Most cloud providers require this; verify that connection strings include `?sslmode=require`.

## Security

Security misconfigurations are the most common attack vector. Every item here addresses a known vulnerability class.

- [ ] **All secrets rotated from defaults** — Default secrets in source code or `.env.example` are public knowledge. Rotate every secret before going live. Use a secrets manager for ongoing rotation.
- [ ] **npm audit passes with no critical vulnerabilities** — Run `npm audit --audit-level=critical` in both `server/` and `client/`. Critical vulnerabilities in production dependencies must be patched or mitigated before deployment.
- [ ] **CSP headers reviewed for production URLs** — Content Security Policy headers should whitelist only production origins for scripts, styles, fonts, and images. Use `report-uri` or `report-to` to capture violations without blocking initially.
- [ ] **CORS origins restricted to known domains** — The `ALLOWED_ORIGINS` environment variable must list only the production frontend domain(s). Never use `*` in production.
- [ ] **Rate limiting configured appropriately** — Verify that `express-rate-limit` is applied to auth routes (login, bootstrap) at a minimum. Suggested limits: 5 requests/minute for login, 100 requests/minute for general API.
- [ ] **Helmet headers verified via securityheaders.com** — Run the production URL through securityheaders.com. Aim for grade A. Key headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`.
- [ ] **JWT token expiry set (7d)** — Verify `JWT_EXPIRES_IN=7d` in production config. Shorter expiries improve security but degrade UX; longer expiries increase the window for token theft.
- [ ] **Cookie secure flag enabled (HTTPS only)** — The `secure: true` flag on session cookies ensures they are only sent over HTTPS. Without it, cookies can be intercepted over plain HTTP.
- [ ] **Input sanitization active on all routes** — Verify that `express-mongo-sanitize` or equivalent middleware is registered globally. Test with injection payloads to confirm blocking behavior.

## Build & Deploy

The build and deployment pipeline must produce deterministic, verifiable artifacts.

- [ ] **Client builds without errors (`npm run build` in client/)** — A broken build means zero functionality for end users. Check for TypeScript errors, missing modules, and static asset failures.
- [ ] **Server loads without errors (`npm start` in server/)** — The server must start cleanly with no unhandled rejections or import failures. Watch the logs for at least 30 seconds after startup.
- [ ] **Docker images build successfully** — Run `docker compose build` and confirm zero exit code. Check image sizes; bloated images indicate missing `.dockerignore` entries.
- [ ] **Docker Compose starts all services** — Run `docker compose up -d` and verify `docker compose ps` shows all services healthy. Check logs for each service to confirm initialization.
- [ ] **Health endpoints respond (GET /api/health, /api/ready, /api/live)** — These endpoints are consumed by the orchestrator (Kubernetes, Docker Compose health checks). A non-responsive health endpoint causes the container to be killed and restarted in a loop.
- [ ] **Metrics endpoint accessible (GET /api/metrics)** — Prometheus scrapes this endpoint. If it returns 404 or errors, monitoring dashboards will be empty and alerting will be blind.
- [ ] **Swagger/API docs accessible** — Verify that the API documentation page loads and all endpoints are documented. This is the primary reference for frontend developers and integrators.

## Monitoring

Without monitoring, you are flying blind. These checks ensure observability is operational.

- [ ] **Sentry error tracking working (test with intentional error)** — Trigger a known error (e.g., `GET /api/trigger-error`) and confirm it appears in the Sentry dashboard within 60 seconds. Check that source maps are uploaded for readable stack traces.
- [ ] **Prometheus metrics scraping configured** — Verify that Prometheus target list shows the server as `UP` and that metrics like `http_request_duration_seconds` and `queue_depth` have non-zero values.
- [ ] **Grafana dashboard imported and panels rendering** — Import the dashboard JSON and confirm all panels show data, not "No data" or error states. Check the data source selector points to the production Prometheus instance.
- [ ] **Alert rules configured for:**
  - [ ] **High error rate (>1% 5xx)** — A sustained error rate above 1% indicates systemic failure. Trigger warning at 1% over 5 minutes, critical at 5%.
  - [ ] **High latency (p99 > 2s)** — p99 latency above 2 seconds degrades user experience. Trigger warning at 1.5s, critical at 3s.
  - [ ] **Low disk space** — Full disks cause database writes to fail and containers to crash. Trigger warning at <20% free, critical at <10%.
  - [ ] **Redis down** — The application becomes non-functional without Redis. Trigger critical if Redis health check fails for 30 seconds.
  - [ ] **Queue depth growing** — A growing queue backlog indicates worker saturation or failure. Trigger warning at >100 jobs, critical at >500.
- [ ] **Log aggregation configured** — Centralized logging (e.g., ELK, Loki, or cloud provider logs) must be operational. Verify that application logs appear in the aggregation system with correct timestamps and severity levels.

## Testing

Testing validates that the deployed system behaves correctly under realistic conditions.

- [ ] **All unit tests pass (npm test)** — Run the full test suite in the CI pipeline. All 141 tests must pass before deployment proceeds.
- [ ] **Integration tests pass** — API integration tests validate cross-component behavior. A passing integration suite is required before production deployment.
- [ ] **Load tests pass (benchmark.js)** — Run the autocannon benchmark against a staging environment. Verify that throughput remains stable and p99 latency stays under 500ms under load.
- [ ] **E2E tests pass (Playwright)** — Full browser tests validate critical user journeys (login → create student → evaluate → approve → generate hall ticket). Any failure here means core functionality is broken.
- [ ] **Coverage meets thresholds (>60%)** — Verify that code coverage exceeds the 60% threshold across statements, branches, functions, and lines. Low coverage increases the risk of undetected bugs in production.

## Operations

Operational readiness ensures the team can respond to incidents effectively and recover quickly.

- [ ] **Backup script tested and scheduled** — The backup script must be executable on demand and via cron. Verify the output file is readable and complete (test restore on a non-production environment).
- [ ] **Restore procedure documented and tested** — Document the exact steps to restore from backup, including command examples, expected duration, and verification queries. Test the procedure end-to-end at least once before go-live.
- [ ] **Runbook printed/accessible** — The runbook must be accessible offline (printed copy) and online (team wiki or docs folder). It should cover common incidents, escalation paths, and contact information.
- [ ] **Incident response plan documented** — Define severity levels (SEV1–SEV3), response SLAs, escalation tree, and communication channels. Include a template for post-incident reviews.
- [ ] **Rollback procedure documented** — Document how to roll back a deployment (revert code, roll back database migration, restore previous Docker images). Test the procedure in staging.
- [ ] **On-call rotation established** — Assign at least two engineers for primary and secondary on-call responsibilities. Ensure they have production access and the runbook before go-live.

## Go-Live

The final checklist executed immediately before and during the production launch.

- [ ] **DNS configured for production domain** — Verify that the domain's A/AAAA records (or CNAME) point to the production server IP. Check propagation with `dig` or `nslookup`. TTL should be low (300s) during launch to allow quick changes.
- [ ] **SSL/TLS certificate installed and valid** — Confirm the certificate is valid (not expired) and covers all expected domains. Use `openssl s_client -connect` to verify the full chain. Enable auto-renewal (e.g., Let's Encrypt or cloud provider managed certificates).
- [ ] **CDN configured (if applicable)** — If using a CDN for static assets or API caching, verify that origins are correctly configured, cache rules are set, and purge API access is available.
- [ ] **Pre-warming of cache completed** — Hit key API endpoints (student list, fee structure, procedures) to populate the Redis cache before user traffic arrives. This prevents a cold-start thundering herd.
- [ ] **Database migration executed** — Run `npx prisma migrate deploy` as the final step before enabling traffic. Do this during a maintenance window if the migration involves locking operations (e.g., adding non-nullable columns).
- [ ] **Smoke test passed (core flows: login, create student, evaluate, approve, generate hall ticket)** — Manually walk through each critical business flow on the production environment. Document the expected outcome for each step and verify it matches.
- [ ] **Monitoring dashboards verified** — Open the Grafana dashboard on a large screen. Confirm that real-time metrics are visible, panels are rendering, and the time range is set to "now."
- [ ] **Alerts configured and tested** — Trigger each alert rule (e.g., stop the Redis container) and confirm the notification reaches the on-call channel (Slack, PagerDuty, email). Silence test alerts after verification.
- [ ] **Stakeholders notified** — Send a launch notification to all stakeholders (product, QA, support) with the production URL, expected behavior, and incident reporting instructions. Set expectations for the observation period (typically 48–72 hours).

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Lead Developer | | | |
| DevOps Engineer | | | |
| QA Lead | | | |
| Product Owner | | | |

---

*Generated for the Smart No Due Clearance System. Review and update this checklist before every production release.*
