const { sendEmail, sendWelcomeEmail, sendFeeUpdateEmail, sendAnnouncementEmail, sendMarksUpdateEmail, sendSubjectApprovedEmail } = require('../services/emailService');

async function processEmailJob(job) {
    const { type, data } = job.data;

    switch (type) {
        case 'welcome':
            return sendWelcomeEmail(data.email, data.name, data.token);
        case 'fee-update':
            return sendFeeUpdateEmail(data.email, data.name, data.amount);
        case 'announcement':
            return sendAnnouncementEmail(data.emails, data.title, data.content, data.priority);
        case 'marks-update':
            return sendMarksUpdateEmail(data.email, data.name, data.subjectName);
        case 'subject-approved':
            return sendSubjectApprovedEmail(data.email, data.name, data.subjectName);
        default:
            throw new Error(`Unknown email type: ${type}`);
    }
}

module.exports = { processEmailJob };
