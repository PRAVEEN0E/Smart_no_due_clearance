// Phase 7 — User preferences (theme, dashboard settings)
async function preferenceRoutes(fastify, opts) {
    fastify.addHook('preHandler', fastify.auth([fastify.authenticate]));

    const { prisma } = fastify;

    fastify.get('/', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (request) => {
        let pref = await prisma.userPreference.findUnique({ where: { userId: request.user.id } });
        if (!pref) {
            pref = await prisma.userPreference.create({
                data: { userId: request.user.id, theme: 'light', settings: {} }
            });
        }
        return pref;
    });

    fastify.put('/', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
        const { theme, settings } = request.body;
        const data = {};
        if (theme) data.theme = theme;
        if (settings !== undefined) data.settings = settings;

        const updated = await prisma.userPreference.upsert({
            where: { userId: request.user.id },
            create: { userId: request.user.id, ...data },
            update: data
        });
        return updated;
    });
}

module.exports = preferenceRoutes;