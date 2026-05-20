const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const colleges = await prisma.college.findMany({
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true
        }
      }
    }
  });
  console.log(JSON.stringify(colleges, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
