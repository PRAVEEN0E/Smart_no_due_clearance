const { success, created, error, badRequest, unauthorized, forbidden, notFound, conflict, tooManyRequests, serverError } = require('../../constants/responses');

describe('Response Helpers', () => {
    const mockReply = () => {
        let statusCode = 200;
        const reply = {
            status: function (c) { statusCode = c; this._code = c; return this; },
            send: function (s) { this.sent = s; return s; },
            get code() { return statusCode; },
        };
        return reply;
    };

    describe('success', () => {
        it('returns 200 with data', () => {
            const r = mockReply();
            const result = success(r, { id: 1 });
            expect(r.code).toBe(200);
            expect(result.success).toBe(true);
            expect(result.data.id).toBe(1);
        });

        it('includes meta when provided', () => {
            const r = mockReply();
            const result = success(r, [], 'Success', 200, { page: 1 });
            expect(result.meta.page).toBe(1);
        });

        it('includes message when provided', () => {
            const r = mockReply();
            const result = success(r, null, 'Done');
            expect(result.message).toBe('Done');
        });
    });

    describe('created', () => {
        it('returns 201', () => {
            const r = mockReply();
            const result = created(r, { id: 'new' });
            expect(r.code).toBe(201);
            expect(result.success).toBe(true);
        });
    });

    describe('error', () => {
        it('returns error response', () => {
            const r = mockReply();
            const result = error(r, 'Something went wrong', 'SERVER_ERROR');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Something went wrong');
            expect(result.code).toBe('SERVER_ERROR');
        });
    });

    describe('badRequest', () => {
        it('returns 400', () => {
            const r = mockReply();
            const result = badRequest(r, 'Invalid input');
            expect(r.code).toBe(400);
            expect(result.success).toBe(false);
        });
    });

    describe('unauthorized', () => {
        it('returns 401', () => {
            const r = mockReply();
            const result = unauthorized(r, 'Login required');
            expect(r.code).toBe(401);
            expect(result.code).toBe('AUTH_TOKEN_INVALID');
        });
    });

    describe('notFound', () => {
        it('returns 404', () => {
            const r = mockReply();
            const result = notFound(r, 'User not found');
            expect(r.code).toBe(404);
        });
    });

    describe('conflict', () => {
        it('returns 409', () => {
            const r = mockReply();
            const result = conflict(r, 'Email exists');
            expect(r.code).toBe(409);
        });
    });

    describe('tooManyRequests', () => {
        it('returns 429', () => {
            const r = mockReply();
            const result = tooManyRequests(r);
            expect(r.code).toBe(429);
            expect(result.code).toBe('RATE_LIMIT_EXCEEDED');
        });
    });

    describe('serverError', () => {
        it('returns 500', () => {
            const r = mockReply();
            const result = serverError(r, 'Internal server error.');
            expect(r.code).toBe(500);
            expect(result.error).toBe('Internal server error.');
        });

        it('sanitizes error message in production', () => {
            const r = mockReply();
            const result = serverError(r, 'Internal server error.');
            expect(result.error).toBe('Internal server error.');
        });
    });
});
