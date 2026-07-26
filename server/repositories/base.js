class BaseRepository {
    constructor(prisma, modelName) {
        this.prisma = prisma;
        this.model = prisma[modelName];
        if (!this.model) {
            throw new Error(`Prisma model "${modelName}" not found. Available: ${Object.keys(prisma).join(', ')}`);
        }
    }

    _select(fields) {
        if (!fields) return undefined;
        const sel = {};
        for (const f of (Array.isArray(fields) ? fields : [fields])) {
            sel[f] = true;
        }
        return sel;
    }

    async findUnique(where, options = {}) {
        const { select, ...rest } = options;
        return this.model.findUnique({
            where,
            select: select ? this._select(select) : undefined,
            ...rest,
        });
    }

    async findFirst(where, options = {}) {
        const { select, ...rest } = options;
        return this.model.findFirst({
            where,
            select: select ? this._select(select) : undefined,
            ...rest,
        });
    }

    async findMany(where = {}, options = {}) {
        const { select, ...rest } = options;
        return this.model.findMany({
            where,
            select: select ? this._select(select) : undefined,
            ...rest,
        });
    }

    async findManyPaginated(where = {}, options = {}) {
        const { page = 1, limit = 20, orderBy = { createdAt: 'desc' }, select, ...rest } = options;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                select: select ? this._select(select) : undefined,
                ...rest,
            }),
            this.model.count({ where }),
        ]);
        return {
            data,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    async findCursorPaginated(where = {}, options = {}) {
        const { limit = 20, cursor, orderBy = { createdAt: 'desc' }, select, ...rest } = options;
        const data = await this.model.findMany({
            where,
            take: limit + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            orderBy,
            select: select ? this._select(select) : undefined,
            ...rest,
        });
        const hasMore = data.length > limit;
        if (hasMore) data.pop();
        return {
            data,
            meta: {
                hasMore,
                nextCursor: hasMore ? data[data.length - 1].id : null,
                limit,
            },
        };
    }

    async count(where = {}) {
        return this.model.count({ where });
    }

    async create(data) {
        return this.model.create({ data });
    }

    async update(where, data) {
        return this.model.update({ where, data });
    }

    async upsert(where, create, update) {
        return this.model.upsert({ where, create, update });
    }

    async delete(where) {
        return this.model.delete({ where });
    }

    async transaction(callback, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                return await this.prisma.$transaction(callback, {
                    maxWait: 5000,
                    timeout: 10000,
                    isolationLevel: 'ReadCommitted',
                });
            } catch (err) {
                if (i === retries - 1 || !err.message?.includes('deadlock')) throw err;
            }
        }
    }

    async exists(where) {
        const count = await this.model.count({ where });
        return count > 0;
    }

    async aggregate(aggregate) {
        return this.model.aggregate(aggregate);
    }
}

module.exports = BaseRepository;
