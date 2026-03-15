const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const student = await prisma.user.findFirst({
        where: { role: 'STUDENT' },
        include: {
            evaluations: { include: { subject: true } },
            studentSubjects: { include: { subject: true } }
        }
    });

    console.log("Student:", student.name, student.email);
    console.log("Evaluations:");
    student.evaluations.forEach(e => {
        console.log(`- ${e.subject.name}: Marks=${e.internalMarksTotal}, Attendance=${e.attendancePercent}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
