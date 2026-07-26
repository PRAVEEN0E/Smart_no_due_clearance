/**
 * Simple dependency injection container.
 * Provides repos, services, and controllers to routes.
 */

let instance = null;

function createContainer(prisma) {
    const { createRepositories } = require('../repositories');
    const { createServices } = require('../services');

    const repos = createRepositories(prisma);
    const services = createServices(repos);

    instance = { repos, services };
    return instance;
}

function getContainer() {
    if (!instance) throw new Error('Container not initialized. Call createContainer(prisma) first.');
    return instance;
}

module.exports = { createContainer, getContainer };
