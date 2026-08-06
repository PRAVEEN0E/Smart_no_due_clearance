require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const prisma = require('../lib/prisma');
const { processAiJob } = require('../workers/aiWorker');

async function main() {
    const stuck = await prisma.assignment.findMany({
        where: { aiFeedback: { contains: 'being generated' } },
        include: { subject: true },
        orderBy: { submittedAt: 'desc' }
    });
    console.log('Stuck assignments to process:', stuck.length);

    let ok = 0, fail = 0;
    for (const a of stuck) {
        try {
            const result = await processAiJob({
                data: {
                    type: 'generate-feedback',
                    data: { fileUrl: a.fileUrl, subjectName: a.subject?.name || 'General', assignmentId: a.id, userId: a.studentId }
                }
            });
            console.log(`OK   ${a.id.substring(0, 8)} (${a.subject?.name || '?'}) len=${(result.feedback || '').length}`);
            ok++;
        } catch (e) {
            console.log(`FAIL ${a.id.substring(0, 8)}: ${e.message}`);
            fail++;
        }
    }
    console.log(`Done: ${ok} ok, ${fail} failed`);
    process.exit(0);
}

main();
