const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const assignments = await prisma.assignment.findMany({
            take: 5,
            orderBy: { submittedAt: 'desc' }
        });
        console.log('Latest 5 assignments:');
        assignments.forEach(a => {
            console.log(`ID: ${a.id}`);
            console.log(`URL: ${a.fileUrl}`);
            console.log('---');
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
