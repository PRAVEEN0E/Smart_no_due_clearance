const cache = require('../../lib/cache');

describe('Cache Module', () => {
    describe('buildKey', () => {
        it('builds prefixed keys', () => {
            const key = cache.buildKey('college', '123');
            expect(key).toBe('sndc:college:123');
        });

        it('builds nested keys', () => {
            const key = cache.buildKey('college', '123', 'settings');
            expect(key).toBe('sndc:college:123:settings');
        });
    });

    describe('KEYS', () => {
        it('defines college key', () => {
            expect(cache.KEYS.college('abc')).toBe('sndc:college:abc');
        });

        it('defines dashboard key', () => {
            expect(cache.KEYS.dashboard('user1')).toBe('sndc:dashboard:user1');
        });

        it('defines rateLimit key', () => {
            expect(cache.KEYS.rateLimit('ip:1.2.3.4')).toBe('sndc:ratelimit:ip:1.2.3.4');
        });
    });

    describe('get/set/del', () => {
        it('get returns null when Redis unavailable', async () => {
            const val = await cache.get('nonexistent');
            expect(val).toBeNull();
        });

        it('set does not throw when Redis unavailable', async () => {
            await expect(cache.set('test', { a: 1 })).resolves.not.toThrow();
        });

        it('del does not throw when Redis unavailable', async () => {
            await expect(cache.del('test')).resolves.not.toThrow();
        });
    });

    describe('delPattern', () => {
        it('does not throw when Redis unavailable', async () => {
            await expect(cache.delPattern('sndc:*')).resolves.not.toThrow();
        });
    });

    describe('remember', () => {
        it('calls fn when Redis unavailable', async () => {
            const fn = vi.fn().mockResolvedValue('computed');
            const result = await cache.remember('test', 60, fn);
            expect(result).toBe('computed');
            expect(fn).toHaveBeenCalled();
        });
    });

    describe('status', () => {
        it('returns a status object', async () => {
            const s = await cache.status();
            expect(s).toBeDefined();
            expect(typeof s.connected).toBe('boolean');
        });
    });

    describe('getRedis', () => {
        it('returns a redis instance', () => {
            const r = cache.getRedis();
            expect(r).toBeDefined();
            expect(r.status).toBeDefined();
        });
    });

    describe('TTL constants', () => {
        it('has correct TTL values', () => {
            expect(cache.DEFAULT_TTL).toBe(300);
            expect(cache.LONG_TTL).toBe(3600);
            expect(cache.SHORT_TTL).toBe(60);
        });
    });
});
