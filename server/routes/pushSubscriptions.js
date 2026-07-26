const webpush = require('web-push');
const { sendNotification } = require('../services/notificationService');

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.EMAIL_FROM || 'mailto:admin@college.edu',
        VAPID_PUBLIC_KEY,
        VAPID_PRIVATE_KEY
    );
}

async function pushRoutes(fastify, opts) {
    const { prisma } = fastify;

    // Public: get VAPID public key
    fastify.get('/vapid-key', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async () => {
        return { publicKey: VAPID_PUBLIC_KEY || '' };
    });

    // Authenticated: subscribe
    fastify.post('/subscribe', { preHandler: fastify.auth([fastify.authenticate]) }, async (request, reply) => {
        const { endpoint, keys } = request.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return reply.status(400).send({ message: 'endpoint, p256dh, and auth required' });
        }

        const existing = await prisma.pushSubscription.findUnique({ where: { endpoint } });
        if (existing) {
            await prisma.pushSubscription.update({
                where: { id: existing.id },
                data: { p256dh: keys.p256dh, auth: keys.auth, userAgent: request.headers['user-agent'] }
            });
            return { success: true, updated: true };
        }

        await prisma.pushSubscription.create({
            data: {
                userId: request.user.id,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                userAgent: request.headers['user-agent']
            }
        });
        return { success: true };
    });

    // Authenticated: unsubscribe
    fastify.delete('/subscribe', { preHandler: fastify.auth([fastify.authenticate]) }, async (request) => {
        const { endpoint } = request.body;
        if (endpoint) {
            await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: request.user.id } });
        }
        return { success: true };
    });

    // Send push notification to a user
    async function sendPush(prisma, userId, title, body) {
        if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
        const subs = await prisma.pushSubscription.findMany({ where: { userId } });
        for (const sub of subs) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    JSON.stringify({ title, body, icon: '/favicon.ico', badge: '/favicon.ico' })
                );
            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
                }
            }
        }
    }

    fastify.decorate('sendPush', (userId, title, body) => sendPush(prisma, userId, title, body));
}

module.exports = pushRoutes;