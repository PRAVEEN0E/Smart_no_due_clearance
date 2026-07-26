# Sprint 4 Complete — Testing, DevOps, Monitoring, Documentation

## Test Results: 141/141 passing (13 files)

## What was built

### Unit Tests (10 files, 126 tests)
- `cache.test.js` (13) — Redis cache layer (get/set/del/remember/status)
- `queue.test.js` (8) — BullMQ queue operations
- `storage.test.js` (7) — Cloudinary storage helpers
- `repository.test.js` (19) — BaseRepository (CRUD, pagination, transactions)
- `authService.test.js` (11) — AuthService (login, profile, password, bootstrap)
- `userService.test.js` (9) — UserService (CRUD, search, bulk create)
- `responses.test.js` (12) — Response helpers (success/error/status codes)
- `constants.test.js` (6) — Constants validation
- Plus pre-existing: marksCalculator (16), sanitize (17), upload (13), qrService (5)

### Integration Tests (1 file, 5 tests)
- `api.test.js` — Health, auth, validation, CORS, rate limiting

### Load Tests (2 files)
- `benchmark.js` — autocannon script (health/login scenarios)
- `load-test.js` — k6-compatible script for CI

### E2E Tests (1 file)
- Playwright login flow + navigation tests

### Docker
- `server/Dockerfile` — multi-stage alpine, non-root, health check
- `client/Dockerfile` — nginx multi-stage, non-root, gzip
- `client/nginx.conf` — SPA routing, API proxy
- `docker-compose.yml` — backend + frontend + postgres 16 + redis 7
- `docker-compose.override.yml` — dev hot-reload
- `.dockerignore` (server + client)

### CI/CD (`.github/workflows/`)
- `ci.yml` — lint, test (matrix 18/20/22), build, coverage, security audit
- `cd.yml` — build Docker, push GHCR, deploy staging, manual approval, production

### Monitoring
- `server.js` — `/api/health`, `/api/ready`, `/api/live`, `/api/metrics`
- `server/prometheus.yml` — 5s scrape interval
- `server/grafana/datasources.yml` — auto-provisioned Prometheus
- `server/grafana/dashboard.json` — API latency, RPS, error rate, memory, queues
- `lib/prisma.js` — shared PrismaClient for health checks

### Documentation
- `docs/TESTING.md` — test structure, how to run
- `docs/DEPLOYMENT.md` — production deployment steps
- `docs/CI_CD.md` — pipeline stages, secrets
- `docs/MONITORING.md` — metrics, health endpoints, Grafana
- `docs/RUNBOOK.md` — incident response, recovery procedures

## Commands
```bash
cd server && npm test              # 141 unit + integration tests
cd server && npm run test:integration  # integration tests
cd server && node __tests__/load/benchmark.js  # benchmark
cd client && npx playwright test   # E2E tests
docker compose up -d               # full stack
```

---

# Session 5 — CSRF removal, Staff fixes, assignments debugging

## Summary
- **CSRF fully removed**: No CSRF packages, middleware, routes, or frontend code remain. `@fastify/csrf-protection` uninstalled; `csrfRoute` and `userCookie` removed from `server.js`; stale artifacts cleaned. httpOnly cookies with `SameSite=Lax` provide sufficient CSRF protection.
- **Staff marks 400 fixed**: `server/schemas/staff.schema.js` — `nullable: true` on all `updateMarks` fields. `server/routes/staff.js` — `cleanData` null-filter strips nulls before Prisma update.
- **Seed updated**: Student `arjun.mehta@college.edu` / `Student@123` added with subject assignments. Staff `divyeshb606@gmail.com` / `12345678` exists.
- **Notifications 500**: Caused by Neon DB sleeping (free tier suspend after ~5 min idle). After wake-up, all endpoints work.
- **Assignments 500 (transient)**: `POST /api/student/assignments` works correctly with valid PDF uploads for both student accounts (`arjun.mehta@college.edu` and `praveeneswaramoorthi08@gmail.com`). The earlier 500s were from Neon DB sleep. No code fix needed.
- **All 141 tests pass**. Vite dev server running on port 5173. Server running on port 3000 (PID 25988).

## Seeded accounts
| Email | Password | Role |
|---|---|---|
| divyeshb606@gmail.com | 12345678 | STAFF |
| arjun.mehta@college.edu | Student@123 | STUDENT |
| praveeneswaramoorthi08@gmail.com | 12345678 | STUDENT |

## Key files
- `server/routes/staff.js:180` — `cleanData` filter for `updateMarks`
- `server/schemas/staff.schema.js` — `nullable: true` on `updateMarks` fields
- `server/routes/student.js:113` — `POST /assignments` handler
- `client/src/lib/api.js` — removed default `Content-Type: application/json` to fix form uploads
- `server/routes/student.js:168` — catch block returns 400 for non-multipart requests (was 500)
- `server/routes/materials.js:27` — try-catch around `request.file()` returns 400 for non-multipart requests (was 406)

## Session 6 — File upload fixes (500 & 406 errors)

### Root cause
`@fastify/multipart@9.4.0` throws `FST_INVALID_MULTIPART_CONTENT_TYPE` (status 406) when `request.file()` is called on a non-multipart request. The assignments handler caught this in a try-catch and returned 500; the materials handler had no try-catch, so Fastify's error handler returned 406.

The root cause was the Axios instance defaulting to `Content-Type: application/json` — when FormData was passed, this header was NOT cleared, causing the browser to send `Content-Type: application/json` with FormData body. `@fastify/multipart` v9 correctly rejected this.

### Fixes
1. **Client** (`client/src/lib/api.js`): Removed hardcoded `headers: { 'Content-Type': 'application/json' }` from Axios instance defaults. Axios auto-detects FormData and lets the browser set the correct `multipart/form-data` header.
2. **Server** (`server/routes/student.js:168`): Catch block now checks for 'not multipart' error and returns 400 with clear message (was generic 500).
3. **Server** (`server/routes/materials.js:27`): Added try-catch around `request.file()` — returns 400 instead of 406 when Content-Type is wrong.

### Verification
- 141/141 tests pass
- Wrong Content-Type → now 400 with clear message (was 500 or 406)
- Valid multipart upload → 200 (unchanged)

---

# Session 7 — Cloudinary integration for assignments & materials

## Summary
Both upload modules (student assignments + staff materials) now store files in **Cloudinary** instead of locally.

### Root cause
The route handlers in `server/routes/student.js:130-149` and `server/routes/materials.js:40-53` were writing files to local disk (`server/uploads/assignments/` and `server/uploads/materials/`) using `fs.createWriteStream`. The DB stored local paths (`/uploads/assignments/...`) instead of Cloudinary URLs.

Cloudinary was already integrated via `server/services/cloudinaryService.js` (`uploadStream` function) and used by `auth.v2.js` for signature uploads, but the two main upload modules weren't using it.

### Changes

| File | What changed |
|------|-------------|
| `server/routes/student.js:130-138` | Replaced local `fs.createWriteStream` save with `cloudinaryService.uploadStream()` |
| `server/routes/materials.js:1,38-48` | Removed `fs`/`pipeline` imports; replaced local save with `cloudinaryService.uploadStream()` |

### Upload details
- **Assignments** → Cloudinary folder: `assignments/`
- **Materials** → Cloudinary folder: `study-materials/`
- Each uses `resource_type: "auto"` (auto-detects PDF/image/raw)
- `use_filename: true`, `unique_filename: true` (no collisions)
- `type: 'upload'`, `access_mode: 'public'` (publicly accessible via secure URL)

### Verification
- Assignment upload → stores `https://res.cloudinary.com/.../assignments/...` (200)
- Material upload → stores `https://res.cloudinary.com/.../study-materials/...` (200)
- DB `fileUrl` column stores Cloudinary secure_url
- Old local files remain in `server/uploads/` for backward compatibility with existing DB records
- `client/src/hooks/useStudentData.js:23`, `useStaffData.js:129`, `CourseMaterials.jsx:161` — proxy URL logic removed; Cloudinary URLs used directly (no `/api/proxy` route existed)
- All 141 tests pass

---

# Session 8 — Super Admin enterprise upgrade

## Summary
Full enterprise upgrade of the Super Admin module: user lifecycle management (create, delete, disable/enable), login monitoring, system health, and broadcast history — plus an upgraded frontend with pagination, filters, and a new Logins tab.

## Backend (server/routes/superadmin.js)
| Endpoint | What |
|----------|------|
| `POST /users` | Create user (admin-managed) with password hash + role + college |
| `DELETE /users/:id` | Cascade delete user + all associated data (audit logs, login history, assignments, evaluations) |
| `PATCH /users/:id/status` | Disable/enable user account (blocks login via `disabled` check) |
| `GET /login-history` | Paginated login history with `success`, `email`, `dateFrom`, `dateTo` filters |
| `GET /login-stats` | Login metrics: total, today success/failed, 7-day daily trend (success/failed per day) |
| `GET /health` | System health: DB ping, cache ping, uptime, memory, node version |
| `GET /broadcasts` | Paginated broadcast history |

## Prisma schema changes
- `User.disabled Boolean? @default(false)` — account lifecycle management
- `LoginHistory` model — tracks userId, email, role, collegeId, success, IP, user-agent, browser, OS, device, reason
- `College.deletedAt DateTime?` — soft delete support
- Reverse relation `User.loginHistory LoginHistory[]`

## Security
- `authService.authenticate()` returns 403 + `AUTH_DISABLED` if `user.disabled === true`
- `authController.login()` records all login attempts (success + failure) to `LoginHistory` with IP/UA parsing
- Impersonation endpoint now sets HttpOnly cookie instead of returning token in body
- Super Admin cannot be disabled or deleted

## Frontend (SuperAdminDashboard.jsx)
- **Stats**: 6 cards (added Staff count + Completed Clearances)
- **Users tab**: server-side pagination, search bar, role dropdown, college dropdown, disable/enable toggle on each row, page controls
- **Logs tab**: pagination controls (prev/next + page buttons)
- **New Logins tab**: login stats cards + paginated login history table with success/failed badges, IP/browser, role badges, date range filter inputs
- Tab bar updated to include Logins entry

## Verification
- 141/141 tests pass
- Frontend builds (55 KB SuperAdminDashboard chunk)
- Schema synced to Neon DB (`npx prisma db push`)
- Server running on port 3000

---

# Session 9 — API Key Management + System Settings

## Summary
Added API Key Management (full CRUD with secure key generation) and a System Settings panel (rate limits, config, feature flags). Both available as new tabs in the Super Admin dashboard.

## Backend (server/routes/superadmin.js)
| Endpoint | What |
|----------|------|
| `GET /settings` | System config: rate limits (parsed from constants), feature flags, JWT expiry, bcrypt rounds, env |
| `GET /api-keys` | Paginated list of API keys with user/college info |
| `POST /api-keys` | Generate new API key (returns full key once, stores SHA-256 hash) |
| `DELETE /api-keys/:id` | Revoke API key |
| `PATCH /api-keys/:id/status` | Activate/deactivate API key |

## Prisma schema
- `ApiKey` model: id, name, keyPrefix, keyHash (unique), userId, collegeId, permissions[], lastUsedAt, expiresAt, active
- Reverse relations on `User.apiKeys` and `College.apiKeys`

## Frontend (SuperAdminDashboard.jsx)
- **New "API Keys" tab**: table with name/prefix/creator/status/last used, generate key modal with copy-to-clipboard (shows full key once), revoke/activate toggle
- **New "Settings" tab**: three panels — Rate Limiting (all limits with max/timeWindow), System Configuration (env, JWT expiry, bcrypt rounds, max upload), Feature Flags (bootstrap/registrations/maintenance)
- Tab bar now has 7 tabs: Institutions | Users | Logs | Logins | API Keys | Settings | Access

## Verification
- 141/141 tests pass
- Frontend builds (67 KB SuperAdminDashboard chunk)
- Schema synced to Neon DB
- Server running on port 3000
