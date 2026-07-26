const BaseRepository = require('./base');
const { ROLES } = require('../constants');

class UserRepository extends BaseRepository {
    constructor(prisma) {
        super(prisma, 'user');
    }

    async findByEmail(email) {
        return this.findFirst({
            email: email.toLowerCase().trim()
        }, { include: { college: true } });
    }

    async findByEmailOrRegisterNumber(identifier) {
        return this.findFirst({
            OR: [
                { email: identifier.toLowerCase().trim() },
                { registerNumber: identifier.trim() }
            ]
        }, { include: { college: true } });
    }

    async findByIdWithCollege(id) {
        return this.findUnique({ id }, {
            include: { college: true }
        });
    }

    async findByIdWithDetails(id) {
        return this.findUnique({ id }, {
            select: {
                id: true, name: true, email: true, role: true,
                signatureUrl: true, className: true, department: true,
                collegeId: true, needsPasswordChange: true,
                college: { select: { name: true, logoUrl: true, primaryColor: true, secondaryColor: true } }
            }
        });
    }

    async findStudentsByCollege(collegeId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = { collegeId, role: ROLES.STUDENT };
        const [data, total] = await Promise.all([
            this.findMany(where, { skip, take: limit, orderBy: { createdAt: 'desc' } }),
            this.count(where)
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async findStaffByCollege(collegeId) {
        return this.findMany({
            collegeId,
            role: { in: [ROLES.STAFF, ROLES.MENTOR] }
        }, { orderBy: { name: 'asc' } });
    }

    async findAdminUsers(search, role, collegeId) {
        const where = {};
        if (role) where.role = role;
        if (collegeId) where.collegeId = collegeId;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }
        return this.findMany(where, {
            include: { college: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: 200
        });
    }

    async searchUsers(query) {
        return this.findMany({
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { id: { contains: query } }
            ]
        }, {
            select: { id: true, name: true, email: true, role: true, college: { select: { name: true } } },
            take: 20
        });
    }

    async updatePassword(id, passwordHash) {
        return this.update({ id }, { passwordHash, passwordChangedAt: new Date() });
    }

    async updateSignature(id, signatureUrl) {
        return this.update({ id }, { signatureUrl });
    }

    async assignCustomRole(userId, customRoleId) {
        return this.update({ id: userId }, { customRoleId });
    }

    async setPasswordSetupToken(userId, token, expiresAt) {
        return this.update({ id: userId }, { passwordSetupToken: token, passwordSetupTokenExpires: expiresAt });
    }

    async clearPasswordSetupToken(userId) {
        return this.update({ id: userId }, { passwordSetupToken: null, passwordSetupTokenExpires: null });
    }

    async findByPasswordSetupToken(token) {
        return this.findFirst({ passwordSetupToken: token });
    }

    async countByRole(role) {
        return this.count({ role });
    }

    async countStudents() {
        return this.countByRole(ROLES.STUDENT);
    }

    async countMentors() {
        return this.countByRole(ROLES.MENTOR);
    }
}

module.exports = UserRepository;
