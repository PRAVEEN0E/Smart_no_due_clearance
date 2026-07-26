const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { sendWelcomeEmail } = require('../services/emailService');
const { parseStudentExcel } = require('../services/excelService');
const { QUEUES, addJob } = require('../lib/queue');

class MentorController {
    constructor(services, fastify) {
        this.services = services;
        this.fastify = fastify;
        this.prisma = fastify.prisma;
    }

    async listStaff(request) {
        const isSuperAdmin = request.user.role === 'SUPERADMIN';
        const isAdmin = isSuperAdmin || request.user.email === 'admin@college.edu';
        const where = { role: 'STAFF' };
        if (!isSuperAdmin) where.collegeId = request.user.collegeId || null;
        if (!isAdmin) where.createdById = request.user.id;
        return this.prisma.user.findMany({ where });
    }

    async createStaff(request, reply) {
        const { name, email, password, role } = request.body;
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) return reply.status(409).send({ message: 'Email already exists' });

        const passwordHash = await bcrypt.hash(password, 12);
        const staff = await this.prisma.user.create({
            data: {
                name, email, passwordHash,
                role: role || 'STAFF',
                createdBy: { connect: { id: request.user.id } },
                college: request.user.collegeId ? { connect: { id: request.user.collegeId } } : undefined
            }
        });

        const setupToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.prisma.user.update({ where: { id: staff.id }, data: { passwordSetupToken: setupToken, passwordSetupTokenExpires: expiresAt } });
        sendWelcomeEmail(email, name, setupToken);

        return { id: staff.id, name: staff.name, email: staff.email, role: staff.role };
    }

    async listStudents(request) {
        const isSuperAdmin = request.user.role === 'SUPERADMIN';
        const isAdmin = isSuperAdmin || request.user.email === 'admin@college.edu';
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 50;
        const skip = (page - 1) * limit;
        const where = { role: 'STUDENT' };
        if (!isSuperAdmin) where.collegeId = request.user.collegeId || null;
        if (!isAdmin) where.createdById = request.user.id;
        const [data, total] = await Promise.all([
            this.prisma.user.findMany({ where, skip, take: limit, include: { evaluations: { include: { subject: true } }, feeRecord: true }, orderBy: { createdAt: 'desc' } }),
            this.prisma.user.count({ where })
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }

    async createStudent(request, reply) {
        const { name, email, registerNumber, password, className, department } = request.body;
        const passwordHash = await bcrypt.hash(password, 12);
        let studentDept = department || null;
        if (!studentDept) {
            const mentor = await this.prisma.user.findUnique({ where: { id: request.user.id }, select: { department: true } });
            studentDept = mentor?.department || null;
        }
        const student = await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name, email, registerNumber: registerNumber || null, passwordHash,
                    role: 'STUDENT',
                    createdBy: { connect: { id: request.user.id } },
                    college: request.user.collegeId ? { connect: { id: request.user.collegeId } } : undefined,
                    className: className || null,
                    department: typeof studentDept === 'object' ? (studentDept?.name || null) : (studentDept || null)
                },
                select: { id: true, name: true, email: true, registerNumber: true, role: true, collegeId: true, className: true, department: true }
            });
            await tx.feeRecord.create({ data: { studentId: newUser.id, feeBalance: 0, feeClearedAuto: true } });
            return newUser;
        });
        const setupToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.prisma.user.update({ where: { id: student.id }, data: { passwordSetupToken: setupToken, passwordSetupTokenExpires: expiresAt } });
        sendWelcomeEmail(email, name, setupToken);
        return student;
    }

    async updateStudent(request, reply) {
        const existing = await this.prisma.user.findUnique({ where: { id: request.params.id } });
        if (!existing || existing.collegeId !== request.user.collegeId) {
            return reply.status(403).send({ message: 'Unauthorized' });
        }
        const { name, email, registerNumber, password, className, department } = request.body;
        const updateData = {
            name, email,
            registerNumber: registerNumber !== undefined ? registerNumber || null : undefined,
            className: className !== undefined ? className : undefined,
            department: department !== undefined ? department : undefined
        };
        if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
        return this.prisma.user.update({
            where: { id: request.params.id }, data: updateData,
            select: { id: true, name: true, email: true, registerNumber: true, role: true, collegeId: true, className: true, department: true }
        });
    }
}

module.exports = MentorController;
