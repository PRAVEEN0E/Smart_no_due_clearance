const Sentry = require('@sentry/node');

let initialized = false;

function initSentry() {
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
    });

    // Process-level error capture
    process.on('unhandledRejection', (reason) => {
        console.error('[Sentry] Unhandled Rejection:', reason);
        Sentry.captureException(reason, {
            level: 'error',
            tags: { type: 'unhandled_rejection' }
        });
    });

    process.on('uncaughtException', (err) => {
        console.error('[Sentry] Uncaught Exception:', err);
        Sentry.captureException(err, {
            level: 'fatal',
            tags: { type: 'uncaught_exception' }
        });
    });

    initialized = true;
    console.log(`[Sentry] Initialized (env: ${env})`);
}

function captureError(error, request = null) {
    if (!initialized) return;
    const scope = new Sentry.Scope();
    if (request) {
        scope.setExtra('url', request.url);
        scope.setExtra('method', request.method);
        scope.setExtra('requestId', request.id);
        if (request.user) {
            scope.setUser({ id: request.user.id, email: request.user.email, role: request.user.role });
        }
    }
    Sentry.captureException(error, scope);
}

function getSentry() {
    return Sentry;
}

module.exports = { initSentry, captureError, getSentry };
