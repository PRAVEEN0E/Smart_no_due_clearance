class StudentController {
    constructor(services, fastify) {
        this.fastify = fastify;
        this.prisma = fastify.prisma;
    }

    async listSubjects(request) {
        return this.fastify.cache.remember(`sndc:studentsubjects:${request.user.id}`, this.fastify.cache.DEFAULT_TTL, () => {
            return this.prisma.studentSubject.findMany({
                where: { studentId: request.user.id },
                include: {
                    subject: {
                        include: {
                            staffAssignments: { include: { staff: true } }
                        }
                    }
                }
            });
        });
    }
}

module.exports = StudentController;
