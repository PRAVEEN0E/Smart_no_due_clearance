require('dotenv').config();
const fastify = require('fastify')({
    logger: true,
    routerOptions: {
        ignoreTrailingSlash: true
    },
    bodyLimit: 10485760, // 10MB limit for bulk uploads
    connectionTimeout: 30000 // 30 seconds timeout to handle slow PDF generation
});
const multipart = require('@fastify/multipart');

const path = require('path');
const fs = require('fs');

// Register Plugins
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : ['http://localhost:5173'];
fastify.register(require('@fastify/cors'), {
    origin: (origin, cb) => {
        // Allow all origins in development or if the origin is in our allowed list
        if (!origin || 
            process.env.NODE_ENV !== 'production' || 
            allowedOrigins.includes(origin) || 
            origin.startsWith('http://192.168.') || 
            origin.startsWith('http://localhost') || 
            origin.startsWith('http://127.0.0.1')) {
            cb(null, true);
            return;
        }
        cb(new Error("Not allowed by CORS"), false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

fastify.register(require('@fastify/rate-limit'), {
    max: 100,
    timeWindow: '1 minute',
    errorResponseBuilder: (request, context) => ({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `I will allow only ${context.after} seconds wait before retrying.`,
        expiresIn: context.after
    })
});

fastify.register(multipart, {
    limits: {
        fileSize: 5242880 // 5MB
    }
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

fastify.register(require('@fastify/static'), {
    root: uploadsDir,
    prefix: '/uploads/',
});

// Serve frontend static files
const distPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
    fastify.register(require('@fastify/static'), {
        root: distPath,
        prefix: '/',
        decorateReply: false // Important: avoid conflicts with the first static plugin
    });

    // SPA Catch-all: Send all non-API/non-upload requests to index.html
    fastify.setNotFoundHandler(async (request, reply) => {
        if (!request.url.startsWith('/api') && !request.url.startsWith('/uploads')) {
            return reply.sendFile('index.html', distPath);
        }
        reply.status(404).send({ error: 'Not Found', message: `Route ${request.url} not found` });
    });
}

// Global Error Handler
fastify.setErrorHandler(async (error, request, reply) => {
    fastify.log.error(error);

    // Prisma Unique Constraint Error
    if (error.code === 'P2002') {
        const fields = error.meta?.target || 'fields';
        return reply.status(409).send({ 
            error: 'Conflict', 
            message: `A record with this ${fields} already exists.` 
        });
    }

    if (error.statusCode === 429) {
        return reply.status(429).send({ error: 'Rate Limit Exceeded', message: error.message });
    }

    if (error.message === 'Not allowed by CORS') {
        return reply.status(403).send({ error: 'Forbidden', message: 'CORS policy restriction' });
    }

    // Generic safe error for production
    const isProd = process.env.NODE_ENV === 'production';
    reply.status(error.statusCode || 500).send({
        error: isProd ? 'Internal Server Error' : error.name,
        message: (isProd && !error.statusCode) ? 'An unexpected error occurred. Please try again later.' : error.message,
        ...(isProd ? {} : { stack: error.stack })
    });
});

fastify.register(require('./plugins/prisma'));
fastify.register(require('./plugins/auth'));

// Auth Decorator helper for multi-plugin guards
fastify.decorate('auth', (guards) => {
    return async (request, reply) => {
        for (const guard of guards) {
            await guard(request, reply);
        }
    };
});

// Debug hook for 401s
fastify.addHook('onSend', async (request, reply, payload) => {
    if (reply.statusCode === 401) {
        fastify.log.warn(`401 Unauthorized: ${request.method} ${request.url}`);
    }
    return payload;
});

// Register Routes
fastify.register(async (instance) => {
    instance.get('/health', async () => ({ status: 'ok' }));

    // Global Media Proxy for Cloudinary (bypasses 401/CORS in iframes)
    instance.get('/proxy', { preHandler: instance.authenticate }, async (request, reply) => {
        const { url } = request.query;
        if (!url) return reply.status(400).send({ message: 'URL is required' });

        try {
            const axios = require('axios');
            const response = await axios({
                method: 'get',
                url: url,
                responseType: 'stream',
                timeout: 5000 
            });

            reply.header('Content-Type', response.headers['content-type'] || 'application/pdf');
            reply.header('Content-Disposition', 'inline');
            reply.header('Cache-Control', 'public, max-age=3600');
            
            return reply.send(response.data);
        } catch (err) {
            instance.log.error(`Global Proxy Error: ${err.message}`);
            return reply.redirect(url);
        }
    });
}, { prefix: '/api' });

fastify.register(require('./routes/mentor'), { prefix: '/api/mentor' });
fastify.register(require('./routes/staff'), { prefix: '/api/staff' });
fastify.register(require('./routes/student'), { prefix: '/api/student' });
fastify.register(require('./routes/auth'), { prefix: '/api/auth' });
fastify.register(require('./routes/materials'), { prefix: '/api/materials' });
fastify.register(require('./routes/notifications'), { prefix: '/api/notifications' });


// Start Server
const start = async () => {
    try {
        const port = process.env.PORT || 3000;
        await fastify.listen({ port, host: '0.0.0.0' });
        fastify.log.info(`Server listening on ${fastify.server.address().port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
