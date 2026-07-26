class CollegeService {
    constructor(repos) {
        this.colleges = repos.college;
        this.users = repos.user;
    }

    async getAll() {
        return this.colleges.findAllWithCounts();
    }

    async getById(id) {
        return this.colleges.findUnique({ id });
    }

    async create(data) {
        return this.colleges.create(data);
    }

    async update(id, data) {
        return this.colleges.update({ id }, data);
    }

    async delete(id) {
        return this.colleges.delete({ id });
    }

    async toggleMaintenance(id, isMaintenanceMode) {
        return this.colleges.updateMaintenance(id, isMaintenanceMode);
    }

    async updateWithMentorDepartment(id, data) {
        const { department, ...collegeData } = data;
        return this.colleges.transaction(async (tx) => {
            const collegeRepo = new (require('../repositories/base'))(tx, 'college');
            const userRepo = new (require('../repositories/base'))(tx, 'user');
            const college = await collegeRepo.update({ id }, collegeData);
            if (department !== undefined) {
                const mentor = await userRepo.findFirst({ collegeId: id, role: 'MENTOR' });
                if (mentor) {
                    await userRepo.update({ id: mentor.id }, { department });
                }
            }
            return college;
        });
    }

    async getStats() {
        const [collegeCount, totalUsers, studentCount, mentorCount] = await Promise.all([
            this.colleges.countAll(),
            this.users.count(),
            this.users.countStudents(),
            this.users.countMentors()
        ]);
        return { colleges: collegeCount, users: totalUsers, students: studentCount, mentors: mentorCount };
    }
}

module.exports = CollegeService;
