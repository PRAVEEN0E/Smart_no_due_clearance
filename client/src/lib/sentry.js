import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentry() {
    if (initialized) return;

    const dsn = import.meta.env.VITE_SENTRY_DSN;
    const env = import.meta.env.VITE_APP_ENV || 'development';

    if (!dsn) {
        console.warn('[Sentry] DSN not configured — skipping initialization');
        return;
    }

    Sentry.init({
        dsn,
        environment: env,
        tracesSampleRate: env === 'production' ? 0.2 : 0.0,
        replaysSessionSampleRate: env === 'production' ? 0.1 : 0.0,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration(),
        ],
        enabled: dsn && (env !== 'development' || true),
    });

    initialized = true;
    console.log(`[Sentry] Initialized (env: ${env})`);
}

export { Sentry };
