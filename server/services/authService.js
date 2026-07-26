const bcrypt = require('bcrypt');
const { AUTH, ERROR_CODES, ROLES } = require('../constants');

class AuthService {
    constructor(repos) {
        this.users = repos.user;
        this.colleges = repos.college;
        this.announcements = repos.announcement;
        this.auditLogs = repos.auditLog;
    }

    async authenticate(email, password, fastify) {
        const user = await this.users.findByEmailOrRegisterNumber(email);
        if (!user) {
            return { error: true, code: ERROR_CODES.AUTH_INVALID_CREDENTIALS, status: 401, message: 'Invalid credentials.', user: { id: null, email, role: null, collegeId: null } };
        }

        if (user.role !== ROLES.SUPERADMIN && user.college?.isMaintenanceMode) {
            return { error: true, code: ERROR_CODES.MAINTENANCE_MODE, status: 503, message: 'Your institutional node is currently under maintenance. Please try again later.', user: { id: user.id, email: user.email, role: user.role, collegeId: user.collegeId } };
        }

        if (user.disabled) {
            return { error: true, code: ERROR_CODES.AUTH_DISABLED, status: 403, message: 'Your account has been disabled. Please contact your administrator.', user: { id: user.id, email: user.email, role: user.role, collegeId: user.collegeId } };
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return { error: true, code: ERROR_CODES.AUTH_INVALID_CREDENTIALS, status: 401, message: 'Invalid credentials.', user: { id: user.id, email: user.email, role: user.role, collegeId: user.collegeId } };
        }

        const token = fastify.jwt.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            collegeId: user.collegeId,
            isMaintenance: user.college?.isMaintenanceMode || false
        });

        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            isMaintenance: user.college?.isMaintenanceMode || false,
            needsPasswordChange: !user.passwordChangedAt && user.role !== ROLES.SUPERADMIN
        };

        return { user: userData, token };
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.users.findUnique({ id: userId });
        if (!user) {
            return { error: true, code: ERROR_CODES.USER_NOT_FOUND, status: 404, message: 'User not found.' };
        }

        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return { error: true, code: ERROR_CODES.AUTH_INVALID_PASSWORD, status: 401, message: 'Current password is incorrect.' };
        }

        const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS, 10) || AUTH.BCRYPT_DEFAULT_ROUNDS);
        await this.users.updatePassword(userId, passwordHash);

        return { message: 'Password updated successfully.' };
    }

    async setupPassword(token, newPassword) {
        const user = await this.users.findByPasswordSetupToken(token);
        if (!user) {
            return { error: true, code: ERROR_CODES.AUTH_INVALID_TOKEN, status: 400, message: 'Invalid or expired setup token.' };
        }
        if (!user.passwordSetupTokenExpires || new Date() > user.passwordSetupTokenExpires) {
            return { error: true, code: ERROR_CODES.AUTH_TOKEN_EXPIRED, status: 400, message: 'Setup token has expired. Please contact your mentor.' };
        }

        const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS, 10) || AUTH.BCRYPT_DEFAULT_ROUNDS);
        await this.users.updatePassword(user.id, passwordHash);
        await this.users.clearPasswordSetupToken(user.id);

        return { message: 'Password set up successfully. You can now log in.' };
    }

    async bootstrap(bootstrapSecretProvided, fastify) {
        if (process.env.NODE_ENV === 'production') {
            return { error: true, code: ERROR_CODES.BOOTSTRAP_DISABLED, status: 403, message: 'Bootstrap is disabled in production.' };
        }

        const secret = process.env.BOOTSTRAP_SECRET;
        if (!secret || bootstrapSecretProvided !== secret) {
            return { error: true, code: ERROR_CODES.BOOTSTRAP_SECRET_INVALID, status: 403, message: 'Invalid bootstrap secret.' };
        }

        const adminExists = await this.users.findByEmail('admin@college.edu');
        if (adminExists) {
            return { message: 'SuperAdmin already exists.' };
        }

        const passwordHash = await bcrypt.hash('Admin@123', parseInt(process.env.BCRYPT_ROUNDS, 10) || AUTH.BCRYPT_DEFAULT_ROUNDS);

        const result = await this.users.transaction(async (tx) => {
            const userRepo = new (require('../repositories/userRepository'))(tx);
            const collegeRepo = new (require('../repositories/collegeRepository'))(tx);
            const college = await collegeRepo.create({ name: 'System Default Department', domain: 'department.edu' });
            const admin = await userRepo.create({ name: 'System Admin', email: 'admin@college.edu', passwordHash, role: ROLES.SUPERADMIN, collegeId: college.id });
            return { admin, college };
        });

        return { message: 'SuperAdmin created', email: result.admin.email, college: result.college.name };
    }

    async registerMentor(data, fastify) {
        const { name, email, password, collegeName, department } = data;
        const normalizedEmail = email.toLowerCase().trim();
        const existing = await this.users.findByEmail(normalizedEmail);
        if (existing) {
            return { error: true, code: ERROR_CODES.EMAIL_EXISTS, status: 409, message: 'An account with this email already exists.' };
        }

        const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS, 10) || AUTH.BCRYPT_DEFAULT_ROUNDS);

        const result = await this.users.transaction(async (tx) => {
            const userRepo = new (require('../repositories/userRepository'))(tx);
            const collegeRepo = new (require('../repositories/collegeRepository'))(tx);
            const college = await collegeRepo.create({ name: collegeName, domain: normalizedEmail.split('@')[1] });
            const mentor = await userRepo.create({ name, email: normalizedEmail, passwordHash, role: ROLES.MENTOR, collegeId: college.id, department: department || null });
            return { mentor, college };
        });

        return { message: 'Mentor & College registered successfully.', email: result.mentor.email, college: result.college.name };
    }

    async getProfile(userId) {
        return this.users.findByIdWithDetails(userId);
    }

    async getAnnouncements(collegeId) {
        return this.announcements.findMany(
            {
                OR: [{ collegeId }, { collegeId: null }],
                AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }]
            },
            { orderBy: { createdAt: 'desc' }, take: 10 }
        );
    }

    async getAuditLogs(collegeId, isSuperAdmin, page = 1, limit = 50) {
        const where = isSuperAdmin ? {} : { collegeId };
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.auditLogs.findMany(where, { skip, take: limit, orderBy: { createdAt: 'desc' } }),
            this.auditLogs.count(where)
        ]);
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
}

module.exports = AuthService;
