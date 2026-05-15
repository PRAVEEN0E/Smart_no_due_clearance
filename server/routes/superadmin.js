
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

    // Update college details
    fastify.put('/colleges/:id', { preHandler: auth }, async (request, reply) => {
        const { id } = request.params;
        const { name, domain, logoUrl, primaryColor, secondaryColor, workflow } = request.body;

        return prisma.college.update({
            where: { id },
            data: { name, domain, logoUrl, primaryColor, secondaryColor, workflow }
        });
    });

    // Delete a college (Cascades to users, subjects, etc.)
    fastify.delete('/colleges/:id', { preHandler: auth }, async (request) => {
        const { id } = request.params;
        return prisma.college.delete({ where: { id } });
    });


    // --- Global User Management ---

    // List all administrative users (Mentors/SuperAdmins)
    fastify.get('/users', { preHandler: auth }, async (request) => {
        return prisma.user.findMany({
            where: {
                role: { in: ['MENTOR', 'SUPERADMIN'] }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                college: { select: { name: true } },
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });
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
}

module.exports = superAdminRoutes;
