// Phase 7 — Student-to-staff queries per subject
async function studentQueryRoutes(fastify, opts) {
    fastify.addHook('preHandler', fastify.auth([fastify.authenticate]));

    const { prisma } = fastify;

    // Student: create a query
    fastify.post('/', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
        const { subjectId, message } = request.body;
        if (!subjectId || !message) return reply.status(400).send({ message: 'subjectId and message required' });

        const query = await prisma.studentQuery.create({
            data: { studentId: request.user.id, subjectId, message }
        });
        return query;
    });

    // Student: list my queries
    fastify.get('/', async (request) => {
        return prisma.studentQuery.findMany({
            where: { studentId: request.user.id },
            include: { subject: { select: { name: true, code: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    });

    // Staff: list queries for their subjects
    fastify.get('/staff', {
        preHandler: fastify.auth([fastify.authenticate, fastify.authorize(['STAFF', 'MENTOR', 'SUPERADMIN'])])
    }, async (request) => {
        const staffSubjects = await prisma.staffSubject.findMany({
            where: { staffId: request.user.id },
            select: { subjectId: true }
        });
        return prisma.studentQuery.findMany({
            where: { subjectId: { in: staffSubjects.map(s => s.subjectId) } },
            include: { subject: { select: { name: true, code: true } }, student: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    });

    // Staff: respond to a query
    fastify.post('/:id/respond', {
        preHandler: fastify.auth([fastify.authenticate, fastify.authorize(['STAFF', 'MENTOR', 'SUPERADMIN'])]),
        config: { rateLimit: { max: 30, timeWindow: '1 minute' } }
    }, async (request, reply) => {
        const { id } = request.params;
        const { response } = request.body;
        if (!response) return reply.status(400).send({ message: 'Response text required' });

        const updated = await prisma.studentQuery.update({
            where: { id },
            data: { response, respondedBy: request.user.id, respondedAt: new Date(), isResolved: true }
        });
        return updated;
    });
}

module.exports = studentQueryRoutes;