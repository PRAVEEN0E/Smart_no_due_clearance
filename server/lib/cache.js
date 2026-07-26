const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis = null;
let isConnected = false;

function getRedis() {
    if (!redis) {
        redis = new Redis(REDIS_URL, {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            retryStrategy(times) {
                if (times > 5) return null;
                return Math.min(times * 200, 2000);
            },
            lazyConnect: true,
        });

        redis.on('connect', () => { isConnected = true; });
        redis.on('close', () => { isConnected = false; });
        redis.on('error', () => {});
    }
    return redis;
}

const DEFAULT_TTL = 300; // 5 minutes
const LONG_TTL = 3600;   // 1 hour
const SHORT_TTL = 60;    // 1 minute

let cacheHitsTotal = null;
let cacheMissesTotal = null;

function setMetrics(metrics) {
    cacheHitsTotal = metrics.cacheHitsTotal;
    cacheMissesTotal = metrics.cacheMissesTotal;
}

async function get(key) {
    try {
        const r = getRedis();
        const val = await r.get(key);
        if (val !== null) {
            if (cacheHitsTotal) cacheHitsTotal.inc();
            return JSON.parse(val);
        }
        if (cacheMissesTotal) cacheMissesTotal.inc();
        return null;
    } catch { return null; }
}

async function set(key, value, ttl = DEFAULT_TTL) {
    try {
        const r = getRedis();
        await r.set(key, JSON.stringify(value), 'EX', ttl);
    } catch { /* cache miss */ }
}

async function del(key) {
    try {
        const r = getRedis();
        await r.del(key);
    } catch { /* ignore */ }
}

async function delPattern(pattern) {
    try {
        const r = getRedis();
        const keys = await r.keys(pattern);
        if (keys.length > 0) await r.del(...keys);
    } catch { /* ignore */ }
}

async function remember(key, ttl, fn) {
    const cached = await get(key);
    if (cached !== null) return cached;
    const value = await fn();
    await set(key, value, ttl);
    return value;
}

async function status() {
    try {
        const r = getRedis();
        await r.ping();
        return { connected: true, info: await r.info('stats') };
    } catch { return { connected: false }; }
}

function buildKey(...parts) {
    return `sndc:${parts.join(':')}`;
}

const KEYS = {
    college: (id) => buildKey('college', id),
    collegeSettings: (id) => buildKey('college', id, 'settings'),
    subjects: (collegeId) => buildKey('subjects', collegeId),
    dashboard: (userId) => buildKey('dashboard', userId),
    announcements: (collegeId) => buildKey('announcements', collegeId),
    stats: (collegeId) => buildKey('stats', collegeId),
    user: (id) => buildKey('user', id),
    rateLimit: (key) => buildKey('ratelimit', key),
};

module.exports = { getRedis, get, set, del, delPattern, remember, status, buildKey, KEYS, DEFAULT_TTL, LONG_TTL, SHORT_TTL, setMetrics };
