const fs = require('fs');
const path = require('path');
const pipeline = require('util').promisify(require('stream').pipeline);

async function materialRoutes(fastify, opts) {
    const { prisma } = fastify;

    // Fetch materials for a subject (Student view)
    fastify.get('/subject/:subjectId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { subjectId } = request.params;
        if (!subjectId || subjectId === 'undefined' || subjectId === 'null') {
            return [];
        }
        return prisma.material.findMany({
            where: { subjectId },
            include: { uploadedBy: { select: { name: true } } },
            orderBy: { createdAt: 'desc' }
        });
    });

    // Upload material (Staff/Mentor view)
    fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        if (request.user.role === 'STUDENT') return reply.status(403).send({ message: 'Only staff can upload materials' });

        const { validateUploadedFile } = require('../lib/uploadPlugin');
        const { sanitizeText } = require('../lib/sanitize');
        const raw = await request.file();
        const uploadInfo = validateUploadedFile(raw, request, reply);
        if (!uploadInfo) return; // reply already sent

        const dirPath = path.join(__dirname, '../uploads/materials');
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        const filePath = path.join(dirPath, uploadInfo.filename);
        const fileType = path.extname(uploadInfo.filename).slice(1).toUpperCase() || 'PDF';

        try {
            const writeStream = fs.createWriteStream(filePath);
            await pipeline(uploadInfo.file, writeStream);
        } catch (error) {
            fastify.log.error(`Local Material Save Error: ${error.message}`);
            return reply.status(500).send({ message: 'Failed to save material locally' });
        }

        const fileUrl = `/uploads/materials/${uploadInfo.filename}`;
        const title = uploadInfo.fields?.title?.value ? sanitizeText(uploadInfo.fields.title.value) : '';
        const category = uploadInfo.fields?.category?.value || 'NOTES';
        const subjectId = uploadInfo.fields?.subjectId?.value || '';

        if (!fileUrl) return reply.status(400).send({ message: 'No file uploaded' });

        return prisma.material.create({
            data: {
                title,
                category,
                subjectId,
                fileUrl,
                fileType,
                uploadedById: request.user.id
            }
        });
    });

    // Delete material
    fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const material = await prisma.material.findUnique({ where: { id: request.params.id } });
        if (!material) return reply.status(404).send({ message: 'Material not found' });

        if (request.user.role !== 'MENTOR' && material.uploadedById !== request.user.id) {
            return reply.status(403).send({ message: 'Unauthorized' });
        }

        await prisma.material.delete({ where: { id: request.params.id } });
        return { message: 'Material deleted' };
    });
}

module.exports = materialRoutes;
