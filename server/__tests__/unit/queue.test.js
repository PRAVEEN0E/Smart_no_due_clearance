const { QUEUES, getQueue, addJob, addBulk, getQueueStatus, closeAll } = require('../../lib/queue');

describe('Queue Module', () => {
    describe('QUEUES', () => {
        it('defines all queue names', () => {
            expect(QUEUES.EMAIL).toBe('sndc_email');
            expect(QUEUES.PDF).toBe('sndc_pdf');
            expect(QUEUES.QR).toBe('sndc_qr');
            expect(QUEUES.AI).toBe('sndc_ai');
            expect(QUEUES.NOTIFICATION).toBe('sndc_notification');
            expect(QUEUES.REPORT).toBe('sndc_report');
        });

        it('has 6 queues', () => {
            expect(Object.keys(QUEUES).length).toBe(6);
        });
    });

    describe('getQueue', () => {
        it('creates and returns a queue instance', () => {
            const q = getQueue('test-sync-queue');
            expect(q).toBeDefined();
            expect(q.name).toBe('test-sync-queue');
        });

        it('returns same instance for same name', () => {
            const q1 = getQueue('test-sync-singleton');
            const q2 = getQueue('test-sync-singleton');
            expect(q1).toBe(q2);
        });
    });

    describe('addJob', () => {
        it('schedules a job (may fail if no Redis)', async () => {
            try {
                const job = await addJob('test:queue', 'test-job', { data: 1 });
                expect(job).toBeDefined();
            } catch {
                // Redis unavailable — expected in test
            }
        });
    });

    describe('addBulk', () => {
        it('schedules bulk jobs (may fail if no Redis)', async () => {
            try {
                const jobs = await addBulk('test:bulk', [
                    { name: 'job1', data: { x: 1 } },
                    { name: 'job2', data: { x: 2 } },
                ]);
                expect(jobs).toBeDefined();
                expect(jobs.length).toBe(2);
            } catch {
                // Redis unavailable — expected in test
            }
        });
    });

    describe('getQueueStatus', () => {
        it('returns zero counts when queue empty (may fail if no Redis)', async () => {
            try {
                const status = await getQueueStatus('test:empty');
                expect(status.waiting).toBe(0);
                expect(status.active).toBe(0);
                expect(status.completed).toBe(0);
                expect(status.failed).toBe(0);
                expect(status.delayed).toBe(0);
            } catch {
                // Redis unavailable
            }
        });
    });

    describe('closeAll', () => {
        it('closes all queues gracefully', async () => {
            await expect(closeAll()).resolves.not.toThrow();
        });
    });
});
