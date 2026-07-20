const { sanitizeText, sanitizeUrl, sanitizeEmail, sanitizeFileName } = require('../sanitize');

describe('sanitizeText', () => {
    it('strips HTML tags', () => {
        expect(sanitizeText('<b>hello</b>')).toBe('hello');
    });

    it('removes script tags entirely', () => {
        expect(sanitizeText('<script>alert("xss")</script>hello')).toBe('hello');
    });

    it('removes event handlers', () => {
        expect(sanitizeText('<img src=x onerror=alert(1)>')).toBe('');
    });

    it('handles plain text without modification', () => {
        expect(sanitizeText('Hello, world!')).toBe('Hello, world!');
    });

    it('trims whitespace', () => {
        expect(sanitizeText('  hello  ')).toBe('hello');
    });

    it('returns non-string values unchanged', () => {
        expect(sanitizeText(123)).toBe(123);
        expect(sanitizeText(null)).toBe(null);
        expect(sanitizeText(undefined)).toBe(undefined);
    });
});

describe('sanitizeUrl', () => {
    it('blocks javascript: URLs', () => {
        expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });

    it('blocks data: URLs', () => {
        expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('allows valid http URLs', () => {
        expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('blocks vbscript: URLs', () => {
        expect(sanitizeUrl('vbscript:msgbox("xss")')).toBe('');
    });
});

describe('sanitizeEmail', () => {
    it('lowercases email', () => {
        expect(sanitizeEmail('TEST@Example.Com')).toBe('test@example.com');
    });

    it('removes dangerous characters', () => {
        expect(sanitizeEmail('test"><script>alert(1)</script>@example.com')).toBe('testscriptalert1script@example.com');
    });

    it('trims whitespace', () => {
        expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });
});

describe('sanitizeFileName', () => {
    it('removes path traversal characters', () => {
        expect(sanitizeFileName('../../../etc/passwd')).toBe('._._._etc_passwd');
    });

    it('sanitizes special characters', () => {
        expect(sanitizeFileName('file<name>.pdf')).toBe('file_name_.pdf');
    });

    it('returns empty string for empty input', () => {
        expect(sanitizeFileName('')).toBe('');
    });

    it('truncates long filenames', () => {
        const long = 'a'.repeat(500) + '.pdf';
        expect(sanitizeFileName(long).length).toBeLessThanOrEqual(255);
    });
});
