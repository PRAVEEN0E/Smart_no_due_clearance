const BaseRepository = require('./base');

class CollegeRepository extends BaseRepository {
    constructor(prisma) {
        super(prisma, 'college');
    }

    async findAllWithCounts() {
        return this.findMany({}, {
            include: {
                _count: { select: { users: true, subjects: true } },
                users: { where: { role: 'MENTOR' }, select: { id: true, department: true }, take: 1 }
            },
            orderBy: { name: 'asc' }
        });
    }

    async findByIdWithMentor(id) {
        return this.findUnique({ id }, {
            include: {
                users: { where: { role: 'MENTOR' }, select: { id: true, department: true }, take: 1 }
            }
        });
    }

    async updateMaintenance(id, isMaintenanceMode) {
        return this.update({ id }, { isMaintenanceMode });
    }

    async countAll() {
        return this.count();
    }
}

module.exports = CollegeRepository;
