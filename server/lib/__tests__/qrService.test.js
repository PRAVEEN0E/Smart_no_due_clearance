const qrcodeModule = require('qrcode');
const { generateVerificationQR } = require('../../services/qrService');

describe('generateVerificationQR', () => {
    let toDataURLSpy;

    beforeEach(() => {
        toDataURLSpy = vi.spyOn(qrcodeModule, 'toDataURL').mockResolvedValue('data:image/png;base64,abc123');
    });

    afterEach(() => {
        toDataURLSpy.mockRestore();
    });

    it('returns a data URL on success', async () => {
        toDataURLSpy.mockResolvedValueOnce('data:image/png;base64,custom');
        const result = await generateVerificationQR('S123', 'test@example.com');
        expect(result).toBe('data:image/png;base64,custom');
    });

    it('generates URL with student ID', async () => {
        await generateVerificationQR('S456', 'test@example.com');
        const urlArg = toDataURLSpy.mock.calls[0][0];
        expect(urlArg).toContain('/verify/hallticket/S456');
    });

    it('uses FRONTEND_URL from env', async () => {
        const originalUrl = process.env.FRONTEND_URL;
        process.env.FRONTEND_URL = 'https://app.example.com';
        await generateVerificationQR('S123', 'test@example.com');
        const urlArg = toDataURLSpy.mock.calls[0][0];
        expect(urlArg).toMatch(/^https:\/\/app\.example\.com/);
        process.env.FRONTEND_URL = originalUrl;
    });

    it('falls back to localhost when FRONTEND_URL is not set', async () => {
        const originalUrl = process.env.FRONTEND_URL;
        delete process.env.FRONTEND_URL;
        await generateVerificationQR('S123', 'test@example.com');
        const urlArg = toDataURLSpy.mock.calls[0][0];
        expect(urlArg).toMatch(/^http:\/\/localhost:5173/);
        process.env.FRONTEND_URL = originalUrl;
    });

    it('returns null on error', async () => {
        toDataURLSpy.mockRejectedValueOnce(new Error('QR generation failed'));
        const result = await generateVerificationQR('S123', 'test@example.com');
        expect(result).toBeNull();
    });
});
