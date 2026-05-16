
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Delete the duplicate AM101 for college 4fd5d1c5-1145-4b2f-8379-3258ae870580
  // Keeping the one created last or first? I'll keep 4fe0762c-05b7-48a9-8d64-e92e9346d5aa
  await prisma.subject.delete({
    where: { id: '0f2a66ec-dbf4-4697-8c2b-ee95b9ce592c' }
  });
  console.log('Deleted duplicate subject');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
