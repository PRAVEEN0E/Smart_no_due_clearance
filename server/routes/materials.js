const fs = require('fs');
const path = require('path');
const pipeline = require('util').promisify(require('stream').pipeline);

async function materialRoutes(fastify, opts) {
    const { prisma } = fastify;

    // Fetch materials for a subject (Student view)
    fastify.get('/subject/:subjectId', { preHandler: [fastify.authenticate] }, async (request) => {
        return prisma.material.findMany({
            where: { subjectId: request.params.subjectId },
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
                    const result = await uploadStream(part.file, 'materials', part.filename);
                    fileUrl = result.secure_url;
                    
                    const path = require('path');
                    fileType = path.extname(part.filename).slice(1).toUpperCase() || 'PDF';
                } catch (error) {
                    fastify.log.error(error);
                    return reply.status(500).send({ message: 'Failed to upload material' });
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
