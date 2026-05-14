const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Delete in order to respect foreign key constraints
    await prisma.notification.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.hallTicket.deleteMany();
    await prisma.feeRecord.deleteMany();
    await prisma.evaluation.deleteMany();
    await prisma.staffSubject.deleteMany();
    await prisma.studentSubject.deleteMany();
    await prisma.material.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.user.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.college.deleteMany();
    console.log('✅ All users and related data deleted successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
