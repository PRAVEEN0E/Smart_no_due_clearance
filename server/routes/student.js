const { QUEUES, addJob } = require('../lib/queue');
const { generateFeedback } = require('../services/aiService');
const { checkAndUnlock } = require('../services/hallTicketService');
const studentSchema = require('../schemas/student.schema');
const { logAction } = require('../services/auditService');

async function studentRoutes(fastify, opts) {
    fastify.addHook('preHandler', async (request, reply) => {
        if (request.url.includes('/verify/')) return;
        await fastify.auth([fastify.authenticate, fastify.authorize(['STUDENT'])])(request, reply);
    });

    const { prisma } = fastify;

    // ─── Profile ──────────────────────────────────────────────────────────────

    fastify.put('/profile', { schema: studentSchema.updateProfile }, async (request, reply) => {
        const { name, dob, department, className } = request.body;
        const updated = await prisma.user.update({
            where: { id: request.user.id },
            data: { ...(name && { name }), ...(dob && { dob }), ...(department && { department }), ...(className && { className }) },
            select: { id: true, name: true, email: true, dob: true, department: true, className: true, signatureUrl: true, role: true }
        });
        return { success: true, user: updated };
    });

    fastify.post('/profile/signature', async (request, reply) => {
        const { validateUploadedFile } = require('../lib/uploadPlugin');
        const raw = await request.file();
        const uploadInfo = validateUploadedFile(raw, request, reply);
        if (!uploadInfo) return;

        const { uploadStream } = require('../services/cloudinaryService');
        const result = await uploadStream(uploadInfo.file, 'signatures', `sig_${request.user.id}`);
        if (!result || !result.secure_url) return reply.status(500).send({ message: 'Signature upload failed' });

        await prisma.user.update({ where: { id: request.user.id }, data: { signatureUrl: result.secure_url } });
        return { success: true, signatureUrl: result.secure_url };
    });

    // ─── Subject / Status / Marks ────────────────────────────────────────────

    fastify.post('/predict/:subjectId', {
        schema: studentSchema.predict,
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } }
    }, async (request, reply) => {
        const { subjectId } = request.params;
        const evaluation = await prisma.evaluation.findFirst({
            where: { studentId: request.user.id, subjectId },
            include: { subject: true }
        });
        if (!evaluation) return reply.status(404).send({ message: 'No record found' });

        try {
            const { predictStudentSuccess } = require('../services/aiService');
            const prediction = await predictStudentSuccess(evaluation, evaluation.subject.name);
            const updated = await prisma.evaluation.update({
                where: { id: evaluation.id },
                data: { aiPrediction: JSON.stringify(prediction) }
            });
            return updated;
        } catch (err) {
            fastify.log.error(`AI Prediction Error: ${err.message}`);
            return reply.status(503).send({ message: 'AI prediction service temporarily unavailable. Please try again later.' });
        }
    });

    fastify.get('/subjects', async (request) => {
        return fastify.cache.remember(`sndc:studentsubjects:${request.user.id}`, fastify.cache.DEFAULT_TTL, () => {
            return prisma.studentSubject.findMany({
                where: { studentId: request.user.id },
                include: { subject: { include: { staffAssignments: { include: { staff: true } } } } }
            });
        });
    });

    fastify.get('/status', async (request) => {
        const evals = await prisma.evaluation.findMany({
            where: { studentId: request.user.id },
            include: { subject: true }
        });

        const [fee, ticket, studentWithSubjects] = await Promise.all([
            prisma.feeRecord.findUnique({ where: { studentId: request.user.id } }),
            prisma.hallTicket.findUnique({ where: { studentId: request.user.id } }),
            prisma.user.findUnique({
                where: { id: request.user.id },
                include: { studentSubjects: { include: { subject: true } }, college: true }
            })
        ]);

        let suggestions = [];
        try {
            const { generateAcademicInsights } = require('../services/aiService');
            suggestions = await generateAcademicInsights(evals, studentWithSubjects.studentSubjects);
        } catch (err) {
            fastify.log.error(`AI Insights Error: ${err.message}`);
        }

        return {
            evaluations: evals,
            feeRecord: fee,
            hallTicket: ticket,
            suggestions,
            user: {
                id: studentWithSubjects.id,
                name: studentWithSubjects.name,
                email: studentWithSubjects.email,
                dob: studentWithSubjects.dob,
                className: studentWithSubjects.className,
                department: studentWithSubjects.department,
                signatureUrl: studentWithSubjects.signatureUrl,
                role: studentWithSubjects.role,
                collegeName: studentWithSubjects.college?.name || null
            }
        };
    });

    fastify.get('/marks', async (request) => {
        return prisma.evaluation.findMany({
            where: { studentId: request.user.id },
            include: { subject: true }
        });
    });

    // ─── Assignments ─────────────────────────────────────────────────────────

    fastify.post('/assignments', async (request, reply) => {
        try {
            const { validateUploadedFile } = require('../lib/uploadPlugin');
            const raw = await request.file();
            const uploadInfo = validateUploadedFile(raw, request, reply);
            if (!uploadInfo) return;

            const subjectId = uploadInfo.fields?.subjectId?.value || uploadInfo.fields?.subjectId;
            if (!subjectId) return reply.status(400).send({ message: 'subjectId is required' });

            const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
            if (!subject) return reply.status(404).send({ message: 'Subject not found' });
            if (subject.type === 'FULL_LAB') {
                return reply.status(400).send({ message: 'Assignment submission is not required for Practical/Lab subjects.' });
            }

            const { uploadStream } = require('../services/cloudinaryService');
            let fileUrl;
            try {
                const result = await uploadStream(uploadInfo.file, 'assignments', uploadInfo.filename, 'raw');
                fileUrl = result.secure_url;
            } catch (err) {
                fastify.log.error(`Cloudinary Upload Error: ${err.message}`);
                return reply.status(500).send({ message: 'Failed to upload assignment file' });
            }

            const assignment = await prisma.assignment.create({
                data: {
                    studentId: request.user.id,
                    subjectId,
                    fileUrl,
                    aiFeedback: "_AI Feedback is being generated. Check back in a moment._"
                }
            });

            addJob(QUEUES.AI, 'generate-feedback', {
                type: 'generate-feedback',
                data: { fileUrl, subjectName: subject?.name || 'General', assignmentId: assignment.id, userId: request.user.id }
            }).catch(async (err) => {
                fastify.log.error(`AI queue unavailable, falling back to sync generation: ${err.message}`);
                try {
                    const feedback = await generateFeedback(fileUrl, subject?.name || 'General');
                    await prisma.assignment.update({
                        where: { id: assignment.id },
                        data: { aiFeedback: feedback }
                    });
                } catch (syncErr) {
                    fastify.log.error(`Sync AI feedback also failed: ${syncErr.message}`);
                }
            });

            // Audit
            logAction(prisma, {
                action: 'ASSIGNMENT_UPLOAD',
                details: { subject: subject.name, assignmentId: assignment.id },
                userId: request.user.id, userEmail: request.user.email, collegeId: request.user.collegeId
            });

            return assignment;
        } catch (err) {
            fastify.log.error(err);
            if (err.message?.includes('not multipart')) {
                return reply.status(400).send({ message: 'Upload must use multipart/form-data encoding.' });
            }
            return reply.status(500).send({ message: 'Server error during upload: ' + err.message });
        }
    });

    fastify.get('/assignments', async (request) => {
        return prisma.assignment.findMany({
            where: { studentId: request.user.id },
            include: { subject: true },
            orderBy: { submittedAt: 'desc' }
        });
    });

    fastify.delete('/assignments/:assignmentId', { schema: studentSchema.deleteAssignment }, async (request, reply) => {
        const { assignmentId } = request.params;
        const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
        if (!assignment || assignment.studentId !== request.user.id) {
            return reply.status(404).send({ message: 'Assignment not found' });
        }
        await prisma.assignment.delete({ where: { id: assignmentId } });

        logAction(prisma, {
            action: 'ASSIGNMENT_DELETE',
            details: { assignmentId, subjectId: assignment.subjectId },
            userId: request.user.id, userEmail: request.user.email, collegeId: request.user.collegeId
        });

        return { success: true, message: 'Assignment deleted' };
    });

    fastify.put('/assignments/:assignmentId', async (request, reply) => {
        const { assignmentId } = request.params;
        const existing = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: { subject: { select: { name: true } } }
        });
        if (!existing || existing.studentId !== request.user.id) {
            return reply.status(404).send({ message: 'Assignment not found' });
        }

        try {
            const { validateUploadedFile } = require('../lib/uploadPlugin');
            const raw = await request.file();
            const uploadInfo = validateUploadedFile(raw, request, reply);
            if (!uploadInfo) return;

            const { uploadStream } = require('../services/cloudinaryService');
            const result = await uploadStream(uploadInfo.file, 'assignments', uploadInfo.filename, 'raw');
            if (!result || !result.secure_url) return reply.status(500).send({ message: 'Upload failed' });

            const updated = await prisma.assignment.update({
                where: { id: assignmentId },
                data: {
                    fileUrl: result.secure_url,
                    aiFeedback: "_AI Feedback is being generated. Check back in a moment._"
                }
            });

            addJob(QUEUES.AI, 'generate-feedback', {
                type: 'generate-feedback',
                data: { fileUrl: result.secure_url, subjectName: existing.subject?.name || 'General', assignmentId, userId: request.user.id }
            }).catch(async (err) => {
                fastify.log.error(`AI queue unavailable during replace, falling back to sync: ${err.message}`);
                try {
                    const feedback = await generateFeedback(result.secure_url, existing.subject?.name || 'General');
                    await prisma.assignment.update({
                        where: { id: assignmentId },
                        data: { aiFeedback: feedback }
                    });
                } catch (syncErr) {
                    fastify.log.error(`Sync AI feedback replace also failed: ${syncErr.message}`);
                }
            });

            return updated;
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ message: 'Replace failed: ' + err.message });
        }
    });

    // ─── Hall Ticket ──────────────────────────────────────────────────────────

    fastify.get('/hallticket', async (request, reply) => {
        await checkAndUnlock(request.user.id, prisma);
        const ticket = await prisma.hallTicket.findUnique({ where: { studentId: request.user.id } });
        if (!ticket || !ticket.isUnlocked) {
            return reply.status(403).send({ message: 'Hall ticket locked. Ensure all approvals are complete and fees are cleared.' });
        }
        return { pdfUrl: `${ticket.pdfUrl}?t=${Date.now()}`, qrCodeData: ticket.qrCodeData };
    });

    fastify.get('/hallticket/status', async (request) => {
        const evals = await prisma.evaluation.findMany({
            where: { studentId: request.user.id },
            include: { subject: true }
        });
        const fee = await prisma.feeRecord.findUnique({ where: { studentId: request.user.id } });
        const ticket = await prisma.hallTicket.findUnique({ where: { studentId: request.user.id } });
        const user = await prisma.user.findUnique({ where: { id: request.user.id } });

        const pendingSubjects = evals.filter(e => !e.staffApproved && !e.staffRejected);
        const rejectedSubjects = evals.filter(e => e.staffRejected);
        const approvedCount = evals.filter(e => e.staffApproved).length;

        const checks = [
            { id: 'FEES', label: 'Fee Clearance', passed: (fee?.feeBalance || 0) <= 0, detail: fee?.feeBalance > 0 ? `₹${fee.feeBalance} outstanding` : 'Cleared' },
            { id: 'ACADEMICS', label: 'Academic Approval', passed: pendingSubjects.length === 0 && rejectedSubjects.length === 0, detail: pendingSubjects.length > 0 ? `${pendingSubjects.length} subject(s) pending` : rejectedSubjects.length > 0 ? `${rejectedSubjects.length} subject(s) rejected` : `${approvedCount}/${evals.length} approved` },
            { id: 'ATTENDANCE', label: 'Attendance Eligibility', passed: evals.every(e => e.attendancePercent >= 75), detail: evals.filter(e => e.attendancePercent < 75).map(e => `${e.subject.name}: ${e.attendancePercent}%`).join(', ') || 'All ≥ 75%' },
        ];

        return {
            isUnlocked: ticket?.isUnlocked || false,
            isGenerated: !!ticket?.pdfUrl,
            generatedAt: ticket?.generatedAt,
            qrCodeData: ticket?.qrCodeData,
            checks,
            totalSubjects: evals.length,
            approvedSubjects: approvedCount,
            rejectedSubjects: rejectedSubjects.length,
            pendingSubjects: pendingSubjects.length,
            hasHallTicket: !!ticket?.pdfUrl
        };
    });

    // ─── Payments ─────────────────────────────────────────────────────────────

    fastify.post('/pay-fees', async (request, reply) => {
        try {
            const feeRecord = await prisma.feeRecord.findUnique({ where: { studentId: request.user.id } });
            if (!feeRecord || feeRecord.feeBalance <= 0) return reply.status(400).send({ message: 'No pending fees' });

            const updatedFee = await prisma.feeRecord.update({
                where: { studentId: request.user.id },
                data: { feeBalance: 0, feeClearedManual: true, clearedAt: new Date() }
            });
            await checkAndUnlock(request.user.id, prisma);

            logAction(prisma, {
                action: 'FEE_PAYMENT',
                details: { amount: feeRecord.feeBalance },
                userId: request.user.id, userEmail: request.user.email, collegeId: request.user.collegeId
            });

            return { success: true, message: 'Payment successful! Fee cleared.', feeRecord: updatedFee };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Payment processing failed.' });
        }
    });

    // ─── Public Verification ──────────────────────────────────────────────────

    fastify.get('/verify/:studentId', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (request, reply) => {
        const { studentId } = request.params;
        const ticket = await prisma.hallTicket.findUnique({
            where: { studentId },
            include: { student: { include: { studentSubjects: { include: { subject: true } } } } }
        });
        if (!ticket || !ticket.isUnlocked) {
            return reply.status(404).send({ message: 'Valid hall ticket not found' });
        }
        return {
            studentName: ticket.student.name,
            generatedAt: ticket.generatedAt,
            verificationCode: ticket.verificationCode,
            subjects: ticket.student.studentSubjects.map(ss => ({ name: ss.subject.name, code: ss.subject.code }))
        };
    });

    // ─── AI Features ──────────────────────────────────────────────────────────

    fastify.post('/qa', {
        schema: studentSchema.generateQA,
        config: { rateLimit: { max: 3, timeWindow: '1 minute' } }
    }, async (request, reply) => {
        const { subjectId } = request.body;
        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) return reply.status(404).send({ message: 'Subject not found' });

        try {
            const evaluation = await prisma.evaluation.findFirst({ where: { studentId: request.user.id, subjectId } });
            const { generateImportantQA } = require('../services/aiService');
            const response = await generateImportantQA(subject.name, subject.syllabusText, evaluation);
            return { response };
        } catch (err) {
            fastify.log.error(`AI QA Error: ${err.message}`);
            return reply.status(503).send({ message: 'AI question generation service temporarily unavailable. Please try again later.' });
        }
    });

    fastify.post('/chat', {
        schema: studentSchema.chat,
        config: { rateLimit: { max: 10, timeWindow: '1 minute' } }
    }, async (request, reply) => {
        const { message, subjectId, history } = request.body;

        try {
            const evals = await prisma.evaluation.findMany({
                where: { studentId: request.user.id },
                include: { subject: true }
            });

            let specificContext = "";
            if (subjectId) {
                const sub = await prisma.subject.findUnique({ where: { id: subjectId } });
                if (sub?.syllabusText) {
                    specificContext = `Focusing on ${sub.name}. Syllabus: ${sub.syllabusText.substring(0, 1000)}`;
                }
            }

            const context = history ? history.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n') : '';
            const { chatWithAI } = require('../services/aiService');
            return { response: await chatWithAI(evals, `${message} ${specificContext}\n\nRecent context:\n${context}`) };
        } catch (err) {
            fastify.log.error(`AI Chat Error: ${err.message}`);
            return reply.status(503).send({ message: 'AI chat service temporarily unavailable. Please try again later.' });
        }
    });

    // AI feedback summary across all assignments
    fastify.get('/ai-feedback-summary', async (request) => {
        const assignments = await prisma.assignment.findMany({
            where: { studentId: request.user.id, aiFeedback: { not: null } },
            include: { subject: { select: { name: true, code: true } } },
            orderBy: { submittedAt: 'desc' }
        });
        return assignments;
    });

    fastify.post('/remedial-plan', {
        schema: studentSchema.remedialPlan
    }, async (request, reply) => {
        const { subjectId } = request.body;

        try {
            const { generateRemedialPlan } = require('../services/aiService');

            const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
            if (!subject) return reply.status(404).send({ message: 'Subject not found' });

            const evaluation = await prisma.evaluation.findFirst({ where: { studentId: request.user.id, subjectId } });
            if (!evaluation) return reply.status(404).send({ message: 'No evaluation record found for this subject.' });

            const plan = await generateRemedialPlan(subject.name, subject.syllabusText, evaluation);
            return { plan };
        } catch (err) {
            fastify.log.error(`AI Remedial Plan Error: ${err.message}`);
            return reply.status(503).send({ message: 'AI remedial plan service temporarily unavailable. Please try again later.' });
        }
    });

    // ─── Exam Schedule ────────────────────────────────────────────────────────

    fastify.get('/exams', async (request) => {
        const subjects = await prisma.studentSubject.findMany({
            where: { studentId: request.user.id },
            include: { subject: true }
        });
        return subjects
            .filter(ss => ss.subject.examDate)
            .map(ss => ({
                subjectId: ss.subject.id,
                subjectName: ss.subject.name,
                subjectCode: ss.subject.code,
                semester: ss.subject.semester,
                examDate: ss.subject.examDate,
                examSession: ss.subject.examSession || 'FN'
            }))
            .sort((a, b) => {
                const [d1, m1, y1] = a.examDate.split('/');
                const [d2, m2, y2] = b.examDate.split('/');
                return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
            });
    });

    // ─── Recent Activity ──────────────────────────────────────────────────────

    fastify.get('/activity', async (request) => {
        const auditLogs = await prisma.auditLog.findMany({
            where: {
                OR: [
                    { details: { contains: request.user.id } },
                    { userId: request.user.id }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        return auditLogs;
    });
}

module.exports = studentRoutes;