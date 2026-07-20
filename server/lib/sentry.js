const Sentry = require('@sentry/node');

let initialized = false;

function initSentry(app) {
    if (initialized) return;
    const dsn = process.env.SENTRY_DSN;
    const env = process.env.NODE_ENV || 'development';

    if (!dsn) {
        console.warn('[Sentry] DSN not configured — skipping initialization');
        return;
    }

    Sentry.init({
        dsn,
        environment: env,
        tracesSampleRate: env === 'production' ? 0.2 : 0.0,
        profilesSampleRate: env === 'production' ? 0.1 : 0.0,
        enabled: env !== 'development' || !!process.env.SENTRY_DSN,
    });

    initialized = true;
    console.log(`[Sentry] Initialized (env: ${env})`);
}

function getSentry() {
    return Sentry;
}

module.exports = { initSentry, getSentry };
