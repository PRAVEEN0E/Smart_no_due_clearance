const staffSchema = require('../schemas/staff.schema');
const { parseMarksExcel, generateMarksExcel } = require('../services/excelService');
const { calculateInternalMarks } = require('../services/marksCalculator');
const { logAction } = require('../services/auditService');
const { sendMarksUpdateEmail, sendSubjectApprovedEmail } = require('../services/emailService');
const { sendNotification } = require('../services/notificationService');

async function staffRoutes(fastify, opts) {
    fastify.addHook('preHandler', fastify.auth([fastify.authenticate, fastify.authorize(['STAFF'])]));

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
                student: true,
                subject: true,
                subject: {
                    include: {
                        evaluations: {
                            where: { studentId: request.user.id } // This logic needs to be refined
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

        // Auto-fix: update any evaluations for these subjects that still have null staffId
        await prisma.evaluation.updateMany({
            where: {
                subjectId: { in: assignedSubjectIds },
                staffId: null
            },
            data: { staffId: request.user.id }
        });

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
            userEmail: request.user.email
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
                userEmail: request.user.email
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

        // Get relative path from URL and convert to absolute
        const relativePath = assignment.fileUrl.replace('/uploads/', '');
        const absolutePath = path.resolve(__dirname, '../uploads', relativePath);

        const aiFeedback = await generateFeedback(absolutePath, assignment.subject.name);

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
}

module.exports = staffRoutes;
