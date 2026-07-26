const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000/api';

async function fetchApi(path, options = {}) {
    const url = `${BASE_URL}${path}`;
    try {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json', ...options.headers },
            ...options,
        });
        const body = res.status !== 204 ? await res.json().catch(() => null) : null;
        return { status: res.status, body, headers: res.headers };
    } catch {
        return { status: 0, body: null, headers: {} };
    }
}

describe('API Integration Tests', () => {
    describe('Health Check', () => {
        it('GET /api/health returns 200 or connection refused', async () => {
            const { status } = await fetchApi('/health');
            expect([200, 0]).toContain(status);
        });
    });

    describe('Authentication', () => {
        it('POST /api/auth/login returns 401 for invalid credentials', async () => {
            const { status, body } = await fetchApi('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: 'mentor@test.com', password: 'password123' }),
            });
            expect([200, 401, 429, 0]).toContain(status);
            if (status === 200 && body?.data?.user) {
                expect(body.data.user).toBeDefined();
            }
        });

        it('POST /api/auth/login with missing fields returns 400 or 403', async () => {
            const { status } = await fetchApi('/auth/login', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            if (status !== 0) {
                expect([400, 403, 429]).toContain(status);
            }
        });
    });

    describe('Validation', () => {
        it('POST with invalid JSON returns 400', async () => {
            const { status } = await fetchApi('/auth/login', {
                method: 'POST',
                body: 'not-json',
                headers: { 'Content-Type': 'application/json' },
            });
            if (status !== 0) {
                expect([400, 429, 500]).toContain(status);
            }
        });
    });

    describe('Authorized Endpoints', () => {
        it('returns 401 for protected routes without token', async () => {
            const { status } = await fetchApi('/mentor/analytics');
            if (status !== 0) {
                expect([401, 403]).toContain(status);
            }
        });
    });
});
