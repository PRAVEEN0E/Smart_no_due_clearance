const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendWelcomeEmail } = require('./emailService');
const { parseStudentExcel, parseFeeExcel } = require('./excelService');
const { QUEUES, addJob } = require('../lib/queue');

class MentorService {
    constructor(repos) {
        this.users = repos.user;
        this.colleges = repos.college;
        this.subjects = repos.subject;
        this.staffSubjects = repos.staffSubject;
        this.announcements = repos.announcement;
    }

    async createStaff(data, user, fastify) {
        const { name, email, password, role } = data;
        const prisma = fastify.prisma;
        const passwordHash = await bcrypt.hash(password, 12);

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return { status: 409, error: 'Email already exists' };

        const staff = await prisma.user.create({
            data: {
                name, email, passwordHash,
                role: role || 'STAFF',
                createdBy: { connect: { id: user.id } },
                college: user.collegeId ? { connect: { id: user.collegeId } } : undefined
            }
        });

        const setupToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await prisma.user.update({ where: { id: staff.id }, data: { passwordSetupToken: setupToken, passwordSetupTokenExpires: expiresAt } });
        sendWelcomeEmail(email, name, setupToken);

        return { id: staff.id, name: staff.name, email: staff.email, role: staff.role };
    }

    async listStudents(user, query) {
        const prisma = this.users.prisma;
        const isSuperAdmin = user.role === 'SUPERADMIN';
        const isAdmin = isSuperAdmin || user.email === 'admin@college.edu';
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 50;
        const skip = (page - 1) * limit;

        const where = { role: 'STUDENT' };
        if (!isSuperAdmin) where.collegeId = user.collegeId || null;
        if (!isAdmin) where.createdById = user.id;

        const [data, total] = await Promise.all([
            this.users.prisma.user.findMany({
                where, skip, take: limit,
                include: { evaluations: { include: { subject: true } }, feeRecord: true },
                orderBy: { createdAt: 'desc' }
            }),
            this.users.prisma.user.count({ where })
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
}

module.exports = MentorService;
