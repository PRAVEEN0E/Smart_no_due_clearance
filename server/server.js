require('dotenv').config();
const fastify = require('fastify')({
    logger: true,
    bodyLimit: 10485760 // 10MB limit for bulk uploads
});
const multipart = require('@fastify/multipart');

const path = require('path');
const fs = require('fs');

// Register Plugins
fastify.register(require('@fastify/cors'), {
    origin: '*', // Adjust this to specific domains in production if needed
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
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
    prefix: '/uploads/', // files will be available at http://localhost:3000/uploads/...
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

// Register Routes
fastify.register(async (instance) => {
    instance.get('/health', async () => ({ status: 'ok' }));
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
