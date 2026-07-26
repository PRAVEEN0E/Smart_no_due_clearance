const res = require('../constants/responses');

class AuthController {
    constructor(authService, fastify) {
        this.auth = authService;
        this.fastify = fastify;
    }

    parseUA(ua) {
        if (!ua) return { browser: null, os: null, device: null };
        let browser = null, os = null, device = null;
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        else browser = 'Unknown';
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'macOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iOS')) os = 'iOS';
        else os = 'Unknown';
        if (ua.includes('Mobile')) device = 'Mobile';
        else device = 'Desktop';
        return { browser, os, device };
    }

    async recordLogin(user, success, reason, request) {
        try {
            const ua = request?.headers?.['user-agent'];
            const parsed = this.parseUA(ua);
            await this.fastify.prisma.loginHistory.create({
                data: {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    collegeId: user.collegeId || null,
                    success,
                    ip: request?.ip || request?.connection?.remoteAddress || null,
                    userAgent: ua?.substring(0, 500) || null,
                    browser: parsed.browser,
                    device: parsed.device,
                    os: parsed.os,
                    reason: reason || null
                }
            });
        } catch (e) {
            this.fastify.log.warn({ err: e }, 'Failed to record login history');
        }
    }

    async login(request, reply) {
        const { email, password } = request.body || {};
        if (!email || !password) {
            return res.badRequest(reply, 'Email and password are required.');
        }

        const result = await this.auth.authenticate(email, password, this.fastify);
        if (result.error) {
            if (result.user) {
                await this.recordLogin(result.user, false, result.message, request);
            }
            return reply.status(result.status).send({
                success: false, error: result.message, code: result.code
            });
        }

        await this.recordLogin(result.user, true, null, request);
        this.fastify.setAuthCookie(reply, result.token);
        return res.success(reply, { user: result.user });
    }

    async changePassword(request, reply) {
        const { currentPassword, newPassword } = request.body || {};
        if (!currentPassword || !newPassword) {
            return res.badRequest(reply, 'Current password and new password are required.');
        }
        if (newPassword.length < 8 || newPassword.length > 128) {
            return res.badRequest(reply, 'Password must be between 8 and 128 characters.');
        }

        const result = await this.auth.changePassword(request.user.id, currentPassword, newPassword);
        if (result.error) {
            return reply.status(result.status).send({ success: false, error: result.message, code: result.code });
        }
        return res.success(reply, null, result.message);
    }

    async setupPassword(request, reply) {
        const { token, newPassword } = request.body || {};
        if (!token || !newPassword) {
            return res.badRequest(reply, 'Token and new password are required.');
        }
        if (newPassword.length < 8 || newPassword.length > 128) {
            return res.badRequest(reply, 'Password must be between 8 and 128 characters.');
        }

        const result = await this.auth.setupPassword(token, newPassword);
        if (result.error) {
            return reply.status(result.status).send({ success: false, error: result.message, code: result.code });
        }
        return res.success(reply, null, result.message);
    }

    async bootstrap(request, reply) {
        const secret = request.headers['bootstrap-secret'];
        const result = await this.auth.bootstrap(secret, this.fastify);
        if (result.error) {
            return reply.status(result.status).send({ success: false, error: result.message, code: result.code });
        }
        return res.success(reply, result, result.message);
    }

    async registerMentor(request, reply) {
        const data = request.body || {};
        if (!data.name || !data.email || !data.password || !data.collegeName) {
            return res.badRequest(reply, 'Name, email, password, and college name are required.');
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return res.badRequest(reply, 'Invalid email format.');
        }
        if (data.password.length < 8) {
            return res.badRequest(reply, 'Password must be at least 8 characters.');
        }

        const result = await this.auth.registerMentor(data, this.fastify);
        if (result.error) {
            return reply.status(result.status).send({ success: false, error: result.message, code: result.code });
        }
        return res.created(reply, { email: result.email, college: result.college }, result.message);
    }

    async profile(request, reply) {
        const user = await this.auth.getProfile(request.user.id);
        if (!user) return res.notFound(reply, 'User not found');
        return res.success(reply, {
            ...user,
            collegeName: user.college?.name || null,
            branding: user.college || null
        });
    }

    async announcements(request, reply) {
        const data = await this.auth.getAnnouncements(request.user.collegeId);
        return res.success(reply, data);
    }

    async auditLogs(request, reply) {
        const isSuperAdmin = request.user.role === 'SUPERADMIN';
        const page = Math.max(1, parseInt(request.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(request.query.limit) || 50));
        const result = await this.auth.getAuditLogs(request.user.collegeId, isSuperAdmin, page, limit);
        return res.success(reply, result.data, 'Success', 200, {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
        });
    }
}

module.exports = AuthController;
