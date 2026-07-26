const prisma = require('../lib/prisma');
const fp = require('fastify-plugin');
const { createContainer } = require('../lib/container');

async function prismaPlugin(fastify, opts) {

    if (process.env.NODE_ENV === 'development') {
        prisma.$on('query', (e) => {
            if (e.duration > 100) {
                fastify.log.warn({ query: e.query, duration: e.duration }, 'Slow query detected');
            }
        });
    }

    prisma.$connect().catch(err => {
        fastify.log.error(`Prisma initial connection failed: ${err.message}`);
    });

    fastify.decorate('prisma', prisma);

    const { repos, services } = createContainer(prisma);
    fastify.decorate('repos', repos);
    fastify.decorate('services', services);

    fastify.addHook('onClose', async (fastify) => {
        await fastify.prisma.$disconnect();
    });
}

module.exports = fp(prismaPlugin);
