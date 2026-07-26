const constants = require('../../constants');

describe('Constants', () => {
    describe('ROLES', () => {
        it('defines all roles', () => {
            expect(constants.ROLES).toBeDefined();
            expect(constants.ROLES.SUPERADMIN).toBe('SUPERADMIN');
            expect(constants.ROLES.MENTOR).toBe('MENTOR');
            expect(constants.ROLES.STAFF).toBe('STAFF');
            expect(constants.ROLES.STUDENT).toBe('STUDENT');
        });

        it('contains exactly 4 roles', () => {
            expect(Object.keys(constants.ROLES).length).toBe(4);
        });
    });

    describe('SUBJECT_TYPES', () => {
        it('defines all subject types', () => {
            expect(constants.SUBJECT_TYPES.FULL_THEORY).toBe('FULL_THEORY');
            expect(constants.SUBJECT_TYPES.FULL_LAB).toBe('FULL_LAB');
            expect(constants.SUBJECT_TYPES.THEORY_WITH_LAB).toBe('THEORY_WITH_LAB');
        });
    });

    describe('HTTP_STATUS', () => {
        it('defines common status codes', () => {
            expect(constants.HTTP_STATUS.OK).toBe(200);
            expect(constants.HTTP_STATUS.CREATED).toBe(201);
            expect(constants.HTTP_STATUS.BAD_REQUEST).toBe(400);
            expect(constants.HTTP_STATUS.UNAUTHORIZED).toBe(401);
            expect(constants.HTTP_STATUS.FORBIDDEN).toBe(403);
            expect(constants.HTTP_STATUS.NOT_FOUND).toBe(404);
            expect(constants.HTTP_STATUS.CONFLICT).toBe(409);
            expect(constants.HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
            expect(constants.HTTP_STATUS.SERVER_ERROR || constants.HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
        });
    });

    describe('ERROR_CODES', () => {
        it('defines error codes', () => {
            expect(constants.ERROR_CODES).toBeDefined();
            expect(constants.ERROR_CODES.AUTH_INVALID_CREDENTIALS).toBe('AUTH_INVALID_CREDENTIALS');
            expect(constants.ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
        });
    });

    describe('PAGINATION', () => {
        it('defines pagination defaults', () => {
            expect(constants.PAGINATION.DEFAULT_PAGE).toBe(1);
            expect(constants.PAGINATION.DEFAULT_LIMIT).toBe(50);
            expect(constants.PAGINATION.MAX_LIMIT).toBe(100);
        });
    });
});
