const { PrismaClient } = require('@prisma/client');
const fp = require('fastify-plugin');

async function prismaPlugin(fastify, opts) {
  const prisma = new PrismaClient();

  await prisma.$connect();

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async (fastify) => {
    await fastify.prisma.$disconnect();
  });
}

module.exports = fp(prismaPlugin);
