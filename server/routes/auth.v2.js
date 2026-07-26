/**
 * Refactored auth routes using Controller → Service → Repository pattern.
 * Routes contain NO business logic — only wiring.
 */
const AuthController = require('../controllers/authController');
const { RATE_LIMITS } = require('../constants');

async function authRoutes(fastify, opts) {
    const controller = new AuthController(fastify.services.auth, fastify);

    fastify.post('/login', {
        config: { rateLimit: RATE_LIMITS.LOGIN }
    }, (req, rep) => controller.login(req, rep));

    fastify.post('/change-password', {
        preHandler: [fastify.authenticate],
        config: { rateLimit: RATE_LIMITS.CHANGE_PASSWORD }
    }, (req, rep) => controller.changePassword(req, rep));

    fastify.post('/setup-password', {
        config: { rateLimit: RATE_LIMITS.CHANGE_PASSWORD }
    }, (req, rep) => controller.setupPassword(req, rep));

    fastify.post('/bootstrap', {}, (req, rep) => controller.bootstrap(req, rep));

    fastify.post('/register-mentor', {
        config: { rateLimit: RATE_LIMITS.REGISTER_MENTOR }
    }, (req, rep) => controller.registerMentor(req, rep));

    fastify.get('/me', { preHandler: [fastify.authenticate] }, (req, rep) => controller.profile(req, rep));

    fastify.post('/signature', {
        preHandler: [fastify.authenticate]
    }, async (request, reply) => {
        // Signature upload — kept in route for multipart streaming
        if (request.user.role === 'STUDENT') {
            return reply.status(403).send({
                success: false, error: 'Students cannot have signatures.', code: 'AUTH_INSUFFICIENT_ROLE'
            });
        }
        const { validateUploadedFile } = require('../lib/uploadPlugin');
        const raw = await request.file();
        const uploadInfo = validateUploadedFile(raw, request, reply);
        if (!uploadInfo) return;

        const { uploadStream } = require('../services/cloudinaryService');
        try {
            const result = await uploadStream(uploadInfo.file, 'signatures', `sig_${request.user.id}`);
            if (!result || !result.secure_url) throw new Error('Upload failed');
            await fastify.repos.user.updateSignature(request.user.id, result.secure_url);
            return reply.send({ success: true, data: { signatureUrl: result.secure_url } });
        } catch (error) {
            request.log.error({ err: error }, 'Signature upload error');
            return reply.status(500).send({ success: false, error: 'Failed to upload signature.', code: 'UPLOAD_ERROR' });
        }
    });

    fastify.get('/announcements', { preHandler: [fastify.authenticate] }, (req, rep) => controller.announcements(req, rep));

    fastify.get('/audit-logs', {
        preHandler: [fastify.authenticate, fastify.authorize('MENTOR', 'SUPERADMIN')]
    }, (req, rep) => controller.auditLogs(req, rep));

    fastify.get('/departments', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async () => {
        const departments = [
            { value: 'CSE', label: 'CSE - Computer Science' },
            { value: 'ECE', label: 'ECE - Electronics & Communication' },
            { value: 'EEE', label: 'EEE - Electrical & Electronics' },
            { value: 'MECH', label: 'MECH - Mechanical' },
            { value: 'CIVIL', label: 'CIVIL - Civil Engineering' },
            { value: 'IT', label: 'IT - Information Technology' },
            { value: 'AIDS', label: 'AIDS - AI & Data Science' },
            { value: 'AIML', label: 'AIML - AI & Machine Learning' },
            { value: 'BME', label: 'BME - Biomedical' },
            { value: 'MBA', label: 'MBA - Business Administration' },
            { value: 'MCA', label: 'MCA - Computer Applications' },
            { value: 'OTHER', label: 'Other' }
        ];
        return { departments };
    });
}

module.exports = authRoutes;
