'use strict';

const fp = require('fastify-plugin');
const http = require('http');

/**
 * Health Dashboard Plugin
 * 
 * Exposes a proxy endpoint on the main Fastify server that fetches
 * the cluster-wide health data from the master process's health server.
 * This is restricted to SUPERADMIN users.
 */
async function healthDashboardPlugin(fastify, opts) {
    // Only register the route if the cluster health port is defined
    const HEALTH_PORT = parseInt(process.env.CLUSTER_HEALTH_PORT, 10) || 3001;

    fastify.get('/cluster/health', {
        preHandler: [fastify.authenticate, fastify.authorize(['SUPERADMIN'])]
    }, async (request, reply) => {
        return new Promise((resolve, reject) => {
            const req = http.get(`http://localhost:${HEALTH_PORT}/health`, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        reply.send(parsedData);
                        resolve();
                    } catch (e) {
                        reply.status(500).send({ error: 'Failed to parse cluster health data' });
                        resolve();
                    }
                });
            });

            req.on('error', (e) => {
                reply.status(503).send({ 
                    error: 'Cluster Health Server Unavailable',
                    message: 'The cluster master process may not be running or the health port is blocked.',
                    details: e.message
                });
                resolve();
            });
            
            // Timeout to prevent hanging
            req.setTimeout(2000, () => {
                req.destroy();
                reply.status(504).send({ error: 'Cluster Health Server Timeout' });
                resolve();
            });
        });
    });
}

module.exports = fp(healthDashboardPlugin);
