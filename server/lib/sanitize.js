/**
 * Input sanitization utilities for XSS prevention.
 * Strips/escapes potentially dangerous HTML/script content from user inputs.
 */

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'blockquote'];

function sanitizeText(value) {
    if (typeof value !== 'string') return value;
    // Remove any HTML tags except line breaks
    return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
}

function sanitizeRichText(value) {
    if (typeof value !== 'string') return value;
    // Strip script tags entirely
    let cleaned = value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    // Strip event handlers (onclick, onerror, etc.)
    cleaned = cleaned.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    // Strip javascript: URLs
    cleaned = cleaned.replace(/javascript:\s*/gi, '');
    // Allow only safe tags
    cleaned = cleaned.replace(/<(\/?)(\w+)([^>]*)>/gi, (match, close, tag, attrs) => {
        if (ALLOWED_TAGS.includes(tag.toLowerCase())) {
            // Strip all attributes from allowed tags except href on <a>
            if (tag.toLowerCase() === 'a') {
                const hrefMatch = attrs.match(/\s+href\s*=\s*"([^"]+)"/i);
                if (hrefMatch && !hrefMatch[1].startsWith('javascript:')) {
                    return `<${close}a href="${sanitizeUrl(hrefMatch[1])}">`;
                }
                return `<${close}a>`;
            }
            return `<${close}${tag}>`;
        }
        // Escaped display for disallowed tags
        return `&lt;${close}${tag}&gt;`;
    });
    return cleaned;
}

function sanitizeUrl(value) {
    if (typeof value !== 'string') return '';
    const url = value.trim().toLowerCase();
    if (url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('vbscript:')) {
        return '';
    }
    return value.trim();
}

function sanitizeEmail(value) {
    if (typeof value !== 'string') return '';
    return value.toLowerCase().replace(/[^a-z0-9@._+-]/g, '').trim();
}

function sanitizeFileName(value) {
    if (typeof value !== 'string') return `file_${Date.now()}`;
    return value
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\.\.+/g, '.')
        .substring(0, 255);
}

function sanitizeObject(obj, fields = []) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = { ...obj };
    for (const field of fields) {
        if (field in sanitized && typeof sanitized[field] === 'string') {
            sanitized[field] = sanitizeText(sanitized[field]);
        }
    }
    return sanitized;
}

module.exports = {
    sanitizeText,
    sanitizeRichText,
    sanitizeUrl,
    sanitizeEmail,
    sanitizeFileName,
    sanitizeObject
};
