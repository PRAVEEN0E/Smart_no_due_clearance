const { addSSEClient, removeSSEClient } = require('../services/notificationService');

async function notificationRoutes(fastify, opts) {
    fastify.addHook('preHandler', fastify.auth([fastify.authenticate]));

    const { prisma } = fastify;

    // SSE stream — real-time notifications (uses query token for EventSource compatibility)
    fastify.get('/stream', {
        preHandler: async (request, reply) => {
            const token = request.query.token;
            if (!token) return reply.status(401).send({ message: 'Missing token' });
            try {
                const decoded = fastify.jwt.verify(token);
                request.user = decoded;
            } catch {
                return reply.status(401).send({ message: 'Invalid token' });
            }
        }
    }, async (request, reply) => {
        const origin = request.headers.origin;
        const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(o => o.trim());
        const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : (allowedOrigins[0] || 'http://localhost:5173');

        const headers = {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': allowedOrigin
        };
        reply.raw.writeHead(200, headers);
        reply.raw.write(`data: ${JSON.stringify({ type: 'CONNECTED', userId: request.user.id })}\n\n`);

        const userId = request.user.id;
        const client = reply.raw;
        addSSEClient(userId, client);

        request.raw.on('close', () => removeSSEClient(userId, client));
        return reply;
    });

    // Get current user's notifications
    fastify.get('/', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (request) => {
        return prisma.notification.findMany({
            where: { userId: request.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    });

    // Mark as read
    fastify.post('/read/:id', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (request, reply) => {
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
    fastify.post('/read-all', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request) => {
        await prisma.notification.updateMany({
            where: { userId: request.user.id, isRead: false },
            data: { isRead: true }
        });
        return { success: true };
    });
}

module.exports = notificationRoutes;