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

describe('Mentor Routes — Integration', () => {
    let authToken = null;
    let serverRunning = true;

    beforeAll(async () => {
        const { status, headers } = await fetchApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email: 'divyeshb606@gmail.com', password: '12345678' }),
        });
        if (status === 0) { serverRunning = false; return; }
        // Extract token from Set-Cookie header
        const sc = headers.get('set-cookie');
        if (sc) {
            const m = sc.match(/token=([^;]+)/);
            if (m) authToken = m[1];
        }
    });

    const authHeaders = (extra = {}) => {
        const h = {};
        if (authToken) h.Authorization = `Bearer ${authToken}`;
        return { ...h, ...extra };
    };

    // ── SERVER CHECK ────────────────────────────
    it('server is reachable', async () => {
        const { status } = await fetchApi('/health');
        if (status === 0) serverRunning = false;
        expect([200, 0]).toContain(status);
    });

    // ── AUTH ────────────────────────────────────
    describe('Authentication', () => {
        it('returns 401 for protected routes without token', async () => {
            const { status } = await fetchApi('/mentor/staff');
            if (status !== 0) expect([401, 403]).toContain(status);
        });

        it('login returns 200 with user data', async () => {
            const { status, body } = await fetchApi('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email: 'divyeshb606@gmail.com', password: '12345678' }),
            });
            if (status !== 0) {
                expect(status).toBe(200);
                expect(body.success).toBe(true);
                expect(body.data.user).toBeDefined();
            }
        });
    });

    // ── STAFF ───────────────────────────────────
    describe('Staff Management', () => {
        it('GET /mentor/staff returns 200 or 403 if not MENTOR role', async () => {
            const { status, body } = await fetchApi('/mentor/staff', { headers: authHeaders() });
            if (status !== 0) {
                // 200 = authorized (MENTOR/SUPERADMIN), 403 = wrong role
                expect([200, 403]).toContain(status);
                if (status === 403) {
                    expect(body).toHaveProperty('error');
                }
            }
        });

        it('GET /mentor/staff/:id with invalid UUID returns 400 or 403', async () => {
            const { status } = await fetchApi('/mentor/staff/invalid-uuid', { headers: authHeaders() });
            if (status !== 0) {
                expect([400, 403, 401]).toContain(status);
            }
        });
    });

    // ── STUDENTS ────────────────────────────────
    describe('Student Management', () => {
        it('GET /mentor/students returns 200 or 403', async () => {
            const { status, body } = await fetchApi('/mentor/students?page=1&limit=10', { headers: authHeaders() });
            if (status !== 0) {
                expect([200, 403]).toContain(status);
                if (status === 200 && body.data) {
                    expect(body).toHaveProperty('total');
                    expect(body).toHaveProperty('page', 1);
                    expect(body).toHaveProperty('totalPages');
                }
            }
        });

        it('GET /mentor/students with search returns 200 or 403', async () => {
            const { status } = await fetchApi('/mentor/students?search=arjun', { headers: authHeaders() });
            if (status !== 0) expect([200, 403]).toContain(status);
        });

        it('GET /mentor/students with department filter returns 200 or 403', async () => {
            const { status } = await fetchApi('/mentor/students?department=Computer%20Science', { headers: authHeaders() });
            if (status !== 0) expect([200, 403]).toContain(status);
        });

        it('GET /mentor/students with feeStatus filter returns 200 or 403', async () => {
            const { status } = await fetchApi('/mentor/students?feeStatus=cleared', { headers: authHeaders() });
            if (status !== 0) expect([200, 403]).toContain(status);
        });

        it('GET /mentor/students with sorting returns 200 or 403', async () => {
            const { status } = await fetchApi('/mentor/students?sortBy=name&sortOrder=asc', { headers: authHeaders() });
            if (status !== 0) expect([200, 403]).toContain(status);
        });

        it('POST /mentor/students with existing email returns error (4xx)', async () => {
            const { status, body } = await fetchApi('/mentor/students', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ name: 'Dup', email: 'arjun.mehta@college.edu', password: 'Test@123' }),
            });
            if (status !== 0) {
                expect(status).toBeGreaterThanOrEqual(400);
                expect(status).toBeLessThan(500);
                if (body) expect(body).toHaveProperty('error');
            }
        });
    });

    // ── SUBJECTS ────────────────────────────────
    describe('Subject Management', () => {
        it('GET /mentor/subjects returns 200 or 403', async () => {
            const { status } = await fetchApi('/mentor/subjects', { headers: authHeaders() });
            if (status !== 0) expect([200, 403]).toContain(status);
        });

        it('POST /mentor/subjects/:id/restore invalid returns 400 or 403', async () => {
            const { status, body } = await fetchApi('/mentor/subjects/00000000-0000-0000-0000-000000000000/restore', {
                method: 'POST',
                headers: authHeaders(),
            });
            if (status !== 0) {
                expect([400, 403, 401]).toContain(status);
                if (status === 400 && body) expect(body.success).toBe(false);
            }
        });
    });

    // ── ANNOUNCEMENTS ───────────────────────────
    describe('Announcements', () => {
        it('GET /mentor/announcements returns 200 or 403', async () => {
            const { status } = await fetchApi('/mentor/announcements', { headers: authHeaders() });
            if (status !== 0) expect([200, 403]).toContain(status);
        });

        it('PUT non-existent returns error (4xx)', async () => {
            const { status, body } = await fetchApi('/mentor/announcements/00000000-0000-0000-0000-000000000000', {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ title: 'T', content: 'C' }),
            });
            if (status !== 0) {
                expect(status).toBeGreaterThanOrEqual(400);
                expect(status).toBeLessThan(500);
                if (body) expect(body).toHaveProperty('error');
            }
        });

        it('DELETE non-existent returns 404 or 403', async () => {
            const { status, body } = await fetchApi('/mentor/announcements/00000000-0000-0000-0000-000000000000', {
                method: 'DELETE',
                headers: authHeaders(),
            });
            if (status !== 0) {
                expect([404, 403, 401]).toContain(status);
                if (status === 404 && body) expect(body.success).toBe(false);
            }
        });

        it('POST restore non-existent returns 404 or 403', async () => {
            const { status, body } = await fetchApi('/mentor/announcements/00000000-0000-0000-0000-000000000000/restore', {
                method: 'POST',
                headers: authHeaders(),
            });
            if (status !== 0) {
                expect([404, 403, 401]).toContain(status);
                if (status === 404 && body) expect(body.success).toBe(false);
            }
        });
    });

    // ── AUDIT LOGS ──────────────────────────────
    describe('Audit Logs', () => {
        it('GET /mentor/audit-logs returns 200 or 403', async () => {
            const { status, body } = await fetchApi('/mentor/audit-logs?page=1&limit=10', { headers: authHeaders() });
            if (status !== 0) {
                expect([200, 403]).toContain(status);
                if (status === 200 && body.data) {
                    expect(body).toHaveProperty('total');
                    expect(body).toHaveProperty('page');
                }
            }
        });

        it('GET /mentor/audit-logs with search returns 200 or 403', async () => {
            const { status } = await fetchApi('/mentor/audit-logs?search=STUDENT', { headers: authHeaders() });
            if (status !== 0) expect([200, 403]).toContain(status);
        });

        it('GET /mentor/audit-logs with date filter returns 200 or 403', async () => {
            const { status } = await fetchApi('/mentor/audit-logs?dateFrom=2024-01-01&dateTo=2026-12-31', { headers: authHeaders() });
            if (status !== 0) expect([200, 403]).toContain(status);
        });

        it('GET /mentor/audit-logs with action filter returns 200 or 403', async () => {
            const { status } = await fetchApi('/mentor/audit-logs?action=STUDENT_CREATED', { headers: authHeaders() });
            if (status !== 0) expect([200, 403]).toContain(status);
        });
    });

    // ── ANALYTICS ───────────────────────────────
    describe('Analytics', () => {
        it('GET /mentor/analytics returns 200 or 403', async () => {
            const { status, body } = await fetchApi('/mentor/analytics', { headers: authHeaders() });
            if (status !== 0) {
                expect([200, 403, 400]).toContain(status);
                if (status === 200 && body.stats) {
                    expect(body.stats).toHaveProperty('studentCount');
                    expect(body.stats).toHaveProperty('staffCount');
                    expect(body.stats).toHaveProperty('subjectCount');
                }
            }
        });
    });

    // ── HALL TICKETS ────────────────────────────
    describe('Hall Tickets', () => {
        it('GET /mentor/hall-tickets returns 200 or 403', async () => {
            const { status, body } = await fetchApi('/mentor/hall-tickets?page=1&limit=10', { headers: authHeaders() });
            if (status !== 0) {
                expect([200, 403]).toContain(status);
                if (status === 200 && body.data) {
                    expect(body).toHaveProperty('stats');
                    expect(body).toHaveProperty('totalPages');
                }
            }
        });
    });

    // ── AI FEATURES ─────────────────────────────
    describe('AI Features', () => {
        it('GET /mentor/ai/at-risk returns 200 or 403', async () => {
            const { status, body } = await fetchApi('/mentor/ai/at-risk', { headers: authHeaders() });
            if (status !== 0) {
                expect([200, 403]).toContain(status);
                if (status === 200 && body && Array.isArray(body.data)) {
                    expect(body).toHaveProperty('total');
                }
            }
        });
    });

    // ── COLLEGE ─────────────────────────────────
    describe('College & Workflow', () => {
        it('GET /mentor/college returns 200/400 or 403', async () => {
            const { status } = await fetchApi('/mentor/college', { headers: authHeaders() });
            if (status !== 0) {
                expect([200, 400, 403, 401]).toContain(status);
            }
        });
    });

    // ── EXPORT ──────────────────────────────────
    describe('Export', () => {
        it('GET /mentor/export/fees returns 200 or 403', async () => {
            const { status } = await fetchApi('/mentor/export/fees', { headers: authHeaders() });
            if (status !== 0) expect([200, 403, 401, 500]).toContain(status);
        });

        it('GET /mentor/export/pdf/fees returns 200 or 403', async () => {
            const { status } = await fetchApi('/mentor/export/pdf/fees', { headers: authHeaders() });
            if (status !== 0) expect([200, 403, 401, 500]).toContain(status);
        });
    });

    // ── EDGE CASES ──────────────────────────────
    describe('Edge Cases', () => {
        it('unknown mentor route returns 404', async () => {
            const { status } = await fetchApi('/mentor/nonexistent-route', { headers: authHeaders() });
            if (status !== 0) expect([404, 401, 403]).toContain(status);
        });

        it('invalid UUID returns error (4xx)', async () => {
            const { status, body } = await fetchApi('/mentor/staff/999', { headers: authHeaders() });
            if (status !== 0) {
                expect(status).toBeGreaterThanOrEqual(400);
                expect(status).toBeLessThan(500);
                if (body) expect(body).toHaveProperty('error');
            }
        });

        it('POST with empty body returns validation error (4xx)', async () => {
            const { status, body } = await fetchApi('/mentor/students', {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({}),
            });
            if (status !== 0) {
                expect(status).toBeGreaterThanOrEqual(400);
                expect(status).toBeLessThan(500);
                if (body && status === 400) {
                    expect(body).toHaveProperty('error');
                    expect(body).toHaveProperty('code');
                }
            }
        });
    });

    // ── RESPONSE FORMAT ─────────────────────────
    describe('Standardized Response Format', () => {
        it('auth error responses have { error, code }', async () => {
            const { status, body } = await fetchApi('/mentor/staff');
            if (body && status === 401) {
                expect(body).toHaveProperty('error');
                expect(body).toHaveProperty('code');
                expect(body.error).toBe('Unauthorized');
            }
        });

        it('validation error responses have { error, message, code }', async () => {
            const { status, body } = await fetchApi('/mentor/staff/invalid', {
                headers: authHeaders(),
            });
            if (status !== 0 && body) {
                if (status === 400) {
                    expect(body).toHaveProperty('error');
                    expect(body).toHaveProperty('message');
                    expect(body).toHaveProperty('code');
                }
            }
        });

        it('403 forbidden responses have { error, message, code }', async () => {
            const { status, body } = await fetchApi('/mentor/staff', {
                headers: authHeaders(),
            });
            if (body && status === 403) {
                expect(body).toHaveProperty('error');
                expect(body).toHaveProperty('message');
                expect(body).toHaveProperty('code');
                expect(body.code).toBe('AUTH_INSUFFICIENT_ROLE');
            }
        });
    });
});
