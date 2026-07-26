const { QUEUES, createWorker } = require('../lib/queue');
const { processEmailJob } = require('./emailWorker');
const { processNotificationJob } = require('./notificationWorker');
const { processAiJob } = require('./aiWorker');

let workers = [];

function registerWorkers() {
    const emailWorker = createWorker(QUEUES.EMAIL, async (job) => {
        try {
            await processEmailJob(job);
        } catch (err) {
            console.error(`[EmailWorker] Job ${job.id} failed:`, err.message);
            throw err;
        }
    });

    const notificationWorker = createWorker(QUEUES.NOTIFICATION, async (job) => {
        try {
            await processNotificationJob(job);
        } catch (err) {
            console.error(`[NotificationWorker] Job ${job.id} failed:`, err.message);
            throw err;
        }
    });

    const aiWorker = createWorker(QUEUES.AI, async (job) => {
        try {
            await processAiJob(job);
        } catch (err) {
            console.error(`[AiWorker] Job ${job.id} failed:`, err.message);
            throw err;
        }
    });

    workers = [emailWorker, notificationWorker, aiWorker];
    console.log(`Registered ${workers.length} BullMQ workers`);
    return workers;
}

async function closeWorkers() {
    await Promise.all(workers.map(w => w.close()));
    workers = [];
}

module.exports = { registerWorkers, closeWorkers };
