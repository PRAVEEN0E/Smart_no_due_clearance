const BaseRepository = require('./base');

class SubjectRepository extends BaseRepository {
    constructor(prisma) {
        super(prisma, 'subject');
    }

    async findByCollegeId(collegeId) {
        return this.findMany({ collegeId }, { orderBy: { name: 'asc' } });
    }

    async findByIdWithDetails(id) {
        return this.findUnique({ id }, {
            include: {
                staff: { include: { user: { select: { name: true, email: true } } } },
                students: { include: { student: { select: { id: true, name: true, registerNumber: true } } } },
                evaluations: true,
                _count: { select: { materials: true, assignments: true } }
            }
        });
    }

    async findTeacherSubjects(userId) {
        return this.findMany({
            staff: { some: { userId } }
        }, {
            include: {
                students: { include: { student: { select: { id: true, name: true, registerNumber: true } } } },
                _count: { select: { materials: true } }
            }
        });
    }

    async findStudentSubjects(studentId) {
        return this.findMany({
            students: { some: { studentId } }
        }, {
            include: {
                evaluations: {
                    where: { studentId },
                    include: { assignment: true }
                },
                _count: { select: { materials: true, assignments: { where: { studentId } } } }
            }
        });
    }
}

module.exports = SubjectRepository;
