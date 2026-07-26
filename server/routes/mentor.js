const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mentorSchema = require('../schemas/mentor.schema');
const { parseStudentExcel, parseFeeExcel, generateFeeExcel } = require('../services/excelService');
const { sendWelcomeEmail } = require('../services/emailService');
const { generateFeeReportPDF } = require('../services/reportService');
const { QUEUES, addBulk } = require('../lib/queue');
const { validateUploadedFile } = require('../lib/uploadPlugin');
const { success, created, badRequest, forbidden, notFound, conflict, serverError } = require('../constants/responses');

function generateSetupToken() {
    return crypto.randomBytes(32).toString('hex');
}

function sendSetupEmail(email, name, prisma, userId) {
    const setupToken = generateSetupToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return Promise.all([
        prisma.user.update({
            where: { id: userId },
            data: { passwordSetupToken: setupToken, passwordSetupTokenExpires: expiresAt }
        }),
        sendWelcomeEmail(email, name, setupToken)
    ]);
}

function isSuperAdmin(user) {
    return user.role === 'SUPERADMIN';
}

function isAdmin(user) {
    return isSuperAdmin(user) || user.email === 'admin@college.edu';
}

function buildCollegeFilter(user, adminOverride) {
    const isAdminUser = adminOverride !== undefined ? adminOverride : isAdmin(user);
    if (isSuperAdmin(user)) return {};
    const filter = { collegeId: user.collegeId, deletedAt: null };
    if (!isAdminUser) filter.createdById = user.id;
    return filter;
}

function buildStudentFilter(user, includeArchived) {
    const filter = { role: 'STUDENT', deletedAt: null };
    if (!isSuperAdmin(user)) filter.collegeId = user.collegeId || null;
    if (includeArchived) delete filter.deletedAt;
    return filter;
}

async function findAndVerifyCollegeOwnership(id, collegeId, prisma, reply) {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.collegeId !== collegeId) {
        forbidden(reply, 'User belongs to a different college');
        return null;
    }
    return existing;
}

async function findAndVerifySubjectOwnership(id, collegeId, prisma, reply) {
    const existing = await prisma.subject.findUnique({ where: { id }, select: { id: true, collegeId: true, deletedAt: true } });
    if (!existing || existing.collegeId !== collegeId) {
        forbidden(reply, 'Subject belongs to a different college');
        return null;
    }
    return existing;
}

async function logAudit(fastify, action, details, request) {
    try {
        await fastify.prisma.auditLog.create({
            data: {
                action,
                details: typeof details === 'string' ? details : JSON.stringify(details),
                userId: request.user.id,
                userEmail: request.user.email,
                collegeId: request.user.collegeId
            }
        });
    } catch (err) {
        fastify.log.error(`Audit log failed: ${err.message}`);
    }
}

async function mentorRoutes(fastify, opts) {
    fastify.addHook('preHandler', fastify.auth([fastify.authenticate, fastify.authorize(['MENTOR', 'SUPERADMIN'])]));

    const { prisma } = fastify;

    // ──────────────────────────────────────────────
    // STAFF MANAGEMENT
    // ──────────────────────────────────────────────

    fastify.get('/staff', async (request) => {
        const isAdminUser = isAdmin(request.user);
        const where = { role: 'STAFF', deletedAt: null, ...buildCollegeFilter(request.user, isAdminUser) };
        return prisma.user.findMany({ where, select: { id: true, name: true, email: true, role: true, collegeId: true } });
    });

    fastify.get('/staff/:id', { schema: mentorSchema.getStaff }, async (request, reply) => {
        const staff = await prisma.user.findUnique({
            where: { id: request.params.id },
            select: { id: true, name: true, email: true, role: true, collegeId: true, deletedAt: true }
        });
        if (!staff || staff.deletedAt) return notFound(reply, 'Staff not found');
        const { deletedAt, ...result } = staff;
        return result;
    });

    fastify.post('/staff', { schema: mentorSchema.createStaff }, async (request, reply) => {
        const { name, email, password, role } = request.body;
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return conflict(reply, 'Email already exists');

        const passwordHash = await bcrypt.hash(password, 12);
        const staff = await prisma.user.create({
            data: {
                name, email, passwordHash,
                role: role || 'STAFF',
                createdBy: { connect: { id: request.user.id } },
                college: request.user.collegeId ? { connect: { id: request.user.collegeId } } : undefined
            }
        });

        sendSetupEmail(email, name, prisma, staff.id);
        logAudit(fastify, 'STAFF_CREATED', { staffId: staff.id, name, email }, request);
        return created(reply, { id: staff.id, name: staff.name, email: staff.email, role: staff.role });
    });

    fastify.put('/staff/:id', { schema: mentorSchema.updateStaff }, async (request, reply) => {
        const existing = await findAndVerifyCollegeOwnership(request.params.id, request.user.collegeId, prisma, reply);
        if (!existing) return;

        const { name, email, password } = request.body;
        const updateData = { name, email };
        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 12);
        }

        const updated = await prisma.user.update({
            where: { id: request.params.id },
            data: updateData,
            select: { id: true, name: true, email: true, role: true, collegeId: true }
        });

        logAudit(fastify, 'STAFF_UPDATED', { staffId: request.params.id, changes: Object.keys(updateData) }, request);
        return updated;
    });

    fastify.delete('/staff/:id', { schema: mentorSchema.deleteStaff }, async (request, reply) => {
        const existing = await findAndVerifyCollegeOwnership(request.params.id, request.user.collegeId, prisma, reply);
        if (!existing) return;

        await prisma.user.update({
            where: { id: request.params.id },
            data: { deletedAt: new Date() }
        });

        logAudit(fastify, 'STAFF_DELETED', { staffId: request.params.id, name: existing.name, email: existing.email }, request);
        return success(reply, null, 'Staff deleted successfully');
    });

    fastify.post('/staff/:id/restore', { schema: mentorSchema.getStaff }, async (request, reply) => {
        const existing = await prisma.user.findUnique({ where: { id: request.params.id } });
        if (!existing || existing.collegeId !== request.user.collegeId) {
            return forbidden(reply, 'Unauthorized');
        }
        if (!existing.deletedAt) return badRequest(reply, 'Staff is not archived');

        await prisma.user.update({
            where: { id: request.params.id },
            data: { deletedAt: null }
        });

        logAudit(fastify, 'STAFF_RESTORED', { staffId: request.params.id, name: existing.name }, request);
        return success(reply, null, 'Staff restored successfully');
    });

    // ──────────────────────────────────────────────
    // STUDENT MANAGEMENT
    // ──────────────────────────────────────────────

    fastify.get('/students', { schema: mentorSchema.listStudents }, async (request, reply) => {
        const page = Math.max(1, parseInt(request.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(request.query.limit) || 50));
        const skip = (page - 1) * limit;
        const includeArchived = request.query.archived === 'true';

        const where = buildStudentFilter(request.user, includeArchived);

        if (request.query.search) {
            const search = request.query.search;
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { registerNumber: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (request.query.department) where.department = request.query.department;
        if (request.query.className) where.className = request.query.className;

        if (request.query.feeStatus && request.query.feeStatus !== 'all') {
            const isCleared = request.query.feeStatus === 'cleared';
            where.feeRecord = isCleared
                ? { OR: [{ feeClearedAuto: true }, { feeClearedManual: true }] }
                : { feeClearedAuto: false, feeClearedManual: false };
        }

        const orderBy = {};
        const sortBy = request.query.sortBy || 'createdAt';
        const sortOrder = request.query.sortOrder || 'desc';
        orderBy[sortBy] = sortOrder;

        try {
            const [data, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    include: {
                        feeRecord: true,
                        studentSubjects: { include: { subject: { select: { id: true, name: true, code: true } } } }
                    },
                    orderBy
                }),
                prisma.user.count({ where })
            ]);

            return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
        } catch (error) {
            fastify.log.error(`Students Fetch Error: ${error.message}`);
            return serverError(reply, 'Failed to fetch students');
        }
    });

    fastify.post('/students', { schema: mentorSchema.createStudent }, async (request, reply) => {
        const { name, email, registerNumber, password, className, department } = request.body;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return conflict(reply, 'Email already exists');

        const passwordHash = await bcrypt.hash(password, 12);
        let studentDept = department || null;
        if (!studentDept) {
            const mentor = await prisma.user.findUnique({ where: { id: request.user.id }, select: { department: true } });
            studentDept = mentor?.department || null;
        }

        const student = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name, email,
                    registerNumber: registerNumber || null,
                    passwordHash,
                    role: 'STUDENT',
                    createdBy: { connect: { id: request.user.id } },
                    college: request.user.collegeId ? { connect: { id: request.user.collegeId } } : undefined,
                    className: className || null,
                    department: studentDept || null
                },
                select: { id: true, name: true, email: true, registerNumber: true, role: true, collegeId: true, className: true, department: true }
            });
            await tx.feeRecord.create({ data: { studentId: newUser.id, feeBalance: 0, feeClearedAuto: true } });
            return newUser;
        });

        sendSetupEmail(email, name, prisma, student.id);
        logAudit(fastify, 'STUDENT_CREATED', { studentId: student.id, name, email, className, department }, request);
        return student;
    });

    fastify.put('/students/:id', { schema: mentorSchema.updateStudent }, async (request, reply) => {
        const existing = await findAndVerifyCollegeOwnership(request.params.id, request.user.collegeId, prisma, reply);
        if (!existing) return;

        const { name, email, registerNumber, password, className, department } = request.body;
        const updateData = { name, email };
        if (registerNumber !== undefined) updateData.registerNumber = registerNumber || null;
        if (className !== undefined) updateData.className = className || null;
        if (department !== undefined) updateData.department = department || null;
        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 12);
        }

        const updated = await prisma.user.update({
            where: { id: request.params.id },
            data: updateData,
            select: { id: true, name: true, email: true, registerNumber: true, role: true, collegeId: true, className: true, department: true }
        });

        logAudit(fastify, 'STUDENT_UPDATED', { studentId: request.params.id, changes: Object.keys(updateData) }, request);
        return updated;
    });

    fastify.delete('/students/:id', { schema: mentorSchema.deleteStudent }, async (request, reply) => {
        const existing = await findAndVerifyCollegeOwnership(request.params.id, request.user.collegeId, prisma, reply);
        if (!existing) return;

        await prisma.user.update({
            where: { id: request.params.id },
            data: { deletedAt: new Date() }
        });

        logAudit(fastify, 'STUDENT_DELETED', { studentId: request.params.id, name: existing.name, email: existing.email }, request);
        return success(reply, null, 'Student deleted successfully');
    });

    fastify.post('/students/:id/restore', { schema: mentorSchema.getStaff }, async (request, reply) => {
        const existing = await prisma.user.findUnique({ where: { id: request.params.id } });
        if (!existing || existing.collegeId !== request.user.collegeId) {
            return forbidden(reply, 'Unauthorized');
        }
        if (!existing.deletedAt) return badRequest(reply, 'Student is not archived');

        await prisma.user.update({
            where: { id: request.params.id },
            data: { deletedAt: null }
        });

        logAudit(fastify, 'STUDENT_RESTORED', { studentId: request.params.id, name: existing.name }, request);
        return success(reply, null, 'Student restored successfully');
    });

    fastify.delete('/students/:id/permanent', { schema: mentorSchema.deleteStudent }, async (request, reply) => {
        if (!isSuperAdmin(request.user)) {
            return forbidden(reply, 'Only Super Admin can permanently delete records');
        }
        const existing = await prisma.user.findUnique({ where: { id: request.params.id } });
        if (!existing) return notFound(reply, 'Student not found');

        await prisma.user.delete({ where: { id: request.params.id } });
        logAudit(fastify, 'STUDENT_PERMANENT_DELETED', { studentId: request.params.id, name: existing.name, email: existing.email }, request);
        return success(reply, null, 'Student permanently deleted');
    });

    // ──────────────────────────────────────────────
    // BULK IMPORT
    // ──────────────────────────────────────────────

    fastify.post('/bulk-students', async (request, reply) => {
        const raw = await request.file();
        const uploadInfo = validateUploadedFile(raw, request, reply);
        if (!uploadInfo) return;

        const buffer = await uploadInfo.toBuffer();
        const students = await parseStudentExcel(buffer);
        const results = [];

        const emailJobs = [];

        for (const s of students) {
            try {
                const existing = await prisma.user.findUnique({ where: { email: s.email } });

                if (existing) {
                    if (existing.collegeId === request.user.collegeId) {
                        await prisma.user.update({
                            where: { id: existing.id },
                            data: {
                                name: s.name,
                                registerNumber: s.registerNumber ? String(s.registerNumber) : undefined,
                                className: s.className || undefined,
                                department: s.department || undefined
                            }
                        });
                        results.push({ email: s.email, status: 'Updated' });
                    } else {
                        results.push({ email: s.email, status: 'Failed', reason: 'Belongs to different college' });
                    }
                    continue;
                }

                const passwordHash = await bcrypt.hash(s.password, 12);
                const user = await prisma.user.create({
                    data: {
                        name: s.name,
                        email: s.email,
                        registerNumber: s.registerNumber ? String(s.registerNumber) : null,
                        passwordHash,
                        role: 'STUDENT',
                        createdBy: { connect: { id: request.user.id } },
                        college: request.user.collegeId ? { connect: { id: request.user.collegeId } } : undefined,
                        className: s.className || null,
                        department: s.department || null
                    }
                });
                await prisma.feeRecord.create({ data: { studentId: user.id, feeBalance: 0, feeClearedAuto: true } });

                const setupToken = generateSetupToken();
                const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { passwordSetupToken: setupToken, passwordSetupTokenExpires: expiresAt }
                });
                emailJobs.push({
                    name: 'welcome',
                    data: { type: 'welcome', data: { email: s.email, name: s.name, token: setupToken } }
                });
                results.push({ email: s.email, status: 'Created' });
            } catch (err) {
                let reason = err.message;
                if (err.code === 'P2002') {
                    const fields = err.meta?.target || ['unknown'];
                    reason = `Duplicate value: ${Array.isArray(fields) ? fields.join(', ') : fields} already exists`;
                }
                results.push({ email: s.email || 'unknown', status: 'Failed', reason });
            }
        }

        if (emailJobs.length > 0) {
            addBulk(QUEUES.EMAIL, emailJobs).catch((err) => {
                fastify.log.error(`Bulk email queue error: ${err.message}`);
            });
        }

        const createdCount = results.filter(r => r.status === 'Created').length;
        const updatedCount = results.filter(r => r.status === 'Updated').length;
        if (createdCount > 0 || updatedCount > 0) {
            logAudit(fastify, 'STUDENT_IMPORTED', { created: createdCount, updated: updatedCount, total: results.length }, request);
        }
        return { message: 'Bulk import completed', results };
    });

    fastify.post('/bulk-fees', async (request, reply) => {
        const raw = await request.file();
        const uploadInfo = validateUploadedFile(raw, request, reply);
        if (!uploadInfo) return;

        const buffer = await uploadInfo.toBuffer();
        const feeUpdates = await parseFeeExcel(buffer);
        const results = [];

        for (const f of feeUpdates) {
            try {
                const user = await prisma.user.findUnique({ where: { email: f.email } });
                if (!user) {
                    results.push({ email: f.email, status: 'Not Found' });
                    continue;
                }
                if (user.collegeId !== request.user.collegeId) {
                    results.push({ email: f.email, status: 'Not Authorized', reason: 'Student belongs to a different college context' });
                    continue;
                }

                await prisma.feeRecord.upsert({
                    where: { studentId: user.id },
                    create: { studentId: user.id, feeBalance: f.feeBalance, feeClearedAuto: f.feeBalance <= 0 },
                    update: { feeBalance: f.feeBalance, feeClearedAuto: f.feeBalance <= 0 }
                });
                results.push({ email: f.email, status: 'Updated' });
            } catch (err) {
                results.push({ email: f.email, status: 'Error', reason: err.message });
            }
        }

        const updatedFeeCount = results.filter(r => r.status === 'Updated').length;
        if (updatedFeeCount > 0) {
            logAudit(fastify, 'FEE_IMPORTED', { updated: updatedFeeCount, total: results.length }, request);
        }
        return { message: 'Fee update completed', results };
    });

    fastify.post('/bulk-add-common-fee', { schema: mentorSchema.commonFee }, async (request, reply) => {
        const { amount } = request.body;

        const isAdminUser = isAdmin(request.user);
        const students = await prisma.user.findMany({
            where: { role: 'STUDENT', deletedAt: null, ...buildCollegeFilter(request.user, isAdminUser) },
            select: { id: true }
        });

        const studentIds = students.map(s => s.id);
        if (studentIds.length === 0) return { message: 'No students found to add fee', updatedCount: 0 };

        const [updateResult] = await Promise.all([
            prisma.feeRecord.updateMany({
                where: { studentId: { in: studentIds } },
                data: { feeBalance: { increment: parseFloat(amount) }, feeClearedAuto: false, clearedAt: null }
            }),
            prisma.hallTicket.updateMany({
                where: { studentId: { in: studentIds } },
                data: { isUnlocked: false }
            })
        ]);

        const studentInfo = await prisma.user.findMany({
            where: { id: { in: studentIds } },
            select: { email: true }
        });

        addBulk(QUEUES.EMAIL, studentInfo.map(s => ({
            name: 'fee-update',
            data: { type: 'fee-update', data: { email: s.email, amount } }
        }))).catch(() => {});

        logAudit(fastify, 'COMMON_FEE_ADDED', { amount, studentCount: studentIds.length, updatedCount: updateResult.count }, request);
        return { message: `Successfully added ₹${amount} fee to ${updateResult.count} students.`, updatedCount: updateResult.count };
    });

    // ──────────────────────────────────────────────
    // FEE MANAGEMENT
    // ──────────────────────────────────────────────

    fastify.put('/fees/:studentId', { schema: mentorSchema.updateFee }, async (request, reply) => {
        const { feeClearedManual } = request.body;

        const existing = await findAndVerifyCollegeOwnership(request.params.studentId, request.user.collegeId, prisma, reply);
        if (!existing) return;

        try {
            const feeRecord = await prisma.feeRecord.update({
                where: { studentId: request.params.studentId },
                data: {
                    feeClearedManual,
                    feeBalance: feeClearedManual ? 0 : undefined,
                    clearedAt: feeClearedManual ? new Date() : null
                }
            });

            const { checkAndUnlock } = require('../services/hallTicketService');
            await checkAndUnlock(request.params.studentId, prisma);

            logAudit(fastify, 'FEE_UPDATED', { studentId: request.params.studentId, feeClearedManual, studentName: existing.name }, request);
            return feeRecord;
        } catch (error) {
            fastify.log.error(`Fee Update Error: ${error.message}`);
            return serverError(reply, error.message || 'Failed to update fee or generate hall ticket');
        }
    });

    // ──────────────────────────────────────────────
    // SUBJECT MANAGEMENT
    // ──────────────────────────────────────────────

    fastify.get('/subjects', async (request) => {
        const isAdminUser = isAdmin(request.user);
        const collegeId = request.user.collegeId;
        return fastify.cache.remember(fastify.cache.KEYS.subjects(collegeId), fastify.cache.DEFAULT_TTL, () => {
            return prisma.subject.findMany({
                where: {
                    deletedAt: null,
                    ...(isSuperAdmin(request.user) ? {} : { collegeId }),
                    ...(!isAdminUser ? { createdById: request.user.id } : {})
                },
                include: { staffAssignments: { include: { staff: { select: { id: true, name: true, email: true } } } } }
            });
        });
    });

    fastify.post('/subjects', { schema: mentorSchema.createSubject }, async (request, reply) => {
        const { name, code, type, syllabusText, semester, examDate, examSession } = request.body;
        const result = await prisma.subject.create({
            data: {
                name, code, type, syllabusText, semester, examDate, examSession,
                createdBy: { connect: { id: request.user.id } },
                college: request.user.collegeId ? { connect: { id: request.user.collegeId } } : undefined
            }
        });
        fastify.cache.delPattern(`sndc:subjects:${request.user.collegeId || '*'}`);
        logAudit(fastify, 'SUBJECT_CREATED', { subjectId: result.id, name, code, type }, request);
        return result;
    });

    fastify.put('/subjects/:id', { schema: mentorSchema.updateSubject }, async (request, reply) => {
        const existing = await findAndVerifySubjectOwnership(request.params.id, request.user.collegeId, prisma, reply);
        if (!existing) return;

        const { name, code, type, syllabusText, semester, examDate, examSession } = request.body;
        const result = await prisma.subject.update({
            where: { id: request.params.id },
            data: { name, code, type, syllabusText, semester, examDate, examSession }
        });
        fastify.cache.delPattern(`sndc:subjects:${request.user.collegeId || '*'}`);
        logAudit(fastify, 'SUBJECT_UPDATED', { subjectId: request.params.id, changes: { name, code, type } }, request);
        return result;
    });

    fastify.delete('/subjects/:id', { schema: mentorSchema.deleteSubject }, async (request, reply) => {
        const existing = await findAndVerifySubjectOwnership(request.params.id, request.user.collegeId, prisma, reply);
        if (!existing) return;

        await prisma.subject.update({
            where: { id: request.params.id },
            data: { deletedAt: new Date() }
        });
        fastify.cache.delPattern(`sndc:subjects:${request.user.collegeId || '*'}`);
        logAudit(fastify, 'SUBJECT_DELETED', { subjectId: request.params.id, name: existing.name, code: existing.code }, request);
        return success(reply, null, 'Subject deleted successfully');
    });

    fastify.post('/subjects/:id/restore', { schema: mentorSchema.deleteSubject }, async (request, reply) => {
        const existing = await prisma.subject.findUnique({ where: { id: request.params.id } });
        if (!existing || existing.collegeId !== request.user.collegeId) {
            return forbidden(reply, 'Unauthorized');
        }
        if (!existing.deletedAt) return badRequest(reply, 'Subject is not archived');

        await prisma.subject.update({ where: { id: request.params.id }, data: { deletedAt: null } });
        fastify.cache.delPattern(`sndc:subjects:${request.user.collegeId || '*'}`);
        logAudit(fastify, 'SUBJECT_RESTORED', { subjectId: request.params.id, name: existing.name }, request);
        return success(reply, null, 'Subject restored successfully');
    });

    fastify.delete('/subjects/:id/permanent', { schema: mentorSchema.deleteSubject }, async (request, reply) => {
        if (!isSuperAdmin(request.user)) {
            return forbidden(reply, 'Only Super Admin can permanently delete records');
        }
        await prisma.subject.delete({ where: { id: request.params.id } });
        fastify.cache.delPattern(`sndc:subjects:${request.user.collegeId || '*'}`);
        logAudit(fastify, 'SUBJECT_PERMANENT_DELETED', { subjectId: request.params.id }, request);
        return success(reply, null, 'Subject permanently deleted');
    });

    // ──────────────────────────────────────────────
    // STAFF-STUDENT ASSIGNMENTS
    // ──────────────────────────────────────────────

    fastify.post('/assign/staff', { schema: mentorSchema.assignStaff }, async (request, reply) => {
        const { staffId, subjectId } = request.body;

        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.staffSubject.findUnique({
                where: { staffId_subjectId: { staffId, subjectId } }
            });
            if (existing) return existing;

            const assignment = await tx.staffSubject.create({ data: { staffId, subjectId } });

            await tx.evaluation.updateMany({
                where: { subjectId, staffId: null },
                data: { staffId }
            });

            return assignment;
        });

        logAudit(fastify, 'STAFF_ASSIGNED', { staffId, subjectId }, request);
        return result;
    });

    fastify.post('/assign/student', { schema: mentorSchema.assignStudent }, async (request, reply) => {
        const { studentId, subjectId } = request.body;

        const result = await prisma.$transaction(async (tx) => {
            const existing = await tx.studentSubject.findUnique({
                where: { studentId_subjectId: { studentId, subjectId } }
            });
            if (existing) return existing;

            const assignment = await tx.studentSubject.create({ data: { studentId, subjectId } });

            const staffSubject = await tx.staffSubject.findFirst({ where: { subjectId } });
            await tx.evaluation.create({
                data: { studentId, subjectId, staffId: staffSubject ? staffSubject.staffId : null }
            });

            return assignment;
        });

        logAudit(fastify, 'STUDENT_ASSIGNED', { studentId, subjectId }, request);
        return result;
    });

    // ──────────────────────────────────────────────
    // ANNOUNCEMENT MANAGEMENT
    // ──────────────────────────────────────────────

    fastify.post('/announcements', { schema: mentorSchema.createAnnouncement }, async (request, reply) => {
        const { title, content, type, priority, expiresAt } = request.body;

        const announcement = await prisma.announcement.create({
            data: {
                title, content,
                type: type || 'CAMPUS',
                priority: Math.min(5, Math.max(1, parseInt(priority) || 1)),
                createdById: request.user.id,
                collegeId: request.user.collegeId,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });

        fastify.cache.delPattern(`sndc:announcements:${request.user.collegeId || 'global'}`);

        if (announcement.priority >= 2) {
            const recipients = await prisma.user.findMany({
                where: { role: 'STUDENT', deletedAt: null, ...(isSuperAdmin(request.user) ? {} : { collegeId: request.user.collegeId }) },
                select: { email: true }
            });
            const emails = recipients.map(r => r.email);

            const chunkSize = 50;
            const jobs = [];
            for (let i = 0; i < emails.length; i += chunkSize) {
                const chunk = emails.slice(i, i + chunkSize);
                jobs.push({
                    name: 'announcement',
                    data: { type: 'announcement', data: { emails: chunk, title, content, priority: announcement.priority } }
                });
            }
            addBulk(QUEUES.EMAIL, jobs).catch(() => {});
        }

        logAudit(fastify, 'ANNOUNCEMENT_CREATED', { announcementId: announcement.id, title, priority: announcement.priority }, request);
        return announcement;
    });

    fastify.get('/announcements', async (request) => {
        const collegeId = request.user.collegeId || 'global';
        return fastify.cache.remember(fastify.cache.KEYS.announcements(collegeId), fastify.cache.SHORT_TTL, () => {
            return prisma.announcement.findMany({
                where: {
                    deletedAt: null,
                    collegeId: request.user.collegeId || undefined,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            });
        });
    });

    fastify.put('/announcements/:id', { schema: mentorSchema.updateAnnouncement }, async (request, reply) => {
        const { id } = request.params;
        const { title, content, type, priority, expiresAt } = request.body;

        try {
            const existing = await prisma.announcement.findUnique({ where: { id } });
            if (!existing) return notFound(reply, 'Announcement not found');

            const updated = await prisma.announcement.update({
                where: { id },
                data: {
                    title, content,
                    type: type || 'CAMPUS',
                    priority: Math.min(5, Math.max(1, parseInt(priority) || 1)),
                    expiresAt: expiresAt ? new Date(expiresAt) : null
                }
            });
            fastify.cache.delPattern('sndc:announcements:*');
            logAudit(fastify, 'ANNOUNCEMENT_UPDATED', { announcementId: id, title }, request);
            return updated;
        } catch (error) {
            fastify.log.error(`Announcement update error: ${error.message}`);
            return serverError(reply, 'Failed to update announcement');
        }
    });

    fastify.delete('/announcements/:id', { schema: mentorSchema.deleteAnnouncement }, async (request, reply) => {
        try {
            const existing = await prisma.announcement.findUnique({ where: { id: request.params.id } });
            if (!existing) return notFound(reply, 'Announcement not found');

            await prisma.announcement.update({
                where: { id: request.params.id },
                data: { deletedAt: new Date() }
            });
            fastify.cache.delPattern('sndc:announcements:*');
            logAudit(fastify, 'ANNOUNCEMENT_DELETED', { announcementId: request.params.id }, request);
            return success(reply, null, 'Announcement deleted successfully');
        } catch (error) {
            fastify.log.error(`Announcement delete error: ${error.message}`);
            return serverError(reply, 'Failed to delete announcement');
        }
    });

    fastify.post('/announcements/:id/restore', { schema: mentorSchema.deleteAnnouncement }, async (request, reply) => {
        try {
            const existing = await prisma.announcement.findUnique({ where: { id: request.params.id } });
            if (!existing) return notFound(reply, 'Announcement not found');

            await prisma.announcement.update({
                where: { id: request.params.id },
                data: { deletedAt: null }
            });
            fastify.cache.delPattern('sndc:announcements:*');
            logAudit(fastify, 'ANNOUNCEMENT_RESTORED', { announcementId: request.params.id }, request);
            return success(reply, null, 'Announcement restored successfully');
        } catch (error) {
            fastify.log.error(`Announcement restore error: ${error.message}`);
            return serverError(reply, 'Failed to restore announcement');
        }
    });

    // ──────────────────────────────────────────────
    // AUDIT LOGS
    // ──────────────────────────────────────────────

    fastify.get('/audit-logs', async (request, reply) => {
        const page = Math.max(1, parseInt(request.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(request.query.limit) || 50));
        const skip = (page - 1) * limit;

        const where = { collegeId: request.user.collegeId || undefined };

        if (request.query.search) {
            where.OR = [
                { action: { contains: request.query.search, mode: 'insensitive' } },
                { userEmail: { contains: request.query.search, mode: 'insensitive' } },
                { details: { contains: request.query.search, mode: 'insensitive' } }
            ];
        }
        if (request.query.action) where.action = request.query.action;
        if (request.query.userEmail) where.userEmail = request.query.userEmail;
        if (request.query.dateFrom || request.query.dateTo) {
            where.createdAt = {};
            if (request.query.dateFrom) where.createdAt.gte = new Date(request.query.dateFrom);
            if (request.query.dateTo) where.createdAt.lte = new Date(request.query.dateTo);
        }

        try {
            const [data, total] = await Promise.all([
                prisma.auditLog.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.auditLog.count({ where })
            ]);

            return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
        } catch (error) {
            fastify.log.error(`Audit Log Fetch Error: ${error.message}`);
            return serverError(reply, 'Failed to fetch audit logs');
        }
    });

    // ──────────────────────────────────────────────
    // ANALYTICS
    // ──────────────────────────────────────────────

    fastify.get('/analytics', async (request, reply) => {
        const isAdminUser = isAdmin(request.user);
        const collegeId = request.user.collegeId;

        if (!isSuperAdmin(request.user) && !collegeId) {
            fastify.log.error(`Analytics Error: No collegeId found for user ${request.user.id}`);
            return badRequest(reply, 'Institutional context (College ID) missing from session.');
        }

        const cacheKey = `sndc:analytics:${request.user.id}`;
        const cached = await fastify.cache.get(cacheKey);
        if (cached) return cached;

        const collegeFilter = isSuperAdmin(request.user) ? {} : { collegeId };
        const studentFilter = { role: 'STUDENT', deletedAt: null, ...collegeFilter, ...(!isAdminUser ? { createdById: request.user.id } : {}) };
        const staffFilter = isAdminUser
            ? { role: { in: ['STAFF', 'MENTOR'] }, deletedAt: null, ...collegeFilter }
            : { role: 'STAFF', deletedAt: null, ...collegeFilter, createdById: request.user.id };
        const subjectFilter = isAdminUser
            ? { deletedAt: null, ...collegeFilter }
            : { deletedAt: null, ...collegeFilter, createdById: request.user.id };

        try {
            let mentorSubjectIds = undefined;
            if (!isAdminUser) {
                const subjects = await prisma.subject.findMany({ where: subjectFilter, select: { id: true } });
                mentorSubjectIds = subjects.map(s => s.id);
            }

            const approvalFilter = isAdminUser
                ? { staffApproved: true }
                : { staffApproved: true, subjectId: { in: mentorSubjectIds } };

            const [studentCount, staffCount, subjectCount, totalApprovals, students] = await Promise.all([
                prisma.user.count({ where: studentFilter }),
                prisma.user.count({ where: staffFilter }),
                prisma.subject.count({ where: subjectFilter }),
                prisma.evaluation.count({ where: approvalFilter }),
                prisma.user.findMany({
                    where: studentFilter,
                    include: { evaluations: { select: { staffApproved: true, internalMarksTotal: true } } }
                })
            ]);

            const classStats = {};
            const deptStats = {};

            students.forEach(s => {
                const cls = s.className || 'Unassigned';
                const dept = s.department || 'Unassigned';

                if (!classStats[cls]) classStats[cls] = { total: 0, cleared: 0, internalAvg: 0, marksCount: 0 };
                classStats[cls].total++;

                if (!deptStats[dept]) deptStats[dept] = { total: 0, cleared: 0 };
                deptStats[dept].total++;

                const studentEvals = s.evaluations || [];
                const clearedCount = studentEvals.filter(e => e.staffApproved).length;
                if (studentEvals.length > 0 && clearedCount === studentEvals.length) {
                    classStats[cls].cleared++;
                    deptStats[dept].cleared++;
                }

                studentEvals.forEach(e => {
                    if (e.internalMarksTotal > 0) {
                        classStats[cls].internalAvg += e.internalMarksTotal;
                        classStats[cls].marksCount++;
                    }
                });
            });

            const formattedClassStats = Object.keys(classStats).map(name => ({
                name,
                clearanceRate: classStats[name].total > 0 ? Math.round((classStats[name].cleared / classStats[name].total) * 100) : 0,
                averageMarks: classStats[name].marksCount > 0 ? (classStats[name].internalAvg / classStats[name].marksCount).toFixed(1) : 0,
                studentCount: classStats[name].total
            }));

            const formattedDeptStats = Object.keys(deptStats).map(name => ({
                name,
                clearanceRate: deptStats[name].total > 0 ? Math.round((deptStats[name].cleared / deptStats[name].total) * 100) : 0,
                studentCount: deptStats[name].total
            }));

            const result = {
                stats: { studentCount, staffCount, subjectCount, totalApprovals },
                classStats: formattedClassStats,
                deptStats: formattedDeptStats,
                recentActivity: []
            };
            await fastify.cache.set(cacheKey, result, fastify.cache.SHORT_TTL);
            return result;
        } catch (error) {
            fastify.log.error(error);
            return serverError(reply, 'Error calculating analytics');
        }
    });

    // ──────────────────────────────────────────────
    // EXPORT
    // ──────────────────────────────────────────────

    fastify.get('/export/fees', async (request, reply) => {
        const isAdminUser = isAdmin(request.user);
        const where = { role: 'STUDENT', deletedAt: null, ...buildCollegeFilter(request.user, isAdminUser) };

        const students = await prisma.user.findMany({
            where,
            include: { feeRecord: true },
            orderBy: { name: 'asc' }
        });

        const buffer = await generateFeeExcel(students);

        reply.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        reply.header('Content-Disposition', 'attachment; filename=Student_Fee_Balances.xlsx');
        return buffer;
    });

    fastify.get('/export/pdf/fees', async (request, reply) => {
        const isAdminUser = isAdmin(request.user);

        const mentor = await prisma.user.findUnique({
            where: { id: request.user.id },
            include: { college: true }
        });

        const where = { role: 'STUDENT', deletedAt: null, ...buildCollegeFilter(request.user, isAdminUser) };
        const students = await prisma.user.findMany({
            where,
            include: { feeRecord: true },
            orderBy: { name: 'asc' }
        });

        const buffer = await generateFeeReportPDF(
            mentor?.college?.name || '',
            mentor?.department || '',
            students
        );

        reply.type('application/pdf');
        reply.header('Content-Disposition', 'attachment; filename=Student_Fee_Report.pdf');
        return buffer;
    });

    // ──────────────────────────────────────────────
    // CUSTOM WORKFLOW & DYNAMIC CLEARANCE
    // ──────────────────────────────────────────────

    fastify.get('/college', async (request, reply) => {
        if (!request.user.collegeId) {
            return badRequest(reply, 'No college associated with user session.');
        }
        return fastify.cache.remember(fastify.cache.KEYS.collegeSettings(request.user.collegeId), fastify.cache.LONG_TTL, () => {
            return prisma.college.findUnique({ where: { id: request.user.collegeId } });
        });
    });

    fastify.put('/college/workflow', { schema: mentorSchema.updateWorkflow }, async (request, reply) => {
        if (!request.user.collegeId) {
            return badRequest(reply, 'No college associated with user session.');
        }
        const { workflow } = request.body;

        const result = await prisma.college.update({
            where: { id: request.user.collegeId },
            data: { workflow }
        });
        await fastify.cache.del(fastify.cache.KEYS.collegeSettings(request.user.collegeId));

        logAudit(fastify, 'WORKFLOW_UPDATED', { stepCount: workflow.length }, request);
        return result;
    });

    fastify.put('/students/:studentId/custom-clearance', { schema: mentorSchema.customClearance }, async (request, reply) => {
        const { studentId } = request.params;
        const { stepId, cleared } = request.body;

        const student = await prisma.user.findUnique({ where: { id: studentId } });
        if (!student || student.collegeId !== request.user.collegeId) {
            return forbidden(reply, 'Access denied or student not found.');
        }

        let currentClearance = student.customClearance || {};
        if (typeof currentClearance !== 'object' || Array.isArray(currentClearance)) {
            currentClearance = {};
        }

        currentClearance[stepId] = {
            cleared: !!cleared,
            updatedAt: new Date().toISOString(),
            updatedBy: request.user.name
        };

        const updatedStudent = await prisma.user.update({
            where: { id: studentId },
            data: { customClearance: currentClearance }
        });

        const { checkAndUnlock } = require('../services/hallTicketService');
        await checkAndUnlock(studentId, prisma);

        logAudit(fastify, 'CLEARANCE_TOGGLED', { studentId, stepId, cleared: !!cleared, studentName: student.name }, request);
        return updatedStudent;
    });

    // ──────────────────────────────────────────────
    // HALL TICKET CENTER
    // ──────────────────────────────────────────────

    fastify.get('/hall-tickets', { schema: mentorSchema.listHallTickets }, async (request, reply) => {
        const isAdminUser = isAdmin(request.user);
        const page = Math.max(1, parseInt(request.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(request.query.limit) || 50));
        const skip = (page - 1) * limit;

        const studentWhere = { role: 'STUDENT', deletedAt: null, ...buildCollegeFilter(request.user, isAdminUser) };
        if (request.query.search) {
            const s = request.query.search;
            studentWhere.OR = [
                { name: { contains: s, mode: 'insensitive' } },
                { email: { contains: s, mode: 'insensitive' } },
                { registerNumber: { contains: s, mode: 'insensitive' } }
            ];
        }

        try {
            const [students, total] = await Promise.all([
                prisma.user.findMany({
                    where: studentWhere,
                    skip,
                    take: limit,
                    include: {
                        hallTicket: { select: { isUnlocked: true, verificationCode: true, generatedAt: true, pdfUrl: true, qrCodeData: true } },
                        feeRecord: { select: { feeClearedAuto: true, feeClearedManual: true, feeBalance: true } },
                        evaluations: { select: { staffApproved: true }, where: { staffApproved: false } },
                        studentSubjects: { select: { id: true } }
                    },
                    orderBy: { name: 'asc' }
                }),
                prisma.user.count({ where: studentWhere })
            ]);

            const data = students.map(s => {
                const ht = s.hallTicket || {};
                const fr = s.feeRecord || {};
                const feeCleared = fr.feeClearedAuto || fr.feeClearedManual;
                const academicCleared = (s.evaluations || []).length === 0;
                const enrolledCount = s.studentSubjects?.length || 0;

                return {
                    id: s.id,
                    name: s.name,
                    email: s.email,
                    registerNumber: s.registerNumber,
                    className: s.className,
                    department: s.department,
                    hallTicket: {
                        isUnlocked: ht.isUnlocked || false,
                        verificationCode: ht.verificationCode || null,
                        generatedAt: ht.generatedAt || null,
                        pdfUrl: ht.pdfUrl || null
                    },
                    feeCleared,
                    feeBalance: fr.feeBalance || 0,
                    pendingApprovals: (s.evaluations || []).filter(e => !e.staffApproved).length,
                    enrolledSubjects: enrolledCount,
                    blockedReasons: [
                        ...(!feeCleared ? ['Pending Fees'] : []),
                        ...((s.evaluations || []).some(e => !e.staffApproved) ? ['Pending Academic Approvals'] : []),
                        ...(enrolledCount === 0 ? ['No Subjects Enrolled'] : [])
                    ]
                };
            });

            const stats = {
                total,
                ready: data.filter(d => d.hallTicket.isUnlocked).length,
                blocked: data.filter(d => !d.hallTicket.isUnlocked).length,
                pendingFees: data.filter(d => !d.feeCleared).length,
                pendingApprovals: data.filter(d => d.pendingApprovals > 0).length,
                noSubjects: data.filter(d => d.enrolledSubjects === 0).length
            };

            return { data, stats, total, page, limit, totalPages: Math.ceil(total / limit) };
        } catch (error) {
            fastify.log.error(`Hall Ticket Fetch Error: ${error.message}`);
            return serverError(reply, 'Failed to fetch hall ticket data');
        }
    });

    // ──────────────────────────────────────────────
    // AI FEATURES
    // ──────────────────────────────────────────────

    fastify.get('/ai/summary/:studentId', { schema: mentorSchema.aiSummary }, async (request, reply) => {
        const { studentId } = request.params;

        const student = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                evaluations: {
                    include: { subject: { select: { name: true, code: true } } }
                },
                feeRecord: true,
                hallTicket: true,
                studentSubjects: { include: { subject: { select: { name: true, code: true } } } }
            }
        });

        if (!student || student.collegeId !== request.user.collegeId) {
            return forbidden(reply, 'Access denied');
        }

        try {
            const { generateAcademicInsights } = require('../services/aiService');
            const insights = await generateAcademicInsights(
                student.evaluations || [],
                (student.studentSubjects || []).map(ss => ss.subject)
            );
            return { student: { id: student.id, name: student.name, email: student.email, registerNumber: student.registerNumber, className: student.className, department: student.department }, insights: insights || [] };
        } catch (err) {
            fastify.log.error(`AI Summary Error: ${err.message}`);
            const defaultInsights = (student.evaluations || []).map(e => ({
                type: e.internalMarksTotal < 20 ? 'warning' : 'info',
                subject: e.subject?.name || 'Unknown',
                message: e.internalMarksTotal < 20
                    ? `${e.subject?.name}: Low performance (${e.internalMarksTotal}/40). Needs attention.`
                    : `${e.subject?.name}: Current marks ${e.internalMarksTotal}/40. On track.`
            }));
            return { student: { id: student.id, name: student.name }, insights: defaultInsights };
        }
    });

    fastify.get('/ai/at-risk', async (request, reply) => {
        const isAdminUser = isAdmin(request.user);
        const studentWhere = { role: 'STUDENT', deletedAt: null, ...buildCollegeFilter(request.user, isAdminUser) };

        try {
            const students = await prisma.user.findMany({
                where: studentWhere,
                include: {
                    evaluations: {
                        include: { subject: { select: { name: true, code: true } } },
                        where: { staffApproved: false }
                    },
                    feeRecord: { select: { feeBalance: true, feeClearedAuto: true, feeClearedManual: true } }
                }
            });

            const atRisk = students.filter(s => {
                const fr = s.feeRecord || {};
                const hasFeeIssue = !fr.feeClearedAuto && !fr.feeClearedManual && (fr.feeBalance || 0) > 0;
                const hasAcademicIssue = (s.evaluations || []).length >= 2;
                return hasFeeIssue || hasAcademicIssue;
            }).map(s => ({
                id: s.id,
                name: s.name,
                email: s.email,
                registerNumber: s.registerNumber,
                className: s.className,
                department: s.department,
                riskFactors: [
                    ...(!s.feeRecord?.feeClearedAuto && !s.feeRecord?.feeClearedManual && (s.feeRecord?.feeBalance || 0) > 0 ? ['Fee Pending'] : []),
                    ...((s.evaluations || []).length >= 2 ? [`${(s.evaluations || []).length} pending approvals`] : [])
                ],
                pendingApprovals: (s.evaluations || []).length
            }));

            return { data: atRisk, total: atRisk.length };
        } catch (error) {
            fastify.log.error(`At-Risk Fetch Error: ${error.message}`);
            return serverError(reply, 'Failed to fetch at-risk students');
        }
    });
}

module.exports = mentorRoutes;
