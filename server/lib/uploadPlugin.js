const { validateFileType, validateFileSize, getSafeFileName } = require('./upload');

const ROUTE_CATEGORIES = {
    'signature': 'signature',
    'assignment': 'assignment',
    'assignments': 'assignment',
    'material': 'material',
    'materials': 'material',
    'students': 'excel',
    'fees': 'excel',
    'bulk': 'excel',
};

function inferCategory(url) {
    const lower = url.toLowerCase();
    for (const [key, cat] of Object.entries(ROUTE_CATEGORIES)) {
        if (lower.includes(key)) return cat;
    }
    return 'assignment';
}

/**
 * Validates an uploaded file's metadata (extension, mimetype) WITHOUT consuming the stream.
 * Returns a validated file info object, or null and sends an error response.
 * The returned object preserves the original `@fastify/multipart` file methods (toBuffer, etc.)
 */
function validateUploadedFile(file, request, reply) {
    if (!file) {
        reply.status(400).send({
            error: 'Bad Request',
            message: 'No file uploaded.',
            code: 'VALIDATION_ERROR'
        });
        return null;
    }

    const category = inferCategory(request.url);

    const typeResult = validateFileType(file.filename, file.mimetype, category);
    if (!typeResult.valid) {
        file.file?.resume && file.file.resume();
        reply.status(400).send({
            error: 'Bad Request',
            message: typeResult.errors.join(' '),
            code: 'FILE_TYPE_REJECTED'
        });
        return null;
    }

    const safeName = getSafeFileName(file.filename, category);

    return {
        filename: safeName,
        originalName: file.filename,
        mimetype: file.mimetype,
        category,
        fields: file.fields || {},
        file: file.file || file,
        encoding: file.encoding,
        toBuffer: file.toBuffer ? () => file.toBuffer() : undefined
    };
}

module.exports = { validateUploadedFile, inferCategory };
