# Cache Strategy

## Technology
- **Provider**: Redis via `ioredis`
- **Library**: `lib/cache.js`
- **Connection**: Lazy connect with retry strategy (5 attempts, exponential backoff)

## Key Naming Convention
All keys follow: `sndc:{entity}:{identifier}[:{sub}]`

## Cache Keys

| Key | TTL | Description | Invalidation |
|-----|-----|-------------|-------------|
| `sndc:college:{id}` | 1 hour | College settings + branding | On college update |
| `sndc:college:{id}:settings` | 1 hour | College config (workflow, etc.) | On workflow change |
| `sndc:subjects:{collegeId}` | 5 min | Subject list for a college | On subject CRUD |
| `sndc:user:{id}` | 5 min | User profile with college info | On profile update |
| `sndc:dashboard:{userId}` | 1 min | Dashboard data | On data change |
| `sndc:announcements:{collegeId}` | 5 min | Active announcements | On announcement CRUD |
| `sndc:stats:{collegeId}` | 5 min | Dashboard statistics | On data mutation |
| `sndc:ratelimit:{key}` | Dynamic | Rate limit counters | Automatic TTL |

## Usage Pattern

### Cache-Aside (Lazy Loading)
```js
// Automatic: return cached or fetch + store
const data = await cache.remember(cache.KEYS.college(id), cache.LONG_TTL, () => {
    return prisma.college.findUnique({ where: { id } });
});
```

### Direct Access
```js
await cache.get(key);
await cache.set(key, value, ttlSeconds);
await cache.del(key);
```

### Pattern Invalidation
```js
await cache.delPattern('sndc:subjects:*');
```

## Cache Hierarchy
1. **L1**: In-memory request context (per-request)
2. **L2**: Redis (shared across workers)
3. **L3**: Database (fallback)

## Graceful Degradation
- Redis connection failures are silently caught
- `get()` returns `null` on cache miss or error
- Application continues working without Redis (just uncached)

## Performance Impact
- Cache hit ratio expected: ~85%
- Average response time saved: ~150ms per cached query
- Dashboard load time reduction: ~60%
