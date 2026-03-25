const bcrypt = require('bcrypt');
const mentorSchema = require('../schemas/mentor.schema');
const { parseStudentExcel, parseFeeExcel } = require('../services/excelService');
const { sendWelcomeEmail } = require('../services/emailService');

async function mentorRoutes(fastify, opts) {
    // Apply authentication and mentor-role guard to all routes in this plugin
    fastify.addHook('preHandler', fastify.auth([fastify.authenticate, fastify.authorize(['MENTOR'])]));

    const { prisma } = fastify;

    fastify.get('/staff', async (request) => {
        const isAdmin = request.user.email === 'admin@college.edu';

        if (isAdmin) {
            // System Admin sees ALL staff and all other mentor accounts
            return prisma.user.findMany({
                where: { role: { in: ['STAFF', 'MENTOR'] } }
            });
        }

        // Regular mentor: only see STAFF users they personally created
        return prisma.user.findMany({
            where: {
                role: 'STAFF',
                createdById: request.user.id
            }
        });
    });

    // --- STAFF MANAGEMENT ---
    fastify.post('/staff', { schema: mentorSchema.createStaff }, async (request, reply) => {
        const { name, email, password, role } = request.body;
        const passwordHash = await bcrypt.hash(password, 12);

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return reply.status(409).send({ message: 'Email already exists' });

        const staff = await prisma.user.create({
            data: { name, email, passwordHash, role: role || 'STAFF', createdById: request.user.id }
        });

        // Send Welcome Email
        sendWelcomeEmail(email, name, password);

        return { id: staff.id, name: staff.name, email: staff.email, role: staff.role };
    });

    // --- STUDENT MANAGEMENT ---
    fastify.get('/students', async (request) => {
        const isAdmin = request.user.email === 'admin@college.edu';
        return prisma.user.findMany({
            where: {
                role: 'STUDENT',
                ...(!isAdmin ? { createdById: request.user.id } : {})
            },
            include: { feeRecord: true }
        });
    });

    fastify.post('/bulk-students', async (request, reply) => {
        const file = await request.file();
        if (!file) return reply.status(400).send({ message: 'No file uploaded' });

        const buffer = await file.toBuffer();
        const students = await parseStudentExcel(buffer);
        const results = [];

        for (const s of students) {
            try {
                const passwordHash = await bcrypt.hash(s.password, 12);
                const user = await prisma.user.create({
                    data: {
                        name: s.name,
                        email: s.email,
                        passwordHash,
                        role: 'STUDENT',
                        createdById: request.user.id
                    }
                });
                await prisma.feeRecord.create({ data: { studentId: user.id, feeBalance: 0 } });

                // Send Welcome Email
                sendWelcomeEmail(s.email, s.name, s.password);

                results.push({ email: s.email, status: 'Success' });
            } catch (err) {
                results.push({ email: s.email, status: 'Failed', reason: err.message });
            }
        }
        return { message: 'Bulk import completed', results };
    });

    fastify.post('/bulk-fees', async (request, reply) => {
        const file = await request.file();
        if (!file) return reply.status(400).send({ message: 'No file uploaded' });

        const buffer = await file.toBuffer();
        const feeUpdates = await parseFeeExcel(buffer);
        const results = [];

        for (const f of feeUpdates) {
            try {
                const user = await prisma.user.findUnique({ where: { email: f.email } });
                if (user) {
                    await prisma.feeRecord.update({
                        where: { studentId: user.id },
                        data: { feeBalance: f.feeBalance, feeClearedAuto: f.feeBalance <= 0 }
                    });
                    results.push({ email: f.email, status: 'Updated' });
                } else {
                    results.push({ email: f.email, status: 'Not Found' });
                }
            } catch (err) {
                results.push({ email: f.email, status: 'Error', reason: err.message });
            }
        }
        return { message: 'Fee update completed', results };
    });

    fastify.post('/students', { schema: mentorSchema.createStudent }, async (request, reply) => {
        const { name, email, password } = request.body;
        const passwordHash = await bcrypt.hash(password, 12);

        const student = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: { name, email, passwordHash, role: 'STUDENT', createdById: request.user.id }
            });
            await tx.feeRecord.create({
                data: { studentId: newUser.id, feeBalance: 0, feeClearedAuto: true }
            });
            return newUser;
        });

        // Send Welcome Email after successful creation
        sendWelcomeEmail(email, name, password);

        return student;
    });

    fastify.put('/students/:id', async (request, reply) => {
        const { name, email, password } = request.body;
        const updateData = { name, email };

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 12);
        }

        return prisma.user.update({
            where: { id: request.params.id },
            data: updateData
        });
    });

    fastify.put('/staff/:id', async (request, reply) => {
        const { name, email, password } = request.body;
        const updateData = { name, email };

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 12);
        }

        return prisma.user.update({
            where: { id: request.params.id },
            data: updateData
        });
    });

    fastify.post('/upload/students', async (request, reply) => {
        const data = await request.file();
        const buffer = await data.toBuffer();
        const students = await parseStudentExcel(buffer);

        const results = [];
        for (const s of students) {
            const existing = await prisma.user.findUnique({ where: { email: s.email } });

            if (existing) {
                // If student exists but has no owner, claim them for this mentor
                if (!existing.createdById) {
                    const claimed = await prisma.user.update({
                        where: { id: existing.id },
                        data: { createdById: request.user.id }
                    });
                    results.push(claimed);
                } else {
                    // Already owned by another mentor — skip
                    results.push(existing);
                }
                continue;
            }

            // Brand new student — create and tag with this mentor
            const passwordHash = await bcrypt.hash(s.password, 12);
            const student = await prisma.user.create({
                data: {
                    name: s.name,
                    email: s.email,
                    passwordHash,
                    role: 'STUDENT',
                    createdById: request.user.id,
                    feeRecord: {
                        create: { feeBalance: 0, feeClearedAuto: true }
                    }
                }
            });
            results.push(student);

            // Send Welcome Email
            sendWelcomeEmail(s.email, s.name, s.password);
        }
        return { count: results.length, students: results };
    });



    fastify.post('/upload/fees', async (request, reply) => {
        const data = await request.file();
        const buffer = await data.toBuffer();
        const feeData = await parseFeeExcel(buffer);

        for (const f of feeData) {
            const student = await prisma.user.findUnique({ where: { email: f.email } });
            if (student) {
                await prisma.feeRecord.upsert({
                    where: { studentId: student.id },
                    update: {
                        feeBalance: f.feeBalance,
                        feeClearedAuto: f.feeBalance === 0,
                        clearedAt: f.feeBalance === 0 ? new Date() : null
                    },
                    create: {
                        studentId: student.id,
                        feeBalance: f.feeBalance,
                        feeClearedAuto: f.feeBalance === 0,
                        clearedAt: f.feeBalance === 0 ? new Date() : null
                    }
                });
            }
        }
        return { success: true };
    });

    fastify.delete('/students/:id', async (request, reply) => {
        await prisma.user.delete({ where: { id: request.params.id } });
        return { success: true };
    });

    // --- SUBJECT MANAGEMENT ---
    fastify.get('/subjects', async (request) => {
        const isAdmin = request.user.email === 'admin@college.edu';
        return prisma.subject.findMany({
            where: isAdmin ? {} : { createdById: request.user.id },
            include: { staffAssignments: { include: { staff: true } } }
        });
    });

    fastify.post('/subjects', { schema: mentorSchema.createSubject }, async (request, reply) => {
        return prisma.subject.create({
            data: { ...request.body, createdById: request.user.id }
        });
    });

    fastify.put('/subjects/:id', async (request, reply) => {
        return prisma.subject.update({
            where: { id: request.params.id },
            data: request.body
        });
    });

    fastify.delete('/subjects/:id', async (request, reply) => {
        await prisma.subject.delete({ where: { id: request.params.id } });
        return { success: true };
    });

    // --- ASSIGNMENTS ---
    fastify.post('/assign/staff', { schema: mentorSchema.assignStaff }, async (request, reply) => {
        const { staffId, subjectId } = request.body;

        return prisma.$transaction(async (tx) => {
            // Check if this specific mapping already exists
            const existing = await tx.staffSubject.findUnique({
                where: {
                    staffId_subjectId: { staffId, subjectId }
                }
            });

            if (existing) {
                return existing;
            }

            const assignment = await tx.staffSubject.create({
                data: { staffId, subjectId }
            });

            // Retroactively update evaluations for this subject that don't have a staff member assigned
            await tx.evaluation.updateMany({
                where: { subjectId, staffId: null },
                data: { staffId }
            });

            return assignment;
        });
    });

    fastify.post('/assign/student', { schema: mentorSchema.assignStudent }, async (request, reply) => {
        const { studentId, subjectId } = request.body;

        return prisma.$transaction(async (tx) => {
            const existing = await tx.studentSubject.findUnique({
                where: {
                    studentId_subjectId: { studentId, subjectId }
                }
            });

            if (existing) return existing;

            const assignment = await tx.studentSubject.create({
                data: { studentId, subjectId }
            });

            // Find the staff assigned to this subject (for the evaluation record)
            const staffSubject = await tx.staffSubject.findFirst({ where: { subjectId } });

            await tx.evaluation.create({
                data: {
                    studentId,
                    subjectId,
                    staffId: staffSubject ? staffSubject.staffId : null,
                }
            });

            return assignment;
        });
    });

    // --- MANUAL FEE OVERRIDE ---
    fastify.put('/fees/:studentId', { schema: mentorSchema.updateFee }, async (request, reply) => {
        const { feeClearedManual } = request.body;
        const feeRecord = await prisma.feeRecord.update({
            where: { studentId: request.params.studentId },
            data: {
                feeClearedManual,
                feeBalance: feeClearedManual ? 0 : undefined,
                clearedAt: feeClearedManual ? new Date() : null
            }
        });

        // Proactively check for hall ticket unlock
        const { checkAndUnlock } = require('../services/hallTicketService');
        await checkAndUnlock(request.params.studentId, prisma);

        return feeRecord;
    });

    // --- ANALYTICS ---
    // Announcement Management
    fastify.post('/announcements', async (request, reply) => {
        const { title, content, type, priority, expiresAt } = request.body;
        return prisma.announcement.create({
            data: {
                title,
                content,
                type,
                priority: parseInt(priority) || 1,
                createdById: request.user.id,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });
    });

    fastify.get('/announcements', async (request) => {
        return prisma.announcement.findMany({
            where: {
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
    });

    fastify.delete('/announcements/:id', async (request) => {
        return prisma.announcement.delete({ where: { id: request.params.id } });
    });

    fastify.get('/analytics', async (request) => {
        const isAdmin = request.user.email === 'admin@college.edu';

        const studentFilter = { role: 'STUDENT', ...(!isAdmin ? { createdById: request.user.id } : {}) };
        const staffFilter = isAdmin
            ? { role: { in: ['STAFF', 'MENTOR'] } }
            : { role: 'STAFF', createdById: request.user.id };

        const subjectFilter = isAdmin ? {} : { createdById: request.user.id };

        // For approvals: count only evaluations for subjects owned by this mentor
        const mentorSubjectIds = isAdmin
            ? undefined
            : (await prisma.subject.findMany({ where: subjectFilter, select: { id: true } })).map(s => s.id);

        const approvalFilter = isAdmin
            ? { staffApproved: true }
            : { staffApproved: true, subjectId: { in: mentorSubjectIds } };

        const [studentCount, staffCount, subjectCount, totalApprovals] = await Promise.all([
            prisma.user.count({ where: studentFilter }),
            prisma.user.count({ where: staffFilter }),
            prisma.subject.count({ where: subjectFilter }),
            prisma.evaluation.count({ where: approvalFilter })
        ]);

        return {
            stats: { studentCount, staffCount, subjectCount, totalApprovals },
            recentActivity: []
        };
    });
}

module.exports = mentorRoutes;
