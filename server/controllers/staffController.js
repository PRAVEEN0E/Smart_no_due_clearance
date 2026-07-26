const res = require('../constants/responses');

class StaffController {
    constructor(services, fastify) {
        this.fastify = fastify;
        this.prisma = fastify.prisma;
    }

    async listSubjects(request) {
        return this.fastify.cache.remember(`sndc:staffsubjects:${request.user.id}`, this.fastify.cache.DEFAULT_TTL, () => {
            return this.prisma.staffSubject.findMany({
                where: { staffId: request.user.id },
                include: { subject: true }
            });
        });
    }

    async analytics(request) {
        return this.fastify.cache.remember(`sndc:staffanalytics:${request.user.id}`, this.fastify.cache.SHORT_TTL, async () => {
            const evaluations = await this.prisma.evaluation.findMany({
                where: { staffId: request.user.id }
            });
            const chartData = [
                { name: '0-15 (Needs Imp.)', count: evaluations.filter(e => e.internalMarksTotal < 15).length, color: '#ef4444' },
                { name: '15-25 (Average)', count: evaluations.filter(e => e.internalMarksTotal >= 15 && e.internalMarksTotal < 25).length, color: '#f59e0b' },
                { name: '25-35 (Good)', count: evaluations.filter(e => e.internalMarksTotal >= 25 && e.internalMarksTotal < 35).length, color: '#3b82f6' },
                { name: '35-40 (Excellent)', count: evaluations.filter(e => e.internalMarksTotal >= 35).length, color: '#10b981' },
            ];
            const catTrends = [
                { name: 'CAT 1', avg: evaluations.length > 0 ? (evaluations.reduce((acc, e) => acc + (e.cat1 || 0), 0) / evaluations.length).toFixed(1) : 0 },
                { name: 'CAT 2', avg: evaluations.length > 0 ? (evaluations.reduce((acc, e) => acc + (e.cat2 || 0), 0) / evaluations.length).toFixed(1) : 0 },
                { name: 'CAT 3', avg: evaluations.length > 0 ? (evaluations.reduce((acc, e) => acc + (e.cat3 || 0), 0) / evaluations.length).toFixed(1) : 0 },
            ];
            return { distribution: chartData, trends: catTrends };
        });
    }
}

module.exports = StaffController;
