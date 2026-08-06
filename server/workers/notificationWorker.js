const prisma = require('../lib/prisma');

async function processNotificationJob(job) {
    const { type, data } = job.data;

    switch (type) {
        case 'hall-ticket-check':
            const { checkAndUnlock } = require('../services/hallTicketService');
            return checkAndUnlock(data.studentId, prisma);
        default:
            throw new Error(`Unknown notification type: ${type}`);
    }
}

module.exports = { processNotificationJob };
