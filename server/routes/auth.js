const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

async function authRoutes(fastify, opts) {
    const { prisma } = fastify;

    // ── LOGIN ──────────────────────────────────────────────────────────────
    fastify.post('/login', {
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '1 minute'
            }
        }
    }, async (request, reply) => {
        try {
            const { email, password } = request.body || {};

            if (!email || !password) {
                return reply.status(400).send({
                    error: 'Bad Request',
                    message: 'Email and password are required.',
                    code: 'VALIDATION_ERROR'
                });
            }

            const normalizedEmail = email.toLowerCase().trim();

            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: normalizedEmail },
                        { registerNumber: email.trim() }
                    ]
                },
                include: { college: true }
            });

            if (!user) {
                fastify.log.warn(`Login attempt for non-existent user: ${email}`);
                return reply.status(401).send({
                    error: 'Unauthorized',
                    message: 'Invalid credentials.',
                    code: 'AUTH_INVALID_CREDENTIALS'
                });
            }

            // Check Maintenance Mode (SuperAdmins are exempt)
            if (user.role !== 'SUPERADMIN' && user.college?.isMaintenanceMode) {
                return reply.status(503).send({
                    error: 'Service Unavailable',
                    message: 'Your institutional node is currently under maintenance. Please try again later.',
                    code: 'MAINTENANCE_MODE'
                });
            }

            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                fastify.log.warn(`Failed password attempt for user: ${email}`);
                return reply.status(401).send({
                    error: 'Unauthorized',
                    message: 'Invalid credentials.',
                    code: 'AUTH_INVALID_CREDENTIALS'
                });
            }

            const token = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                collegeId: user.collegeId,
                isMaintenance: user.college?.isMaintenanceMode || false
            });

            // Set httpOnly cookie
            fastify.setAuthCookie(reply, token);

            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isMaintenance: user.college?.isMaintenanceMode || false,
                needsPasswordChange: !user.passwordChangedAt && user.role !== 'SUPERADMIN'
            };

            return {
                token,
                user: userData
            };
        } catch (error) {
            request.log.error({ err: error }, 'Login error');
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'An error occurred during login. Please try again.',
                code: 'AUTH_LOGIN_ERROR'
            });
        }
    });

    // ── CHANGE PASSWORD ────────────────────────────────────────────────────
    fastify.post('/change-password', {
        preHandler: [fastify.authenticate],
        config: {
            rateLimit: {
                max: 3,
                timeWindow: '5 minutes'
            }
        }
    }, async (request, reply) => {
        try {
            const { currentPassword, newPassword } = request.body || {};

            if (!currentPassword || !newPassword) {
                return reply.status(400).send({
                    error: 'Bad Request',
                    message: 'Current password and new password are required.',
                    code: 'VALIDATION_ERROR'
                });
            }

            if (newPassword.length < 8) {
                return reply.status(400).send({
                    error: 'Bad Request',
                    message: 'New password must be at least 8 characters long.',
                    code: 'VALIDATION_ERROR'
                });
            }

            if (newPassword.length > 128) {
                return reply.status(400).send({
                    error: 'Bad Request',
                    message: 'New password must not exceed 128 characters.',
                    code: 'VALIDATION_ERROR'
                });
            }

            const user = await prisma.user.findUnique({
                where: { id: request.user.id }
            });

            if (!user) {
                return reply.status(404).send({
                    error: 'Not Found',
                    message: 'User not found.',
                    code: 'USER_NOT_FOUND'
                });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isMatch) {
                return reply.status(401).send({
                    error: 'Unauthorized',
                    message: 'Current password is incorrect.',
                    code: 'AUTH_INVALID_PASSWORD'
                });
            }

            const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash, passwordChangedAt: new Date() }
            });

            return { message: 'Password updated successfully.' };
        } catch (error) {
            request.log.error({ err: error }, 'Change password error');
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'Failed to update password.',
                code: 'PASSWORD_CHANGE_ERROR'
            });
        }
    });

    // ── BOOTSTRAP ──────────────────────────────────────────────────────────
    fastify.post('/bootstrap', async (request, reply) => {
        try {
            // Production guard: never allow bootstrap in production
            if (process.env.NODE_ENV === 'production') {
                return reply.status(403).send({
                    error: 'Forbidden',
                    message: 'Bootstrap is disabled in production. Configure the initial admin through your deployment process.',
                    code: 'BOOTSTRAP_DISABLED'
                });
            }

            const secret = request.headers['bootstrap-secret'];
            if (!process.env.BOOTSTRAP_SECRET || secret !== process.env.BOOTSTRAP_SECRET) {
                return reply.status(403).send({
                    error: 'Forbidden',
                    message: 'Invalid bootstrap secret.',
                    code: 'BOOTSTRAP_SECRET_INVALID'
                });
            }

            const adminExists = await prisma.user.findFirst({
                where: { email: 'admin@college.edu' }
            });

            if (adminExists) {
                return { message: 'SuperAdmin already exists.' };
            }

            const passwordHash = await bcrypt.hash('Admin@123', BCRYPT_ROUNDS);

            const result = await prisma.$transaction(async (tx) => {
                const college = await tx.college.create({
                    data: {
                        name: 'System Default Department',
                        domain: 'department.edu'
                    }
                });

                const admin = await tx.user.create({
                    data: {
                        name: 'System Admin',
                        email: 'admin@college.edu',
                        passwordHash,
                        role: 'SUPERADMIN',
                        collegeId: college.id
                    }
                });
                return { admin, college };
            });

            return {
                message: 'SuperAdmin created',
                email: result.admin.email,
                college: result.college.name
            };
        } catch (error) {
            request.log.error({ err: error }, 'Bootstrap error');
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'Failed to bootstrap admin.',
                code: 'BOOTSTRAP_ERROR'
            });
        }
    });

    // ── REGISTER MENTOR ───────────────────────────────────────────────────
    fastify.post('/register-mentor', {
        config: {
            rateLimit: {
                max: 3,
                timeWindow: '10 minutes'
            }
        }
    }, async (request, reply) => {
        try {
            const { name, email, password, collegeName, department } = request.body || {};

            if (!name || !email || !password || !collegeName) {
                return reply.status(400).send({
                    error: 'Bad Request',
                    message: 'Name, email, password, and college name are required.',
                    code: 'VALIDATION_ERROR'
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return reply.status(400).send({
                    error: 'Bad Request',
                    message: 'Invalid email format.',
                    code: 'VALIDATION_ERROR'
                });
            }

            // Password strength
            if (password.length < 8) {
                return reply.status(400).send({
                    error: 'Bad Request',
                    message: 'Password must be at least 8 characters long.',
                    code: 'VALIDATION_ERROR'
                });
            }

            const normalizedEmail = email.toLowerCase().trim();
            const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
            if (existing) {
                return reply.status(409).send({
                    error: 'Conflict',
                    message: 'An account with this email already exists.',
                    code: 'EMAIL_EXISTS'
                });
            }

            const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

            const result = await prisma.$transaction(async (tx) => {
                const college = await tx.college.create({
                    data: {
                        name: collegeName,
                        domain: normalizedEmail.split('@')[1]
                    }
                });

                const mentor = await tx.user.create({
                    data: {
                        name,
                        email: normalizedEmail,
                        passwordHash,
                        role: 'MENTOR',
                        collegeId: college.id,
                        department: department || null
                    }
                });
                return { mentor, college };
            });

            return {
                message: 'Mentor & College registered successfully.',
                email: result.mentor.email,
                college: result.college.name
            };
        } catch (error) {
            request.log.error({ err: error }, 'Registration error');
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: error.message || 'Registration failed.',
                code: 'REGISTRATION_ERROR'
            });
        }
    });

    // ── GET CURRENT USER PROFILE ───────────────────────────────────────────
    fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request) => {
        const user = await prisma.user.findUnique({
            where: { id: request.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                signatureUrl: true,
                className: true,
                department: true,
                collegeId: true,
                needsPasswordChange: true,
                college: {
                    select: {
                        name: true,
                        logoUrl: true,
                        primaryColor: true,
                        secondaryColor: true
                    }
                }
            }
        });

        if (!user) {
            throw fastify.httpErrors.notFound('User not found');
        }

        return {
            ...user,
            collegeName: user.college?.name || null,
            branding: user.college || null
        };
    });

    // ── SIGNATURE UPLOAD ───────────────────────────────────────────────────
    fastify.post('/signature', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        if (request.user.role === 'STUDENT') {
            return reply.status(403).send({
                error: 'Forbidden',
                message: 'Students cannot have signatures.',
                code: 'AUTH_INSUFFICIENT_ROLE'
            });
        }

        const data = await request.file();
        if (!data) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'No signature image uploaded.',
                code: 'VALIDATION_ERROR'
            });
        }

        // File type validation for signatures
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!allowedMimeTypes.includes(data.mimetype)) {
            return reply.status(400).send({
                error: 'Bad Request',
                message: 'Invalid file type. Only PNG, JPEG, and WebP images are allowed.',
                code: 'VALIDATION_ERROR'
            });
        }

        const { uploadStream } = require('../services/cloudinaryService');

        try {
            const result = await uploadStream(data.file, 'signatures', `sig_${request.user.id}`);
            if (!result || !result.secure_url) {
                throw new Error('Upload failed');
            }

            await prisma.user.update({
                where: { id: request.user.id },
                data: { signatureUrl: result.secure_url }
            });

            return { signatureUrl: result.secure_url };
        } catch (error) {
            request.log.error({ err: error }, 'Signature upload error');
            return reply.status(500).send({
                error: 'Internal Server Error',
                message: 'Failed to upload signature.',
                code: 'UPLOAD_ERROR'
            });
        }
    });

    // ── ANNOUNCEMENTS ──────────────────────────────────────────────────────
    fastify.get('/announcements', { preHandler: [fastify.authenticate] }, async (request) => {
        return prisma.announcement.findMany({
            where: {
                OR: [
                    { collegeId: request.user.collegeId },
                    { collegeId: null }
                ],
                AND: [
                    {
                        OR: [
                            { expiresAt: null },
                            { expiresAt: { gt: new Date() } }
                        ]
                    }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
    });

    // ── AUDIT LOGS ─────────────────────────────────────────────────────────
    fastify.get('/audit-logs', {
        preHandler: [fastify.authenticate, fastify.authorize('MENTOR', 'SUPERADMIN')]
    }, async (request) => {
        const isSuperAdmin = request.user.role === 'SUPERADMIN';
        const page = Math.max(1, parseInt(request.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(request.query.limit) || 50));
        const skip = (page - 1) * limit;

        const where = isSuperAdmin ? {} : { collegeId: request.user.collegeId };

        const [data, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.auditLog.count({ where })
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    });
}

module.exports = authRoutes;
