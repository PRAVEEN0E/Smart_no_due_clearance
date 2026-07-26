describe('UserService', () => {
    let mockRepos;
    let UserService;

    beforeEach(() => {
        vi.resetModules();
        mockRepos = {
            user: {
                findUnique: vi.fn(),
                findMany: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                delete: vi.fn(),
                count: vi.fn(),
                findByEmail: vi.fn(),
                findStudentsByCollege: vi.fn(),
                findStaffByCollege: vi.fn(),
                searchUsers: vi.fn(),
                prisma: {},
            },
            college: {
                findUnique: vi.fn(),
            },
        };
        UserService = require('../../services/userService');
    });

    describe('createStudent', () => {
        it('creates a student', async () => {
            mockRepos.user.create.mockResolvedValue({ id: 's1', role: 'STUDENT' });
            const svc = new UserService(mockRepos);
            const result = await svc.createStudent({ name: 'Test', email: 't@t.com', password: 'pass123' }, 'c1');
            expect(result.role).toBe('STUDENT');
        });
    });

    describe('createStaff', () => {
        it('creates a staff member', async () => {
            mockRepos.user.create.mockResolvedValue({ id: 'st1', role: 'STAFF' });
            const svc = new UserService(mockRepos);
            const result = await svc.createStaff({ name: 'Staff', email: 's@t.com', password: 'pass123' }, 'c1');
            expect(result.role).toBe('STAFF');
        });
    });

    describe('getStudents', () => {
        it('returns students list', async () => {
            mockRepos.user.findStudentsByCollege.mockResolvedValue([{ id: 's1', role: 'STUDENT' }]);
            const svc = new UserService(mockRepos);
            const result = await svc.getStudents('c1', 1, 10);
            expect(result).toBeDefined();
            expect(result.length).toBe(1);
        });
    });

    describe('getStaff', () => {
        it('returns staff list', async () => {
            mockRepos.user.findStaffByCollege.mockResolvedValue([{ id: 'st1', role: 'STAFF' }]);
            const svc = new UserService(mockRepos);
            const result = await svc.getStaff('c1');
            expect(result).toBeDefined();
            expect(result.length).toBe(1);
        });
    });

    describe('updateUser', () => {
        it('updates a user', async () => {
            mockRepos.user.update.mockResolvedValue({ id: '1', name: 'Updated' });
            const svc = new UserService(mockRepos);
            const result = await svc.updateUser('1', { name: 'Updated' });
            expect(result.name).toBe('Updated');
        });
    });

    describe('deleteUser', () => {
        it('deletes a user', async () => {
            mockRepos.user.delete.mockResolvedValue({ id: '1' });
            const svc = new UserService(mockRepos);
            const result = await svc.deleteUser('1');
            expect(result.id).toBe('1');
        });
    });

    describe('search', () => {
        it('searches users', async () => {
            mockRepos.user.searchUsers.mockResolvedValue([{ id: '1', name: 'Test' }]);
            const svc = new UserService(mockRepos);
            const result = await svc.search('test');
            expect(result).toBeDefined();
            expect(result.length).toBe(1);
        });

        it('returns empty array for short queries', async () => {
            const svc = new UserService(mockRepos);
            const result = await svc.search('a');
            expect(result).toEqual([]);
        });
    });

    describe('bulkCreateStudents', () => {
        it('returns results array', async () => {
            mockRepos.user.findByEmail.mockResolvedValue(null);
            mockRepos.user.create.mockResolvedValue({ id: 's1' });
            const svc = new UserService(mockRepos);
            const result = await svc.bulkCreateStudents([{ name: 'A', email: 'a@t.com', password: 'pass' }], 'c1');
            expect(Array.isArray(result)).toBe(true);
        });
    });
});
