const { sanitizeText, sanitizeEmail, sanitizeFileName, sanitizeObject } = require('./sanitize');

const TEXT_FIELDS = ['name', 'title', 'content', 'message', 'department', 'remarks', 'feedback', 'subject', 'description', 'collegeName'];
const EMAIL_FIELDS = ['email'];
const FILE_NAME_FIELDS = ['filename', 'fileName', 'originalName', 'originalname'];

function sanitizeBody(request, reply, done) {
    if (request.body && typeof request.body === 'object') {
        const sanitized = { ...request.body };

        for (const key of Object.keys(sanitized)) {
            const val = sanitized[key];
            if (typeof val === 'string') {
                if (EMAIL_FIELDS.includes(key)) {
                    sanitized[key] = sanitizeEmail(val);
                } else if (FILE_NAME_FIELDS.includes(key)) {
                    sanitized[key] = sanitizeFileName(val);
                } else if (TEXT_FIELDS.includes(key)) {
                    sanitized[key] = sanitizeText(val);
                }
            }
        }

        request.body = sanitized;
    }

    if (request.query && typeof request.query === 'object') {
        const sanitized = { ...request.query };
        for (const key of Object.keys(sanitized)) {
            if (typeof sanitized[key] === 'string') {
                sanitized[key] = sanitized[key].trim().replace(/<[^>]*>/g, '');
            }
        }
        request.query = sanitized;
    }

    if (done) done();
}

function sanitizeRichTextBody(request, reply, done) {
    if (request.body && typeof request.body === 'object') {
        const sanitized = { ...request.body };
        for (const key of Object.keys(sanitized)) {
            if (typeof sanitized[key] === 'string' && TEXT_FIELDS.includes(key)) {
                sanitized[key] = sanitizeText(sanitized[key]);
            }
        }
        request.body = sanitized;
    }
    if (done) done();
}

module.exports = { sanitizeBody, sanitizeRichTextBody };
