const { generateFeedback, predictStudentSuccess } = require('../services/aiService');
const { prisma } = require('../lib/prisma');

async function processAiJob(job) {
    const { type, data } = job.data;

    switch (type) {
        case 'generate-feedback': {
            const aiFeedback = await generateFeedback(data.fileUrl, data.subjectName);
            if (data.assignmentId) {
                await prisma.assignment.update({
                    where: { id: data.assignmentId },
                    data: { aiFeedback }
                });
            }
            return { feedback: aiFeedback };
        }
        case 'predict-success': {
            const prediction = await predictStudentSuccess(data.evaluation, data.subjectName);
            if (data.evaluation?.id) {
                await prisma.evaluation.update({
                    where: { id: data.evaluation.id },
                    data: { aiPrediction: JSON.stringify(prediction) }
                });
            }
            return { prediction };
        }
        default:
            throw new Error(`Unknown AI type: ${type}`);
    }
}

module.exports = { processAiJob };
