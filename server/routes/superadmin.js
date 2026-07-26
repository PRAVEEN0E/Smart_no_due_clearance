async function superAdminRoutes(fastify, opts) {
    const { prisma } = fastify;
    const auth = [fastify.authenticate, fastify.authorize(['SUPERADMIN'])];

    async function logAudit(action, details, request) {
        try {
            await prisma.auditLog.create({
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

    // Schema definitions
    const collegeBody = {
        type: 'object',
        properties: {
            name: { type: 'string', minLength: 1, maxLength: 200 },
            domain: { type: 'string', maxLength: 200 },
            logoUrl: { type: 'string', maxLength: 500 },
            primaryColor: { type: 'string', maxLength: 50 },
            secondaryColor: { type: 'string', maxLength: 50 },
            workflow: { type: 'object' },
            isMaintenanceMode: { type: 'boolean' },
            department: { type: 'string', maxLength: 100 },
            affiliationText: { type: 'string', maxLength: 500 },
            controllerName: { type: 'string', maxLength: 200 },
            principalName: { type: 'string', maxLength: 200 }
        },
        additionalProperties: false
    };

    const broadcastBody = {
        type: 'object',
        required: ['title', 'content'],
        properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            content: { type: 'string', minLength: 1, maxLength: 5000 },
            type: { type: 'string', enum: ['SYSTEM', 'INFO', 'WARNING', 'ALERT'] },
            priority: { type: 'integer', minimum: 0, maximum: 10 },
            expiresAt: { type: 'string' }
        },
        additionalProperties: false
    };

    const roleBody = {
        type: 'object',
        required: ['name', 'collegeId', 'permissions'],
        properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            description: { type: 'string', maxLength: 500 },
            permissions: { type: 'array', items: { type: 'string' } },
            collegeId: { type: 'string', minLength: 1 }
        },
        additionalProperties: false
    };

    const impersonateLimit = { max: 5, timeWindow: '1 minute' };
    const broadcastLimit = { max: 3, timeWindow: '5 minutes' };
    const collegeWriteLimit = { max: 10, timeWindow: '1 minute' };

    // --- College Management ---

    fastify.get('/colleges', { preHandler: auth }, async (request) => {
        return fastify.cache.remember('sndc:superadmin:colleges', fastify.cache.DEFAULT_TTL, () => {
            return prisma.college.findMany({
                where: { deletedAt: null },
                include: {
                    _count: { select: { users: true, subjects: true } },
                    users: {
                        where: { role: 'MENTOR' },
                        select: { id: true, department: true },
                        take: 1
                    }
                },
                orderBy: { name: 'asc' }
            });
        });
    });

    fastify.post('/colleges', {
        preHandler: auth,
        schema: { body: { type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 1 }, domain: { type: 'string' } }, additionalProperties: false } },
        config: { rateLimit: collegeWriteLimit }
    }, async (request, reply) => {
        const { name, domain } = request.body;
        const result = await prisma.college.create({ data: { name, domain } });
        fastify.cache.del('sndc:superadmin:colleges');
        return result;
    });

    fastify.put('/colleges/:id', {
        preHandler: auth,
        schema: { body: collegeBody, params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
        config: { rateLimit: collegeWriteLimit }
    }, async (request, reply) => {
        const { id } = request.params;
        const { name, domain, logoUrl, primaryColor, secondaryColor, workflow, isMaintenanceMode, department, affiliationText, controllerName, principalName } = request.body;

        const result = await prisma.$transaction(async (tx) => {
            const college = await tx.college.update({
                where: { id },
                data: { name, domain, logoUrl, primaryColor, secondaryColor, workflow, isMaintenanceMode, affiliationText, controllerName, principalName }
            });

            if (department !== undefined) {
                const mentor = await tx.user.findFirst({
                    where: { collegeId: id, role: 'MENTOR' }
                });
                if (mentor) {
                    await tx.user.update({ where: { id: mentor.id }, data: { department } });
                }
            }
            return college;
        });
        fastify.cache.del('sndc:superadmin:colleges');
        return result;
    });

    fastify.delete('/colleges/:id', {
        preHandler: auth,
        schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } }
    }, async (request, reply) => {
        const { id } = request.params;
        const college = await prisma.college.findUnique({ where: { id } });
        if (!college) return reply.status(404).send({ message: 'College not found' });

        const userCount = await prisma.user.count({ where: { collegeId: id, deletedAt: null } });

        await prisma.college.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        logAudit('COLLEGE_SOFT_DELETED', {
            collegeId: id,
            collegeName: college.name,
            userCount
        }, request);

        fastify.cache.del('sndc:superadmin:colleges');
        return { success: true, message: 'College soft-deleted' };
    });

    // --- Global User Management ---

    fastify.put('/users/:id', {
        preHandler: auth,
        schema: { body: { type: 'object', properties: { name: { type: 'string', maxLength: 100 }, email: { type: 'string', maxLength: 255 }, role: { type: 'string', enum: ['STUDENT', 'STAFF', 'MENTOR', 'SUPERADMIN'] }, department: { type: 'string', maxLength: 100 }, className: { type: 'string', maxLength: 50 } }, additionalProperties: false } },
        config: { rateLimit: collegeWriteLimit }
    }, async (request, reply) => {
        const { id } = request.params;
        const { name, email, role, department, className } = request.body;
        return prisma.user.update({ where: { id }, data: { name, email, role, department, className } });
    });

    fastify.post('/impersonate/:userId', {
        preHandler: auth,
        schema: { params: { type: 'object', properties: { userId: { type: 'string' } }, required: ['userId'] } },
        config: { rateLimit: impersonateLimit }
    }, async (request, reply) => {
        const { userId } = request.params;
        const user = await prisma.user.findUnique({ where: { id: userId }, include: { college: true } });
        if (!user) return reply.status(404).send({ message: 'User not found' });

        const token = fastify.jwt.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            collegeId: user.collegeId,
            collegeName: user.college?.name,
            isImpersonated: true,
            adminEmail: request.user.email
        }, { expiresIn: '15m' });

        logAudit('IMPERSONATION_STARTED', {
            targetUserId: user.id,
            targetEmail: user.email,
            targetRole: user.role,
            adminEmail: request.user.email
        }, request);

        fastify.setAuthCookie(reply, token);
        return { user: { ...user, isImpersonated: true } };
    });

    // --- User Creation (admin-managed) ---

    const bcrypt = require('bcrypt');
    const { AUTH, ROLES } = require('../constants');

    fastify.post('/users', {
        preHandler: auth,
        schema: {
            body: {
                type: 'object', required: ['name', 'email', 'password', 'role', 'collegeId'],
                properties: {
                    name: { type: 'string', minLength: 1, maxLength: 100 },
                    email: { type: 'string', maxLength: 255 },
                    password: { type: 'string', minLength: 8 },
                    role: { type: 'string', enum: ['STUDENT', 'STAFF', 'MENTOR'] },
                    collegeId: { type: 'string' },
                    department: { type: 'string', maxLength: 100 },
                    className: { type: 'string', maxLength: 50 },
                    registerNumber: { type: 'string', maxLength: 50 }
                },
                additionalProperties: false
            }
        },
        config: { rateLimit: collegeWriteLimit }
    }, async (request, reply) => {
        const { name, email, password, role, collegeId, department, className, registerNumber } = request.body;
        const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
        if (exists) return reply.status(409).send({ message: 'A user with this email already exists' });

        const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS, 10) || AUTH.BCRYPT_DEFAULT_ROUNDS);
        const user = await prisma.user.create({
            data: {
                name, email: email.toLowerCase().trim(), passwordHash,
                role, collegeId,
                department: department || null,
                className: className || null,
                registerNumber: registerNumber || null,
                needsPasswordChange: true
            }
        });
        return { id: user.id, name: user.name, email: user.email, role: user.role, collegeId: user.collegeId };
    });

    // --- User Deletion ---

    fastify.delete('/users/:id', {
        preHandler: auth,
        schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } }
    }, async (request, reply) => {
        const { id } = request.params;
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return reply.status(404).send({ message: 'User not found' });
        if (user.role === 'SUPERADMIN') return reply.status(403).send({ message: 'Cannot delete a Super Admin' });

        await prisma.$transaction(async (tx) => {
            await tx.auditLog.deleteMany({ where: { userId: id } });
            await tx.loginHistory.deleteMany({ where: { userId: id } });
            await tx.announcement.deleteMany({ where: { createdById: id } });
            await tx.evaluation.deleteMany({ where: { studentId: id } });
            await tx.assignment.deleteMany({ where: { studentId: id } });
            await tx.prediction.deleteMany({ where: { studentId: id } });
            await tx.subjectAssignment.deleteMany({ where: { userId: id } });
            await tx.user.delete({ where: { id } });
        });
        return { success: true, message: 'User and all associated data permanently deleted' };
    });

    // --- User Disable/Enable ---

    fastify.patch('/users/:id/status', {
        preHandler: auth,
        schema: {
            body: { type: 'object', required: ['disabled'], properties: { disabled: { type: 'boolean' } }, additionalProperties: false },
            params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
        },
        config: { rateLimit: collegeWriteLimit }
    }, async (request, reply) => {
        const { id } = request.params;
        const { disabled } = request.body;
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) return reply.status(404).send({ message: 'User not found' });
        if (user.role === 'SUPERADMIN') return reply.status(403).send({ message: 'Cannot disable a Super Admin' });

        const updated = await prisma.user.update({ where: { id }, data: { disabled } });
        return { id: updated.id, disabled: updated.disabled, message: disabled ? 'User disabled' : 'User enabled' };
    });

    // --- System Statistics ---

    fastify.get('/stats', { preHandler: auth }, async (request) => {
        return fastify.cache.remember('sndc:superadmin:stats', fastify.cache.SHORT_TTL, async () => {
            const [
                collegeCount, totalUsers, studentCount, mentorCount,
                staffCount, pendingClearances, completedClearances
            ] = await Promise.all([
                prisma.college.count(),
                prisma.user.count(),
                prisma.user.count({ where: { role: 'STUDENT' } }),
                prisma.user.count({ where: { role: 'MENTOR' } }),
                prisma.user.count({ where: { role: 'STAFF' } }),
                prisma.evaluation.count({ where: { staffApproved: false } }),
                prisma.evaluation.count({ where: { staffApproved: true } })
            ]);

            // Real monthly registration data
            const months = [];
            const registrationCounts = [];
            const now = new Date();
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
                months.push(d.toLocaleString('default', { month: 'short' }));
                const count = await prisma.user.count({
                    where: { createdAt: { gte: d, lt: end } }
                });
                registrationCounts.push(count);
            }

            // College-wise stats
            const colleges = await prisma.college.findMany({
                select: {
                    id: true, name: true,
                    _count: { select: { users: true, subjects: true } }
                }
            });

            return {
                colleges: collegeCount,
                users: totalUsers,
                students: studentCount,
                mentors: mentorCount,
                staff: staffCount,
                pendingClearances,
                completedClearances,
                growthData: months.map((name, i) => ({ name, val: registrationCounts[i] })),
                collegeStats: colleges.map(c => ({
                    name: c.name,
                    users: c._count.users,
                    subjects: c._count.subjects
                }))
            };
        });
    });

    fastify.post('/colleges/:id/maintenance', {
        preHandler: auth,
        schema: { body: { type: 'object', required: ['isMaintenanceMode'], properties: { isMaintenanceMode: { type: 'boolean' } }, additionalProperties: false } },
        config: { rateLimit: collegeWriteLimit }
    }, async (request, reply) => {
        const { id } = request.params;
        const { isMaintenanceMode } = request.body;
        return prisma.college.update({ where: { id }, data: { isMaintenanceMode } });
    });

    // --- Global Audit ---

    fastify.get('/audit', { preHandler: auth }, async (request) => {
        const { page = '1', limit = '50' } = request.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.auditLog.count()
        ]);

        return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
    });

    // --- Global Broadcast ---

    fastify.post('/broadcast', {
        preHandler: auth,
        schema: { body: broadcastBody },
        config: { rateLimit: broadcastLimit }
    }, async (request, reply) => {
        const { title, content, type, priority, expiresAt } = request.body;

        return prisma.announcement.create({
            data: {
                title,
                content,
                type: type || 'SYSTEM',
                priority: priority || 1,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                createdById: request.user.id,
                collegeId: null
            }
        });
    });

    // --- Global Search ---

    fastify.get('/search', { preHandler: auth, config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (request) => {
        const { q } = request.query;
        if (!q || q.length < 2) return [];
        return prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: q, mode: 'insensitive' } },
                    { email: { contains: q, mode: 'insensitive' } },
                    { id: { contains: q } }
                ]
            },
            select: { id: true, name: true, email: true, role: true, college: { select: { name: true } } },
            take: 20
        });
    });

    fastify.get('/logs', { preHandler: auth }, async (request) => {
        const { page = '1', limit = '50', action, userId, collegeId, dateFrom, dateTo } = request.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (action) where.action = action;
        if (userId) where.userId = userId;
        if (collegeId) where.collegeId = collegeId;
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limitNum,
                include: { college: { select: { name: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.auditLog.count({ where })
        ]);

        return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
    });

    fastify.get('/users', { preHandler: auth }, async (request) => {
        const { search, role, collegeId, page = '1', limit = '50', sortBy = 'createdAt', sortOrder = 'desc' } = request.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (role) where.role = role;
        if (collegeId) where.collegeId = collegeId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const orderField = ['name', 'email', 'role', 'createdAt', 'department'].includes(sortBy) ? sortBy : 'createdAt';
        const orderDir = sortOrder === 'asc' ? 'asc' : 'desc';

        const [data, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limitNum,
                include: { college: { select: { name: true } } },
                orderBy: { [orderField]: orderDir }
            }),
            prisma.user.count({ where })
        ]);

        return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
    });

    // --- Login History ---

    fastify.get('/login-history', { preHandler: auth }, async (request) => {
        const { page = '1', limit = '50', success, userId, email, dateFrom, dateTo } = request.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (success !== undefined) where.success = success === 'true';
        if (userId) where.userId = userId;
        if (email) where.email = { contains: email, mode: 'insensitive' };
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        const [data, total] = await Promise.all([
            prisma.loginHistory.findMany({
                where,
                skip,
                take: limitNum,
                include: { user: { select: { name: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.loginHistory.count({ where })
        ]);

        return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
    });

    // --- Login Statistics ---

    fastify.get('/login-stats', { preHandler: auth }, async () => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

        const [totalAttempts, successToday, failedToday, last24h] = await Promise.all([
            prisma.loginHistory.count(),
            prisma.loginHistory.count({ where: { createdAt: { gte: todayStart }, success: true } }),
            prisma.loginHistory.count({ where: { createdAt: { gte: todayStart }, success: false } }),
            prisma.loginHistory.count({ where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } })
        ]);

        // Daily trend for last 7 days
        const dailyTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const next = new Date(d.getTime() + 24 * 60 * 60 * 1000);
            const [success, failed] = await Promise.all([
                prisma.loginHistory.count({ where: { createdAt: { gte: d, lt: next }, success: true } }),
                prisma.loginHistory.count({ where: { createdAt: { gte: d, lt: next }, success: false } })
            ]);
            dailyTrend.push({
                date: d.toISOString().split('T')[0],
                label: d.toLocaleString('default', { weekday: 'short' }),
                success,
                failed
            });
        }

        return {
            totalAttempts,
            successToday,
            failedToday,
            last24h,
            dailyTrend,
            successRate: totalAttempts > 0 ? Math.round((successToday / (successToday + failedToday || 1)) * 100) : 0
        };
    });

    // --- System Health ---

    fastify.get('/health', { preHandler: auth }, async () => {
        const checks = {
            database: false,
            cache: false,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
        };

        try {
            await prisma.$queryRaw`SELECT 1`;
            checks.database = true;
        } catch { checks.database = false; }

        try {
            await fastify.cache.ping();
            checks.cache = true;
        } catch { checks.cache = false; }

        return checks;
    });

    // --- Broadcast History ---

    fastify.get('/broadcasts', { preHandler: auth }, async (request) => {
        const { page = '1', limit = '50' } = request.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = { collegeId: null };
        const [data, total] = await Promise.all([
            prisma.announcement.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.announcement.count({ where })
        ]);

        return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
    });

    // --- RBAC: Custom Role Management ---

    fastify.get('/roles', { preHandler: auth }, async (request) => {
        return fastify.cache.remember('sndc:superadmin:roles', fastify.cache.DEFAULT_TTL, () => {
            return prisma.customRole.findMany({
                include: { college: { select: { name: true } }, _count: { select: { users: true } } },
                orderBy: { createdAt: 'desc' }
            });
        });
    });

    fastify.post('/roles', {
        preHandler: auth,
        schema: { body: roleBody },
        config: { rateLimit: collegeWriteLimit }
    }, async (request, reply) => {
        const { name, description, permissions, collegeId } = request.body;
        try {
            const result = await prisma.customRole.create({ data: { name, description, permissions, collegeId } });
            fastify.cache.del('sndc:superadmin:roles');
            return result;
        } catch (error) {
            if (error.code === 'P2002') return reply.status(400).send({ message: 'Role name already exists for this college' });
            throw error;
        }
    });

    fastify.put('/roles/:id', {
        preHandler: auth,
        schema: { body: { type: 'object', properties: { name: { type: 'string', maxLength: 100 }, description: { type: 'string', maxLength: 500 }, permissions: { type: 'array', items: { type: 'string' } } }, additionalProperties: false } },
        config: { rateLimit: collegeWriteLimit }
    }, async (request, reply) => {
        const { id } = request.params;
        const { name, description, permissions } = request.body;
        const result = await prisma.customRole.update({ where: { id }, data: { name, description, permissions } });
        fastify.cache.del('sndc:superadmin:roles');
        return result;
    });

    fastify.delete('/roles/:id', {
        preHandler: auth,
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } }
    }, async (request) => {
        const { id } = request.params;
        await prisma.customRole.delete({ where: { id } });
        fastify.cache.del('sndc:superadmin:roles');
        return { success: true };
    });

    fastify.post('/users/:id/assign-role', {
        preHandler: auth,
        schema: { body: { type: 'object', properties: { customRoleId: { type: 'string' } }, additionalProperties: false } },
        config: { rateLimit: collegeWriteLimit }
    }, async (request, reply) => {
        const { id } = request.params;
        const { customRoleId } = request.body;
        return prisma.user.update({ where: { id }, data: { customRoleId } });
    });

    // --- System Settings ---

    const { RATE_LIMITS: RL } = require('../constants');

    fastify.get('/settings', { preHandler: auth }, async () => {
        const settings = {
            rateLimits: Object.entries(RL).map(([key, val]) => ({
                name: key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
                key,
                max: val.max,
                timeWindow: val.timeWindow
            })),
            features: {
                bootstrap: process.env.NODE_ENV !== 'production',
                maintenance: false,
                registrations: true
            },
            system: {
                jwtExpiry: require('../constants').AUTH.JWT_EXPIRY,
                bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
                nodeEnv: process.env.NODE_ENV || 'development',
                maxUploadBytes: require('../constants').FILE_LIMITS.MAX_BODY_BYTES
            }
        };
        return settings;
    });

    // --- API Key Management ---

    const crypto = require('crypto');

    fastify.get('/api-keys', { preHandler: auth }, async (request) => {
        const { page = '1', limit = '50', active } = request.query;
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const where = {};
        if (active !== undefined) where.active = active === 'true';

        const [data, total] = await Promise.all([
            prisma.apiKey.findMany({
                where,
                skip,
                take: limitNum,
                include: { user: { select: { name: true } }, college: { select: { name: true } } },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.apiKey.count({ where })
        ]);

        return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
    });

    const apiKeyBody = {
        type: 'object',
        required: ['name'],
        properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            collegeId: { type: 'string' },
            permissions: { type: 'array', items: { type: 'string' } },
            expiresInDays: { type: 'integer', minimum: 1, maximum: 365 }
        },
        additionalProperties: false
    };

    fastify.post('/api-keys', {
        preHandler: auth,
        schema: { body: apiKeyBody },
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } }
    }, async (request, reply) => {
        const { name, collegeId, permissions = ['READ'], expiresInDays } = request.body;

        const raw = `sndc_${crypto.randomBytes(32).toString('hex')}`;
        const prefix = raw.substring(0, 12);
        const keyHash = crypto.createHash('sha256').update(raw).digest('hex');

        const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null;

        const key = await prisma.apiKey.create({
            data: {
                name,
                keyPrefix: prefix,
                keyHash,
                userId: request.user.id,
                collegeId: collegeId || null,
                permissions,
                expiresAt
            }
        });

        // Return the full key ONCE — it will never be shown again
        return { id: key.id, name: key.name, keyPrefix: key.keyPrefix, fullKey: raw, expiresAt: key.expiresAt };
    });

    fastify.delete('/api-keys/:id', {
        preHandler: auth,
        schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
        config: { rateLimit: { max: 10, timeWindow: '1 minute' } }
    }, async (request, reply) => {
        const { id } = request.params;
        const key = await prisma.apiKey.findUnique({ where: { id } });
        if (!key) return reply.status(404).send({ message: 'API key not found' });
        await prisma.apiKey.delete({ where: { id } });
        return { success: true, message: 'API key revoked' };
    });

    fastify.patch('/api-keys/:id/status', {
        preHandler: auth,
        schema: {
            body: { type: 'object', required: ['active'], properties: { active: { type: 'boolean' } }, additionalProperties: false },
            params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }
        },
        config: { rateLimit: collegeWriteLimit }
    }, async (request, reply) => {
        const { id } = request.params;
        const { active } = request.body;
        const key = await prisma.apiKey.findUnique({ where: { id } });
        if (!key) return reply.status(404).send({ message: 'API key not found' });
        const updated = await prisma.apiKey.update({ where: { id }, data: { active } });
        return { id: updated.id, active: updated.active, message: active ? 'API key activated' : 'API key deactivated' };
    });
}

module.exports = superAdminRoutes;
