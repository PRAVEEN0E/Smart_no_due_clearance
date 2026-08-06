# NoDueNest — System Architecture

## 1. System Architecture Overview

The application follows a **3-tier architecture** with strict separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT TIER (React/Vite)                 │
│  Nginx (prod) │ Vite Dev Server (dev)                       │
│  React SPA    │ Zustand State │ Axios HTTP                  │
└──────────┬──────────────────────────────────────────────────┘
           │  HTTP/HTTPS (REST + JSON)
           │  Cookie-based JWT Auth / Bearer Token fallback
           ▼
┌─────────────────────────────────────────────────────────────┐
│                   API TIER (Node.js/Fastify)                │
│                                                             │
│  Cluster Master (cluster.js) — Round-robin load balancer    │
│  ┌─────────────┬──────────────┬──────────────┐              │
│  │  Worker 1   │  Worker 2    │  Worker N    │              │
│  │  Fastify    │  Fastify     │  Fastify     │              │
│  └──────┬──────┴──────┬───────┴──────┬───────┘              │
│         │             │              │                       │
│  ┌──────┴─────────────┴──────────────┴───────┐              │
│  │        Shared Services Layer               │              │
│  │  Controllers → Services → Repositories     │              │
│  └────────────────────────────────────────────┘              │
│         │             │              │                       │
│  ┌──────┴─────────────┴──────────────┴───────┐              │
│  │        Infrastructure Layer                │              │
│  │  Redis Cache │ BullMQ Queue │ Sentry       │              │
│  └────────────────────────────────────────────┘              │
└──────────┬──────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA TIER                                  │
│  PostgreSQL 16 (Primary)                                     │
│  Redis 7 (Cache + Queue Backend)                             │
│  Cloudinary (File Storage)                                   │
│  Groq API (AI/LLM)                                           │
└─────────────────────────────────────────────────────────────┘
```

### Tier Responsibilities

| Tier | Technology | Responsibility |
|------|-----------|----------------|
| **Client** | React 18 + Vite | SPA routing, UI rendering, form validation |
| **API** | Fastify (Node.js) | Request handling, business logic, auth, caching, background jobs |
| **Data** | PostgreSQL 16 | Persistent storage via Prisma ORM |

---

## 2. Folder Structure

### Server (`server/`)

```
server/
├── server.js                 # Fastify app entry — middleware stack, route registration, health endpoints
├── cluster.js                # Production cluster master — forks workers, heartbeat monitoring, health API
├── config/
│   └── swagger.js            # OpenAPI 3.0 schema definitions (tags, security schemes, component schemas)
├── constants/
│   ├── index.js              # Enums: ROLES, SUBJECT_TYPES, RATE_LIMITS, PAGINATION, AUTH, ERROR_CODES, HTTP_STATUS
│   └── responses.js          # Standardized response helpers (success/created/error/badRequest/notFound/etc.)
├── plugins/
│   ├── prisma.js             # Registers Prisma client, creates DI container (repos + services)
│   ├── auth.js               # JWT + Cookie auth plugin — authenticate, authorize, setAuthCookie, clearAuthCookie
│   └── healthDashboard.js    # /cluster/health endpoint for SUPERADMIN — proxies cluster master health port
├── lib/
│   ├── cache.js              # Redis cache layer — get/set/del/remember/delPattern, Prometheus metrics integration
│   ├── queue.js              # BullMQ queue abstraction — getQueue/addJob/addBulk/createWorker/getQueueStatus
│   ├── prisma.js             # Shared PrismaClient singleton with slow-query logging in dev
│   ├── container.js          # Simple DI container — initializes repositories and services
│   ├── sentry.js             # Sentry initialization — captures unhandled rejections/exceptions
│   ├── sanitize.js           # Input sanitization utilities (strip HTML/script tags)
│   ├── sanitizePlugin.js     # Fastify preHandler hook — sanitizes POST/PUT/PATCH/DELETE body & query
│   └── env.js                # Environment variable validation on startup
├── routes/
│   ├── auth.v2.js            # Auth routes (login, logout, change-password, setup-password, bootstrap, profile)
│   ├── student.js            # Student routes — marks viewing, hall ticket, assignments, attendance
│   ├── staff.js              # Staff routes — marks entry, attendance scanning, material upload
│   ├── mentor.js             # Mentor routes — student management, clearance oversight
│   ├── mentor.v2.js          # Refactored mentor routes (Controller pattern)
│   ├── superadmin.js         # SuperAdmin routes — college CRUD, impersonation, system management
│   ├── materials.js          # Course materials routes
│   └── notifications.js      # Notification routes
├── controllers/
│   ├── authController.js     # Auth — login, changePassword, setupPassword, bootstrap, profile, auditLogs
│   ├── studentController.js  # Student operations
│   ├── staffController.js    # Staff operations
│   └── mentorController.js   # Mentor operations
├── services/
│   ├── index.js              # Service factory — creates AuthService, CollegeService, UserService
│   ├── authService.js        # Authentication logic, password management, bootstrap, registration
│   ├── userService.js        # User CRUD, search, bulk operations
│   ├── collegeService.js     # College CRUD, settings management
│   ├── marksCalculator.js    # Internal marks computation engine (CATs, assignments, activities, attendance)
│   ├── aiService.js          # Groq LLM integration — feedback, prediction, chat, insights, Q&A, remedial plans
│   ├── cloudinaryService.js  # Cloudinary upload stream/buffer, signed URL generation
│   ├── hallTicketService.js  # Hall ticket unlock logic — workflow validation, PDF generation, QR embedding
│   ├── pdfService.js         # Browser/chromium PDF generation
│   ├── qrService.js          # QR code generation for hall ticket verification
│   ├── emailService.js       # Email sending via EmailJS
│   ├── notificationService.js # In-app notification creation
│   ├── auditService.js       # Audit logging for security-sensitive operations
│   ├── excelService.js       # Excel export/import utilities
│   └── reportService.js      # Reporting utilities
├── repositories/
│   ├── index.js              # Repository factory — auto-creates repos for all Prisma models
│   ├── base.js               # BaseRepository — generic CRUD with pagination, cursor pagination, transactions
│   ├── userRepository.js     # User-specific queries (findByEmail, findByRegisterNumber, password tokens, etc.)
│   ├── collegeRepository.js  # College-specific queries
│   └── subjectRepository.js  # Subject-specific queries
├── workers/
│   ├── index.js              # Worker registration — email, notification, AI workers
│   ├── emailWorker.js        # Processes EMAIL queue jobs
│   ├── notificationWorker.js # Processes NOTIFICATION queue jobs
│   └── aiWorker.js           # Processes AI queue jobs (feedback generation)
├── middleware/               # (reserved for custom middleware)
├── prisma/
│   └── schema.prisma         # Database schema — 15 models, enums, relations, indexes
├── scripts/                  # Database seed/migration scripts
├── uploads/                  # Local file storage (assignments/, halltickets/, materials/, signatures/)
├── __tests__/                # Unit, integration, load, and E2E tests
├── prometheus.yml            # Prometheus scrape configuration (5s interval, /api/metrics)
├── grafana/
│   ├── dashboard.json        # Pre-built Grafana dashboard (API latency, RPS, error rate, memory, queues)
│   └── datasources.yml       # Auto-provisioned Prometheus datasource
└── Dockerfile                # Multi-stage Alpine build — deps → builder → runner (non-root, health check)
```

### Client (`client/`)

```
client/
├── src/
│   ├── main.jsx              # React entry point
│   ├── App.jsx               # Root component with routing
│   ├── index.css             # TailwindCSS base styles
│   ├── lib/
│   │   ├── api.js            # Axios instance — 401 handler, offline detection
│   │   └── sentry.js         # Client-side Sentry initialization
│   ├── store/
│   │   └── authStore.js      # Zustand store — user state, login/logout, session management
│   ├── context/              # React context providers
│   ├── hooks/                # Custom React hooks
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # Generic UI primitives (buttons, inputs, modals, etc.)
│   │   ├── mentor/           # Mentor-specific components
│   │   ├── staff/            # Staff-specific components
│   │   ├── AIChatBubble.jsx  # AI tutor chat interface
│   │   ├── AnnouncementTicker.jsx
│   │   ├── CourseMaterials.jsx
│   │   ├── EmptyState.jsx
│   │   ├── ErrorBoundary.jsx
│   │   ├── LoadingScreen.jsx
│   │   ├── NotificationBell.jsx
│   │   └── Skeletons.jsx
│   └── pages/
│       ├── auth/             # Login, password setup
│       ├── student/          # Student dashboard, marks, hall ticket, attendance
│       ├── staff/            # Staff dashboard, marks entry, scanning
│       ├── mentor/           # Mentor dashboard, student management
│       ├── superadmin/       # College management, impersonation
│       └── Verification.jsx  # QR hall ticket verification page
├── vite.config.js            # Vite config — React plugin, manual chunks, dev proxy
├── nginx.conf                # Nginx SPA routing, API proxy, gzip, HSTS
├── Dockerfile                # Multi-stage Alpine + Nginx, non-root
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 3. Data Flow

A complete request lifecycle follows this path:

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────────┐
│  Client   │───▶│  Route   │───▶│Controller │───▶│ Service  │───▶│ Repository   │
│ (React)   │    │ (Fastify)│    │(AuthCtrl) │    │(AuthSvc) │    │ (UserRepo)   │
└──────────┘    └──────────┘    └───────────┘    └──────────┘    └──────┬───────┘
                                                                        │
                                                                        ▼
                                                                 ┌──────────────┐
                                                                 │  PostgreSQL   │
                                                                 │  (Prisma ORM) │
                                                                 └──────────────┘
```

### Detailed Request Flow (Login Example)

1. **Client** → POST `/api/auth/login` with `{ email, password }` via Axios
2. **Middleware stack** (in order):
   - `onRequest` hook — tracks request count, sets security headers
   - `preHandler` — HTML sanitization of POST body
   - `@fastify/rate-limit` — checks rate limits (5 req/min for login)

   - Route-specific `preHandler` — none for login (public)
3. **Route** (`routes/auth.v2.js`) calls `controller.login(req, rep)`
4. **Controller** (`controllers/authController.js`) validates body, calls `this.auth.authenticate()`
5. **Service** (`services/authService.js`):
   - Calls `this.users.findByEmailOrRegisterNumber(email)` on repository
   - Repository executes Prisma query against PostgreSQL
   - Service compares password with bcrypt
   - Signs JWT with `fastify.jwt.sign({ id, email, role, collegeId })`
   - Returns user data and token
6. **Controller** sets auth cookie via `fastify.setAuthCookie(reply, token)`
7. **Response** → `{ success: true, data: { user: {...} } }`

### Caching Layer

The cache is checked/set at the **service layer**, not in repositories:

```
Service ──▶ Cache (Redis) ──▶ Repository ──▶ Database
              │                                  │
              └── Cache hit ─── return cached ───┘
              └── Cache miss ─── query DB ─── store in cache ─── return
```

Key patterns used:
- `cache.remember(key, ttl, fn)` — atomic check-then-fetch pattern
- `cache.delPattern(pattern)` — invalidate by prefix (e.g., `sndc:college:*`)

---

## 4. Authentication Flow

### JWT-Based Authentication with Cookie Storage

```
┌──────────────┐                    ┌──────────────────┐
│   Login      │                    │  Fastify Server   │
│   Form       │                    │                   │
├──────────────┤                    ├──────────────────┤
│ POST /login  │───────────────────▶│ Validate creds    │
│ email+pass   │                    │ bcrypt.compare()  │
└──────────────┘                    │                   │
        ◀───────────────────────────│ Sign JWT (HS256)  │
        │ Set-Cookie: token=<jwt>   │                    │
        │ httpOnly, secure,         │                    │
        │ sameSite=lax, maxAge=7d   └────────────────────┘
```

### Token Architecture

| Property | Value |
|----------|-------|
| Algorithm | HS256 |
| Expiry | 7 days |
| Storage | httpOnly cookie (primary) + Bearer header (fallback) |
| Payload | `{ id, email, role, name, collegeId, isMaintenance }` |

### Role-Based Access Control (RBAC)

```javascript
// From constants/index.js
ROLES = { STUDENT, STAFF, MENTOR, SUPERADMIN }
```

| Role | Capabilities |
|------|-------------|
| **STUDENT** | View marks, download hall ticket, submit assignments, view attendance, chat with AI tutor |
| **STAFF** | Enter/update marks, scan QR attendance, upload course materials |
| **MENTOR** | Create/manage students, approve clearance, override marks, generate hall ticket |
| **SUPERADMIN** | Manage colleges, impersonate users, access cluster health, system-wide operations |

### Guard Implementation

```javascript
// plugins/auth.js
fastify.decorate('authenticate', async (request, reply) => {
    // Try cookie first, then Authorization header
    await request.jwtVerify({ decode: { complete: true } });
});

fastify.decorate('authorize', (...roles) => {
    return async (request, reply) => {
        if (!roles.includes(request.user.role)) {
            reply.status(403).send({ code: 'AUTH_INSUFFICIENT_ROLE' });
        }
    };
});

// Usage in routes:
preHandler: [fastify.authenticate, fastify.authorize('MENTOR', 'SUPERADMIN')]
```

### Password Lifecycle

1. **Mentor creates student** → system generates `passwordSetupToken` (24h expiry)
2. **Student sets password** via `POST /auth/setup-password` with token
3. **Flag change**: `needsPasswordChange` forces password update on first login
4. **Password change** via `POST /auth/change-password` (requires current password)

---

## 5. Multi-Tenancy (College Isolation)

Each `College` is a tenant. All data is scoped via `collegeId` foreign key.

```
College (tenant)
├── Users (students, staff, mentors)
├── Subjects (unique code per college)
├── Announcements (college-scoped or global)
├── CustomRoles (RBAC extensions per college)
├── AuditLogs (college-scoped)
└── Branding (logo, colors, controller/principal names)
```

### College Workflow Customization

Each college defines its own **clearance workflow** via the `workflow` JSON field:

```json
[
  { "id": "FEES", "label": "Financial Dues", "type": "FEE", "required": true },
  { "id": "ACADEMICS", "label": "Academic Approvals", "type": "STAFF_APPROVAL", "required": true },
  { "id": "LIBRARY", "label": "Library Clearance", "type": "CUSTOM", "required": false },
  { "id": "SPORTS", "label": "Sports Department", "type": "CUSTOM", "required": false }
]
```

The clearance engine (`services/hallTicketService.js`) iterates over these steps and checks:
- **FEE** type → `FeeRecord` table
- **STAFF_APPROVAL** type → all evaluations `staffApproved === true`
- **CUSTOM** type → student's `customClearance` JSON object

### Isolation Enforcement

- All models with `collegeId` field are filtered in repository queries
- SUPERADMIN role bypasses college isolation (can see all colleges)
- Indexes on `collegeId` columns ensure query performance
- Subject codes are unique `@@unique([code, collegeId])` — not globally unique

---

## 6. Key Modules

### 6.1 Clearance Workflow System

The clearance system is the core business logic. It orchestrates multiple checks before unlocking a student's hall ticket.

```
Student Created
      │
      ▼
Fee Clearance ───▶ FeeRecord.feeClearedAuto ∨ feeClearedManual
      │
      ▼
Academic Approval ───▶ All evaluations staffApproved === true
      │
      ▼
Custom Clearance ───▶ student.customClearance[step.id].cleared
      │
      ▼
Hall Ticket Unlocked ───▶ PDF generated, QR embedded, email sent
```

**Files:**
- `services/hallTicketService.js` — orchestration logic, PDF generation
- `services/qrService.js` — QR code generation
- `services/pdfService.js` — browser-based PDF rendering
- `services/emailService.js` — email notification on unlock

### 6.2 Marks / Evaluation System

The marks system handles CAT exams, assignments, activities, and attendance computation.

**Marks Calculation** (`services/marksCalculator.js`):

| Component | Max Marks | Calculation |
|-----------|-----------|-------------|
| CAT (best 2 of 3) | 20 | `(bestTwoSum / 100) * 20` |
| Assignments (5) | 10 | `(sum / 50) * 10` |
| Activities (2) | 5 | `(sum / 20) * 5` |
| Attendance | 5 | Bucket-based (≥95% → 5, ≥90% → 4, etc.) |
| **Total Internal** | **40** | Sum of all above |

- **Remedial exams**: replace CAT scores if higher
- **Subject types**: FULL_THEORY, FULL_LAB, THEORY_WITH_LAB (affects lab marks inclusion)
- **AI prediction**: `aiService.predictStudentSuccess()` evaluates risk based on CATs, attendance, and assignments

### 6.3 Fee Management

Simple fee tracking per student:

```
FeeRecord
├── studentId (unique)
├── feeBalance (current dues as float)
├── feeClearedAuto (system-checked)
├── feeClearedManual (mentor-override)
└── clearedAt (timestamp)
```

- No payment gateway integration — fees are recorded externally
- Automatic clearance can be toggled by SUPERADMIN
- Manual override by MENTOR for edge cases

### 6.4 Hall Ticket Generation

When all clearance steps pass, the system:

1. Generates a **verification code**: `VAL-${random 6-char uppercase}`
2. Generates a **QR code** containing verification URL
3. Renders **HTML** with college branding, student info, subject schedule, QR, signatures
4. Converts to **PDF** via Puppeteer/Chromium
5. Saves PDF to `uploads/halltickets/`
6. Stores record in `HallTicket` table with `isUnlocked`, `pdfUrl`, `qrCodeData`, `verificationCode`
7. Sends **in-app notification** and **email** to student

### 6.5 Notification System

```
┌────────────╥──────────────────────────────────────────────┐
│  Producer  ║  Queue (BullMQ / Redis)                      │
├────────────╫──────────────────────────────────────────────┤
│ Service    ║  sndc_notification queue                      │
│ calls      ║                                                │
│ sendNotif()║  ┌──────────┐    ┌────────────────────┐      │
└────────────╨──▶   Queue   │───▶  NotificationWorker │      │
                 └──────────┘    └─────────┬──────────┘      │
                                           ▼                  │
                                   ┌──────────────┐          │
                                   │  PostgreSQL   │          │
                                   │ notifications │          │
                                   │   table       │          │
                                   └──────────────┘          │
```

Types: `INFO`, `SUCCESS`, `WARNING`, `URGENT`
Students fetch unread notifications with pagination (indexed by `[userId, isRead, createdAt]`)

### 6.6 File Upload System (Cloudinary)

```
Client upload
      │
      ▼
@fastify/multipart ───▶ File stream
      │                       │
      ▼                       ▼
Local storage           Cloudinary upload
(uploads/*/)            (cloudinaryService.js)
  │                       │
  ▼                       ▼
@fastify/static         CDN URL stored
serves files            in database
```

**Upload limits:**
- Body: 10MB
- Upload file: 5MB
- Assignment: 10MB
- Material: 20MB
- Signature: 2MB

**Storage directories:** `assignments/`, `halltickets/`, `materials/`, `signatures/`

### 6.7 AI Feedback System (GROQ)

The system uses Groq's `llama-3.3-70b-versatile` model for five distinct features:

| Feature | Service Method | Purpose |
|---------|---------------|---------|
| **Assignment Feedback** | `generateFeedback()` | Constructive feedback on submitted work |
| **Success Prediction** | `predictStudentSuccess()` | Risk analysis based on marks & attendance |
| **AI Tutor Chat** | `chatWithAI()` | Contextual academic assistant with student data |
| **Academic Insights** | `generateAcademicInsights()` | Personalized subject-level recommendations |
| **Important Q&A** | `generateImportantQA()` | Exam-focused question generation from syllabus |
| **Remedial Study Plan** | `generateRemedialPlan()` | 5-day targeted study plan for at-risk students |

All AI jobs are queued via BullMQ (`sndc_ai` queue) for async processing.

### 6.8 QR Attendance Scanning

Staff scan QR codes to mark attendance:

```
Staff scans QR ───▶ /verify/hallticket/:studentId
                           │
                           ▼
                   Create ExamAttendance record
                   { studentId, subjectId, scannedById,
                     scannedAt, session, date }
```

- Prevents duplicate attendance with `@@unique([studentId, subjectId, date, session])`
- Each scan is logged with timestamp and staff identity
- Used for hall ticket verification during exams

---

## 7. Technology Stack

### Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js 20+ | JavaScript runtime |
| Framework | Fastify 5 | High-performance HTTP server with plugin architecture |
| ORM | Prisma 5 | Type-safe database access with migrations |
| Database | PostgreSQL 16 | Primary data store |
| Cache | Redis 7 (via ioredis) | Caching, session store, queue backend |
| Queue | BullMQ | Background job processing |
| Authentication | @fastify/jwt + @fastify/cookie | JWT tokens in httpOnly cookies |
| Validation | @fastify/schema (JSON Schema) | Request validation |
| Security | @fastify/helmet, @fastify/cors, @fastify/rate-limit | Security headers, CORS, rate limiting |
| Documentation | @fastify/swagger + @fastify/swagger-ui | OpenAPI 3.0 docs at `/docs` |
| Monitoring | prom-client + @sentry/node | Prometheus metrics + Sentry error tracking |
| Testing | Vitest, autocannon, Playwright | Unit, integration, load, E2E tests |

### Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | React 18 | UI library |
| Build | Vite 6 | Fast dev server and optimized builds |
| Styling | TailwindCSS | Utility-first CSS |
| State | Zustand | Lightweight state management |
| HTTP | Axios | HTTP client with interceptors |
| Charts | Recharts | Data visualization |
| Animation | Framer Motion | UI animations |
| Icons | Lucide React | Icon library |
| Notifications | react-hot-toast | Toast notifications |
| Deployment | Nginx (Docker) | Static file serving, SPA routing |

### Infrastructure

| Component | Technology |
|-----------|-----------|
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Registry | GitHub Container Registry (GHCR) |
| Error Tracking | Sentry |
| Monitoring | Prometheus + Grafana |
| AI/LLM | Groq API (llama-3.3-70b-versatile) |
| File Storage | Cloudinary |
| Email | EmailJS |

---

## 8. Security Architecture

### Defense Layers

```
┌──────────────────────────────────────────────────────────┐
│ Layer 1: Network / Transport                              │
│  HTTPS (production) │ HSTS (1 year, preload)              │
├──────────────────────────────────────────────────────────┤
│ Layer 2: HTTP Headers (Helmet)                            │
│  CSP │ X-Frame-Options: DENY │ X-Content-Type-Options    │
│  Referrer-Policy │ Permitted-Cross-Domain-Policies        │
│  Hide-Powered-By │ IE-No-Open │ DNS-Prefetch-Control      │
├──────────────────────────────────────────────────────────┤
│ Layer 3: CORS                                             │
│  Whitelist origins │ Credentials: true │ Methods: GET,    │
│  POST, PUT, DELETE, OPTIONS │ Max-Age: 86400              │
├──────────────────────────────────────────────────────────┤
│ Layer 4: Rate Limiting                                    │
│  Global: 100 req/min │ Per-route: Login 5/min,           │
│  Register 3/10min, Predict 5/min, etc.                    │
├──────────────────────────────────────────────────────────┤
│ Layer 6: Input Validation & Sanitization                  │
│  JSON Schema validation (Fastify)                         │
│  HTML tag stripping (sanitizePlugin.js)                   │
│  Email normalization (lowercase, trim)                    │
│  File type / size limits (multipart config)               │
├──────────────────────────────────────────────────────────┤
│ Layer 7: Authentication & Authorization                   │
│  JWT with HS256 │ httpOnly cookies │ 7-day expiry         │
│  Role-based guards (authenticate + authorize)             │
│  Maintenance mode enforcement (per-college)               │
├──────────────────────────────────────────────────────────┤
│ Layer 8: Error Handling                                   │
│  No stack traces in production                            │
│  Standardized error codes (ERROR_CODES enum)              │
│  Sentry captures all 400+ errors with context             │
└──────────────────────────────────────────────────────────┘
```

### Content Security Policy

```javascript
default-src 'self';
script-src 'self' 'unsafe-inline' https://vercel.live;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https://res.cloudinary.com https://*.cloudinary.com;
font-src 'self' https://fonts.gstatic.com data:;
connect-src 'self' <FRONTEND_URL> https://api.emailjs.com https://api.groq.com;
frame-src 'none';
object-src 'none';
upgrade-insecure-requests (production only);
```

---

## 9. Scalability

### 9.1 Redis Caching

```javascript
// Cache key namespace: sndc:<entity>:<id>
KEYS = {
    college: (id) => `sndc:college:${id}`,
    subjects: (collegeId) => `sndc:subjects:${collegeId}`,
    dashboard: (userId) => `sndc:dashboard:${userId}`,
    user: (id) => `sndc:user:${id}`,
    stats: (collegeId) => `sndc:stats:${collegeId}`,
}
```

- **TTL tiers**: SHORT (60s), DEFAULT (300s), LONG (3600s)
- **Cache-aside pattern**: `remember(key, ttl, fn)` — cache hit returns, cache miss computes and stores
- **Invalidation**: `delPattern('sndc:college:*')` for bulk invalidation on data changes
- **Prometheus metrics**: `sndc_cache_hits_total`, `sndc_cache_misses_total`
- **Graceful degradation**: Redis failure → queries go directly to database (no crash)

### 9.2 BullMQ Queue Workers

```javascript
QUEUES = { EMAIL, PDF, QR, AI, NOTIFICATION, REPORT }
```

| Queue | Worker | Concurrency | Purpose |
|-------|--------|-------------|---------|
| `sndc_email` | emailWorker | 5 | Send transactional emails |
| `sndc_notification` | notificationWorker | 5 | Create in-app notifications |
| `sndc_ai` | aiWorker | 5 | Process AI feedback generation |
| `sndc_pdf` | (planned) | — | PDF generation offloading |
| `sndc_qr` | (planned) | — | QR code generation offloading |
| `sndc_report` | (planned) | — | Report generation offloading |

**Job lifecycle:** `waiting → active → completed/failed`

- Jobs auto-remove: completed after 1h (max 100 kept), failed after 24h (max 50 kept)
- Rate limiter: 50 jobs/second per worker
- Queue depths tracked via Prometheus gauge (`bullmq_queue_waiting_count`)

### 9.3 Cluster Mode

`cluster.js` implements a production load balancer:

```
┌─────────────────────────────────────────────┐
│         Cluster Master (PID: 1)             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Worker 1│ │ Worker 2│ │ Worker N│       │
│  │  :3000  │ │  :3000  │ │  :3000  │       │
│  └────┬────┘ └────┬────┘ └────┬────┘       │
│       │           │           │             │
│  OS Round-Robin (Socket sharding)           │
└─────────────────────────────────────────────┘
        │
        ▼
  Health Dashboard (port 3001)
  └── /cluster/health — worker status, memory, restart counts
```

**Features:**
- Auto-detects CPU cores (or `CLUSTER_WORKERS` env override)
- Heartbeat monitoring every 5s (10s timeout)
- Auto-restart with exponential backoff (1s → 30s max)
- Graceful shutdown with 30s connection draining
- IPC-based shared rate-limit coordination
- Accessible via `/cluster/health` (SUPERADMIN only)

---

## 10. Monitoring

### Health Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /api/health` | Worker health | Cache status, queue status, memory, uptime |
| `GET /api/ready` | Readiness probe | DB + Redis + Queue connectivity (503 if DB/Redis down) |
| `GET /api/live` | Liveness probe | Returns `{ alive: true }` |
| `GET /api/metrics` | Prometheus metrics | Text format for scraping |
| `GET /cluster/health` | Cluster dashboard | Worker list, rate limiter, memory per worker |

### Prometheus Metrics

```javascript
// Default metrics (with 'sndc_' prefix)
sndc_cpu_*, sndc_heap_*, sndc_event_loop_*, etc.

// Custom metrics
http_request_duration_seconds  { method, route, status }  // Histogram
http_requests_total            { method, route, status }   // Counter
sndc_cache_hits_total                                      // Counter
sndc_cache_misses_total                                    // Counter
bullmq_queue_waiting_count     { queue }                   // Gauge
```

### Grafana Dashboard

Located at `server/grafana/dashboard.json`, pre-configured panels:

| Panel | Metric |
|-------|--------|
| Request Rate (RPS) | `rate(http_requests_total[1m])` |
| Error Rate | `sum(rate(http_requests_total{status=~"5.."}[1m]))` |
| P95/P99 Latency | `histogram_quantile(0.95/0.99, http_request_duration_seconds_bucket)` |
| Memory Usage | `process_resident_memory_bytes` |
| Cache Hit Ratio | `rate(sndc_cache_hits_total[5m]) / (rate(sndc_cache_misses_total[5m]) + rate(sndc_cache_hits_total[5m]))` |
| Queue Depth | `bullmq_queue_waiting_count` |
| Worker Uptime | Per-worker uptime from `/cluster/health` |

### Sentry Error Tracking

- Captures all 400+ errors with request context (URL, method, user)
- Configurable trace sampling (20% in prod, 0% in dev)
- Process-level `unhandledRejection` and `uncaughtException` handlers
- Environment-tagged (production vs development)

---

## Database Schema Summary

### Models (15 total)

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **College** | id, name, domain, workflow (JSON), branding fields | users[], subjects[], announcements[] |
| **User** | id, name, email, registerNumber, passwordHash, role, collegeId, customClearance (JSON) | college, evaluations[], feeRecord, hallTicket, notifications[] |
| **Subject** | id, name, code, type, collegeId, semester, examDate, examSession | staffAssignments[], studentAssignments[], evaluations[] |
| **Evaluation** | id, studentId, subjectId, CATs 1-3, assignments 1-5, activities 1-2, attendancePercent, staffApproved, aiPrediction | student, staff, subject |
| **FeeRecord** | id, studentId (unique), feeBalance, feeClearedAuto, feeClearedManual | student |
| **Assignment** | id, studentId, subjectId, fileUrl, aiFeedback | student, subject |
| **HallTicket** | id, studentId (unique), isUnlocked, pdfUrl, qrCodeData, verificationCode | student |
| **Notification** | id, userId, title, message, type, isRead | user |
| **ExamAttendance** | id, studentId, subjectId, scannedById, session, date | student, subject, scannedBy |
| **Announcement** | id, title, content, type, priority, collegeId | college, createdBy |
| **Material** | id, title, fileUrl, fileType, category, subjectId | subject, uploadedBy |
| **CustomRole** | id, name, permissions (JSON), collegeId | college, users[] |
| **AuditLog** | id, action, details, userId, collegeId | user, college |
| **StaffSubject** | id, staffId, subjectId (unique pair) | staff, subject |
| **StudentSubject** | id, studentId, subjectId (unique pair) | student, subject |

### Key Indexes

- `User`: `[collegeId]`, `[role]`, `[role, collegeId]`, `[email, role]`, `[email, registerNumber]`
- `Evaluation`: `[studentId, staffApproved]`, `[subjectId, staffId]`
- `Notification`: `[userId, isRead, createdAt]`
- `ExamAttendance`: `@@unique([studentId, subjectId, date, session])`
- `Subject`: `@@unique([code, collegeId])`

---

## Docker Deployment Architecture

```
docker-compose.yml
├── postgres:16-alpine       Port: 5432   Health: pg_isready
├── redis:7-alpine           Port: 6379   Health: redis-cli ping
├── backend                  Port: 3000   Health: /api/health
│   └── Dockerfile (multi-stage alpine, non-root user)
└── frontend                 Port: 80     Health: wget /
    └── Dockerfile (multi-stage alpine + nginx, non-root)
      └── nginx.conf (SPA fallback, API proxy, gzip)
```

- All services on `sndc-net` bridge network
- Volumes: `pgdata` (persistent), `redisdata` (persistent)
- Docker Compose override for dev hot-reload

---

## Testing Architecture

| Test Type | Framework | Location | Count |
|-----------|-----------|----------|-------|
| Unit | Vitest | `server/__tests__/` | 126 across 10 files |
| Integration | Vitest | `server/__tests__/` | 5 across 1 file |
| Load | autocannon/k6 | `server/__tests__/load/` | 2 scenarios |
| E2E | Playwright | `e2e/` | Login + navigation flow |

```bash
cd server && npm test                  # 141 unit + integration tests
cd server && npm run test:integration  # integration tests only
cd server && node __tests__/load/benchmark.js  # benchmark
cd client && npx playwright test       # E2E tests
```

---

## API Documentation

Swagger/OpenAPI 3.0 documentation is auto-generated and available at:

- **Dev**: `http://localhost:3000/docs`
- **Configuration**: `server/config/swagger.js`
- Tags: Auth, Users, Colleges, Subjects, Mentor, Staff, Student, Materials, Notifications, SuperAdmin, System
- Security schemes: `cookieAuth` (httpOnly JWT cookie) and `bearerAuth` (Bearer token fallback)
