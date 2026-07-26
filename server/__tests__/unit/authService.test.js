describe('AuthService', () => {
    let mockRepos;
    let AuthService;
    let mockFastify;

    beforeEach(() => {
        vi.resetModules();
        mockFastify = {
            jwt: { sign: vi.fn().mockReturnValue('test-token') },
        };
        mockRepos = {
            user: {
                findByEmail: vi.fn(),
                findByEmailOrRegisterNumber: vi.fn(),
                findByIdWithDetails: vi.fn(),
                updatePassword: vi.fn(),
                count: vi.fn(),
                create: vi.fn(),
                findUnique: vi.fn(),
                update: vi.fn(),
                transaction: vi.fn(),
            },
            college: {
                findUnique: vi.fn(),
                create: vi.fn(),
            },
            subject: {
                findByCollegeId: vi.fn(),
            },
            announcement: {
                findMany: vi.fn(),
            },
            auditLog: {
                findMany: vi.fn(),
                count: vi.fn(),
            },
        };
        AuthService = require('../../services/authService');
    });

    describe('authenticate', () => {
        it('returns user for valid email/password', async () => {
            const bcrypt = require('bcrypt');
            const hash = bcrypt.hashSync('password123', 10);
            mockRepos.user.findByEmailOrRegisterNumber.mockResolvedValue({
                id: '1', email: 'test@test.com', passwordHash: hash, role: 'STUDENT',
                collegeId: 'c1', passwordChangedAt: new Date(),
            });
            const svc = new AuthService(mockRepos);
            const result = await svc.authenticate('test@test.com', 'password123', mockFastify);
            expect(result.user).toBeDefined();
            expect(result.user.email).toBe('test@test.com');
        });

        it('returns error for invalid password', async () => {
            const bcrypt = require('bcrypt');
            const hash = bcrypt.hashSync('realpass', 10);
            mockRepos.user.findByEmailOrRegisterNumber.mockResolvedValue({
                id: '1', email: 'test@test.com', passwordHash: hash, role: 'STUDENT',
            });
            const svc = new AuthService(mockRepos);
            const result = await svc.authenticate('test@test.com', 'wrongpass', mockFastify);
            expect(result.error).toBe(true);
        });

        it('returns error for non-existent user', async () => {
            mockRepos.user.findByEmailOrRegisterNumber.mockResolvedValue(null);
            const svc = new AuthService(mockRepos);
            const result = await svc.authenticate('noone@test.com', 'pass', mockFastify);
            expect(result.error).toBe(true);
        });
    });

    describe('getProfile', () => {
        it('returns user profile with college info', async () => {
            mockRepos.user.findByIdWithDetails.mockResolvedValue({
                id: '1', name: 'Test', email: 'test@test.com', role: 'STUDENT',
                college: { name: 'Test College' },
            });
            const svc = new AuthService(mockRepos);
            const result = await svc.getProfile('1');
            expect(result.name).toBe('Test');
            expect(result.college).toBeDefined();
        });

        it('returns null for non-existent user', async () => {
            mockRepos.user.findByIdWithDetails.mockResolvedValue(null);
            const svc = new AuthService(mockRepos);
            const result = await svc.getProfile('nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('changePassword', () => {
        it('changes password successfully', async () => {
            const bcrypt = require('bcrypt');
            const hash = bcrypt.hashSync('oldpass', 10);
            mockRepos.user.findUnique.mockResolvedValue({
                id: '1', passwordHash: hash,
            });
            mockRepos.user.updatePassword.mockResolvedValue();
            const svc = new AuthService(mockRepos);
            const result = await svc.changePassword('1', 'oldpass', 'newpass');
            expect(result.message).toBe('Password updated successfully.');
        });

        it('returns error for wrong old password', async () => {
            const bcrypt = require('bcrypt');
            const hash = bcrypt.hashSync('realold', 10);
            mockRepos.user.findUnique.mockResolvedValue({
                id: '1', passwordHash: hash,
            });
            const svc = new AuthService(mockRepos);
            const result = await svc.changePassword('1', 'wrongold', 'newpass');
            expect(result.error).toBe(true);
            expect(result.code).toBe('AUTH_INVALID_PASSWORD');
        });
    });

    describe('bootstrap', () => {
        it('creates superadmin with valid secret', async () => {
            process.env.BOOTSTRAP_SECRET = 'test-secret';
            mockRepos.user.findByEmail.mockResolvedValue(null);
            mockRepos.user.transaction.mockImplementation(async (fn) => {
                const tx = {
                    user: { create: vi.fn().mockResolvedValue({ id: 'admin1', email: 'admin@college.edu', role: 'SUPERADMIN' }) },
                    college: { create: vi.fn().mockResolvedValue({ id: 'c1', name: 'System Default Department' }) },
                };
                return fn(tx);
            });
            const svc = new AuthService(mockRepos);
            const result = await svc.bootstrap('test-secret', mockFastify);
            expect(result.message).toContain('SuperAdmin created');
            delete process.env.BOOTSTRAP_SECRET;
        });

        it('returns error for invalid secret', async () => {
            process.env.BOOTSTRAP_SECRET = 'real-secret';
            const svc = new AuthService(mockRepos);
            const result = await svc.bootstrap('wrong-secret', mockFastify);
            expect(result.error).toBe(true);
            expect(result.code).toBe('BOOTSTRAP_SECRET_INVALID');
            delete process.env.BOOTSTRAP_SECRET;
        });
    });

    describe('getAnnouncements', () => {
        it('returns announcements for a college', async () => {
            mockRepos.announcement.findMany.mockResolvedValue([{ id: 'a1' }]);
            const svc = new AuthService(mockRepos);
            const result = await svc.getAnnouncements('c1');
            expect(result).toBeDefined();
            expect(result.length).toBe(1);
        });

        it('returns empty array when no announcements', async () => {
            mockRepos.announcement.findMany.mockResolvedValue([]);
            const svc = new AuthService(mockRepos);
            const result = await svc.getAnnouncements('c1');
            expect(result).toEqual([]);
        });
    });
});
