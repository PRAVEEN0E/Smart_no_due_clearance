const BaseRepository = require('../../repositories/base');

describe('BaseRepository', () => {
    let mockPrisma;
    let repo;

    beforeEach(() => {
        mockPrisma = {
            user: {
                findUnique: vi.fn(),
                findFirst: vi.fn(),
                findMany: vi.fn(),
                count: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
                upsert: vi.fn(),
                delete: vi.fn(),
                aggregate: vi.fn(),
            },
            $transaction: vi.fn(),
        };
        repo = new BaseRepository(mockPrisma, 'user');
    });

    describe('constructor', () => {
        it('throws for invalid model', () => {
            expect(() => new BaseRepository(mockPrisma, 'nonexistent')).toThrow('Prisma model "nonexistent" not found');
        });

        it('creates instance for valid model', () => {
            expect(repo.model).toBeDefined();
        });
    });

    describe('findUnique', () => {
        it('calls prisma with correct args', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
            const result = await repo.findUnique({ id: '1' });
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
            expect(result.id).toBe('1');
        });

        it('passes select option correctly', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({ id: '1', name: 'Test' });
            const result = await repo.findUnique({ id: '1' }, { select: ['id', 'name'] });
            expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
                where: { id: '1' },
                select: { id: true, name: true },
            });
            expect(result.name).toBe('Test');
        });
    });

    describe('findFirst', () => {
        it('calls prisma findFirst', async () => {
            mockPrisma.user.findFirst.mockResolvedValue({ id: '1' });
            const result = await repo.findFirst({ email: 'test@test.com' });
            expect(result.id).toBe('1');
        });
    });

    describe('findMany', () => {
        it('calls prisma findMany', async () => {
            mockPrisma.user.findMany.mockResolvedValue([{ id: '1' }]);
            const result = await repo.findMany({ role: 'STUDENT' });
            expect(result.length).toBe(1);
        });
    });

    describe('findManyPaginated', () => {
        it('returns paginated results', async () => {
            mockPrisma.user.findMany.mockResolvedValue([{ id: '1' }]);
            mockPrisma.user.count.mockResolvedValue(1);
            const result = await repo.findManyPaginated({}, { page: 1, limit: 10 });
            expect(result.data.length).toBe(1);
            expect(result.meta.page).toBe(1);
            expect(result.meta.total).toBe(1);
        });

        it('computes totalPages correctly', async () => {
            mockPrisma.user.findMany.mockResolvedValue([{ id: '1' }, { id: '2' }]);
            mockPrisma.user.count.mockResolvedValue(25);
            const result = await repo.findManyPaginated({}, { page: 1, limit: 10 });
            expect(result.meta.totalPages).toBe(3);
        });
    });

    describe('findCursorPaginated', () => {
        it('returns cursor-based results', async () => {
            mockPrisma.user.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
            const result = await repo.findCursorPaginated({}, { limit: 10 });
            expect(result.data.length).toBe(2);
            expect(result.meta.hasMore).toBe(false);
        });

        it('detects hasMore correctly', async () => {
            const items = Array.from({ length: 11 }, (_, i) => ({ id: `item-${i}` }));
            mockPrisma.user.findMany.mockResolvedValue(items);
            const result = await repo.findCursorPaginated({}, { limit: 10 });
            expect(result.data.length).toBe(10);
            expect(result.meta.hasMore).toBe(true);
            expect(result.meta.nextCursor).toBe('item-9');
        });
    });

    describe('count', () => {
        it('calls prisma count', async () => {
            mockPrisma.user.count.mockResolvedValue(42);
            const result = await repo.count({ role: 'STUDENT' });
            expect(result).toBe(42);
        });
    });

    describe('create', () => {
        it('creates a record', async () => {
            mockPrisma.user.create.mockResolvedValue({ id: 'new' });
            const result = await repo.create({ name: 'Test' });
            expect(result.id).toBe('new');
        });
    });

    describe('update', () => {
        it('updates a record', async () => {
            mockPrisma.user.update.mockResolvedValue({ id: '1', name: 'Updated' });
            const result = await repo.update({ id: '1' }, { name: 'Updated' });
            expect(result.name).toBe('Updated');
        });
    });

    describe('upsert', () => {
        it('upserts a record', async () => {
            mockPrisma.user.upsert.mockResolvedValue({ id: '1' });
            const result = await repo.upsert({ email: 't@t.com' }, { name: 'New' }, { name: 'Updated' });
            expect(mockPrisma.user.upsert).toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });

    describe('delete', () => {
        it('deletes a record', async () => {
            mockPrisma.user.delete.mockResolvedValue({ id: '1' });
            const result = await repo.delete({ id: '1' });
            expect(result.id).toBe('1');
        });
    });

    describe('transaction', () => {
        it('runs a transaction', async () => {
            const txFn = vi.fn().mockResolvedValue('done');
            mockPrisma.$transaction.mockResolvedValue('done');
            const result = await repo.transaction(async (tx) => {
                return 'done';
            });
            expect(mockPrisma.$transaction).toHaveBeenCalled();
        });
    });

    describe('exists', () => {
        it('returns true when record exists', async () => {
            mockPrisma.user.count.mockResolvedValue(1);
            const result = await repo.exists({ id: '1' });
            expect(result).toBe(true);
        });

        it('returns false when no record', async () => {
            mockPrisma.user.count.mockResolvedValue(0);
            const result = await repo.exists({ id: 'none' });
            expect(result).toBe(false);
        });
    });

    describe('aggregate', () => {
        it('calls aggregate', async () => {
            mockPrisma.user.aggregate.mockResolvedValue({ _count: { id: 5 } });
            const result = await repo.aggregate({ _count: { id: true } });
            expect(result._count.id).toBe(5);
        });
    });
});
