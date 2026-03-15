const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const student = await prisma.user.findFirst({
        where: { role: 'STUDENT' },
        include: {
            studentSubjects: { include: { subject: true } },
            evaluations: { include: { subject: true } }
        }
    });

    if (!student) {
        console.log("No student found");
        return;
    }

    console.log("Student Name:", student.name);
    console.log("Email:", student.email);
    console.log("\nEnrolled Subjects (StudentSubject):");
    student.studentSubjects.forEach(ss => {
        console.log(`- ${ss.subject.name} (${ss.subject.code})`);
    });

    console.log("\nEvaluations in DB:");
    student.evaluations.forEach(ev => {
        console.log(`- ${ev.subject.name}: Attendance=${ev.attendancePercent}%, Internal=${ev.internalMarksTotal}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
