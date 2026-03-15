async function notificationRoutes(fastify, opts) {
    fastify.addHook('preHandler', fastify.auth([fastify.authenticate]));

    const { prisma } = fastify;

    // Get current user's notifications
    fastify.get('/', async (request) => {
        return prisma.notification.findMany({
            where: { userId: request.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
    });

    // Mark as read
    fastify.post('/read/:id', async (request, reply) => {
        const { id } = request.params;

        const notif = await prisma.notification.findUnique({ where: { id } });
        if (!notif || notif.userId !== request.user.id) {
            return reply.status(403).send({ message: 'Unauthorized' });
        }

        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });

        return { success: true };
    });

    // Mark all as read
    fastify.post('/read-all', async (request) => {
        await prisma.notification.updateMany({
            where: { userId: request.user.id, isRead: false },
            data: { isRead: true }
        });
        return { success: true };
    });
}

module.exports = notificationRoutes;
