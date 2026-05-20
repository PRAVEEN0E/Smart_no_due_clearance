const { PrismaClient } = require('@prisma/client');

async function check() {
  const url = 'postgresql://postgres:postgres@localhost:5432/postgres';
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url
      }
    }
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Success');
  } catch (err) {
    console.error('FULL ERROR:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
