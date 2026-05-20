const staffSchema = require('../schemas/staff.schema');
const { parseMarksExcel, generateMarksExcel } = require('../services/excelService');
const { calculateInternalMarks } = require('../services/marksCalculator');
const { logAction } = require('../services/auditService');
const { sendMarksUpdateEmail, sendSubjectApprovedEmail } = require('../services/emailService');
const { sendNotification } = require('../services/notificationService');

async function staffRoutes(fastify, opts) {
    const sseClients = new Set();

    function broadcastScanEvent(eventData) {
        const payload = `data: ${JSON.stringify(eventData)}\n\n`;
        for (const client of sseClients) {
            try {
                client.write(payload);
            } catch (err) {
                sseClients.delete(client);
            }
        }
    }

    fastify.addHook('preHandler', async (request, reply) => {
        if (request.url.includes('/scan-stream')) {
            return; // Skip standard bearer token check for SSE stream
        }
        await fastify.auth([fastify.authenticate, fastify.authorize(['STAFF', 'MENTOR', 'SUPERADMIN'])])(request, reply);
    });

    const { prisma } = fastify;

    // View assigned students and subjects
    fastify.get('/subjects', async (request) => {
        return prisma.staffSubject.findMany({
            where: { staffId: request.user.id },
            include: { subject: true }
        });
    });

    fastify.get('/students', async (request) => {
        // Get all subjects assigned to this staff
        const assignedSubjects = await prisma.staffSubject.findMany({
            where: { staffId: request.user.id },
            select: { subjectId: true }
        });
        const subIds = assignedSubjects.map(s => s.subjectId);

        return prisma.studentSubject.findMany({
            where: { subjectId: { in: subIds } },
            include: {
                student: {
                    select: { id: true, name: true, email: true, role: true, signatureUrl: true, collegeId: true }
                },
                subject: {
                    include: {
                        evaluations: {
                            where: { staffId: request.user.id }
                        }
                    }
                }
            }
        });
    });

    // Get evaluations for this staff — includes evaluations where staffId matches
    // OR where the subject is assigned to this staff (handles students enrolled before staff assignment)
    fastify.get('/evaluations', async (request) => {
        // Get all subjects assigned to this staff member
        const staffSubjects = await prisma.staffSubject.findMany({
            where: { staffId: request.user.id },
            select: { subjectId: true }
        });
        const assignedSubjectIds = staffSubjects.map(s => s.subjectId);

        if (assignedSubjectIds.length === 0) return [];

        // Now fetch all evaluations for this staff's subjects
        return prisma.evaluation.findMany({
            where: {
                subjectId: { in: assignedSubjectIds },
                staffId: request.user.id
            },
            include: {
                student: {
                    include: {
                        assignments: {
                            orderBy: { submittedAt: 'desc' }
                        }
                    }
                },
                subject: true
            }
        });
    });

    fastify.put('/marks/:evalId', { schema: staffSchema.updateMarks }, async (request, reply) => {
        const { evalId } = request.params;
        const updateData = request.body;
        const { predictStudentSuccess } = require('../services/aiService');

        const evaluation = await prisma.evaluation.findUnique({
            where: { id: evalId },
            include: { subject: true }
        });

        if (!evaluation || evaluation.staffId !== request.user.id) {
            return reply.status(403).send({ message: 'Unauthorized access to evaluation' });
        }

        // Logic: Remedial marks allowed per CAT if CAT < 25 OR attendance < threshold
        const threshold = parseFloat(process.env.ATTENDANCE_THRESHOLD || 75);
        const attendance = updateData.attendancePercent ?? evaluation.attendancePercent;

        const cats = {
            cat1: updateData.cat1 ?? evaluation.cat1 ?? 0,
            cat2: updateData.cat2 ?? evaluation.cat2 ?? 0,
            cat3: updateData.cat3 ?? evaluation.cat3 ?? 0
        };

        // Validate each remedial field
        const remedials = ['remedial1', 'remedial2', 'remedial3'];
        
        if (evaluation.subject.type === 'FULL_LAB') {
            const hasRemedials = remedials.some(r => (updateData[r] !== undefined && updateData[r] !== null));
            if (hasRemedials) {
                return reply.status(400).send({ message: 'Remedial marks are not applicable for Practical/Lab subjects.' });
            }
        }

        for (let i = 0; i < remedials.length; i++) {
            const field = remedials[i];
            const catField = `cat${i + 1}`;
            if (updateData[field] !== undefined && updateData[field] !== null) {
                if (attendance >= threshold && cats[catField] >= 25) {
                    return reply.status(400).send({
                        message: `Remedial ${i + 1} is locked. Student has sufficient attendance (${attendance}%) and CAT ${i + 1} score is >= 25.`
                    });
                }
            }
        }

        // Merge current data with update to calculate total
        const mergedData = { ...evaluation, ...updateData };
        const total = calculateInternalMarks(mergedData, evaluation.subject.type);

        const updatedEval = await prisma.evaluation.update({
            where: { id: evalId },
            data: {
                ...updateData,
                internalMarksTotal: total
            },
            include: { subject: true, student: true }
        });

        // Audit Trail
        logAction(prisma, {
            action: 'MARK_UPDATE',
            details: {
                student: updatedEval.student.name,
                subject: updatedEval.subject.name,
                changes: updateData
            },
            userId: request.user.id,
            userEmail: request.user.email,
            collegeId: request.user.collegeId
        });

        // Background processes
        predictStudentSuccess(updatedEval, updatedEval.subject.name).then(async (prediction) => {
            await prisma.evaluation.update({
                where: { id: evalId },
                data: { aiPrediction: JSON.stringify(prediction) }
            });
        }).catch(err => console.error("Async AI Prediction Error:", err));

        // Email Notification
        sendMarksUpdateEmail(updatedEval.student.email, updatedEval.student.name, updatedEval.subject.name);

        return updatedEval;
    });


    fastify.post('/approve/:evalId', async (request, reply) => {
        const { evalId } = request.params;

        try {
            const evaluation = await prisma.evaluation.findUnique({
                where: { id: evalId }
            });

            if (!evaluation || evaluation.staffId !== request.user.id) {
                return reply.status(403).send({ message: 'Unauthorized to approve this record' });
            }

            const updatedEval = await prisma.evaluation.update({
                where: { id: evalId },
                data: {
                    staffApproved: true,
                    approvedAt: new Date()
                },
                include: { student: true, subject: true }
            });

            // Audit Trail
            logAction(prisma, {
                action: 'APPROVAL',
                details: { student: updatedEval.student.name, subject: updatedEval.subject.name },
                userId: request.user.id,
                userEmail: request.user.email,
                collegeId: request.user.collegeId
            });

            // Trigger hall ticket check in the background
            const { checkAndUnlock } = require('../services/hallTicketService');
            const { sendNotification } = require('../services/notificationService');

            checkAndUnlock(evaluation.studentId, prisma).catch(console.error);

            // Notify Student
            sendNotification(prisma, {
                userId: evaluation.studentId,
                title: 'Subject Cleared',
                message: `Your internal marks for ${updatedEval.subject.name} have been approved by staff.`,
                type: 'SUCCESS'
            }).catch(console.error);

            // Send Subject Approved Email
            sendSubjectApprovedEmail(updatedEval.student.email, updatedEval.student.name, updatedEval.subject.name);

            return updatedEval;
        } catch (err) {
            console.error("Approval error:", err);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });

    fastify.post('/regenerate-feedback/:assignmentId', async (request, reply) => {
        const { assignmentId } = request.params;
        const { generateFeedback } = require('../services/aiService');
        const path = require('path');

        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { subject: true }
        });

        if (!assignment) return reply.status(404).send({ message: 'Assignment not found' });

        // Ensure staff is assigned to this subject
        const staffSub = await prisma.staffSubject.findFirst({
            where: { staffId: request.user.id, subjectId: assignment.subjectId }
        });
        if (!staffSub) return reply.status(403).send({ message: 'Unauthorized to regenerate feedback for this subject' });

        // Pass URL or local path directly to service; it handles both
        const aiFeedback = await generateFeedback(assignment.fileUrl, assignment.subject.name);

        const updated = await prisma.assignment.update({
            where: { id: assignmentId },
            data: { aiFeedback }
        });

        return { aiFeedback: updated.aiFeedback };
    });

    fastify.get('/analytics', async (request) => {
        const evaluations = await prisma.evaluation.findMany({
            where: { staffId: request.user.id }
        });

        // Grouping by mark ranges for distribution charts
        const chartData = [
            { name: '0-15 (Needs Imp.)', count: evaluations.filter(e => e.internalMarksTotal < 15).length, color: '#ef4444' },
            { name: '15-25 (Average)', count: evaluations.filter(e => e.internalMarksTotal >= 15 && e.internalMarksTotal < 25).length, color: '#f59e0b' },
            { name: '25-35 (Good)', count: evaluations.filter(e => e.internalMarksTotal >= 25 && e.internalMarksTotal < 35).length, color: '#3b82f6' },
            { name: '35-40 (Excellent)', count: evaluations.filter(e => e.internalMarksTotal >= 35).length, color: '#10b981' },
        ];

        // NEW: CAT Progress Data for Line Chart
        const catTrends = [
            { name: 'CAT 1', avg: evaluations.length > 0 ? (evaluations.reduce((acc, e) => acc + (e.cat1 || 0), 0) / evaluations.length).toFixed(1) : 0 },
            { name: 'CAT 2', avg: evaluations.length > 0 ? (evaluations.reduce((acc, e) => acc + (e.cat2 || 0), 0) / evaluations.length).toFixed(1) : 0 },
            { name: 'CAT 3', avg: evaluations.length > 0 ? (evaluations.reduce((acc, e) => acc + (e.cat3 || 0), 0) / evaluations.length).toFixed(1) : 0 },
        ];

        return { distribution: chartData, trends: catTrends };
    });

    // --- EXPORT MARKS ---
    fastify.get('/export/excel/:subjectId', async (request, reply) => {
        const { subjectId } = request.params;
        try {
            const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
            if (!subject) return reply.status(404).send({ message: 'Subject not found' });

            const evaluations = await prisma.evaluation.findMany({
                where: { subjectId },
                include: { student: true }
            });

            const buffer = await generateMarksExcel(subject.name, evaluations);

            reply.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            reply.header('Content-Disposition', `attachment; filename=Marks_${subject.code}.xlsx`);
            return buffer;
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ message: 'Excel export failed: ' + err.message });
        }
    });

    fastify.get('/export/pdf/:subjectId', async (request, reply) => {
        const { subjectId } = request.params;
        try {
            const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
            if (!subject) return reply.status(404).send({ message: 'Subject not found' });

            const evaluations = await prisma.evaluation.findMany({
                where: { subjectId },
                include: { student: true }
            });

            const { generateMarksPDF } = require('../services/reportService');
            const buffer = await generateMarksPDF(subject.name, evaluations, request.user.name);

            reply.type('application/pdf');
            reply.header('Content-Disposition', `attachment; filename=Marks_${subject.code}.pdf`);
            return buffer;
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ message: 'PDF export failed: ' + err.message });
        }
    });

    fastify.post('/verify-scan/:studentId', async (request, reply) => {
        const { studentId } = request.params;
        const { subjectId } = request.body || {}; // Selected subject currently being examined

        try {
            const student = await prisma.user.findFirst({
                where: { id: studentId, role: 'STUDENT' },
                include: {
                    feeRecord: true,
                    hallTicket: true,
                    studentSubjects: {
                        include: {
                            subject: {
                                include: {
                                    evaluations: {
                                        where: { studentId }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!student) {
                return reply.status(404).send({ message: 'Student record not found in system.' });
            }

            // Check Fee Clearance
            const feeBalance = student.feeRecord?.balance || 0;
            const feeCleared = (feeBalance <= 0) || !!student.feeRecord?.feeClearedManual;

            // Check Academic Clearance (Evaluations)
            const evaluations = await prisma.evaluation.findMany({
                where: { studentId }
            });
            
            const pendingSubjects = [];
            for (const ss of student.studentSubjects) {
                const evalRec = evaluations.find(e => e.subjectId === ss.subjectId);
                if (!evalRec || !evalRec.staffApproved) {
                    pendingSubjects.push({
                        name: ss.subject.name,
                        code: ss.subject.code,
                        staffApproved: !!evalRec?.staffApproved
                    });
                }
            }

            const academicCleared = pendingSubjects.length === 0;
            const overallCleared = feeCleared && academicCleared && !!student.hallTicket?.isUnlocked;

            let attendanceResult = null;

            // If a subject is selected, log Exam Attendance!
            if (subjectId && overallCleared) {
                const targetSub = student.studentSubjects.find(ss => ss.subjectId === subjectId);
                if (targetSub) {
                    const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
                    const session = targetSub.subject.examSession || 'FN';

                    // Check if already logged
                    const existingAttendance = await prisma.examAttendance.findUnique({
                        where: {
                            studentId_subjectId: {
                                studentId,
                                subjectId
                            }
                        }
                    });

                    if (!existingAttendance) {
                        const newAttendance = await prisma.examAttendance.create({
                            data: {
                                studentId,
                                subjectId,
                                scannedById: request.user.id,
                                date: todayStr,
                                session,
                                verified: true
                            },
                            include: { subject: true }
                        });

                        attendanceResult = {
                            marked: true,
                            alreadyExists: false,
                            subjectName: newAttendance.subject.name,
                            subjectCode: newAttendance.subject.code,
                            date: newAttendance.date,
                            session: newAttendance.session
                        };
                    } else {
                        attendanceResult = {
                            marked: true,
                            alreadyExists: true,
                            subjectName: targetSub.subject.name,
                            subjectCode: targetSub.subject.code,
                            date: existingAttendance.date,
                            session: existingAttendance.session
                        };
                    }
                } else {
                    attendanceResult = {
                        marked: false,
                        error: "Student is not enrolled in the selected subject."
                    };
                }
            }

            const responseData = {
                success: true,
                student: {
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    className: student.className,
                    department: student.department
                },
                hallTicket: {
                    isUnlocked: !!student.hallTicket?.isUnlocked,
                    unlockedAt: student.hallTicket?.unlockedAt
                },
                dues: {
                    cleared: overallCleared,
                    feeCleared,
                    feeBalance,
                    academicCleared,
                    pendingSubjects
                },
                attendance: attendanceResult
            };

            // Broadcast real-time scan event to live listeners
            broadcastScanEvent({
                type: 'SCAN',
                timestamp: new Date().toISOString(),
                data: responseData
            });

            return responseData;
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ message: 'Failed to verify scanned student: ' + err.message });
        }
    });

    // --- LIVE SCAN STREAM (SSE) ---
    fastify.get('/scan-stream', async (request, reply) => {
        const token = request.query.token;
        if (token) {
            try {
                fastify.jwt.verify(token);
            } catch (err) {
                return reply.status(401).send({ message: 'Unauthorized stream request' });
            }
        }

        const headers = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*'
        };
        reply.raw.writeHead(200, headers);
        reply.raw.write(`data: ${JSON.stringify({ type: 'PING', message: 'Connected' })}\n\n`);

        const client = reply.raw;
        sseClients.add(client);

        request.raw.on('close', () => {
            sseClients.delete(client);
        });

        return reply;
    });
}

module.exports = staffRoutes;
