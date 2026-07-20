require('dotenv').config();
const cluster = require('cluster');
const { validateEnv } = require('./lib/env');
const { initSentry } = require('./lib/sentry');
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
            : undefined
    },
    routerOptions: {
        ignoreTrailingSlash: true
    },
    bodyLimit: 10485760,
    connectionTimeout: 30000,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'req_id',
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
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'x-request-id'],
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
    errorResponseBuilder: (request, context) => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${context.after} seconds.`,
        retryAfter: context.after
    }),
    enableAsync: true
});

// 4. CSRF Protection
fastify.register(require('@fastify/csrf-protection'), {
    cookieOpts: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    },
    csrfOpts: {
        getToken: (request) => {
            return request.headers['x-csrf-token'];
        }
    }
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
    maxAge: '1h'
});

// Serve frontend static files
const distPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
    fastify.register(require('@fastify/static'), {
        root: distPath,
        prefix: '/',
        decorateReply: false,
        cacheControl: true,
        maxAge: '1h'
    });

    // SPA Catch-all
    fastify.setNotFoundHandler(async (request, reply) => {
        if (!request.url.startsWith('/api') && !request.url.startsWith('/uploads')) {
            return reply.sendFile('index.html', distPath);
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

    // CSRF Error
    if (error.code === 'FST_CSRF_INVALID_TOKEN') {
        return reply.status(403).send({
            error: 'Forbidden',
            message: 'Invalid or missing CSRF token.',
            code: 'CSRF_INVALID_TOKEN'
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
fastify.register(require('./plugins/auth'));
fastify.register(require('./plugins/healthDashboard'));

// Auth Decorator helper for multi-plugin guards
fastify.decorate('auth', (guards) => {
    return async (request, reply) => {
        for (const guard of guards) {
            await guard(request, reply);
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

fastify.register(require('./routes/mentor'), { prefix: '/api/mentor' });
fastify.register(require('./routes/staff'), { prefix: '/api/staff' });
fastify.register(require('./routes/student'), { prefix: '/api/student' });
fastify.register(require('./routes/auth'), { prefix: '/api/auth' });
fastify.register(require('./routes/materials'), { prefix: '/api/materials' });
fastify.register(require('./routes/notifications'), { prefix: '/api/notifications' });
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
