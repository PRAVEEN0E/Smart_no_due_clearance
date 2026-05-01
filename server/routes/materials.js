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

        const { uploadStream } = require('../services/cloudinaryService');
        const parts = request.parts();
        let title = '';
        let category = 'NOTES';
        let subjectId = '';
        let fileUrl = '';
        let fileType = 'PDF';

        for await (const part of parts) {
            if (part.file) {
                try {
                    const ext = path.extname(part.filename).slice(1).toUpperCase() || 'PDF';
                    fileType = ext;
                    const fileName = `mat_${request.user.id}_${Date.now()}.${ext.toLowerCase()}`;
                    const dirPath = path.join(__dirname, '../uploads/materials');
                    if (!fs.existsSync(dirPath)) {
                        fs.mkdirSync(dirPath, { recursive: true });
                    }
                    const filePath = path.join(dirPath, fileName);
                    
                    await pipeline(part.file, fs.createWriteStream(filePath));
                    fileUrl = `/uploads/materials/${fileName}`;
                } catch (error) {
                    fastify.log.error(`Local Material Save Error: ${error.message}`);
                    return reply.status(500).send({ message: 'Failed to save material locally' });
                }
            } else {
                if (part.fieldname === 'title') title = part.value;
                if (part.fieldname === 'category') category = part.value;
                if (part.fieldname === 'subjectId') subjectId = part.value;
            }
        }

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
