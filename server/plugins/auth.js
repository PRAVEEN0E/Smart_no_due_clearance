const fp = require('fastify-plugin');
const jwt = require('@fastify/jwt');
const cookie = require('@fastify/cookie');

async function authPlugin(fastify, opts) {
    if (!process.env.JWT_SECRET) {
        throw new Error("FATAL ERROR: JWT_SECRET environment variable is missing.");
    }

    if (process.env.JWT_SECRET.length < 32) {
        throw new Error("FATAL ERROR: JWT_SECRET must be at least 32 characters long.");
    }

    // Register cookie support
    await fastify.register(cookie, {
        secret: process.env.JWT_COOKIE_SECRET || process.env.JWT_SECRET,
        parseOptions: {}
    });

    // Register JWT with cookie support
    await fastify.register(jwt, {
        secret: process.env.JWT_SECRET,
        cookie: {
            cookieName: 'token',
            signed: false
        },
        sign: {
            algorithm: 'HS256',
            expiresIn: '7d'
        }
    });

    fastify.decorate('authenticate', async (request, reply) => {
        try {
            // Try cookie first, then Authorization header
            if (!request.cookies || !request.cookies.token) {
                const authHeader = request.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.substring(7);
                    return await request.jwtVerify({ token });
                }
            }
            await request.jwtVerify({ decode: { complete: true } });
        } catch (err) {
            reply.status(401).send({
                error: 'Unauthorized',
                message: 'Authentication required. Please log in again.',
                code: 'AUTH_TOKEN_INVALID'
            });
        }
    });

    fastify.decorate('authenticateOptional', async (request, reply) => {
        try {
            if (!request.cookies || !request.cookies.token) {
                const authHeader = request.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.substring(7);
                    await request.jwtVerify({ token });
                    return;
                }
            }
            await request.jwtVerify({ decode: { complete: true } });
        } catch (err) {
            // No auth is fine for optional endpoints
        }
    });

    fastify.decorate('authorize', (...roles) => {
        return async (request, reply) => {
            const { role } = request.user;
            if (!roles.includes(role)) {
                reply.status(403).send({
                    error: 'Forbidden',
                    message: 'Insufficient permissions to access this resource.',
                    code: 'AUTH_INSUFFICIENT_ROLE'
                });
            }
        };
    });

    // Helper to set auth cookie
    fastify.decorate('setAuthCookie', function (reply, token) {
        const isProduction = process.env.NODE_ENV === 'production';
        reply.setCookie('token', token, {
            path: '/',
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            signed: false
        });
    });

    // Helper to clear auth cookie
    fastify.decorate('clearAuthCookie', function (reply) {
        reply.clearCookie('token', {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });
    });
}

module.exports = fp(authPlugin);
