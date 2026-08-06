require('dotenv').config();
const cluster = require('cluster');
const { validateEnv } = require('./lib/env');
const { initSentry, captureError } = require('./lib/sentry');
const { sanitizeBody } = require('./lib/sanitizePlugin');
initSentry();

// ═══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════
validateEnv();

const fastify = require('fastify')({
    logger: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        requestIdLogLabel: 'req_id'
    },
    routerOptions: {
        ignoreTrailingSlash: true
    },
    bodyLimit: 10485760,
    connectionTimeout: 30000,
    requestIdHeader: 'x-request-id',
    genReqId: () => crypto.randomUUID()
});

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const multipart = require('@fastify/multipart');

// ─── Cluster Worker Metrics ───────────────────────────────────────────────────
const workerMetrics = {
    workerId: cluster.isWorker ? cluster.worker.id : 0,
    pid: process.pid,
    requestCount: 0,
    startedAt: Date.now()
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECURITY PLUGINS
// ═══════════════════════════════════════════════════════════════════════════════

// 1. Helmet - Security Headers
fastify.register(require('@fastify/helmet'), {
    global: true,
    contentSecurityPolicy: {
        useDefaults: true,
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://vercel.live', 'https://va.vercel-scripts.com'],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com', 'https://*.cloudinary.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
            connectSrc: [
                "'self'",
                process.env.FRONTEND_URL || 'http://localhost:5173',
                'https://api.emailjs.com',
                'https://api.groq.com'
            ],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            manifestSrc: ["'self'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    noSniff: true,
    xssFilter: true,
    frameguard: { action: 'deny' },
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    hidePoweredBy: true,
    ieNoOpen: true,
    dnsPrefetchControl: { allow: false }
});

// 2. CORS - Configured strictly
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:5173'];

fastify.register(require('@fastify/cors'), {
    origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return cb(null, true);
        }

        const isDev = process.env.NODE_ENV !== 'production';
        if (isDev && (origin.startsWith('http://192.168.') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
            return cb(null, true);
        }

        cb(new Error("Not allowed by CORS"), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    exposedHeaders: ['X-Request-Id', 'X-Worker-Id'],
    maxAge: 86400
});

// 3. Rate Limiting - Global with per-route overrides
fastify.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
        return request.ip || request.connection.remoteAddress;
    },
    // Static assets & the SPA shell are served straight from disk (CDN-like) —
    // rate-limiting them only causes false 429s (e.g. page loads tripping the
    // budget). The API surface stays protected at 100 req/min per IP.
    allowList: (request) => {
        const url = request.url || '';
        return !url.startsWith('/api');
    },
    errorResponseBuilder: (request, context) => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${context.after} seconds.`,
        retryAfter: context.after
    }),
    enableAsync: true
});

// 4. Swagger / OpenAPI Documentation
fastify.register(require('@fastify/swagger'), require('./config/swagger'));
fastify.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
});

// 5. Multipart - File upload limits
fastify.register(multipart, {
    limits: {
        fileSize: 5242880, // 5MB
        files: 1,
        headerPairs: 2000
    },
    throwFileSizeLimit: false
});

// Create upload directories if they don't exist
const uploadsDir = path.join(__dirname, 'uploads');
const subDirs = ['assignments', 'halltickets', 'materials', 'signatures'];
subDirs.forEach(dir => {
    const fullPath = path.join(uploadsDir, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
    }
});

// 6. Compression — reduces response size
fastify.register(require('@fastify/compress'), {
    global: true,
    threshold: 1024, // 1KB minimum
    zlib: { level: 6 },
    brotli: process.env.NODE_ENV === 'production' ? { enabled: true, quality: 4 } : false,
});

// 7. Redis connection check (non-blocking)
const cache = require('./lib/cache');
cache.status().then(s => {
    if (s.connected) fastify.log.info('Redis connected');
    else fastify.log.warn('Redis not available — cache disabled');
}).catch(() => fastify.log.warn('Redis not available — cache disabled'));

// Attach cache to fastify instance
fastify.decorate('cache', cache);

// Register BullMQ workers
const { registerWorkers, closeWorkers } = require('./workers');
registerWorkers();

// Add .gitkeep to each upload directory to track them in git
subDirs.forEach(dir => {
    const gitkeepPath = path.join(uploadsDir, dir, '.gitkeep');
    if (!fs.existsSync(gitkeepPath)) {
        fs.writeFileSync(gitkeepPath, '');
    }
});

// Serve uploaded files
fastify.register(require('@fastify/static'), {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
    cacheControl: true,
    maxAge: '1h',
    wildcard: true
});

// Serve frontend static files
const distPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
    fastify.register(require('@fastify/static'), {
        root: distPath,
        prefix: '/',
        decorateReply: false,
        // v9 applies computed headers AFTER setHeaders — disable plugin-generated
        // Cache-Control so the setHeaders values below are not overridden.
        cacheControl: false,
        // Hashed build assets are immutable — cache them for a year.
        // index.html stays no-cache so new deploys propagate instantly.
        setHeaders(res, filePath) {
            const rel = path.relative(distPath, filePath).replace(/\\/g, '/');
            if (rel.startsWith('assets/')) {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            } else if (rel === 'index.html' || rel === 'sw.js') {
                res.setHeader('Cache-Control', 'no-cache');
            }
        }
    });

    // SPA Catch-all — serve index.html only for known client routes;
    // unknown paths return a real 404 (soft-404 avoidance) while still
    // delivering index.html so the client-side 404 page renders.
    const KNOWN_SPA_ROUTES = [
        '/',
        '/about',
        '/features',
        '/contact',
        '/privacy',
        '/terms',
        '/verify',
        '/login',
        '/register',
        '/change-password',
    ];
    const KNOWN_SPA_PREFIXES = ['/verify/hallticket/', '/student', '/staff', '/mentor', '/superadmin'];
    const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'));
    fastify.setNotFoundHandler(async (request, reply) => {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return reply.status(404).send({
                error: 'Not Found',
                message: `Route ${request.url} not found`,
                code: 'ROUTE_NOT_FOUND'
            });
        }
        if (!request.url.startsWith('/api') && !request.url.startsWith('/uploads')) {
            const url = request.url.split('?')[0].replace(/\/+$/, '') || '/';
            const isKnown = KNOWN_SPA_ROUTES.includes(url) || KNOWN_SPA_PREFIXES.some((p) => url.startsWith(p));
            if (isKnown) {
                return reply.type('text/html').header('Cache-Control', 'no-cache').send(indexHtml);
            }
            // Unknown route: correct 404 status, client renders the 404 page
            return reply.status(404).type('text/html').header('X-Robots-Tag', 'noindex').header('Cache-Control', 'no-cache').send(indexHtml);
        }
        reply.status(404).send({
            error: 'Not Found',
            message: `Route ${request.url} not found`,
            code: 'ROUTE_NOT_FOUND'
        });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
fastify.setErrorHandler(async (error, request, reply) => {
    // Log the error internally
    request.log.error({
        err: error,
        url: request.url,
        method: request.method,
        requestId: request.id
    }, 'Request error');

    // Send to Sentry (captures all 400+ errors with context)
    captureError(error, request);

    // Prisma Unique Constraint Error
    if (error.code === 'P2002') {
        const fields = error.meta?.target || 'fields';
        return reply.status(409).send({
            error: 'Conflict',
            message: `A record with this ${Array.isArray(fields) ? fields.join(', ') : fields} already exists.`,
            code: 'DB_UNIQUE_CONSTRAINT'
        });
    }

    // Prisma Foreign Key Error
    if (error.code === 'P2003') {
        return reply.status(400).send({
            error: 'Bad Request',
            message: 'Referenced record does not exist.',
            code: 'DB_FOREIGN_KEY'
        });
    }

    // Prisma Record Not Found
    if (error.code === 'P2025') {
        return reply.status(404).send({
            error: 'Not Found',
            message: 'Record not found.',
            code: 'DB_NOT_FOUND'
        });
    }

    // Rate Limit Exceeded
    if (error.statusCode === 429) {
        return reply.status(429).send({
            error: 'Too Many Requests',
            message: error.message,
            retryAfter: error.retryAfter,
            code: 'RATE_LIMIT_EXCEEDED'
        });
    }

    // CORS Error
    if (error.message === 'Not allowed by CORS') {
        return reply.status(403).send({
            error: 'Forbidden',
            message: 'Origin not allowed by CORS policy.',
            code: 'CORS_DENIED'
        });
    }

    // Validation Error
    if (error.validation) {
        return reply.status(400).send({
            error: 'Validation Error',
            message: 'Invalid request data.',
            details: error.validation.map(v => ({
                field: v.instancePath || v.keyword,
                message: v.message,
                params: v.params
            })),
            code: 'VALIDATION_ERROR'
        });
    }

    // File too large
    if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
        return reply.status(413).send({
            error: 'Request Entity Too Large',
            message: 'File size exceeds the maximum allowed limit (10MB).',
            code: 'FILE_TOO_LARGE'
        });
    }

    // Generic safe error for production
    const isProd = process.env.NODE_ENV === 'production';
    const statusCode = error.statusCode || 500;

    reply.status(statusCode).send({
        error: isProd ? 'Internal Server Error' : error.name || 'Error',
        message: isProd && statusCode >= 500
            ? 'An unexpected error occurred. Please try again later.'
            : error.message,
        code: error.code || 'INTERNAL_ERROR',
        ...(isProd ? {} : { stack: error.stack }),
        requestId: request.id
    });
});

// ═══════════════════════════════════════════════════════════════════════════════
// PLUGINS
// ═══════════════════════════════════════════════════════════════════════════════
fastify.register(require('./plugins/prisma'));
fastify.register(require('./plugins/auth'));     // registers @fastify/cookie + @fastify/jwt
fastify.register(require('./plugins/healthDashboard'));

// Auth Decorator helper for multi-plugin guards
fastify.decorate('auth', (guards) => {
    return async (request, reply) => {
        for (const guard of guards) {
            await guard(request, reply);
            if (reply.sent) return;
        }
    };
});

// ─── Cluster-Aware Hooks ──────────────────────────────────────────────────────

// Track requests & tag responses with worker ID
fastify.addHook('onRequest', async (request, reply) => {
    workerMetrics.requestCount++;

    // Set response headers
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');

    if (cluster.isWorker) {
        try { process.send({ type: 'request_tick' }); } catch (e) { /* noop */ }
    }
});

// Global input sanitization — strips HTML/script from all unsafe method bodies
fastify.addHook('preHandler', (request, reply, done) => {
    const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (unsafeMethods.includes(request.method)) {
        return sanitizeBody(request, reply, done);
    }
    done();
});

fastify.addHook('onSend', async (request, reply, payload) => {
    reply.header('X-Worker-Id', workerMetrics.workerId.toString());
    reply.header('X-Worker-PID', workerMetrics.pid.toString());
    reply.header('X-Request-Id', request.id);

    if (reply.statusCode === 401) {
        request.log.warn(`401 Unauthorized: ${request.method} ${request.url}`);
    }
    if (reply.statusCode === 403) {
        request.log.warn(`403 Forbidden: ${request.method} ${request.url}`);
    }
    if (reply.statusCode >= 500) {
        request.log.error(`5xx Server Error: ${request.method} ${request.url} -> ${reply.statusCode}`);
    }
    return payload;
});

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

fastify.register(async (instance) => {
    // Enhanced health endpoint with worker-level metrics
    instance.get('/health', async (request) => {
        const memUsage = process.memoryUsage();
        const cacheStatus = require('./lib/cache').status().catch(() => ({ connected: false }));
        const qStatus = {};
        const queueModule = require('./lib/queue');
        for (const [key, name] of Object.entries(queueModule.QUEUES || {})) {
            try { qStatus[key.toLowerCase()] = await queueModule.getQueueStatus(name); } catch { /* skip */ }
        }
        return {
            status: 'ok',
            worker: {
                id: workerMetrics.workerId,
                pid: workerMetrics.pid,
                uptime_seconds: Math.round((Date.now() - workerMetrics.startedAt) / 1000),
                requests_handled: workerMetrics.requestCount,
                memory: {
                    rss_mb: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
                    heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
                    heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100
                }
            },
            cache: await cacheStatus,
            queue: qStatus,
            uptime: process.uptime(),
            node_version: process.version,
            environment: process.env.NODE_ENV || 'development',
            is_clustered: cluster.isWorker,
            timestamp: new Date().toISOString()
        };
    });

    // Logout endpoint - clears auth cookie
    instance.post('/logout', async (request, reply) => {
        fastify.clearAuthCookie(reply);
        return { message: 'Logged out successfully.' };
    });
}, { prefix: '/api' });

const queueModule = require('./lib/queue');
const prisma = require('./lib/prisma');

// Readiness probe — checks DB, Redis, Queue
fastify.get('/api/ready', async (request, reply) => {
    const errors = [];
    let dbOk = false;
    let redisOk = false;
    let queueOk = false;

    try {
        await prisma.$queryRaw`SELECT 1`;
        dbOk = true;
    } catch (e) {
        errors.push({ component: 'database', error: e.message });
    }

    try {
        const s = await require('./lib/cache').status();
        redisOk = s.connected;
    } catch (e) {
        errors.push({ component: 'redis', error: e.message });
    }

    try {
        const s = await queueModule.getQueueStatus(queueModule.QUEUES.EMAIL);
        queueOk = !!s;
    } catch {
        queueOk = false;
    }

    const ready = dbOk && redisOk;
    if (!ready) {
        reply.status(503);
    }
    return { ready, dbOk, redisOk, queueOk, errors: errors.length > 0 ? errors : undefined, timestamp: new Date().toISOString() };
});

// Liveness probe
fastify.get('/api/live', async (request, reply) => {
    return { alive: true, pid: process.pid, uptime: process.uptime(), timestamp: new Date().toISOString() };
});

// Prometheus metrics
const promClient = require('prom-client');
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'sndc_', gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5] });

const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

const httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'],
});

const cacheHitsTotal = new promClient.Counter({
    name: 'sndc_cache_hits_total',
    help: 'Total number of cache hits',
});
const cacheMissesTotal = new promClient.Counter({
    name: 'sndc_cache_misses_total',
    help: 'Total number of cache misses',
});
const bullmqQueueWaitingCount = new promClient.Gauge({
    name: 'bullmq_queue_waiting_count',
    help: 'Number of waiting jobs in BullMQ queues',
    labelNames: ['queue'],
});

fastify.addHook('onResponse', async (request, reply) => {
    const route = request.routeOptions?.url || request.url || 'unknown';
    const labels = { method: request.method, route, status: reply.statusCode };
    httpRequestDuration.observe(labels, reply.elapsedTime / 1000);
    httpRequestsTotal.inc(labels);
});

fastify.decorate('metrics', { cacheHitsTotal, cacheMissesTotal, bullmqQueueWaitingCount });
require('./lib/cache').setMetrics(fastify.metrics);

// Track queue depths periodically
setInterval(async () => {
    try {
        if (!process.env.REDIS_URL) return;
        const { QUEUES, getQueueStatus } = require('./lib/queue');
        for (const name of Object.values(QUEUES)) {
            const status = await getQueueStatus(name);
            bullmqQueueWaitingCount.set({ queue: name }, status.waiting);
        }
    } catch {} // Graceful if Redis is down
}, 15000);

fastify.get('/api/metrics', async (request, reply) => {
    reply.type('text/plain');
    return promClient.register.metrics();
});

fastify.register(require('./routes/mentor'), { prefix: '/api/mentor' });
fastify.register(require('./routes/staff'), { prefix: '/api/staff' });
fastify.register(require('./routes/student'), { prefix: '/api/student' });
// Refactored layered-architecture auth route
fastify.register(require('./routes/auth.v2'), { prefix: '/api/auth' });
fastify.register(require('./routes/materials'), { prefix: '/api/materials' });
fastify.register(require('./routes/notifications'), { prefix: '/api/notifications' });
fastify.register(require('./routes/pushSubscriptions'), { prefix: '/api/push' });
fastify.register(require('./routes/studentQueries'), { prefix: '/api/queries' });
fastify.register(require('./routes/userPreferences'), { prefix: '/api/preferences' });
fastify.register(require('./routes/superadmin'), { prefix: '/api/superadmin' });

// ═══════════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════════
const start = async () => {
    try {
        const port = process.env.PORT || 3000;
        await fastify.listen({ port, host: '0.0.0.0' });
        fastify.log.info(`Server listening on ${fastify.server.address().port} (Worker #${workerMetrics.workerId}, PID: ${workerMetrics.pid})`);

        // Notify cluster master that this worker is ready
        if (cluster.isWorker) {
            try { process.send({ type: 'worker_ready' }); } catch (e) { /* noop */ }
        }
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// IPC MESSAGE HANDLER (Cluster Worker)
// ═══════════════════════════════════════════════════════════════════════════════
if (cluster.isWorker) {
    process.on('message', (msg) => {
        switch (msg.type) {
            case 'heartbeat_ping':
                try {
                    process.send({
                        type: 'heartbeat_response',
                        memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100,
                        requestCount: workerMetrics.requestCount
                    });
                } catch (e) { /* noop */ }
                break;

            case 'shutdown':
                fastify.log.info(`[Worker #${workerMetrics.workerId}] Shutdown signal received — draining connections...`);
                fastify.close().then(() => {
                    fastify.log.info(`[Worker #${workerMetrics.workerId}] All connections drained. Exiting.`);
                    process.exit(0);
                }).catch((err) => {
                    fastify.log.error(`[Worker #${workerMetrics.workerId}] Error during shutdown: ${err.message}`);
                    process.exit(1);
                });
                break;
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROCESS SIGNAL HANDLING
// ═══════════════════════════════════════════════════════════════════════════════
if (!cluster.isWorker) {
    const shutdown = async (signal) => {
        fastify.log.info(`${signal} received — shutting down...`);
        await fastify.close();
        process.exit(0);
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
