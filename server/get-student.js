const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        take: 1
    });
    console.log(JSON.stringify(students, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
