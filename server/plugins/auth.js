const fp = require('fastify-plugin');
const jwt = require('@fastify/jwt');

async function authPlugin(fastify, opts) {
    fastify.register(jwt, {
        secret: process.env.JWT_SECRET || 'supersecret'
    });

    fastify.decorate('authenticate', async (request, reply) => {
        try {
            // Check for token in Header or Query (for iframes/links)
            const token = request.headers.authorization || request.query.token;
            if (request.query.token && !request.headers.authorization) {
                request.headers.authorization = `Bearer ${request.query.token}`;
            }
            await request.jwtVerify();
        } catch (err) {
            reply.status(401).send({ message: 'Unauthorized: Invalid or missing token' });
        }
    });

    fastify.decorate('authorize', (roles) => {
        return async (request, reply) => {
            const { role } = request.user;
            if (!roles.includes(role)) {
                return reply.status(403).send({ message: 'Forbidden: Insufficient permissions' });
            }
        };
    });
}

module.exports = fp(authPlugin);
