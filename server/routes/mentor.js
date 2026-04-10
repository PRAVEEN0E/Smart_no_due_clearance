const bcrypt = require('bcrypt');
const mentorSchema = require('../schemas/mentor.schema');
const { parseStudentExcel, parseFeeExcel } = require('../services/excelService');
const { sendWelcomeEmail, sendFeeUpdateEmail, sendAnnouncementEmail } = require('../services/emailService');

async function mentorRoutes(fastify, opts) {
    // Apply authentication and mentor-role guard to all routes in this plugin
    fastify.addHook('preHandler', fastify.auth([fastify.authenticate, fastify.authorize(['MENTOR', 'SUPERADMIN'])]));

    const { prisma } = fastify;

    fastify.get('/staff', async (request) => {
        const isSuperAdmin = request.user.role === 'SUPERADMIN';
        const isAdmin = isSuperAdmin || request.user.email === 'admin@college.edu';

        return prisma.user.findMany({
            where: {
                role: 'STAFF',
                ...(isSuperAdmin ? {} : { collegeId: request.user.collegeId }),
                ...(!isAdmin ? { createdById: request.user.id } : {})
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
            data: { name, email, passwordHash, role: role || 'STAFF', createdById: request.user.id, collegeId: request.user.collegeId }
        });

        // Send Welcome Email
        sendWelcomeEmail(email, name, password);

        return { id: staff.id, name: staff.name, email: staff.email, role: staff.role };
    });

    // --- STUDENT MANAGEMENT ---
    fastify.get('/students', async (request) => {
        const isSuperAdmin = request.user.role === 'SUPERADMIN';
        const isAdmin = isSuperAdmin || request.user.email === 'admin@college.edu';
        return prisma.user.findMany({
            where: {
                role: 'STUDENT',
                ...(isSuperAdmin ? {} : { collegeId: request.user.collegeId }),
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
                        createdById: request.user.id,
                        collegeId: request.user.collegeId
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
                    // Check Multi-tenant context: only update if student belongs to same college
                    if (user.collegeId !== request.user.collegeId) {
                        results.push({ email: f.email, status: 'Not Authorized', reason: 'Student belongs to a different college context' });
                        continue;
                    }

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

    fastify.post('/bulk-add-common-fee', async (request, reply) => {
        const { amount } = request.body;
        if (!amount || isNaN(amount) || amount <= 0) {
            return reply.status(400).send({ message: 'Invalid fee amount' });
        }

        const isSuperAdmin = request.user.role === 'SUPERADMIN';
        const isAdmin = isSuperAdmin || request.user.email === 'admin@college.edu';

        const students = await prisma.user.findMany({
            where: {
                role: 'STUDENT',
                ...(isSuperAdmin ? {} : { collegeId: request.user.collegeId }),
                ...(!isAdmin ? { createdById: request.user.id } : {})
            },
            select: { id: true }
        });

        const studentIds = students.map(s => s.id);
        if (studentIds.length === 0) return { message: 'No students found to add fee', updatedCount: 0 };

        const updateResult = await prisma.feeRecord.updateMany({
            where: { studentId: { in: studentIds } },
            data: {
                feeBalance: { increment: parseFloat(amount) },
                feeClearedAuto: false,
                clearedAt: null
            }
        });

        await prisma.hallTicket.updateMany({
            where: { studentId: { in: studentIds } },
            data: { isUnlocked: false }
        });

        // Get student info for emails
        const studentInfo = await prisma.user.findMany({
            where: { id: { in: studentIds } },
            select: { email: true, name: true }
        });
        
        // Notify them asynchronously
        Promise.allSettled(studentInfo.map(s => sendFeeUpdateEmail(s.email, s.name, amount))).catch(console.error);

        return { message: `Successfully added ₹${amount} fee to ${updateResult.count} students.`, updatedCount: updateResult.count };
    });

    fastify.post('/students', { schema: mentorSchema.createStudent }, async (request, reply) => {
        const { name, email, password } = request.body;
        const passwordHash = await bcrypt.hash(password, 12);

        const student = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: { name, email, passwordHash, role: 'STUDENT', createdById: request.user.id, collegeId: request.user.collegeId },
                select: { id: true, name: true, email: true, role: true, collegeId: true }
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
            data: updateData,
            select: { id: true, name: true, email: true, role: true, collegeId: true }
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
            data: updateData,
            select: { id: true, name: true, email: true, role: true, collegeId: true }
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
                // If student exists but has no owner, claim them for this mentor ONLY if collegeId matches
                if (!existing.createdById) {
                    if (existing.collegeId === request.user.collegeId) {
                        const claimed = await prisma.user.update({
                            where: { id: existing.id },
                            data: { createdById: request.user.id }
                        });
                        results.push(claimed);
                    } else {
                        results.push({ ...existing, error: 'Cannot claim: student belongs to different college' });
                    }
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
        const isSuperAdmin = request.user.role === 'SUPERADMIN';
        const isAdmin = isSuperAdmin || request.user.email === 'admin@college.edu';
        return prisma.subject.findMany({
            where: {
                ...(isSuperAdmin ? {} : { collegeId: request.user.collegeId }),
                ...(!isAdmin ? { createdById: request.user.id } : {})
            },
            include: { staffAssignments: { include: { staff: true } } }
        });
    });

    fastify.post('/subjects', { schema: mentorSchema.createSubject }, async (request, reply) => {
        return prisma.subject.create({
            data: { ...request.body, createdById: request.user.id, collegeId: request.user.collegeId }
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
        try {
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
        } catch (error) {
            console.error("Fee Update Error:", error);
            return reply.status(500).send({ message: error.message || "Failed to update fee or generate hall ticket" });
        }
    });

    // --- ANALYTICS ---
    // Announcement Management
    fastify.post('/announcements', async (request, reply) => {
        const { title, content, type, priority, expiresAt } = request.body;
        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                type,
                priority: parseInt(priority) || 1,
                createdById: request.user.id,
                collegeId: request.user.collegeId,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });

        // Email Alert for Higher Priority Announcements
        if (announcement.priority >= 2) {
            prisma.user.findMany({
                where: { role: 'STUDENT' }, // You could refine this to 'students belonging to this mentor'
                select: { email: true }
            }).then(recipients => {
                const emails = recipients.map(r => r.email);
                
                // Chunk to 50 for Resend limits
                const chunkSize = 50;
                for (let i = 0; i < emails.length; i += chunkSize) {
                    const chunk = emails.slice(i, i + chunkSize);
                    sendAnnouncementEmail(chunk, title, content, announcement.priority).catch(console.error);
                }
            }).catch(console.error);
        }

        return announcement;
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
        const isSuperAdmin = request.user.role === 'SUPERADMIN';
        const isAdmin = isSuperAdmin || request.user.email === 'admin@college.edu';

        const collegeFilter = isSuperAdmin ? {} : { collegeId: request.user.collegeId };
        const studentFilter = { role: 'STUDENT', ...collegeFilter, ...(!isAdmin ? { createdById: request.user.id } : {}) };
        const staffFilter = isAdmin
            ? { role: { in: ['STAFF', 'MENTOR'] }, ...collegeFilter }
            : { role: 'STAFF', ...collegeFilter, createdById: request.user.id };
        const subjectFilter = isAdmin
            ? { ...collegeFilter }
            : { ...collegeFilter, createdById: request.user.id };

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
