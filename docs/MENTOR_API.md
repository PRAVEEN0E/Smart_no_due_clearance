# Mentor Module API

Base path: `/api/mentor`

Auth: `Bearer <token>` — requires `MENTOR` or `SUPERADMIN` role.

---

## Staff Management

| Method | Path | Schema | Description |
|--------|------|--------|-------------|
| GET | `/staff` | — | List all staff (college-scoped) |
| GET | `/staff/:id` | `getStaff` | Get single staff |
| POST | `/staff` | `createStaff` | Create staff (sends setup email) |
| PUT | `/staff/:id` | `updateStaff` | Update staff name/email/password |
| DELETE | `/staff/:id` | `deleteStaff` | Soft-delete (sets `deletedAt`) |
| POST | `/staff/:id/restore` | `getStaff` | Restore soft-deleted staff |

**POST `/staff` body:**
```json
{ "name": "string", "email": "string", "password": "string", "role": "STAFF" }
```

---

## Student Management

| Method | Path | Schema | Description |
|--------|------|--------|-------------|
| GET | `/students` | `listStudents` | Paginated list with search/filter/sort |
| POST | `/students` | `createStudent` | Create student (creates feeRecord, sends setup email) |
| PUT | `/students/:id` | `updateStudent` | Update student details |
| DELETE | `/students/:id` | `deleteStudent` | Soft-delete (sets `deletedAt`) |
| POST | `/students/:id/restore` | `getStaff` | Restore soft-deleted student |
| DELETE | `/students/:id/permanent` | `deleteStudent` | Permanently delete (Super Admin only) |

**GET `/students` query params:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Page number (default: 1) |
| `limit` | int | Items per page (1-100, default: 50) |
| `search` | string | Search name/email/registerNumber |
| `department` | string | Filter by department |
| `className` | string | Filter by class |
| `feeStatus` | `cleared\|pending\|all` | Filter by fee status |
| `archived` | `true\|false` | Include soft-deleted |
| `sortBy` | string | Field to sort by (default: `createdAt`) |
| `sortOrder` | `asc\|desc` | Sort direction (default: `desc`) |

**Response:**
```json
{ "success": true, "message": "Success", "data": [...], "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 1 } }
```

---

## Subject Management

| Method | Path | Schema | Description |
|--------|------|--------|-------------|
| GET | `/subjects` | — | List subjects (cached) |
| POST | `/subjects` | `createSubject` | Create subject (invalidates cache) |
| PUT | `/subjects/:id` | `updateSubject` | Update subject |
| DELETE | `/subjects/:id` | `deleteSubject` | Soft-delete (sets `deletedAt`) |
| POST | `/subjects/:id/restore` | `deleteSubject` | Restore soft-deleted |
| DELETE | `/subjects/:id/permanent` | `deleteSubject` | Permanently delete (Super Admin only) |

---

## Assignments

| Method | Path | Schema | Description |
|--------|------|--------|-------------|
| POST | `/assign/staff` | `assignStaff` | Assign staff to subject |
| POST | `/assign/student` | `assignStudent` | Assign student to subject (creates Evaluation) |

---

## Fee Management

| Method | Path | Schema | Description |
|--------|------|--------|-------------|
| PUT | `/fees/:studentId` | `updateFee` | Manual fee clearance toggle |
| POST | `/bulk-add-common-fee` | `commonFee` | Add fee amount to all students |
| POST | `/bulk-fees` | — | Upload Excel with fee updates |
| POST | `/bulk-students` | — | Upload Excel to bulk-create students |
| GET | `/export/fees` | — | Download fee balance Excel |
| GET | `/export/pdf/fees` | — | Download fee report PDF |

---

## Announcements

| Method | Path | Schema | Description |
|--------|------|--------|-------------|
| GET | `/announcements` | — | List active announcements (cached) |
| POST | `/announcements` | `createAnnouncement` | Create (priority ≥2 triggers email) |
| PUT | `/announcements/:id` | `updateAnnouncement` | Update |
| DELETE | `/announcements/:id` | `deleteAnnouncement` | Soft-delete |
| POST | `/announcements/:id/restore` | `deleteAnnouncement` | Restore |

---

## Audit & Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/audit-logs` | Paginated audit log with search/filter |
| GET | `/analytics` | Cached dashboard stats (student/staff/subject counts, clearance rates, class/dept stats) |

**GET `/audit-logs` query params:** `page`, `limit`, `search`, `action`, `userEmail`, `dateFrom`, `dateTo`

---

## Hall Tickets

| Method | Path | Schema | Description |
|--------|------|--------|-------------|
| GET | `/hall-tickets` | `listHallTickets` | Paginated list with stats (ready/blocked/fees pending/approvals pending) |

**Response:**
```json
{ "success": true, "message": "Success", "data": [...], "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 1 }, "stats": { "total": 0, "ready": 0, "blocked": 0, "pendingFees": 0, "pendingApprovals": 0, "noSubjects": 0 } }
```

---

## AI Features

| Method | Path | Schema | Description |
|--------|------|--------|-------------|
| GET | `/ai/summary/:studentId` | `aiSummary` | Academic insights for a student |
| GET | `/ai/at-risk` | — | List at-risk students (fee + academic flags) |

---

## College & Workflow

| Method | Path | Schema | Description |
|--------|------|--------|-------------|
| GET | `/college` | — | Get college settings (cached) |
| PUT | `/college/workflow` | `updateWorkflow` | Update clearance workflow |
| PUT | `/students/:studentId/custom-clearance` | `customClearance` | Toggle custom clearance step |

---

## Standardized Response Format

**Success:**
```json
{ "success": true, "message": "string", "data": {} }
```

**Success with pagination:**
```json
{ "success": true, "message": "string", "data": [], "meta": { "total": 0, "page": 1, "limit": 10, "totalPages": 1 } }
```

**Error:**
```json
{ "success": false, "error": "string", "code": "ERROR_CODE" }
```

**Validation error:**
```json
{ "error": "Validation Error", "message": "Invalid request data.", "details": [...], "code": "VALIDATION_ERROR" }
```

**Auth error:**
```json
{ "error": "Unauthorized", "message": "string", "code": "AUTH_TOKEN_INVALID" }
```

**Forbidden:**
```json
{ "error": "Forbidden", "message": "string", "code": "AUTH_INSUFFICIENT_ROLE" }
```

---

## Soft Delete + Restore Pattern

All delete operations are **soft deletes** (set `deletedAt` timestamp). Restore clears it. Permanent delete requires `SUPERADMIN` role and cascades.

| Resource | Soft delete | Restore | Permanent |
|----------|------------|---------|-----------|
| Staff | `DELETE /staff/:id` | `POST /staff/:id/restore` | — |
| Student | `DELETE /students/:id` | `POST /students/:id/restore` | `DELETE /students/:id/permanent` |
| Subject | `DELETE /subjects/:id` | `POST /subjects/:id/restore` | `DELETE /subjects/:id/permanent` |
| Announcement | `DELETE /announcements/:id` | `POST /announcements/:id/restore` | — |
