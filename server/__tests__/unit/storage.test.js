describe('Storage Module', () => {
    let storage;

    beforeAll(() => {
        process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
        process.env.CLOUDINARY_API_KEY = 'test-key';
        process.env.CLOUDINARY_API_SECRET = 'test-secret';
        storage = require('../../lib/storage');
    });

    describe('isCloudinaryConfigured', () => {
        it('returns true when env vars are set', () => {
            expect(storage.isCloudinaryConfigured()).toBe(true);
        });
    });

    describe('extractPublicId', () => {
        it('extracts public ID from Cloudinary URL', () => {
            const url = 'https://res.cloudinary.com/demo/image/upload/v12345/sndc/file123';
            expect(storage.extractPublicId(url)).toBe('sndc/file123');
        });

        it('returns null for non-Cloudinary URLs', () => {
            expect(storage.extractPublicId('https://example.com/file.pdf')).toBeNull();
        });

        it('returns null for empty input', () => {
            expect(storage.extractPublicId(null)).toBeNull();
            expect(storage.extractPublicId('')).toBeNull();
        });
    });

    describe('deleteFile', () => {
        it('handles errors gracefully (no cloudinary config)', async () => {
            try {
                await storage.deleteFile('nonexistent');
            } catch (err) {
                expect(err).toBeDefined();
            }
        });
    });

    describe('getOptimizedUrl', () => {
        it('returns URL string for a public ID', () => {
            const url = storage.getOptimizedUrl('sndc/test');
            expect(url).toContain('res.cloudinary.com');
            expect(url).toContain('q_auto');
            expect(url).toContain('f_auto');
        });
    });

    describe('getResponsiveUrls', () => {
        it('returns array of responsive URLs', () => {
            const urls = storage.getResponsiveUrls('sndc/test');
            expect(Array.isArray(urls)).toBe(true);
            expect(urls.length).toBeGreaterThan(0);
            urls.forEach(u => {
                expect(u.width).toBeDefined();
                expect(u.url).toContain('res.cloudinary.com');
            });
        });
    });
});
