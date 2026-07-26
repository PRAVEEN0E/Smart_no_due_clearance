const staffSchema = require('../schemas/staff.schema');
const { generateMarksExcel } = require('../services/excelService');
const { calculateInternalMarks } = require('../services/marksCalculator');
const { logAction } = require('../services/auditService');
const { QUEUES, addJob } = require('../lib/queue');

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
        return fastify.cache.remember(`sndc:staffsubjects:${request.user.id}`, fastify.cache.DEFAULT_TTL, () => {
            return prisma.staffSubject.findMany({
                where: { staffId: request.user.id },
                include: { subject: true }
            });
        });
    });

    fastify.get('/students', async (request) => {
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Get all subjects assigned to this staff
        const assignedSubjects = await prisma.staffSubject.findMany({
            where: { staffId: request.user.id },
            select: { subjectId: true }
        });
        const subIds = assignedSubjects.map(s => s.subjectId);

        const where = { subjectId: { in: subIds } };

        const [data, total] = await Promise.all([
            prisma.studentSubject.findMany({
                where,
                skip,
                take: limit,
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
            }),
            prisma.studentSubject.count({ where })
        ]);

        return {
            data,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
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

        // Optional status filter: 'approved', 'rejected', 'pending'
        const statusFilter = request.query.status;

        const whereClause = {
            subjectId: { in: assignedSubjectIds },
            staffId: request.user.id
        };

        if (statusFilter === 'approved') {
            whereClause.staffApproved = true;
        } else if (statusFilter === 'rejected') {
            whereClause.staffRejected = true;
        } else if (statusFilter === 'pending') {
            whereClause.staffApproved = false;
            whereClause.staffRejected = false;
        }

        // Now fetch all evaluations for this staff's subjects
        return prisma.evaluation.findMany({
            where: whereClause,
            include: {
                student: {
                    include: {
                        assignments: {
                            orderBy: { submittedAt: 'desc' }
                        }
                    }
                },
                subject: true
            },
            orderBy: { id: 'asc' }
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

        // Filter out null values — use existing evaluation values instead
        const cleanData = {};
        for (const [key, value] of Object.entries(updateData)) {
            if (value !== null) cleanData[key] = value;
        }

        // Merge current data with update to calculate total
        const mergedData = { ...evaluation, ...cleanData };
        const total = calculateInternalMarks(mergedData, evaluation.subject.type);

        const updatedEval = await prisma.evaluation.update({
            where: { id: evalId },
            data: {
                ...cleanData,
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

        // Background AI prediction via queue
        addJob(QUEUES.AI, 'predict-success', {
            type: 'predict-success',
            data: { evaluation: updatedEval, subjectName: updatedEval.subject.name }
        }).catch(() => {});

        // Email Notification via queue
        addJob(QUEUES.EMAIL, 'marks-update', {
            type: 'marks-update',
            data: { email: updatedEval.student.email, name: updatedEval.student.name, subjectName: updatedEval.subject.name }
        }).catch(() => {});

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

            if (evaluation.staffApproved) {
                return reply.status(409).send({ message: 'Evaluation has already been approved.' });
            }

            if (evaluation.staffRejected) {
                return reply.status(409).send({ message: 'Cannot approve a rejected evaluation. Clear the rejection first.' });
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

            // Trigger hall ticket check and notification via queue
            addJob(QUEUES.NOTIFICATION, 'hall-ticket-check', {
                type: 'hall-ticket-check',
                data: { studentId: evaluation.studentId }
            }).catch(() => {});

            // Send Subject Approved Email via queue
            addJob(QUEUES.EMAIL, 'subject-approved', {
                type: 'subject-approved',
                data: { email: updatedEval.student.email, name: updatedEval.student.name, subjectName: updatedEval.subject.name }
            }).catch(() => {});

            return updatedEval;
        } catch (err) {
            fastify.log.error(`Approval error: ${err.message}`);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });

    fastify.post('/reject/:evalId', { schema: staffSchema.rejectEvaluation }, async (request, reply) => {
        const { evalId } = request.params;
        const { rejectionReason } = request.body;

        try {
            const evaluation = await prisma.evaluation.findUnique({
                where: { id: evalId }
            });

            if (!evaluation || evaluation.staffId !== request.user.id) {
                return reply.status(403).send({ message: 'Unauthorized to reject this record' });
            }

            if (evaluation.staffRejected) {
                return reply.status(409).send({ message: 'Evaluation has already been rejected.' });
            }

            if (evaluation.staffApproved) {
                return reply.status(409).send({ message: 'Cannot reject an already approved evaluation.' });
            }

            const updatedEval = await prisma.evaluation.update({
                where: { id: evalId },
                data: {
                    staffRejected: true,
                    rejectedAt: new Date(),
                    rejectionReason
                },
                include: { student: true, subject: true }
            });

            // Audit Trail
            logAction(prisma, {
                action: 'REJECTION',
                details: {
                    student: updatedEval.student.name,
                    subject: updatedEval.subject.name,
                    reason: rejectionReason
                },
                userId: request.user.id,
                userEmail: request.user.email,
                collegeId: request.user.collegeId
            });

            // Email notification via queue
            addJob(QUEUES.EMAIL, 'marks-rejected', {
                type: 'marks-rejected',
                data: {
                    email: updatedEval.student.email,
                    name: updatedEval.student.name,
                    subjectName: updatedEval.subject.name,
                    reason: rejectionReason
                }
            }).catch(() => {});

            return updatedEval;
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ message: 'Internal server error' });
        }
    });

    // Clear rejection (allows staff to un-reject and re-enter marks)
    fastify.post('/reject/:evalId/clear', async (request, reply) => {
        const { evalId } = request.params;

        try {
            const evaluation = await prisma.evaluation.findUnique({
                where: { id: evalId }
            });

            if (!evaluation || evaluation.staffId !== request.user.id) {
                return reply.status(403).send({ message: 'Unauthorized to clear rejection' });
            }

            if (!evaluation.staffRejected) {
                return reply.status(400).send({ message: 'Evaluation is not rejected.' });
            }

            const updatedEval = await prisma.evaluation.update({
                where: { id: evalId },
                data: {
                    staffRejected: false,
                    rejectedAt: null,
                    rejectionReason: null
                },
                include: { student: true, subject: true }
            });

            logAction(prisma, {
                action: 'REJECTION_CLEARED',
                details: {
                    student: updatedEval.student.name,
                    subject: updatedEval.subject.name
                },
                userId: request.user.id,
                userEmail: request.user.email,
                collegeId: request.user.collegeId
            });

            return updatedEval;
        } catch (err) {
            fastify.log.error(err);
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
        return fastify.cache.remember(`sndc:staffanalytics:${request.user.id}`, fastify.cache.SHORT_TTL, async () => {
            const evaluations = await prisma.evaluation.findMany({
                where: { staffId: request.user.id },
                include: { student: true, subject: true }
            });

            // Grouping by mark ranges for distribution charts
            const chartData = [
                { name: '0-15 (Needs Imp.)', count: evaluations.filter(e => e.internalMarksTotal < 15).length, color: '#ef4444' },
                { name: '15-25 (Average)', count: evaluations.filter(e => e.internalMarksTotal >= 15 && e.internalMarksTotal < 25).length, color: '#f59e0b' },
                { name: '25-35 (Good)', count: evaluations.filter(e => e.internalMarksTotal >= 25 && e.internalMarksTotal < 35).length, color: '#3b82f6' },
                { name: '35-40 (Excellent)', count: evaluations.filter(e => e.internalMarksTotal >= 35).length, color: '#10b981' },
            ];

            // CAT Progress Data for Line Chart
            const catTrends = [
                { name: 'CAT 1', avg: evaluations.length > 0 ? (evaluations.reduce((acc, e) => acc + (e.cat1 || 0), 0) / evaluations.length).toFixed(1) : 0 },
                { name: 'CAT 2', avg: evaluations.length > 0 ? (evaluations.reduce((acc, e) => acc + (e.cat2 || 0), 0) / evaluations.length).toFixed(1) : 0 },
                { name: 'CAT 3', avg: evaluations.length > 0 ? (evaluations.reduce((acc, e) => acc + (e.cat3 || 0), 0) / evaluations.length).toFixed(1) : 0 },
            ];

            // Approval status counts
            const approvedCount = evaluations.filter(e => e.staffApproved).length;
            const rejectedCount = evaluations.filter(e => e.staffRejected).length;
            const pendingCount = evaluations.filter(e => !e.staffApproved && !e.staffRejected).length;

            // At-risk students (marks < 15 or attendance < 75%)
            const atRiskStudents = evaluations
                .filter(e => !e.staffApproved && (e.internalMarksTotal < 15 || e.attendancePercent < 75))
                .slice(0, 5)
                .map(e => ({
                    id: e.id,
                    student: { id: e.student.id, name: e.student.name, email: e.student.email },
                    subject: e.subject.name,
                    internalMarksTotal: e.internalMarksTotal,
                    attendancePercent: e.attendancePercent
                }));

            // Attendance distribution
            const attendanceBuckets = [
                { name: '< 75%', count: evaluations.filter(e => e.attendancePercent < 75).length, color: '#ef4444' },
                { name: '75-85%', count: evaluations.filter(e => e.attendancePercent >= 75 && e.attendancePercent < 85).length, color: '#f59e0b' },
                { name: '85-95%', count: evaluations.filter(e => e.attendancePercent >= 85 && e.attendancePercent < 95).length, color: '#3b82f6' },
                { name: '>= 95%', count: evaluations.filter(e => e.attendancePercent >= 95).length, color: '#10b981' },
            ];

            // Pass percentage (marks >= 20 out of 40)
            const passCount = evaluations.filter(e => e.internalMarksTotal >= 20).length;
            const passPercentage = evaluations.length > 0 ? ((passCount / evaluations.length) * 100).toFixed(1) : 0;

            const subjectPerformance = evaluations.reduce((acc, e) => {
                const name = e.subject.name;
                if (!acc[name]) acc[name] = { name, total: 0, count: 0, approved: 0 };
                acc[name].total += e.internalMarksTotal || 0;
                acc[name].count += 1;
                if (e.staffApproved) acc[name].approved += 1;
                return acc;
            }, {});

            return {
                distribution: chartData,
                trends: catTrends,
                approvedCount,
                rejectedCount,
                pendingCount,
                totalStudents: evaluations.length,
                atRiskStudents,
                attendanceDistribution: attendanceBuckets,
                passPercentage: parseFloat(passPercentage),
                subjectPerformance: Object.values(subjectPerformance).map(s => ({
                    ...s,
                    avg: s.count > 0 ? (s.total / s.count).toFixed(1) : 0
                }))
            };
        });
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
            const feeBalance = student.feeRecord?.feeBalance || 0;
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

                    // Check if already logged (compound unique: studentId + subjectId + date + session)
                    const existingAttendance = await prisma.examAttendance.findFirst({
                        where: {
                            studentId,
                            subjectId,
                            date: todayStr,
                            session
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

        const origin = request.headers.origin;
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim());
        const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || 'http://localhost:5173');

        const headers = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': allowedOrigin
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
