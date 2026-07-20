async function superAdminRoutes(fastify, opts) {
    const { prisma } = fastify;
    const auth = [fastify.authenticate, fastify.authorize(['SUPERADMIN'])];

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
            department: { type: 'string', maxLength: 100 }
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
        return prisma.college.findMany({
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

    fastify.post('/colleges', {
        preHandler: auth,
        schema: { body: { type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 1 }, domain: { type: 'string' } }, additionalProperties: false } },
        config: { rateLimit: collegeWriteLimit }
    }, async (request, reply) => {
        const { name, domain } = request.body;
        return prisma.college.create({ data: { name, domain } });
    });

    fastify.put('/colleges/:id', {
        preHandler: auth,
        schema: { body: collegeBody, params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
        config: { rateLimit: collegeWriteLimit }
    }, async (request, reply) => {
        const { id } = request.params;
        const { name, domain, logoUrl, primaryColor, secondaryColor, workflow, isMaintenanceMode, department } = request.body;

        return prisma.$transaction(async (tx) => {
            const college = await tx.college.update({
                where: { id },
                data: { name, domain, logoUrl, primaryColor, secondaryColor, workflow, isMaintenanceMode }
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
    });

    fastify.delete('/colleges/:id', {
        preHandler: auth,
        schema: { params: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] } },
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } }
    }, async (request) => {
        const { id } = request.params;
        return prisma.college.delete({ where: { id } });
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

        return { token, user: { ...user, isImpersonated: true } };
    });

    // --- System Statistics ---

    fastify.get('/stats', { preHandler: auth }, async (request) => {
        const [collegeCount, totalUsers, studentCount, mentorCount] = await Promise.all([
            prisma.college.count(),
            prisma.user.count(),
            prisma.user.count({ where: { role: 'STUDENT' } }),
            prisma.user.count({ where: { role: 'MENTOR' } })
        ]);

        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            months.push(date.toLocaleString('default', { month: 'short' }));
        }

        return {
            colleges: collegeCount,
            users: totalUsers,
            students: studentCount,
            mentors: mentorCount,
            growthData: months.map(m => ({ name: m, val: Math.floor(Math.random() * 50) + 10 }))
        };
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
        return prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
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

    fastify.get('/search', { preHandler: auth }, async (request) => {
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
        return prisma.auditLog.findMany({
            include: { college: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
    });

    fastify.get('/users', { preHandler: auth }, async (request) => {
        const { search, role, collegeId } = request.query;
        return prisma.user.findMany({
            where: {
                ...(role ? { role } : {}),
                ...(collegeId ? { collegeId } : {}),
                ...(search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] } : {})
            },
            include: { college: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200
        });
    });

    // --- RBAC: Custom Role Management ---

    fastify.get('/roles', { preHandler: auth }, async (request) => {
        return prisma.customRole.findMany({
            include: { college: { select: { name: true } }, _count: { select: { users: true } } },
            orderBy: { createdAt: 'desc' }
        });
    });

    fastify.post('/roles', {
        preHandler: auth,
        schema: { body: roleBody },
        config: { rateLimit: collegeWriteLimit }
    }, async (request, reply) => {
        const { name, description, permissions, collegeId } = request.body;
        try {
            return await prisma.customRole.create({ data: { name, description, permissions, collegeId } });
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
        return prisma.customRole.update({ where: { id }, data: { name, description, permissions } });
    });

    fastify.delete('/roles/:id', {
        preHandler: auth,
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } }
    }, async (request) => {
        const { id } = request.params;
        return prisma.customRole.delete({ where: { id } });
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
}

module.exports = superAdminRoutes;
