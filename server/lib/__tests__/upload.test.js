const { validateFileType, validateFileSize, getSafeFileName } = require('../upload');

describe('validateFileType', () => {
    it('accepts valid PDF for assignment', () => {
        const result = validateFileType('report.pdf', 'application/pdf', 'assignment');
        expect(result.valid).toBe(true);
    });

    it('rejects dangerous executable', () => {
        const result = validateFileType('virus.exe', 'application/x-msdownload', 'assignment');
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('not allowed'))).toBe(true);
    });

    it('rejects double extension attack', () => {
        const result = validateFileType('document.pdf.exe', 'application/x-msdownload', 'assignment');
        expect(result.valid).toBe(false);
    });

    it('rejects missing filename', () => {
        const result = validateFileType('', 'application/pdf', 'assignment');
        expect(result.valid).toBe(false);
    });

    it('rejects disallowed extension for signature', () => {
        const result = validateFileType('doc.pdf', 'application/pdf', 'signature');
        expect(result.valid).toBe(false);
    });

    it('accepts allowed extension for signature', () => {
        const result = validateFileType('sig.png', 'image/png', 'signature');
        expect(result.valid).toBe(true);
    });

    it('defaults to assignment category', () => {
        const result = validateFileType('doc.pdf', 'application/pdf');
        expect(result.valid).toBe(true);
    });
});

describe('validateFileSize', () => {
    it('accepts files under limit', () => {
        const result = validateFileSize(1024 * 1024, 'assignment');
        expect(result.valid).toBe(true);
    });

    it('rejects oversized files', () => {
        const result = validateFileSize(100 * 1024 * 1024, 'assignment');
        expect(result.valid).toBe(false);
    });

    it('returns size limit in error message', () => {
        const result = validateFileSize(100 * 1024 * 1024, 'signature');
        expect(result.error).toContain('2MB');
    });
});

describe('getSafeFileName', () => {
    it('preserves safe extension', () => {
        const safe = getSafeFileName('report.pdf', 'doc');
        expect(safe).toMatch(/^doc_\d+_\w+\.pdf$/);
    });

    it('falls back to .bin for unsafe extensions', () => {
        const safe = getSafeFileName('virus.exe', 'file');
        expect(safe).toMatch(/^file_\d+_\w+\.bin$/);
    });

    it('generates unique names', () => {
        const a = getSafeFileName('doc.pdf');
        const b = getSafeFileName('doc.pdf');
        expect(a).not.toBe(b);
    });
});
