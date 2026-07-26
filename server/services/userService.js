const bcrypt = require('bcrypt');
const { ROLES, AUTH } = require('../constants');

class UserService {
    constructor(repos) {
        this.users = repos.user;
        this.colleges = repos.college;
    }

    async createStaff(data, collegeId) {
        const passwordHash = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_ROUNDS, 10) || AUTH.BCRYPT_DEFAULT_ROUNDS);
        return this.users.create({
            name: data.name,
            email: data.email.toLowerCase().trim(),
            passwordHash,
            role: data.role || ROLES.STAFF,
            collegeId
        });
    }

    async createStudent(data, collegeId) {
        const passwordHash = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_ROUNDS, 10) || AUTH.BCRYPT_DEFAULT_ROUNDS);
        return this.users.create({
            name: data.name,
            email: data.email.toLowerCase().trim(),
            passwordHash,
            role: ROLES.STUDENT,
            collegeId,
            registerNumber: data.registerNumber || null,
            className: data.className || null,
            department: data.department || null
        });
    }

    async updateUser(userId, data) {
        return this.users.update({ id: userId }, data);
    }

    async deleteUser(userId) {
        return this.users.delete({ id: userId });
    }

    async getStudents(collegeId, page, limit) {
        return this.users.findStudentsByCollege(collegeId, page, limit);
    }

    async getStaff(collegeId) {
        return this.users.findStaffByCollege(collegeId);
    }

    async search(query) {
        if (!query || query.length < 2) return [];
        return this.users.searchUsers(query);
    }

    async bulkCreateStudents(studentsData, collegeId) {
        const results = [];
        for (const s of studentsData) {
            try {
                const existing = await this.users.findByEmail(s.email);
                if (existing) {
                    if (existing.collegeId === collegeId) {
                        const updateData = {};
                        if (s.name) updateData.name = s.name;
                        if (s.registerNumber) updateData.registerNumber = String(s.registerNumber);
                        if (s.className) updateData.className = s.className;
                        if (s.department) updateData.department = typeof s.department === 'object' ? (s.department?.name || null) : s.department;
                        await this.users.update({ id: existing.id }, updateData);
                        results.push({ email: s.email, status: 'Updated' });
                    } else {
                        results.push({ email: s.email, status: 'Failed', reason: 'Belongs to different college' });
                    }
                } else {
                    const passwordHash = await bcrypt.hash(s.password, parseInt(process.env.BCRYPT_ROUNDS, 10) || AUTH.BCRYPT_DEFAULT_ROUNDS);
                    const user = await this.users.create({
                        name: s.name,
                        email: s.email,
                        registerNumber: s.registerNumber ? String(s.registerNumber) : null,
                        passwordHash,
                        role: ROLES.STUDENT,
                        collegeId,
                        className: s.className || null,
                        department: typeof s.department === 'object' ? (s.department?.name || null) : (s.department || null)
                    });
                    await new (require('../repositories/base'))(this.users.prisma, 'feeRecord').create({ studentId: user.id, feeBalance: 0, feeClearedAuto: true });
                    results.push({ email: s.email, status: 'Created' });
                }
            } catch (err) {
                results.push({ email: s.email || 'unknown', status: 'Failed', reason: err.message });
            }
        }
        return results;
    }
}

module.exports = UserService;
