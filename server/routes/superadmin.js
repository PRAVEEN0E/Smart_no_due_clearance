
async function superAdminRoutes(fastify, opts) {
    const { prisma } = fastify;
    const auth = [fastify.authenticate, fastify.authorize(['SUPERADMIN'])];

    // --- College Management ---

    // List all colleges
    fastify.get('/colleges', { preHandler: auth }, async (request) => {
        return prisma.college.findMany({
            include: {
                _count: {
                    select: { users: true, subjects: true }
                },
                users: {
                    where: { role: 'MENTOR' },
                    select: { id: true, department: true },
                    take: 1
                }
            },
            orderBy: { name: 'asc' }
        });
    });

    // Create a new college
    fastify.post('/colleges', { preHandler: auth }, async (request, reply) => {
        const { name, domain } = request.body;
        if (!name) return reply.status(400).send({ message: 'College name is required' });

        return prisma.college.create({
            data: { name, domain }
        });
    });

    // Update college details & Mentor department
    fastify.put('/colleges/:id', { preHandler: auth }, async (request, reply) => {
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
                    await tx.user.update({
                        where: { id: mentor.id },
                        data: { department }
                    });
                }
            }

            return college;
        });
    });

    // Delete a college (Cascades to users, subjects, etc.)
    fastify.delete('/colleges/:id', { preHandler: auth }, async (request) => {
        const { id } = request.params;
        return prisma.college.delete({ where: { id } });
    });


    // --- Global User Management ---

    // List all administrative users (Mentors/SuperAdmins)


    // Update a user (e.g., change department)
    fastify.put('/users/:id', { preHandler: auth }, async (request, reply) => {
        const { id } = request.params;
        const { name, email, role, department, className } = request.body;

        return prisma.user.update({
            where: { id },
            data: { name, email, role, department, className }
        });
    });


    // Impersonate a user (Generate a short-lived support token)
    fastify.post('/impersonate/:userId', { preHandler: auth }, async (request, reply) => {
        const { userId } = request.params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { college: true }
        });

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

        // Get monthly growth (last 6 months)
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
            growthData: months.map(m => ({ name: m, val: Math.floor(Math.random() * 50) + 10 })) // Placeholder for growth trends
        };
    });

    // Toggle Maintenance Mode
    fastify.post('/colleges/:id/maintenance', { preHandler: auth }, async (request, reply) => {
        const { id } = request.params;
        const { isMaintenanceMode } = request.body;
        
        return prisma.college.update({
            where: { id },
            data: { isMaintenanceMode }
        });
    });


    // --- Global Audit ---
    
    // --- Global Audit ---
    
    fastify.get('/audit', { preHandler: auth }, async (request) => {
        return prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });
    });

    // --- Global Broadcast System ---

    fastify.post('/broadcast', { preHandler: auth }, async (request, reply) => {
        const { title, content, type, priority, expiresAt } = request.body;
        if (!title || !content) return reply.status(400).send({ message: 'Title and content are required' });

        return prisma.announcement.create({
            data: {
                title,
                content,
                type: type || 'SYSTEM',
                priority: priority || 1,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                createdById: request.user.id,
                collegeId: null // NULL means Global Broadcast
            }
        });
    });


    // --- Global Omni-Search ---

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
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                college: { select: { name: true } }
            },
            take: 20
        });
    });
    // --- Global Audit Ledger ---
    fastify.get('/logs', { preHandler: auth }, async (request) => {
        return prisma.auditLog.findMany({
            include: {
                college: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
        });
    });

    // --- Global User Directory ---
    fastify.get('/users', { preHandler: auth }, async (request) => {
        const { search, role, collegeId } = request.query;
        
        return prisma.user.findMany({
            where: {
                ...(role ? { role } : {}),
                ...(collegeId ? { collegeId } : {}),
                ...(search ? {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { email: { contains: search, mode: 'insensitive' } }
                    ]
                } : {})
            },
            include: {
                college: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 200 // Safety limit
        });
    });

    // --- RBAC: Custom Role Management ---

    // Get all custom roles
    fastify.get('/roles', { preHandler: auth }, async (request) => {
        return prisma.customRole.findMany({
            include: {
                college: { select: { name: true } },
                _count: { select: { users: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    });

    // Create a new custom role
    fastify.post('/roles', { preHandler: auth }, async (request, reply) => {
        const { name, description, permissions, collegeId } = request.body;
        if (!name || !collegeId || !permissions) {
            return reply.status(400).send({ message: 'Name, collegeId, and permissions are required' });
        }

        try {
            return await prisma.customRole.create({
                data: {
                    name,
                    description,
                    permissions, // Should be an array of strings
                    collegeId
                }
            });
        } catch (error) {
            if (error.code === 'P2002') return reply.status(400).send({ message: 'Role name already exists for this college' });
            throw error;
        }
    });

    // Update a custom role
    fastify.put('/roles/:id', { preHandler: auth }, async (request, reply) => {
        const { id } = request.params;
        const { name, description, permissions } = request.body;

        return prisma.customRole.update({
            where: { id },
            data: { name, description, permissions }
        });
    });

    // Delete a custom role
    fastify.delete('/roles/:id', { preHandler: auth }, async (request) => {
        const { id } = request.params;
        return prisma.customRole.delete({ where: { id } });
    });

    // Assign a custom role to a user
    fastify.post('/users/:id/assign-role', { preHandler: auth }, async (request, reply) => {
        const { id } = request.params;
        const { customRoleId } = request.body;

        return prisma.user.update({
            where: { id },
            data: { customRoleId } // Can be null to remove custom role
        });
    });
}

module.exports = superAdminRoutes;
