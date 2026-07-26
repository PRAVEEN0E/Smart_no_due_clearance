-- Fix schema drift: Add SUPERADMIN to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPERADMIN';

-- Add missing User fields
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "registerNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "signatureUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "collegeId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customRoleId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "className" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customClearance" JSONB;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordChangedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "needsPasswordChange" BOOLEAN DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordSetupToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordSetupTokenExpires" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "dob" TEXT;

-- Ensure unique constraints
ALTER TABLE "User" ADD CONSTRAINT "User_registerNumber_key" UNIQUE ("registerNumber");
ALTER TABLE "User" ADD CONSTRAINT "User_passwordSetupToken_key" UNIQUE ("passwordSetupToken");

-- Add missing indexes on User
CREATE INDEX IF NOT EXISTS "User_collegeId_idx" ON "User"("collegeId");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_role_collegeId_idx" ON "User"("role", "collegeId");
CREATE INDEX IF NOT EXISTS "User_email_role_idx" ON "User"("email", "role");
CREATE INDEX IF NOT EXISTS "User_email_registerNumber_idx" ON "User"("email", "registerNumber");

-- Add missing indexes on Evaluation
CREATE INDEX IF NOT EXISTS "Evaluation_studentId_idx" ON "Evaluation"("studentId");

-- Add missing indexes on FeeRecord
CREATE INDEX IF NOT EXISTS "FeeRecord_feeClearedAuto_idx" ON "FeeRecord"("feeClearedAuto");
CREATE INDEX IF NOT EXISTS "FeeRecord_feeBalance_idx" ON "FeeRecord"("feeBalance");

-- Create missing tables that exist in the schema but not in the init migration

-- College table
CREATE TABLE IF NOT EXISTS "College" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logoUrl" TEXT,
    "primaryColor" TEXT DEFAULT '#7c3aed',
    "secondaryColor" TEXT DEFAULT '#a855f7',
    "affiliationText" TEXT DEFAULT '(An Autonomous Institution, affiliated to Anna University)',
    "controllerName" TEXT DEFAULT 'M. Arulselvan',
    "principalName" TEXT DEFAULT 'P. Velavan',
    "workflow" JSONB,
    "isMaintenanceMode" BOOLEAN DEFAULT false,
    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "collegeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Announcement table
CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" INTEGER DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "collegeId" TEXT,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- Material table
CREATE TABLE IF NOT EXISTS "Material" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- ExamAttendance table
CREATE TABLE IF NOT EXISTS "ExamAttendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "scannedById" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified" BOOLEAN DEFAULT true,
    "session" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    CONSTRAINT "ExamAttendance_pkey" PRIMARY KEY ("id")
);

-- CustomRole table
CREATE TABLE IF NOT EXISTS "CustomRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collegeId" TEXT NOT NULL,
    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

-- Add missing Subject columns (table created in init migration)
ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "createdById" TEXT;
ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "collegeId" TEXT;
ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "syllabusText" TEXT;
ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "semester" INTEGER DEFAULT 4;
ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "examDate" TEXT;
ALTER TABLE "Subject" ADD COLUMN IF NOT EXISTS "examSession" TEXT DEFAULT 'FN';

-- Replace unique index Subject_code_key with Subject_code_collegeId_key
DROP INDEX IF EXISTS "Subject_code_key";
CREATE INDEX IF NOT EXISTS "Subject_code_collegeId_idx" ON "Subject"("code", "collegeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Subject_code_collegeId_key" ON "Subject"("code", "collegeId");

-- Add missing Evaluation columns (table created in init migration)
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "remedial1" INTEGER;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "remedial2" INTEGER;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "remedial3" INTEGER;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "aiPrediction" TEXT;
ALTER TABLE "Evaluation" ALTER COLUMN "staffId" DROP NOT NULL;
ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "staffId" TEXT;

-- Make staffId nullable (schema says String?)
-- Note: if staffId already has values, this will work. If column doesn't exist, the ADD COLUMN above creates it as nullable.

-- Add missing HallTicket columns (table created in init migration)
ALTER TABLE "HallTicket" ADD COLUMN IF NOT EXISTS "qrCodeData" TEXT;
ALTER TABLE "HallTicket" ADD COLUMN IF NOT EXISTS "verificationCode" TEXT;

-- Add foreign keys for Subject (after College exists and Subject columns added)
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"(id) ON DELETE CASCADE;
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"(id) ON DELETE SET NULL;

-- Add foreign keys for User (after College and CustomRole exist)
ALTER TABLE "User" ADD CONSTRAINT "User_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"(id) ON DELETE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"(id) ON DELETE SET NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "CustomRole"(id) ON DELETE SET NULL;

-- Add foreign keys for all new tables
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"(id) ON DELETE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"(id) ON DELETE CASCADE;
ALTER TABLE "Material" ADD CONSTRAINT "Material_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"(id) ON DELETE CASCADE;
ALTER TABLE "Material" ADD CONSTRAINT "Material_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"(id);
ALTER TABLE "ExamAttendance" ADD CONSTRAINT "ExamAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "ExamAttendance" ADD CONSTRAINT "ExamAttendance_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"(id) ON DELETE CASCADE;
ALTER TABLE "ExamAttendance" ADD CONSTRAINT "ExamAttendance_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"(id) ON DELETE CASCADE;

-- Add unique constraints for new tables
ALTER TABLE "HallTicket" ADD CONSTRAINT "HallTicket_verificationCode_key" UNIQUE ("verificationCode");
ALTER TABLE "ExamAttendance" ADD CONSTRAINT "ExamAttendance_studentId_subjectId_date_session_key" UNIQUE ("studentId", "subjectId", "date", "session");
ALTER TABLE "CustomRole" ADD CONSTRAINT "CustomRole_name_collegeId_key" UNIQUE ("name", "collegeId");

-- Add indexes for existing tables (from init)
CREATE INDEX IF NOT EXISTS "Assignment_studentId_idx" ON "Assignment"("studentId");
CREATE INDEX IF NOT EXISTS "Assignment_subjectId_idx" ON "Assignment"("subjectId");
CREATE INDEX IF NOT EXISTS "Assignment_studentId_subjectId_idx" ON "Assignment"("studentId", "subjectId");

-- Add indexes for new tables
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "AuditLog_collegeId_idx" ON "AuditLog"("collegeId");
CREATE INDEX IF NOT EXISTS "HallTicket_studentId_isUnlocked_idx" ON "HallTicket"("studentId", "isUnlocked");
CREATE INDEX IF NOT EXISTS "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");
CREATE INDEX IF NOT EXISTS "Announcement_collegeId_idx" ON "Announcement"("collegeId");
CREATE INDEX IF NOT EXISTS "Announcement_createdById_idx" ON "Announcement"("createdById");
CREATE INDEX IF NOT EXISTS "Material_subjectId_idx" ON "Material"("subjectId");
CREATE INDEX IF NOT EXISTS "Material_uploadedById_idx" ON "Material"("uploadedById");
CREATE INDEX IF NOT EXISTS "Material_subjectId_category_idx" ON "Material"("subjectId", "category");
