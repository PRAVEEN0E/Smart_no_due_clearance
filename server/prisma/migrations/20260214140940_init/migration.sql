-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MENTOR', 'STAFF', 'STUDENT');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('FULL_THEORY', 'FULL_LAB', 'THEORY_WITH_LAB');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "SubjectType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSubject" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "StaffSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSubject" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "StudentSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "cat1" INTEGER DEFAULT 0,
    "cat2" INTEGER DEFAULT 0,
    "cat3" INTEGER DEFAULT 0,
    "assignment1" INTEGER DEFAULT 0,
    "assignment2" INTEGER DEFAULT 0,
    "assignment3" INTEGER DEFAULT 0,
    "assignment4" INTEGER DEFAULT 0,
    "assignment5" INTEGER DEFAULT 0,
    "activity1" INTEGER DEFAULT 0,
    "activity2" INTEGER DEFAULT 0,
    "modelLabMarks" INTEGER,
    "remedialMarks" INTEGER,
    "attendancePercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "internalMarksTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "staffApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeRecord" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feeClearedAuto" BOOLEAN NOT NULL DEFAULT false,
    "feeClearedManual" BOOLEAN NOT NULL DEFAULT false,
    "clearedAt" TIMESTAMP(3),

    CONSTRAINT "FeeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "aiFeedback" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HallTicket" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "pdfUrl" TEXT,
    "generatedAt" TIMESTAMP(3),

    CONSTRAINT "HallTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StaffSubject_staffId_subjectId_key" ON "StaffSubject"("staffId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSubject_studentId_subjectId_key" ON "StudentSubject"("studentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_studentId_subjectId_key" ON "Evaluation"("studentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "FeeRecord_studentId_key" ON "FeeRecord"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "HallTicket_studentId_key" ON "HallTicket"("studentId");

-- AddForeignKey
ALTER TABLE "StaffSubject" ADD CONSTRAINT "StaffSubject_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffSubject" ADD CONSTRAINT "StaffSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubject" ADD CONSTRAINT "StudentSubject_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubject" ADD CONSTRAINT "StudentSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeRecord" ADD CONSTRAINT "FeeRecord_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HallTicket" ADD CONSTRAINT "HallTicket_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
