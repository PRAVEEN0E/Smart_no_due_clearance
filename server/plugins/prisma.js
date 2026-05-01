const { PrismaClient } = require('@prisma/client');
const fp = require('fastify-plugin');

async function prismaPlugin(fastify, opts) {
  const prisma = new PrismaClient();

  // Try to connect but don't crash if it fails
  prisma.$connect().catch(err => {
    fastify.log.error(`Prisma initial connection failed: ${err.message}`);
  });

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (fastify) => {
    await fastify.prisma.$disconnect();
  });
}

module.exports = fp(prismaPlugin);
