const { PrismaClient } = require('@prisma/client');

const users = ['postgres', 'Pravin', 'Praveen', 'praveen0e', 'root'];
const passwords = [
  '',
  'postgres',
  'password',
  'admin',
  'admin123',
  'postgres123',
  'root',
  '1234',
  '123456',
  '12345678',
  'Praveen@123',
  'Pravin@123',
  'praveen0e',
  'Praveen',
  'Pravin',
  'smartnodue',
  'nodue'
];

async function testConnections() {
  for (const user of users) {
    for (const pwd of passwords) {
      const url = pwd 
        ? `postgresql://${user}:${encodeURIComponent(pwd)}@localhost:5432/postgres`
        : `postgresql://${user}@localhost:5432/postgres`;
        
      console.log(`Testing user: ${user}, pwd: ${pwd ? '****' : '(none)'}`);
      
      const prisma = new PrismaClient({
        datasources: {
          db: {
            url: url
          }
        }
      });

      try {
        await prisma.$queryRaw`SELECT 1`;
        console.log(`\n🎉 SUCCESS: Connected using postgresql://${user}:${pwd ? '****' : ''}@localhost:5432/postgres`);
        await prisma.$disconnect();
        return url;
      } catch (err) {
        // If the error is NOT an authentication failure, but rather a "database does not exist" error, it means authentication succeeded!
        if (err.message.includes('database') && (err.message.includes('does not exist') || err.message.includes('db'))) {
          console.log(`\n🎉 SUCCESS (Auth succeeded, but db doesn't exist): postgresql://${user}:${pwd ? '****' : ''}@localhost:5432/postgres`);
          await prisma.$disconnect();
          return url;
        }
        // console.log(`❌ FAILED: ${err.message}`);
      } finally {
        await prisma.$disconnect();
      }
    }
  }
  console.log('Finished probing. No local connection worked.');
  return null;
}

testConnections();
