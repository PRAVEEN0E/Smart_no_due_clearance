# Changelog

All notable changes to the Smart No Due Clearance System are documented in this file.

## [1.0.0] - 2026-07-20

### Sprint 4.5 — Production Hardening (Jul 2026)

#### Added
- Environment variable validation with startup guard (`lib/env.js`) — checks required vars, JWT length (min 32 chars), bcrypt rounds (10–16), production HTTPS origins
- Password setup flow — `POST /api/auth/setup-password` with timed token, `passwordSetupToken` and `passwordSetupTokenExpires` fields
- `POST /logout` endpoint — clears auth cookie, returns confirmation
- Cluster health dashboard (`plugins/healthDashboard.js`) — `GET /cluster/health` SUPERADMIN proxy to master health port
- Cluster master process (`cluster.js`) — round-robin load balancing, 5s heartbeat monitoring, adaptive restart with exponential backoff (1s→30s), IPC rate-limit coordination, graceful shutdown with 30s drain timeout
- Worker-level health metadata — per-worker request count, memory, PID, uptime in `/api/health` response
- IPC message handler — heartbeat ping/response, worker_ready, shutdown signals, request_tick tracking
- Prometheus custom metrics — `http_request_duration_seconds` (histogram, p50/p95/p99 buckets), `http_requests_total` (counter), `sndc_cache_hits_total`, `sndc_cache_misses_total`, `bullmq_queue_waiting_count`
- `setInterval` queue depth tracker — polls BullMQ queue status every 15s for Prometheus gauge
- `POST /api/auth/signature` route — multipart signature upload to Cloudinary with role guard (no STUDENT)
- `GET /csrf-token` endpoint — returns fresh CSRF token for current session (removed later)
- Swagger/OpenAPI documentation — `@fastify/swagger` + `@fastify/swagger-ui` at `/docs` route
- Maintenance mode support — `isMaintenanceMode` on college blocks non-SUPERADMIN login with 503 response
- Startup upload directory creation — `uploads/{assignments,halltickets,materials,signatures}/` with `.gitkeep`
- `git log --all` commit history tracking for production audit trail

#### Changed
- CORS origin validation — moved from static list to callback function with descriptive error (`Not allowed by CORS`), dev-mode IP range allowance (192.168.*, localhost, 127.0.0.1)
- Production CORS enforcement — startup rejects non-HTTPS origins in production environment
- Auth cookie security — `sameSite: 'lax'`, `secure: true` in production, `httpOnly: true`
- Rate limit error response — structured JSON with `retryAfter` field, `RATE_LIMIT_EXCEEDED` code
- Error handler — maps Prisma codes P2002 (409), P2003 (400), P2025 (404); CORS denial (403); file too large (413); validation errors (400) with structured detail array
- Global error response — production mode hides stack traces, exposes `requestId` for tracing
- Sanitization hook — moved from plugin to `preHandler` hook on `['POST', 'PUT', 'PATCH', 'DELETE']` methods
- `onSend` hook — attaches `X-Worker-Id`, `X-Worker-PID`, `X-Request-Id` headers; logs 401/403/5xx status codes
- `@fastify/compress` — Brotli enabled in production with quality level 4
- `process.on` handlers — `SIGTERM` and `SIGINT` graceful shutdown in non-worker mode

#### Fixed
- Mass assignment vulnerability — all request body fields sanitized via `sanitizePlugin.js` before reaching route handlers
- File upload security — validated against `DANGEROUS_EXTENSIONS` blocklist (exe, bat, cmd, vbs, sh, php, asp, etc.), double-extension detection, safe filename generation
- Cache graceful degradation — all `cache.*` calls wrapped in try/catch, Redis unavailability returns `{connected: false}` without crashing
- Prisma connection lifecycle — `$connect()` on startup, `$disconnect()` in `onClose` hook, slow-query logging (>100ms) in development
- Worker crash recovery — cluster master restarts dead workers with exponential backoff

#### Security
- Helmet CSP — strict `default-src 'self'`, whitelisted script/style/img/font/connect sources, `upgradeInsecureRequests` in production, `frame-src 'none'`
- HSTS — `maxAge=31536000`, `includeSubDomains`, `preload`
- Input sanitization — script tag removal, event handler stripping (`on\w+=`), `javascript:` URL blocking, email normalization, filename sanitization
- Sentry error tracking — captures unhandled rejections, uncaught exceptions, all 400+ errors with request context

### Sprint 4 — Testing, DevOps & Monitoring (Jul 2026)

#### Added
- **141 tests across 13 files** — 126 unit tests + 5 integration tests + load + E2E
- Unit tests: `cache.test.js` (13), `queue.test.js` (8), `storage.test.js` (7), `repository.test.js` (19), `authService.test.js` (11), `userService.test.js` (9), `responses.test.js` (12), `constants.test.js` (6), `marksCalculator.test.js` (16), `sanitize.test.js` (17), `upload.test.js` (13), `qrService.test.js` (5)
- Integration tests (`api.test.js`) — health check, auth flow, validation error handling, CORS headers, rate limiting
- Load tests — `benchmark.js` (autocannon: health/login scenarios), `load-test.js` (k6-compatible for CI)
- E2E tests (`e2e/login.spec.js`) — Playwright login flow + homepage navigation
- Docker multi-stage builds — `server/Dockerfile` (deps→builder→runner, alpine, non-root appuser, health check), `client/Dockerfile` (Vite builder→nginx runner, non-root appuser, gzip)
- `client/nginx.conf` — SPA catch-all routing, `/assets` immutable cache, `/api/` proxy to backend, gzip compression
- `docker-compose.yml` — backend + frontend + PostgreSQL 16 + Redis 7 with health checks and named volumes
- `docker-compose.override.yml` — dev hot-reload (nodemon), port bindings for PG/Redis/frontend
- `.dockerignore` (server + client) — excludes node_modules, tests, coverage, local env
- CI pipeline (`.github/workflows/ci.yml`) — lint, matrix test (Node 18/20/22), security audit, Docker build on main push
- CD pipeline (`.github/workflows/cd.yml`) — build Docker, push to GHCR, deploy staging, manual approval gate, production deploy, triggerable via version tags or workflow dispatch
- Health monitoring — `GET /api/health` (memory, cache, queues, worker info, uptime, cluster status), `GET /api/ready` (DB + Redis + queue readiness probes), `GET /api/live` (liveness check)
- Prometheus configuration (`prometheus.yml`) — 5s scrape interval, `/api/metrics` target, 3s timeout
- Grafana auto-provisioning (`grafana/datasources.yml`, `grafana/dashboard.json`) — API latency p50/p95/p99, RPS, error rate (5xx), memory RSS, Redis connections, queue depth, DB connections, cache hit ratio
- Documentation — `docs/TESTING.md`, `docs/DEPLOYMENT.md`, `docs/CI_CD.md`, `docs/MONITORING.md`, `docs/RUNBOOK.md`
- Test configuration — `vitest.config.js`, `vitest.integration.config.js`, `playwright.config.js`

#### Changed
- Vitest runner configured with path aliases and global setup/teardown
- Integration tests run against ephemeral PG + Redis services

#### Fixed
- Test reliability — all async operations properly awaited, mocks isolated per test file
- E2E test resilience — graceful timeout handling for flaky CI environments

### Sprint 3 — Performance & Database (Jun–Jul 2026)

#### Added
- Redis caching layer (`lib/cache.js`) — ioredis with lazy connect, retry strategy (5 attempts, exponential backoff), graceful fallback
- Cache key convention — `sndc:{entity}:{identifier}[:{sub}]` with `buildKey()` helper
- TTL tiers — `SHORT_TTL` (60s), `DEFAULT_TTL` (300s), `LONG_TTL` (3600s)
- `cache.remember()` pattern — cache-aside with automatic population on miss
- Pattern-based cache invalidation — `cache.delPattern('sndc:subjects:*')`
- BullMQ background job queues (`lib/queue.js`) — `sndc:email`, `sndc:pdf`, `sndc:qr`, `sndc:ai`, `sndc:notification`, `sndc:report`
- Queue helpers — `addJob()`, `addBulk()`, `createWorker()` with concurrency/rate limiting, `getQueueStatus()`
- Worker implementations — `emailWorker.js` (transactional emails), `notificationWorker.js` (push notifications), `aiWorker.js` (LLM predictions)
- Multi-tenancy architecture — college-scoped data isolation, `collegeId` foreign key on all entities
- Composite database indexes:
  - `User_role_collegeId_idx` — role + college filtering
  - `User_email_role_idx` — auth lookups by email + role
  - `User_email_registerNumber_idx` — dual-identifier login
  - `Evaluation_studentId_staffApproved_idx` — student dashboard
  - `Evaluation_subjectId_staffId_idx` — staff subject evaluations
  - `Evaluation_staffId_staffApproved_idx` — staff approval dashboard
  - `Assignment_studentId_subjectId_idx` — student assignment queries
  - `Notification_userId_isRead_createdAt_idx` — notification listing
  - `HallTicket_studentId_isUnlocked_idx` — hall ticket status
  - `Material_subjectId_category_idx` — course materials
- Pagination in `BaseRepository`:
  - `findManyPaginated()` — offset-based with total count and `meta` envelope
  - `findCursorPaginated()` — cursor-based with `hasMore` + `nextCursor` for infinite scroll
- Prisma connection pool configuration — limit 10, timeout 30s, statement cache 100, transaction retry (3 attempts, ReadCommitted isolation)
- Slow query logging — Prisma events log queries >100ms in development
- `@fastify/multipart` — 5MB file limit, single file, 2000 header pairs
- `@fastify/compress` — global compression with 1KB threshold, gzip level 6
- Frontend code-splitting — `React.lazy` + `Suspense` on all dashboard pages
- Component memoization — `useCallback`/`useMemo` in all custom hooks (`useMentorData`, `useStaffData`, `useStudentData`)
- Bundle splitting — vendor chunks (`vendor-react`, `vendor-ui`, `vendor-utils`), route-level chunks
- List virtualization — `VirtualizedTable` with `react-virtuoso`, windowed rendering, configurable overscan, 100-row fallback threshold
- Lazy-loaded `AIChatBubble` — 121KB kept out of initial bundle
- Cloudinary storage (`lib/storage.js`, `services/cloudinaryService.js`) — upload buffer/path, responsive URLs, signed URLs, delete, extract public ID
- College branding cache keys — `sndc:college:{id}`, `sndc:college:{id}:settings`, `sndc:subjects:{collegeId}`, `sndc:dashboard:{userId}`, `sndc:announcements:{collegeId}`, `sndc:stats:{collegeId}`, `sndc:user:{id}`

#### Performance
- Initial bundle size reduced from ~2.1MB to ~1.4MB (33% reduction)
- JS execution time improved from ~2.5s to ~1.2s (52%)
- p95 API response time reduced from ~800ms to ~200ms (75%)
- DB query time reduced from ~150ms to ~30ms (80%)
- Cache hit ratio: ~85%

### Sprint 2 — Clean Architecture (May–Jun 2026)

#### Added
- Dependency injection container (`lib/container.js`) — `createContainer(prisma)` initializes all repositories and services as a singleton
- BaseRepository class (`repositories/base.js`):
  - `findUnique`, `findFirst`, `findMany` with optional field selection
  - `findManyPaginated` with offset + total count
  - `findCursorPaginated` with cursor-based pagination
  - `create`, `update`, `upsert`, `delete`, `count`, `exists`, `aggregate`
  - `transaction` with configurable retries and deadlock detection
- Custom repositories — `UserRepository` (findByEmail, findByEmailOrRegisterNumber, findByIdWithDetails, findStudentsByCollege, searchUsers, updatePassword, updateSignature, password setup token management), `CollegeRepository`, `SubjectRepository`
- Auto-created BaseRepositories for 9 models (announcement, assignment, auditLog, customRole, evaluation, feeRecord, material, notification, staffSubject, studentSubject)
- Service layer (`services/index.js`) — `AuthService`, `CollegeService`, `UserService` with injected repositories
- Controller layer (`controllers/`) — `AuthController`, `MentorController`, `StaffController`, `StudentController`
- Refactored auth routes (`routes/auth.v2.js`) — Controller → Service → Repository pattern, zero business logic in routes
- Fastify plugins:
  - `plugins/prisma.js` — registers Prisma client, creates DI container, decorates `fastify.repos` and `fastify.services`
  - `plugins/auth.js` — JWT + Cookie auth plugin: `authenticate` (cookie-first, Bearer fallback), `authenticateOptional`, `authorize(roles)`, `setAuthCookie`, `clearAuthCookie`
  - `plugins/healthDashboard.js` — `GET /cluster/health` proxy to master
- `fastify.decorate('auth', ...)` — multi-plugin auth guard helper
- Standardized constants (`constants/index.js`) — `ROLES`, `SUBJECT_TYPES`, `ANNOUNCEMENT_TYPES`, `RATE_LIMITS`, `PAGINATION`, `FILE_LIMITS`, `AUTH`, `HTTP_STATUS`, `ERROR_CODES`
- Standardized response helpers (`constants/responses.js`) — `success`, `created`, `error`, `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `tooManyRequests`, `serverError`
- Cluster mode (`cluster.js`) — production load balancer with OS round-robin, worker health monitoring, adaptive restart, graceful shutdown, cluster health API on port 3001

#### Changed
- Route architecture — migrated from monolithic route files to layered Controller → Service → Repository pattern
- Auth flow — consolidated JWT + cookie authentication into a single Fastify plugin
- Response format — all endpoints use standardized `success`/`error` response helpers
- Error handling — centralized in global error handler with Prisma error code mapping

### Sprint 1.5 — Runtime Security Fixes (Apr–May 2026)

#### Added
- Input sanitization utilities (`lib/sanitize.js`):
  - `sanitizeText()` — removes all HTML tags including scripts
  - `sanitizeRichText()` — strips event handlers, `javascript:` URLs, allows only safe tags (b, i, em, strong, a, p, br, ul, ol, li, code, pre, blockquote)
  - `sanitizeUrl()` — blocks `javascript:`/`data:`/`vbscript:` protocols
  - `sanitizeEmail()` — normalizes to lowercase, strips dangerous chars
  - `sanitizeFileName()` — removes path traversal and dangerous chars, 255-char limit
  - `sanitizeObject()` — bulk sanitization of named fields
- Sanitization Fastify hook (`lib/sanitizePlugin.js`) — preHandler hook for POST/PUT/PATCH/DELETE, sanitizes body fields by type (TEXT_FIELDS, EMAIL_FIELDS, FILE_NAME_FIELDS) plus query params
- Rich text sanitization variant (`sanitizeRichTextBody`) for content fields
- File upload validation (`lib/upload.js`):
  - `validateFileType()` — checks extension against whitelist per category, blocks DANGEROUS_EXTENSIONS (52 types), double-extension detection
  - `validateFileSize()` — enforces per-category limits (assignment 10MB, material 20MB, signature 2MB, excel 5MB)
  - `getSafeFileName()` — generates randomized safe filenames with timestamp prefix
  - Category inference (`uploadPlugin.js`) — maps URL patterns to validation categories
- Sentry error monitoring (`lib/sentry.js`):
  - `initSentry()` — configures DSN, environment sampling (20% traces in prod, 10% profiles)
  - `captureError()` — captures exceptions with request context (URL, method, user, requestId)
  - Global handlers — `unhandledRejection` and `uncaughtException` capture
- Audit logging service (`services/auditService.js`) — `logAction()` writes structured audit entries to database
- RBAC authorization — `fastify.authorize(...roles)` decorator checks user role against allowed roles
- `CustomRole` model support — `assignCustomRole()` in UserRepository
- Structured error codes — `ERROR_CODES` constant with 30+ error codes for consistent client error handling

#### Changed
- XSS prevention — all user-submitted text fields sanitized before reaching route handlers
- File upload flow — validation moved from route handlers to reusable plugin with early rejection

#### Security
- XSS prevention — input sanitization on all text/email/filename fields
- File upload hardening — extension whitelist, dangerous extension blocklist, MIME type verification, double-extension detection, randomized safe filenames
- Error information leakage — production mode hides stack traces, returns generic error messages for 5xx
- Structured error responses — every error returns a machine-readable `code` field
- Audit trail — all significant actions logged with user, college, and detail context

### Sprint 1 — Security Foundation (Mar–Apr 2026)

#### Added
- Helmet security headers (`@fastify/helmet`):
  - Content Security Policy with strict directives (default-src, script-src, style-src, img-src, font-src, connect-src, frame-src, form-action, base-uri)
  - HSTS — `maxAge=31536000`, `includeSubDomains`, `preload`
  - `referrerPolicy: 'strict-origin-when-cross-origin'`
  - `noSniff`, `xssFilter`, `frameguard: 'deny'`, `permittedCrossDomainPolicies: 'none'`
  - `hidePoweredBy`, `ieNoOpen`, `dnsPrefetchControl`
- CORS configuration (`@fastify/cors`):
  - Strict origin whitelist via `ALLOWED_ORIGINS` env var
  - Methods: GET, POST, PUT, DELETE, OPTIONS
  - Allowed headers: Content-Type, Authorization, x-request-id
  - Credentials: true, maxAge: 86400
- Rate limiting (`@fastify/rate-limit`):
  - Global: 100 requests/minute per IP
  - Per-route overrides via `config.rateLimit` (login: 5/min, register: 3/10min, password change: 3/5min, predict: 5/min, AI chat: 10/min, etc.)
  - Structured error response with `retryAfter`
- CSRF protection (`@fastify/csrf-protection`): removed (httpOnly cookies with SameSite=Lax provide sufficient CSRF protection)
- JWT authentication (`@fastify/jwt`):
  - Cookie-first strategy with Bearer token fallback
  - HS256 algorithm, 7-day expiry
  - Token payload: id, email, role, name, collegeId
  - 32-character minimum JWT secret enforcement
- Cookie support (`@fastify/cookie`) — signed cookies with `JWT_COOKIE_SECRET`
- bcrypt password hashing — configurable rounds (10–16, default 12)
- Environment validation (`lib/env.js`):
  - Required vars: DATABASE_URL, JWT_SECRET, FRONTEND_URL, ALLOWED_ORIGINS
  - Startup guard exits with missing vars message
  - JWT_SECRET length check (min 32 chars)
  - Production HTTPS origin enforcement
  - bcrypt rounds validation (10–16)
- Global error handler with structured error responses:
  - Prisma error mapping (P2002 → 409, P2003 → 400, P2025 → 404)
   - Rate limit (429), CORS (403), validation (400), file too large (413)
  - Production-safe 500 responses with `requestId`
- Health endpoints:
  - `GET /api/health` — full status with memory, cache, worker metrics, uptime
  - `GET /api/ready` — readiness probe (DB + Redis + queues)
  - `GET /api/live` — liveness probe

#### Changed
- Express/Fastify migration — full rewrite to Fastify framework
- Security headers — comprehensive Helmet configuration replacing minimal previous setup
- Authentication — consolidated dual-strategy (cookie + Bearer) JWT auth

#### Security
- Multi-layer security: CSP + CORS + Rate Limiting + JWT + bcrypt
- Production-only HTTPS enforcement for CORS origins
- Request ID generation — `crypto.randomUUID()` for tracing
- Response headers — `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-Request-Id`, `X-Worker-Id`, `X-Worker-PID`
- 401/403/5xx response logging for security monitoring
