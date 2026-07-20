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

        const where = { role: 'STAFF' };
        if (!isSuperAdmin) where.collegeId = request.user.collegeId || null;
        if (!isAdmin) where.createdById = request.user.id;

        return prisma.user.findMany({ where });
    });

    // --- STAFF MANAGEMENT ---
    fastify.post('/staff', { schema: mentorSchema.createStaff }, async (request, reply) => {
        const { name, email, password, role } = request.body;
        const passwordHash = await bcrypt.hash(password, 12);

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return reply.status(409).send({ message: 'Email already exists' });

        const staff = await prisma.user.create({
            data: { 
                name, 
                email, 
                passwordHash, 
                role: role || 'STAFF', 
                createdBy: { connect: { id: request.user.id } },
                college: request.user.collegeId ? { connect: { id: request.user.collegeId } } : undefined
            }
        });

        // Send Welcome Email
        sendWelcomeEmail(email, name, password);

        return { id: staff.id, name: staff.name, email: staff.email, role: staff.role };
    });

    // --- STUDENT MANAGEMENT ---
    fastify.get('/students', async (request) => {
        const isSuperAdmin = request.user.role === 'SUPERADMIN';
        const isAdmin = isSuperAdmin || request.user.email === 'admin@college.edu';
        
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 50;
        const skip = (page - 1) * limit;

        const where = { role: 'STUDENT' };
        if (!isSuperAdmin) where.collegeId = request.user.collegeId || null;
        // Mentors should be able to see all students in their college/department context
        // if (!isAdmin) where.createdById = request.user.id;

        try {
            const [data, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    skip,
                    take: limit,
                    include: { feeRecord: true, studentSubjects: { include: { subject: true } } }
                }),
                prisma.user.count({ where })
            ]);

            return {
                data,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            fastify.log.error(`Students Fetch Error: ${error.message}`);
            throw error;
        }
    });

    fastify.post('/bulk-students', async (request, reply) => {
        const file = await request.file();
        if (!file) return reply.status(400).send({ message: 'No file uploaded' });

        const buffer = await file.toBuffer();
        const students = await parseStudentExcel(buffer);
        const results = [];

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
                        department: typeof s.department === 'object' ? (s.department?.name || null) : (s.department || null)
                    }
                });
                await prisma.feeRecord.create({ data: { studentId: user.id, feeBalance: 0, feeClearedAuto: true } });

                // Send Welcome Email
                sendWelcomeEmail(s.email, s.name, s.password);

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

                    await prisma.feeRecord.upsert({
                        where: { studentId: user.id },
                        create: {
                            studentId: user.id,
                            feeBalance: f.feeBalance,
                            feeClearedAuto: f.feeBalance <= 0
                        },
                        update: {
                            feeBalance: f.feeBalance,
                            feeClearedAuto: f.feeBalance <= 0
                        }
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
        const { name, email, registerNumber, password, className, department } = request.body;
        const passwordHash = await bcrypt.hash(password, 12);

        // Auto-inherit mentor's department if not explicitly set
        let studentDept = department || null;
        if (!studentDept) {
            const mentor = await prisma.user.findUnique({ where: { id: request.user.id }, select: { department: true } });
            studentDept = mentor?.department || null;
        }

        const student = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: { 
                    name, 
                    email, 
                    registerNumber: registerNumber || null,
                    passwordHash, 
                    role: 'STUDENT', 
                    createdBy: { connect: { id: request.user.id } }, 
                    college: request.user.collegeId ? { connect: { id: request.user.collegeId } } : undefined,
                    className: className || null, 
                    department: typeof studentDept === 'object' ? (studentDept?.name || null) : (studentDept || null)
                },
                select: { id: true, name: true, email: true, registerNumber: true, role: true, collegeId: true, className: true, department: true }
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
        // Authorization: verify student belongs to same college
        const existing = await prisma.user.findUnique({ where: { id: request.params.id } });
        if (!existing || existing.collegeId !== request.user.collegeId) {
            return reply.status(403).send({ message: 'Unauthorized: student belongs to a different college' });
        }

        const { name, email, registerNumber, password, className, department } = request.body;
        const updateData = { 
            name, 
            email,
            registerNumber: registerNumber !== undefined ? registerNumber || null : undefined,
            className: className !== undefined ? className : undefined,
            department: department !== undefined ? department : undefined
        };

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 12);
        }

        return prisma.user.update({
            where: { id: request.params.id },
            data: updateData,
            select: { id: true, name: true, email: true, registerNumber: true, role: true, collegeId: true, className: true, department: true }
        });
    });

    fastify.get('/staff/:id', async (request, reply) => {
        const staff = await prisma.user.findUnique({
            where: { id: request.params.id },
            select: { id: true, name: true, email: true, role: true, collegeId: true }
        });
        if (!staff) return reply.status(404).send({ message: 'Staff not found' });
        return staff;
    });

    fastify.put('/staff/:id', async (request, reply) => {
        // Authorization: verify staff belongs to same college
        const existing = await prisma.user.findUnique({ where: { id: request.params.id } });
        if (!existing || existing.collegeId !== request.user.collegeId) {
            return reply.status(403).send({ message: 'Unauthorized: staff belongs to a different college' });
        }

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
                // Multi-tenant safety: check if student belongs to the same college
                if (existing.collegeId === request.user.collegeId) {
                    const updated = await prisma.user.update({
                        where: { id: existing.id },
                        data: { 
                            name: s.name,
                            registerNumber: s.registerNumber || undefined,
                            className: s.className || undefined,
                            department: s.department || undefined,
                            // Ensure the current mentor has "ownership" if it was null
                            createdById: existing.createdById || request.user.id 
                        }
                    });
                    results.push(updated);
                } else {
                    results.push({ ...existing, error: 'Cannot update: student belongs to a different institution' });
                }
                continue;
            }

            // Brand new student — create and tag with this mentor
            const passwordHash = await bcrypt.hash(s.password, 12);
            const student = await prisma.user.create({
                data: {
                    name: s.name,
                    email: s.email,
                    registerNumber: s.registerNumber || null,
                    passwordHash,
                    role: 'STUDENT',
                    createdBy: { connect: { id: request.user.id } },
                    college: request.user.collegeId ? { connect: { id: request.user.collegeId } } : undefined,
                    className: s.className || null,
                    department: s.department || null,
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
                // Multi-tenant check: only update if student belongs to same college
                if (student.collegeId !== request.user.collegeId) continue;

                await prisma.feeRecord.upsert({
                    where: { studentId: student.id },
                    update: {
                        feeBalance: f.feeBalance,
                        feeClearedAuto: f.feeBalance <= 0,
                        clearedAt: f.feeBalance <= 0 ? new Date() : null
                    },
                    create: {
                        studentId: student.id,
                        feeBalance: f.feeBalance,
                        feeClearedAuto: f.feeBalance <= 0,
                        clearedAt: f.feeBalance <= 0 ? new Date() : null
                    }
                });
            }
        }
        return { success: true };
    });

    fastify.delete('/students/:id', async (request, reply) => {
        // Authorization: verify student belongs to same college
        const existing = await prisma.user.findUnique({ where: { id: request.params.id } });
        if (!existing || existing.collegeId !== request.user.collegeId) {
            return reply.status(403).send({ message: 'Unauthorized: cannot delete users from another college' });
        }
        await prisma.user.delete({ where: { id: request.params.id } });
        return { success: true };
    });

    fastify.delete('/staff/:id', async (request, reply) => {
        // Authorization: verify staff belongs to same college
        const existing = await prisma.user.findUnique({ where: { id: request.params.id } });
        if (!existing || existing.collegeId !== request.user.collegeId) {
            return reply.status(403).send({ message: 'Unauthorized: cannot delete users from another college' });
        }
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
            data: { 
                ...request.body, 
                createdBy: { connect: { id: request.user.id } }, 
                college: request.user.collegeId ? { connect: { id: request.user.collegeId } } : undefined
            }
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

    fastify.put('/announcements/:id', async (request, reply) => {
        const { id } = request.params;
        const { title, content, type, priority, expiresAt } = request.body;
        
        try {
            const updated = await prisma.announcement.update({
                where: { id },
                data: {
                    title,
                    content,
                    type,
                    priority: parseInt(priority) || 1,
                    expiresAt: expiresAt ? new Date(expiresAt) : null
                }
            });
            return updated;
        } catch (error) {
            return reply.status(404).send({ message: 'Announcement not found' });
        }
    });

    fastify.delete('/announcements/:id', async (request) => {
        return prisma.announcement.delete({ where: { id: request.params.id } });
    });

    fastify.get('/analytics', async (request, reply) => {
        const isSuperAdmin = request.user.role === 'SUPERADMIN';
        const isAdmin = isSuperAdmin || request.user.email === 'admin@college.edu';
        const collegeId = request.user.collegeId;

        if (!isSuperAdmin && !collegeId) {
            fastify.log.error(`Analytics Error: No collegeId found for user ${request.user.id}`);
            return reply.status(400).send({ message: 'Institutional context (College ID) missing from session.' });
        }

        const collegeFilter = isSuperAdmin ? {} : { collegeId };
        const studentFilter = { role: 'STUDENT', ...collegeFilter, ...(!isAdmin ? { createdById: request.user.id } : {}) };
        const staffFilter = isAdmin
            ? { role: { in: ['STAFF', 'MENTOR'] }, ...collegeFilter }
            : { role: 'STAFF', ...collegeFilter, createdById: request.user.id };
        const subjectFilter = isAdmin
            ? { ...collegeFilter }
            : { ...collegeFilter, createdById: request.user.id };

        try {
            // For approvals: count only evaluations for subjects owned by this mentor
            let mentorSubjectIds = undefined;
            if (!isAdmin) {
                const subjects = await prisma.subject.findMany({ where: subjectFilter, select: { id: true } });
                mentorSubjectIds = subjects.map(s => s.id);
            }

            const approvalFilter = isAdmin
                ? { staffApproved: true }
                : { staffApproved: true, subjectId: { in: mentorSubjectIds } };

            const [studentCount, staffCount, subjectCount, totalApprovals, students] = await Promise.all([
                prisma.user.count({ where: studentFilter }),
                prisma.user.count({ where: staffFilter }),
                prisma.subject.count({ where: subjectFilter }),
                prisma.evaluation.count({ where: approvalFilter }),
                prisma.user.findMany({ 
                    where: studentFilter, 
                    include: { evaluations: true } 
                })
            ]);

        // Group Stats by Class and Department
        const classStats = {};
        const deptStats = {};

        students.forEach(s => {
            const cls = s.className || 'Unassigned';
            const dept = s.department || 'Unassigned';

            // Class Grouping
            if (!classStats[cls]) classStats[cls] = { total: 0, cleared: 0, internalAvg: 0, marksCount: 0 };
            classStats[cls].total++;
            
            // Dept Grouping
            if (!deptStats[dept]) deptStats[dept] = { total: 0, cleared: 0 };
            deptStats[dept].total++;

            // Calculate progress/marks
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
            clearanceRate: Math.round((classStats[name].cleared / classStats[name].total) * 100),
            averageMarks: classStats[name].marksCount > 0 ? (classStats[name].internalAvg / classStats[name].marksCount).toFixed(1) : 0,
            studentCount: classStats[name].total
        }));

        const formattedDeptStats = Object.keys(deptStats).map(name => ({
            name,
            clearanceRate: Math.round((deptStats[name].cleared / deptStats[name].total) * 100),
            studentCount: deptStats[name].total
        }));

            return {
                stats: { studentCount, staffCount, subjectCount, totalApprovals },
                classStats: formattedClassStats,
                deptStats: formattedDeptStats,
                recentActivity: []
            };
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Error calculating analytics' });
        }
    });

    // --- EXPORT FEES ---
    fastify.get('/export/fees', async (request, reply) => {
        const isSuperAdmin = request.user.role === 'SUPERADMIN';
        const isAdmin = isSuperAdmin || request.user.email === 'admin@college.edu';
        
        const where = { role: 'STUDENT' };
        if (!isSuperAdmin) where.collegeId = request.user.collegeId || null;
        if (!isAdmin) where.createdById = request.user.id;

        const students = await prisma.user.findMany({
            where,
            include: { feeRecord: true }
        });

        const { generateFeeExcel } = require('../services/excelService');
        const buffer = await generateFeeExcel(students);

        reply.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        reply.header('Content-Disposition', 'attachment; filename=Student_Fee_Balances.xlsx');
        return buffer;
    });

    fastify.get('/export/pdf/fees', async (request, reply) => {
        const isSuperAdmin = request.user.role === 'SUPERADMIN';
        const isAdmin = isSuperAdmin || request.user.email === 'admin@college.edu';
        
        // Fetch mentor's details for the header
        const mentor = await prisma.user.findUnique({
            where: { id: request.user.id },
            include: { college: true }
        });

        const where = { role: 'STUDENT' };
        if (!isSuperAdmin) where.collegeId = request.user.collegeId || null;
        if (!isAdmin) where.createdById = request.user.id;

        const students = await prisma.user.findMany({
            where,
            include: { feeRecord: true }
        });

        const { generateFeeReportPDF } = require('../services/reportService');
        const buffer = await generateFeeReportPDF(
            mentor.college?.name,
            mentor.department,
            students
        );

        reply.type('application/pdf');
        reply.header('Content-Disposition', 'attachment; filename=Student_Fee_Report.pdf');
        return buffer;
    });

    // --- CUSTOM WORKFLOW & DYNAMIC CLEARANCE ENDPOINTS ---
    fastify.get('/college', async (request, reply) => {
        if (!request.user.collegeId) {
            return reply.status(400).send({ message: 'No college associated with user session.' });
        }
        return prisma.college.findUnique({ where: { id: request.user.collegeId } });
    });

    fastify.put('/college/workflow', async (request, reply) => {
        if (!request.user.collegeId) {
            return reply.status(400).send({ message: 'No college associated with user session.' });
        }
        const { workflow } = request.body;
        return prisma.college.update({
            where: { id: request.user.collegeId },
            data: { workflow }
        });
    });

    fastify.put('/students/:studentId/custom-clearance', async (request, reply) => {
        const { studentId } = request.params;
        const { stepId, cleared } = request.body;

        const student = await prisma.user.findUnique({ where: { id: studentId } });
        if (!student || student.collegeId !== request.user.collegeId) {
            return reply.status(403).send({ message: 'Access denied or student not found.' });
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

        // Re-evaluate eligibility for hall ticket unlocking
        const { checkAndUnlock } = require('../services/hallTicketService');
        await checkAndUnlock(studentId, prisma);

        return updatedStudent;
    });

}

module.exports = mentorRoutes;
