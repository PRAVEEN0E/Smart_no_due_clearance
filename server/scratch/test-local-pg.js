const { PrismaClient } = require('@prisma/client');

const connectionStrings = [
  'postgresql://postgres:postgres@localhost:5432/postgres',
  'postgresql://postgres:password@localhost:5432/postgres',
  'postgresql://postgres:admin@localhost:5432/postgres',
  'postgresql://postgres:root@localhost:5432/postgres',
  'postgresql://postgres:123456@localhost:5432/postgres',
  'postgresql://postgres:1234@localhost:5432/postgres',
  'postgresql://postgres@localhost:5432/postgres',
  'postgresql://root:root@localhost:5432/postgres',
  'postgresql://root@localhost:5432/postgres'
];

async function testConnections() {
  for (const url of connectionStrings) {
    console.log(`Testing: ${url.replace(/:([^:@]+)@/, ':****@')}`);
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: url
        }
      }
    });

    try {
      // Try to query something simple
      await prisma.$queryRaw`SELECT 1`;
      console.log(`🎉 SUCCESS: Connected using ${url}`);
      await prisma.$disconnect();
      return url; // Found a working URL
    } catch (err) {
      console.log(`❌ FAILED: ${err.message.split('\n')[0]}`);
    } finally {
      await prisma.$disconnect();
    }
  }
  console.log('No local connection strings worked.');
  return null;
}

testConnections();
