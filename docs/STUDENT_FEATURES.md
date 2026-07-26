# Student Module — Proposed New Features

> Audit-based gap analysis of features currently **not implemented** in the student module.

---

## 1. Assignment Dashboard

**Current state:** Students can upload assignments (`POST /assignments`) and view individual AI feedback, but there is no aggregated view of all submissions with their feedback, grades, and submission dates.

**What to build:**
- `GET /student/assignments` — returns all assignments for the logged-in student, joined with subject name, aiFeedback, submittedAt
- A dedicated "My Assignments" page or section in `StudentDashboard.jsx` with a table/cards listing each submission, its status, and a button to view AI feedback

**Reuses:** Existing `Assignment` model, `fileUrl`, `aiFeedback`, `submittedAt`

---

## 2. Clearance Progress Tracker

**Current state:** The `/student/status` endpoint returns evaluations, fee record, and hall ticket separately. Students must interpret this raw data to understand how far they are from completion.

**What to build:**
- `GET /student/clearance-progress` — returns a structured summary:
  - `overallProgress` — percentage or fraction (e.g. `7/8` subjects cleared)
  - `subjects` — list with per-subject clearance (fee, academic approval, hall ticket unlock)
  - `feeCleared`, `academicCleared`, `hallTicketUnlocked` booleans
  - `pendingSubjects` — subjects where staff has not yet approved
- A progress bar visualization on the student dashboard (e.g. "7 of 8 steps complete")

**Reuses:** Existing `Evaluation.staffApproved`, `FeeRecord`, `HallTicket.isUnlocked`

---

## 3. Hall Ticket Download (Direct PDF)

**Current state:** `GET /student/hallticket` returns a URL to the PDF. There is no direct download endpoint or in-browser viewer.

**What to build:**
- `GET /student/hallticket/download` — streams the PDF with correct `Content-Disposition: attachment` header
- Or an in-app PDF viewer modal that loads the ticket without navigating away

**Reuses:** Existing `HallTicket.pdfUrl`, `HallTicket.qrCodeData`

---

## 4. Profile Management

**Current state:** Student has no way to update profile fields like `className`, `department`, or display preferences.

**What to build:**
- `PUT /student/profile` — schema-validated endpoint accepting optional fields (`className`, `department`)
- A simple profile/edit modal accessible from the dashboard header or settings

**Reuses:** Existing `User` model fields

---

## 5. Notification History View

**Current state:** Backend sends notifications (marks update, approval, hall ticket ready) and stores them in the `Notification` model. Students see the bell badge count but cannot view a history list.

**What to build:**
- `GET /student/notifications` — paginated list with read/unread filtering
- A notifications page or slide-out panel with mark-as-read functionality
- `PUT /student/notifications/read-all` — bulk mark-as-read

**Reuses:** Existing `Notification` model, `type`, `isRead`, `createdAt`

---

## 6. Exam Schedule View

**Current state:** `Subject` model has `semester`, `examDate`, `examSession` fields, but no student-facing endpoint exposes this in a calendar/schedule format.

**What to build:**
- `GET /student/exam-schedule` — returns enrolled subjects with `{ subjectName, code, examDate, examSession, semester }`
- A schedule card/table on the dashboard sorted by date

**Reuses:** Existing `Subject.examDate`, `Subject.examSession`, `Subject.semester`

---

## 7. Attendance Per Subject

**Current state:** `Evaluation.attendancePercent` exists but is only visible via `/student/status` inside the evaluations array — no dedicated attendance view.

**What to build:**
- Add `attendancePercent` to the subject list response or create `GET /student/attendance`
- Display a colored badge (green ≥75%, yellow 50–75%, red <50%) next to each subject on the dashboard

**Reuses:** Existing `Evaluation.attendancePercent`, no new model needed

---

## 8. Download Marks Statement (PDF / Excel)

**Current state:** Students can view marks per subject via `/student/marks`, but there is no export/print feature.

**What to build:**
- `GET /student/marks/export?format=pdf` — generates a consolidated marks statement for all enrolled subjects
- Include student name, college name, subject names, CAT scores, internal total, and approval status
- Same for Excel format (`format=xlsx`)

**Reuses:** Existing `Evaluation` data, `reportService` or `excelService` patterns

---

## 9. Subject Syllabus Viewer

**Current state:** `Subject.syllabusText` exists in the database with full syllabus text, but no student endpoint exposes it.

**What to build:**
- `GET /student/subjects/:subjectId/syllabus` — returns the syllabus text
- A "View Syllabus" button on each subject card/row that opens a modal or expands an accordion

**Reuses:** Existing `Subject.syllabusText`

---

## 10. Grievance / Query Form

**Current state:** No mechanism for students to raise disputes about marks, fee amounts, or clearance decisions. The only feedback channel is `POST /student/qa` which is AI-driven, not human.

**What to build:**
- `Grievance` model: `{ id, studentId, subjectId?, type, description, status (OPEN/IN_PROGRESS/RESOLVED), createdAt, resolvedAt, resolvedById }`
- `POST /student/grievances` — create a grievance
- `GET /student/grievances` — list my grievances
- Staff dashboard view to manage incoming grievances
- Notification to student when status changes

**Requires:** New Prisma model + migration, new route file or extend student route, staff grievance management UI

---

## 11. Library / Lab Custom Clearance Status

**Current state:** `User.customClearance` JSON field exists but is never displayed or explained to the student.

**What to build:**
- Expose `customClearance` in `/student/status` response
- Display each clearance item (Library, Lab, Sports, etc.) as a badge with cleared/pending status on the dashboard
- Mentors can toggle these via a `PUT /mentor/students/:id/clearance` endpoint

**Reuses:** Existing `User.customClearance` JSON field

---

## 12. Assignment Deadline Tracking

**Current state:** No due-date concept exists for assignments. Students can upload anytime, and staff have no basis to mark submissions as late.

**What to build:**
- Add `dueDate` to `Subject` or create an `AssignmentDeadline` model per subject
- Validate in `POST /student/assignments` — reject or flag as late if past due date
- Show days remaining or overdue indicator on the dashboard

**Requires:** Schema change (new field or model), migration

---

## Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| P0 | Clearance Progress Tracker | Low | High |
| P0 | Assignment Dashboard | Low | High |
| P1 | Notification History View | Low | Medium |
| P1 | Exam Schedule View | Low | Medium |
| P1 | Attendance Per Subject | Low | Medium |
| P2 | Subject Syllabus Viewer | Low | Low |
| P2 | Profile Management | Low | Medium |
| P2 | Hall Ticket Download (Direct PDF) | Low | Medium |
| P2 | Download Marks Statement | Medium | Medium |
| P3 | Library / Lab Custom Clearance | Medium | Low |
| P3 | Assignment Deadline Tracking | Medium | Medium |
| P4 | Grievance / Query System | High | High |

---

**Note:** All features listed here reuse existing patterns (Prisma queries, route structure, Fastify schema validation, controller→service pattern) and existing model fields unless stated otherwise. No architectural changes are required for P0–P2 items.
