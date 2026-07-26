# Mentor, Staff & Super Admin — Proposed New Features

> Audit-based gap analysis of features currently **not implemented** in the mentor, staff, and super admin modules.

---

## Mentor Module

### Existing features
- Staff CRUD (create, list, get, update, delete)
- Student CRUD (create, list, update, delete, bulk Excel upload)
- Subject CRUD (create, list, update, delete)
- Staff↔Subject assignment, Student↔Subject assignment
- Fee management (bulk upload, bulk add common fee, individual override, export XLSX/PDF)
- Announcement CRUD
- Analytics (student/staff/subject counts, clearance rates, class/dept stats)
- College settings & workflow customization
- Per-student custom clearance toggles

### Proposed new features

| # | Feature | What to build | Reuses |
|---|---------|---------------|--------|
| 1 | **Dashboard Overview Cards** | Key metrics at a glance: total students, pending approvals, clearance rate, fee defaults. Cards with trend indicators. | Existing `/mentor/analytics` data + cache |
| 2 | **Bulk Subject Creation** | Upload a CSV/Excel with subject name, code, type, semester, exam date → batch-create subjects. Include validation and duplicate detection. | `excelService` pattern, existing `POST /subjects` logic |
| 3 | **Staff Assignment Dashboard** | Visual table showing all staff members and which subjects they are assigned to. Inline assign/unassign actions without navigating. | `StaffSubject` model, `assign/staff` route logic |
| 4 | **Student Subject Assignment UI** | Grid/table showing which students are enrolled in which subjects. Filter by class, department. Bulk assign or remove. | `StudentSubject` model, `assign/student` route logic |
| 5 | **Activity Feed / Recent Changes** | A paginated log of recent actions within the mentor's college (marks updates, approvals, fee changes). | `AuditLog` model, existing collegeId filter |
| 6 | **Download Student List** | Export all students (filtered by class/dept) as CSV or Excel with columns: name, email, registerNumber, className, department, feeBalance. | `excelService` pattern, existing `GET /students` query |
| 7 | **Subject-wise Clearance Report** | For each subject, show: total students enrolled, how many approved, average marks, pending count. Exportable as PDF/Excel. | `Evaluation.staffApproved`, `StudentSubject`, `Subject` |
| 8 | **Department Management** | CRUD interface for departments. Assign departments to subjects and staff. Dashboard filtered by department. | New `Department` model OR use existing `User.department` string |
| 9 | **Email History Log** | Track which welcome/setup emails were sent, to whom, and whether delivery succeeded or failed. | `EmailJob` log in DB, existing `sendWelcomeEmail` |
| 10 | **Student Marks Overview** | See all students' marks at a glance across subjects. Filter by subject, class. Identify students with low performance. | `Evaluation` model with subject joins |
| 11 | **Bulk Staff Invite** | Create multiple staff accounts at once via CSV upload (name, email, department columns). Each gets a setup email. | `bulk-students` pattern, existing `POST /staff` + email flow |
| 12 | **Hall Ticket Management** | View which students have unlocked hall tickets and which haven't. Manually trigger hall ticket regeneration for a student. | `HallTicket.isUnlocked`, `checkAndUnlock` service |
| 13 | **Academic Year / Semester Management** | Set current active semester for the college. Archive previous semester data. Students auto-filtered by semester. | New `AcademicYear` model or `College.meta` JSON field |
| 14 | **Mentor Profile Settings** | Update own profile: name, department, password. Customize dashboard layout preferences. | `PUT /mentor/profile` route, existing `User` model |

### Priority matrix

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P0 | Dashboard Overview Cards | Low | High |
| P0 | Staff Assignment Dashboard | Low | High |
| P0 | Student Subject Assignment UI | Low | High |
| P1 | Subject-wise Clearance Report | Low | Medium |
| P1 | Student Marks Overview | Low | Medium |
| P1 | Activity Feed | Medium | Medium |
| P1 | Download Student List | Low | Medium |
| P2 | Bulk Subject Creation | Medium | Medium |
| P2 | Department Management | Medium | Medium |
| P2 | Hall Ticket Management | Low | Low |
| P2 | Mentor Profile Settings | Low | Medium |
| P3 | Email History Log | Medium | Low |
| P3 | Bulk Staff Invite | Medium | Low |
| P3 | Academic Year Management | High | Medium |

---

## Staff Module

### Existing features
- View assigned subjects (cached)
- View students per subject (paginated)
- View evaluations with student + subject details
- Update marks per evaluation (with remedial validation logic)
- Approve evaluations (triggers hall ticket check + email)
- Regenerate AI feedback for assignments
- Analytics (mark distribution chart + CAT trend data)
- Export marks as Excel (per subject)
- Export marks as PDF (per subject)
- Verify scanned student (QR scan → fee/academic/hall ticket check)
- Live scan stream (SSE broadcast)
- Exam attendance marking (during QR verification flow)

### Proposed new features

| # | Feature | What to build | Reuses |
|---|---------|---------------|--------|
| 1 | **Assignment Review Dashboard** | View all student-submitted assignments for assigned subjects with file preview and AI feedback displayed. Mark as reviewed. | `Assignment` model, existing `POST /regenerate-feedback` |
| 2 | **Manual Feedback Entry** | Allow staff to write/edit the `aiFeedback` text for each assignment instead of only regenerating AI feedback. | `PUT /assignments/:id/feedback` route, `Assignment.aiFeedback` |
| 3 | **Bulk Marks Entry (Excel)** | Download a template XLSX with student list, fill in CAT/assignment marks, upload → batch-update evaluations. | `excelService` parse pattern, `PUT /marks/:evalId` logic |
| 4 | **Student Performance Alerts** | Dashboard shows students flagged for: attendance < 75%, CAT scores <25, high risk of failure (from aiPrediction data). | `Evaluation.attendancePercent`, `Evaluation.aiPrediction` |
| 5 | **Subject-wise Report Card** | Generate a consolidated PDF report per student showing all CAT scores, internal total, attendance, approval status across subjects. | `reportService` pattern, existing evaluation data |
| 6 | **Communication Panel** | Send in-app notification or email to individual students or groups (e.g., "all students below 75% attendance"). | `Notification` model, `emailService`, `addJob` pattern |
| 7 | **Class Attendance Management** | View/edit attendance percentages for students per subject. Bulk update attendance from an Excel sheet. | `Evaluation.attendancePercent`, excel parse pattern |
| 8 | **Grade Distribution Charts** | Enhanced analytics: histogram, box plot, percentile breakdown per subject. Compare across CATs. | Existing analytics endpoint, charting library |
| 9 | **Late Submission Tracker** | Flag assignments submitted past due date (if deadline feature added). Show late count per student. | `Assignment.submittedAt`, hypothetical `dueDate` field |
| 10 | **Draft Marks / Save Progress** | Allow saving marks as draft before final submission. Staff can edit drafts before approving. | New `draft` boolean on `Evaluation` or separate draft state |
| 11 | **Marks Audit Trail Viewer** | See who changed what marks and when for each evaluation. Audit log filtered per student/subject. | `AuditLog.action = 'MARK_UPDATE'`, existing audit data |
| 12 | **Exam Attendance Report** | View/download exam attendance records for subjects assigned to staff. Per-session (FN/AN) breakdown. | `ExamAttendance` model, joined with subjects |
| 13 | **Personal Dashboard** | Quick summary: total students assigned, pending approval count, overdue assignments, recent changes. | Aggregate existing query data |
| 14 | **Profile & Password Settings** | Update own profile and change password from staff dashboard. | `PUT /staff/profile`, `POST /auth/change-password` |

### Priority matrix

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P0 | Assignment Review Dashboard | Low | High |
| P0 | Student Performance Alerts | Low | High |
| P1 | Manual Feedback Entry | Low | Medium |
| P1 | Personal Dashboard | Low | High |
| P1 | Marks Audit Trail Viewer | Low | Medium |
| P1 | Grade Distribution Charts | Low | Medium |
| P2 | Bulk Marks Entry (Excel) | Medium | High |
| P2 | Communication Panel | Medium | Medium |
| P2 | Profile & Password Settings | Low | Medium |
| P2 | Subject-wise Report Card | Medium | Medium |
| P2 | Exam Attendance Report | Low | Low |
| P3 | Class Attendance Management | Medium | Medium |
| P3 | Late Submission Tracker | Medium | Low |
| P3 | Draft Marks / Save Progress | Medium | Low |

---

## Super Admin Module

### Existing features
- College CRUD (create, list, update, delete)
- User management (update user details, search)
- Impersonate any user (15-min short-lived JWT)
- System statistics (college/user/student/mentor counts, mock growth data)
- Maintenance mode toggle per college
- Global audit log viewer
- Broadcast announcements (system-wide)
- RBAC: Custom role CRUD per college
- Global search (users across colleges)
- Audit logs with college info

### Proposed new features

| # | Feature | What to build | Reuses |
|---|---------|---------------|--------|
| 1 | **System Health Dashboard** | Real-time status: DB connection, Redis status, queue depths, worker count, memory/CPU usage. Colored indicators (green/red). | `/api/health`, `/api/ready`, `prom-client` metrics, `cache.status()` |
| 2 | **API Usage Monitoring** | Track request volume per route, per college, per hour. Display top endpoints, error rate trends, latency percentiles. | Prometheus metrics (`http_requests_total`, `http_request_duration_seconds`) |
| 3 | **Data Export / Backup** | Trigger database backup, export all colleges' data as JSON/CSV, scheduled export configuration. | Prisma queries, existing `excelService`/`reportService` patterns |
| 4 | **Multi-College Comparison Report** | Side-by-side comparison of colleges: student count, clearance rate, fee collection, average marks, active users. | Aggregate queries across `collegeId` |
| 5 | **College Branding Manager** | Upload/manage logos, set primary/secondary colors, affiliation text, controller/principal names for each college. | `College.logoUrl`, `College.primaryColor`, etc. |
| 6 | **Audit Log Advanced Search & Export** | Filter audit logs by action type, date range, college, user. Export filtered results as CSV/PDF. | `AuditLog` model, search params, `excelService` |
| 7 | **User Activity Timeline** | For any user, show a chronological timeline of actions (login, marks update, approval, fee change) from audit logs. | `AuditLog` filtered by userId |
| 8 | **System Configuration Editor** | UI to update system-wide constants: attendance threshold, rate limits, max file sizes, bcrypt rounds — without editing code. | New `SystemConfig` model or JSON config file |
| 9 | **Email Template Editor** | Edit welcome email, marks update email, hall ticket email templates from admin UI. Preview before saving. | Email templates in `emailService.js`, new `EmailTemplate` model |
| 10 | **Queue / Worker Monitoring** | View BullMQ queue stats: waiting, active, delayed, failed jobs. Retry or remove failed jobs. Worker availability. | `lib/queue.js`, `GET /api/metrics`, BullMQ admin UI |
| 11 | **Session Management** | View active user sessions across the system. Force-logout a user (invalidate their token). | Requires token blacklist in Redis or `lastTokenIssuedAt` field on User |
| 12 | **Bulk User Operations** | Create/update/delete users across multiple colleges. Transfer students between colleges. Merge duplicate accounts. | Existing bulk patterns, transactional logic |
| 13 | **System Announcement History** | View all past system-wide announcements with delivery status (queued, sent, failed per email). | `Announcement` model, email job results |
| 14 | **Sub-Admin Role Management** | Create limited admin roles (e.g., "Auditor" who can view logs but not modify). Extend existing `CustomRole` to control API routes. | `CustomRole.permissions` JSON, `authorize` guard enhancement |
| 15 | **Fee Reconciliation Dashboard** | Total fee collected vs pending per college, per department. Identify defaulters across institutions. | `FeeRecord.feeBalance`, aggregated queries |
| 16 | **Super Admin Profile & Security** | Change own password, manage API keys, view own login history, configure 2FA. | `POST /auth/change-password`, new `TwoFactorAuth` model |
| 17 | **Rate Limit Configuration UI** | View current rate limit settings per endpoint. Adjust limits without restarting the server. | `@fastify/rate-limit` dynamic config, new `RateLimitConfig` model |

### Priority matrix

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P0 | System Health Dashboard | Low | High |
| P0 | Queue / Worker Monitoring | Low | High |
| P1 | Audit Log Advanced Search & Export | Medium | High |
| P1 | Multi-College Comparison Report | Medium | High |
| P1 | User Activity Timeline | Low | Medium |
| P1 | College Branding Manager | Low | Medium |
| P1 | Fee Reconciliation Dashboard | Low | Medium |
| P2 | API Usage Monitoring | Medium | Medium |
| P2 | System Configuration Editor | Medium | Medium |
| P2 | Bulk User Operations | Medium | Medium |
| P3 | Data Export / Backup | Medium | Low |
| P3 | Email Template Editor | High | Low |
| P3 | Session Management | High | Medium |
| P3 | Sub-Admin Role Management | High | Medium |
| P3 | Rate Limit Configuration UI | High | Low |
| P3 | Super Admin Security Settings | Medium | Medium |

---

## Cross-Module Features (Shared)

These span multiple modules and could be built once for all roles:

| # | Feature | Modules | What to build |
|---|---------|---------|---------------|
| 1 | **Dark Mode / Theme Toggle** | All | Persist theme preference in `localStorage`, CSS variables already exist |
| 2 | **Data Export (CSV/Excel)** | All | Generic export utility accepting column config + data array |
| 3 | **In-App Notification System** | All | Real-time notifications via WebSocket/SSE for events (marks updated, approved, hall ticket ready) |
| 4 | **Row-Level Pagination / Search** | All | Consistent search + pagination component across all data tables |
| 5 | **Activity Feed Widget** | Mentor + Staff + Super Admin | Reusable dashboard widget showing recent actions from audit log |
| 6 | **Bulk Action Confirmation Modals** | All | Standard "Are you sure? This will affect N records" dialog for destructive actions |
| 7 | **Session Timeout Warning** | All | Show warning 60s before JWT expiry, auto-redirect to login on expiry |

---

## Implementation Philosophy

All features listed here:
1. **Reuse existing models** unless explicitly stated (no schema changes for P0 items)
2. **Follow the existing route pattern** (Fastify preHandler guards → route handler → Prisma query)
3. **Use existing services** (cache, queue, email, excel, audit) without new infrastructure
4. **Require no architectural changes** — they layer on top of the current Controller → Service → Repository pattern
