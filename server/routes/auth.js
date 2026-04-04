const bcrypt = require('bcrypt');

async function authRoutes(fastify, opts) {
    const { prisma } = fastify;

    fastify.post('/login', {
        config: {
            rateLimit: {
                max: 5,
                timeWindow: '1 minute'
            }
        }
    }, async (request, reply) => {
        const { email, password } = request.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return reply.status(401).send({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return reply.status(401).send({ message: 'Invalid credentials' });
        }

        const token = fastify.jwt.sign({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            collegeId: user.collegeId
        });

        return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    });

    // Bootstrap Super Admin (for development)
    fastify.post('/bootstrap', async (request, reply) => {
        const adminExists = await prisma.user.findFirst({ where: { email: 'admin@college.edu' } });
        if (adminExists) return { message: 'SuperAdmin already exists' };

        const passwordHash = await bcrypt.hash('Admin@123', 12);
        
        const result = await prisma.$transaction(async (tx) => {
            const college = await tx.college.create({
                data: {
                    name: 'System Default College',
                    domain: 'college.edu'
                }
            });

            const admin = await tx.user.create({
                data: {
                    name: 'System Admin',
                    email: 'admin@college.edu',
                    passwordHash,
                    role: 'MENTOR', // Reverted to MENTOR to ensure frontend routing works cleanly
                    collegeId: college.id
                }
            });
            return { admin, college };
        });

        return { message: 'SuperAdmin created', email: result.admin.email, college: result.college.name };
    });

    // Public Mentor Registration (Creates a new Tenant/College)
    fastify.post('/register-mentor', async (request, reply) => {
        const { name, email, password, collegeName } = request.body;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return reply.status(409).send({ message: 'Email already exists' });

        const passwordHash = await bcrypt.hash(password, 12);
        
        const result = await prisma.$transaction(async (tx) => {
            const college = await tx.college.create({
                data: {
                    name: collegeName || 'Default College',
                    domain: email.split('@')[1]
                }
            });

            const mentor = await tx.user.create({
                data: {
                    name,
                    email,
                    passwordHash,
                    role: 'MENTOR',
                    collegeId: college.id
                }
            });
            return { mentor, college };
        });

        return { message: 'Mentor & College registered successfully', email: result.mentor.email, college: result.college.name };
    });

    // Profile & Signature Management
    fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request) => {
        return prisma.user.findUnique({
            where: { id: request.user.id },
            select: { id: true, name: true, email: true, role: true, signatureUrl: true }
        });
    });

    fastify.post('/signature', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        if (request.user.role === 'STUDENT') return reply.status(403).send({ message: 'Students cannot have signatures' });

        const data = await request.file();
        if (!data) return reply.status(400).send({ message: 'No signature image uploaded' });

        const { uploadStream } = require('../services/cloudinaryService');

        let signatureUrl;
        try {
            const result = await uploadStream(data.file, 'signatures', `sig_${request.user.id}`);
            signatureUrl = result.secure_url;
        } catch (error) {
            fastify.log.error(error);
            return reply.status(500).send({ message: 'Failed to upload signature' });
        }

        await prisma.user.update({
            where: { id: request.user.id },
            data: { signatureUrl }
        });

        return { signatureUrl };
    });
    // Notification Routes
    fastify.get('/notifications', { preHandler: [fastify.authenticate] }, async (request) => {
        return prisma.notification.findMany({
            where: { userId: request.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
    });

    fastify.put('/notifications/:id/read', { preHandler: [fastify.authenticate] }, async (request) => {
        return prisma.notification.update({
            where: { id: request.params.id, userId: request.user.id },
            data: { isRead: true }
        });
    });

    fastify.get('/announcements', { preHandler: [fastify.authenticate] }, async (request) => {
        return prisma.announcement.findMany({
            where: {
                collegeId: request.user.collegeId,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
    });

    fastify.get('/audit-logs', { preHandler: [fastify.authenticate, fastify.authorize(['MENTOR'])] }, async (request) => {
        return prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
    });
}


module.exports = authRoutes;
