# Mentor Module — Architecture & Data Flow

## Module Overview

The Mentor Module provides a comprehensive dashboard for managing students, staff, subjects, fees, announcements, hall tickets, and clearance workflows within a college context. It serves as the primary administrative interface between Super Admins and day-to-day academic operations.

---

## Directory Structure

```
server/
  routes/mentor.js              # 39 endpoint handlers (1180 lines)
  schemas/mentor.schema.js      # JSON Schema validation for all endpoints
  services/
    excelService.js             # Excel parsing (students, fees)
    emailService.js             # Welcome/setup email sending
    reportService.js            # PDF report generation
    hallTicketService.js        # Hall ticket unlock logic
    aiService.js                # Academic insight generation

client/src/
  pages/mentor/
    MentorDashboard.jsx         # Main dashboard page (orchestrates all components)
  components/mentor/
    MentorHeader.jsx            # Top navigation bar
    MentorStatsGrid.jsx         # 8 stat cards (students, staff, subjects, approvals, hall tickets, fees, etc.)
    MentorTable.jsx             # Table with pagination, search, sort, fee filter, restore buttons
    MentorModals.jsx            # 5 modals: clearance, enroll, add/edit, staff mapping, common fee
    MentorAnalyticsSidebar.jsx  # Slide-out analytics panel with subject chart
    WorkflowCustomizer.jsx      # Drag-and-drop clearance workflow designer
  hooks/
    useMentorData.js            # Server-side data fetching with debounced search, pagination, filters
```

---

## Data Flow

```
Browser → MentorDashboard → useMentorData hook → fetch() → Server (/api/mentor/*)
                                                            ↓
                                                     Fastify Router
                                                            ↓
                                              authenticate + authorize (MENTOR/SUPERADMIN)
                                                            ↓
                                                     Route Handler
                                                            ↓
                                                  Prisma ORM → PostgreSQL
                                                            ↓
                                          Cache layer (Redis) for subjects, announcements, analytics
                                                            ↓
                                          Response helpers → Standardized JSON { success, message, data }
```

---

## Authentication & Authorization

1. **`@fastify/auth`** pipeline: `authenticate` → `authorize(['MENTOR', 'SUPERADMIN'])`
2. Auth token: JWT in httpOnly cookie (`SameSite=Lax`) or `Bearer` header
3. Role granularity:
   - `SUPERADMIN` — full access across all colleges
   - `MENTOR` — scoped to own college, manages staff/students created by them
   - `STAFF` — no access to mentor routes (can only evaluate marks)

## College Scoping

All queries include `collegeId` filter derived from the authenticated user. The `buildCollegeFilter()` and `buildStudentFilter()` helpers enforce scoping:

| Role | Staff/Subjects scope | Students scope |
|------|---------------------|----------------|
| SUPERADMIN | All colleges | All colleges |
| MENTOR (admin@college.edu) | Own college | Own college |
| MENTOR (regular) | Own college, own created | Own college |

---

## Key Patterns

### Soft Delete
All deletable resources (`User`, `Subject`, `Announcement`) use `deletedAt` timestamp:
- Soft delete: `UPDATE ... SET deletedAt = NOW()`
- Restore: `UPDATE ... SET deletedAt = NULL`
- Permanent delete: `DELETE ... WHERE id = :id` (Super Admin only, cascades)

### Audit Logging
Every CRUD operation calls `logAudit(fastify, action, details, request)` which writes to the `AuditLog` table with: `action`, `details`, `userId`, `userEmail`, `collegeId`.

### Caching
- **Subjects**: `sndc:subjects:{collegeId}` (long TTL)
- **Announcements**: `sndc:announcements:{collegeId}` (short TTL)
- **Analytics**: `sndc:analytics:{userId}` (short TTL)
- Cache invalidated on create/update/delete operations

### Pagination
All list endpoints support: `page`, `limit`, `search`, `sortBy`, `sortOrder`, plus domain-specific filters (`department`, `className`, `feeStatus`, `action`, `dateFrom`, `dateTo`).

### Response Standardization
All responses now use the `constants/responses.js` helpers:
- `success(reply, data, message, meta)` — `{ success: true, message, data, meta? }`
- `badRequest(reply, message)` — `{ success: false, error, code }` (400)
- `forbidden(reply, message)` — `{ success: false, error, code }` (403)
- `notFound(reply, message)` — `{ success: false, error, code }` (404)
- `conflict(reply, message)` — `{ success: false, error, code }` (409)
- `serverError(reply, message)` — `{ success: false, error, code }` (500)

---

## Endpoint Groups

| Group | Count | Key routes | Models |
|-------|-------|------------|--------|
| Staff | 6 | CRUD + restore | `User (role: STAFF)` |
| Students | 6 | CRUD + restore + permanent | `User (role: STUDENT)`, `FeeRecord` |
| Subjects | 6 | CRUD + restore + permanent | `Subject` |
| Assignments | 2 | Staff/student to subject | `StaffSubject`, `StudentSubject` |
| Fees | 5 | Update, bulk upload, common fee, exports | `FeeRecord` |
| Announcements | 5 | CRUD + restore | `Announcement` |
| Audit/Analytics | 2 | Logs, dashboard stats | `AuditLog`, aggregate queries |
| Hall Tickets | 1 | Paginated list with status | `HallTicket`, `FeeRecord`, `Evaluation` |
| AI | 2 | Summary, at-risk detection | `Evaluation`, `FeeRecord` |
| College | 2 | Settings, workflow | `College` |

---

## Batch Processing

### Fee Bulk Add
```
POST /bulk-add-common-fee
  → Find all students in college
  → UpdateMany FeeRecord (increment balance)
  → UpdateMany HallTicket (lock if fee added)
  → Enqueue batch email jobs via addBulk()
```

### Excel Bulk Import
```
POST /bulk-students
  → Parse Excel → for each row:
      if existing email:
        update if same college, skip if different
      else:
        create user + feeRecord + send setup email
  → Return results array with status/reason per row
```

### Email Queue
High-priority announcements (priority ≥ 2) trigger batched email jobs via BullMQ (`addBulk` with chunk size of 50 recipients per job).
