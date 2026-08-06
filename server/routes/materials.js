const path = require('path');
const { Readable } = require('stream');
const { uploadStream, deleteFile } = require('../services/cloudinaryService');

const MIME_TYPES = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    txt: 'text/plain',
    csv: 'text/csv',
};

function resolveDownloadName(material) {
    if (material.originalName && material.originalName.includes('.')) return material.originalName;
    const urlName = material.fileUrl?.split('/').pop()?.split('?')[0] || '';
    if (urlName.includes('.')) return urlName;
    const ext = (material.fileType || '').toLowerCase() || (material.mimeType ? MIME_TYPES[material.mimeType] : '');
    const safeTitle = (material.title || 'resource').replace(/[\\/:*?"<>|]/g, '_');
    return `${safeTitle}.${ext}`;
}

function encodeFilename(name) {
    return encodeURIComponent(name).replace(/['()]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

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

    // Download material with original filename preserved
    fastify.get('/:id/download', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const material = await prisma.material.findUnique({ where: { id: request.params.id } });
        if (!material) return reply.status(404).send({ message: 'Material not found' });

        const downloadName = resolveDownloadName(material);
        const ext = downloadName.split('.').pop()?.toLowerCase() || '';
        const contentType = material.mimeType || MIME_TYPES[ext] || 'application/octet-stream';

        reply.type(contentType);
        reply.header('Content-Disposition',
            `attachment; filename="${downloadName.replace(/"/g, "'")}"; filename*=UTF-8''${encodeFilename(downloadName)}`);
        reply.header('X-Content-Type-Options', 'nosniff');
        reply.header('Cache-Control', 'private, max-age=300');

        try {
            const upstream = await fetch(material.fileUrl);
            if (!upstream.ok || !upstream.body) {
                return reply.status(502).send({ message: 'Failed to retrieve file from storage' });
            }
            return reply.send(Readable.fromWeb(upstream.body));
        } catch (err) {
            fastify.log.error(`Material download stream error: ${err.message}`);
            return reply.status(502).send({ message: 'Failed to stream file from storage' });
        }
    });

    // Upload material (Staff/Mentor view)
    fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        if (request.user.role === 'STUDENT') return reply.status(403).send({ message: 'Only staff can upload materials' });

        let raw;
        try {
            raw = await request.file();
        } catch (err) {
            if (err.message?.includes('not multipart')) {
                return reply.status(400).send({ message: 'Upload must use multipart/form-data encoding.' });
            }
            throw err;
        }

        const { validateUploadedFile } = require('../lib/uploadPlugin');
        const { sanitizeText } = require('../lib/sanitize');
        const uploadInfo = validateUploadedFile(raw, request, reply);
        if (!uploadInfo) return; // reply already sent

        const fileType = path.extname(uploadInfo.filename).slice(1).toUpperCase() || 'PDF';

        let fileUrl;
        try {
            const result = await uploadStream(uploadInfo.file, 'study-materials', uploadInfo.filename, 'raw');
            fileUrl = result.secure_url;
        } catch (err) {
            fastify.log.error(`Cloudinary Material Upload Error: ${err.message}`);
            return reply.status(500).send({ message: 'Failed to upload material' });
        }
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
                originalName: uploadInfo.originalName || uploadInfo.filename,
                mimeType: uploadInfo.mimetype || null,
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

        // Delete from Cloudinary first, then DB
        try {
            await deleteFile(material.fileUrl);
        } catch (err) {
            fastify.log.error(`Cloudinary delete error (non-blocking): ${err.message}`);
        }

        await prisma.material.delete({ where: { id: request.params.id } });
        return { message: 'Material deleted' };
    });
}

module.exports = materialRoutes;
