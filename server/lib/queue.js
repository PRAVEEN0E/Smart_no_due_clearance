const { Queue: BullQueue, Worker } = require('bullmq');
const { getRedis } = require('./cache');

const connection = { connection: getRedis() };

const QUEUES = {
    EMAIL: 'sndc_email',
    PDF: 'sndc_pdf',
    QR: 'sndc_qr',
    AI: 'sndc_ai',
    NOTIFICATION: 'sndc_notification',
    REPORT: 'sndc_report',
};

const queues = {};

function getQueue(name) {
    if (!queues[name]) {
        queues[name] = new BullQueue(name, connection);
    }
    return queues[name];
}

async function addJob(queueName, jobName, data, opts = {}) {
    const queue = getQueue(queueName);
    return queue.add(jobName, data, {
        removeOnComplete: { age: 3600, count: 100 },
        removeOnFail: { age: 86400, count: 50 },
        ...opts,
    });
}

async function addBulk(queueName, jobs) {
    const queue = getQueue(queueName);
    return queue.addBulk(jobs.map(j => ({
        name: j.name,
        data: j.data,
        opts: { removeOnComplete: { age: 3600, count: 100 }, ...j.opts },
    })));
}

function createWorker(queueName, processor, opts = {}) {
    return new Worker(queueName, processor, {
        ...connection,
        concurrency: opts.concurrency || 5,
        limiter: opts.limiter || { max: 50, duration: 1000 },
        ...opts,
    });
}

async function getQueueStatus(queueName) {
    const queue = getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
    ]);
    return { waiting, active, completed, failed, delayed };
}

async function closeAll() {
    await Promise.all(Object.values(queues).map(q => q.close()));
}

module.exports = { QUEUES, getQueue, addJob, addBulk, createWorker, getQueueStatus, closeAll };
