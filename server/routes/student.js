const { generateFeedback, predictStudentSuccess, chatWithAI, generateAcademicInsights } = require('../services/aiService');
const { checkAndUnlock } = require('../services/hallTicketService');

async function studentRoutes(fastify, opts) {
    fastify.addHook('preHandler', fastify.auth([fastify.authenticate, fastify.authorize(['STUDENT'])]));

    const { prisma } = fastify;

    fastify.post('/predict/:subjectId', async (request, reply) => {
        const { subjectId } = request.params;
        const evaluation = await prisma.evaluation.findFirst({
            where: { studentId: request.user.id, subjectId },
            include: { subject: true }
        });

        if (!evaluation) return reply.status(404).send({ message: 'No record found' });

        const prediction = await predictStudentSuccess(evaluation, evaluation.subject.name);

        const updated = await prisma.evaluation.update({
            where: { id: evaluation.id },
            data: { aiPrediction: JSON.stringify(prediction) }
        });

        return updated;
    });

    fastify.get('/subjects', async (request) => {
        return prisma.studentSubject.findMany({
            where: { studentId: request.user.id },
            include: {
                subject: {
                    include: {
                        staffAssignments: {
                            include: { staff: true }
                        }
                    }
                }
            }
        });
    });

    fastify.get('/status', async (request) => {
        const evals = await prisma.evaluation.findMany({
            where: { studentId: request.user.id },
            include: { subject: true }
        });

        const fee = await prisma.feeRecord.findUnique({
            where: { studentId: request.user.id }
        });

        const ticket = await prisma.hallTicket.findUnique({
            where: { studentId: request.user.id }
        });

        const studentWithSubjects = await prisma.user.findUnique({
            where: { id: request.user.id },
            include: {
                studentSubjects: { include: { subject: true } }
            }
        });

        const suggestions = await generateAcademicInsights(evals, studentWithSubjects.studentSubjects);

        return { evaluations: evals, feeRecord: fee, hallTicket: ticket, suggestions };
    });

    fastify.get('/marks', async (request) => {
        return prisma.evaluation.findMany({
            where: { studentId: request.user.id },
            include: { subject: true }
        });
    });

    fastify.post('/assignments', async (request, reply) => {
        try {
            const data = await request.file();
            if (!data) return reply.status(400).send({ message: 'No file uploaded' });

            const subjectId = data.fields.subjectId ? data.fields.subjectId.value : null;
            if (!subjectId) return reply.status(400).send({ message: 'subjectId is required and must be sent before the file' });

            const fs = require('fs');
            const path = require('path');
            const util = require('util');
            const pipeline = util.promisify(require('stream').pipeline);
            
            let fileUrl;
            try {
                // Save locally to bypass Cloudinary PDF restrictions
                const ext = data.filename.split('.').pop() || 'pdf';
                const fileName = `asgn_${request.user.id}_${subjectId}_${Date.now()}.${ext}`;
                const filePath = path.join(__dirname, '../uploads/assignments', fileName);
                
                await pipeline(data.file, fs.createWriteStream(filePath));
                fileUrl = `/uploads/assignments/${fileName}`;
            } catch (err) {
                fastify.log.error(`Local Assignment Save Error: ${err.message}`);
                return reply.status(500).send({ message: 'Failed to save assignment file locally' });
            }

            // Get AI feedback — pass the uploaded file URL
            const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
            const aiFeedback = await generateFeedback(fileUrl, subject?.name || 'General');

            const assignment = await prisma.assignment.create({
                data: {
                    studentId: request.user.id,
                    subjectId: subjectId,
                    fileUrl: fileUrl,
                    aiFeedback: aiFeedback
                }
            });

            const { sendNotification } = require('../services/notificationService');
            sendNotification(prisma, {
                userId: request.user.id,
                title: 'Assignment Submitted',
                message: `Your assignment for ${subject?.name || 'Subject'} has been uploaded and AI feedback is ready.`,
                type: 'INFO'
            }).catch(console.error);

            return assignment;
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ message: 'Server error during upload: ' + err.message });
        }
    });

    fastify.get('/hallticket', async (request, reply) => {
        // Force a check/refresh of hall ticket status
        await checkAndUnlock(request.user.id, prisma);

        const ticket = await prisma.hallTicket.findUnique({
            where: { studentId: request.user.id }
        });

        if (!ticket || !ticket.isUnlocked) {
            return reply.status(403).send({ message: 'Hall ticket locked. Ensure all approvals are complete and fees are cleared.' });
        }

        return { pdfUrl: `${ticket.pdfUrl}?t=${Date.now()}` };
    });

    // Public Verification Route (Used by QR scanners in Exam Hall)
    fastify.get('/verify/:studentId', async (request, reply) => {
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
            subjects: ticket.student.studentSubjects.map(ss => ({
                name: ss.subject.name,
                code: ss.subject.code
            }))
        };
    });

    fastify.post('/qa', async (request, reply) => {
        const { subjectId } = request.body;
        const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
        if (!subject) return reply.status(404).send({ message: 'Subject not found' });

        const evaluation = await prisma.evaluation.findFirst({
            where: { studentId: request.user.id, subjectId }
        });

        const { generateImportantQA } = require('../services/aiService');
        const response = await generateImportantQA(subject.name, subject.syllabusText, evaluation);

        return { response };
    });

    fastify.post('/chat', async (request) => {
        const { message, subjectId } = request.body;
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

        return { response: await chatWithAI(evals, `${message} ${specificContext}`) };
    });
}

module.exports = studentRoutes;
