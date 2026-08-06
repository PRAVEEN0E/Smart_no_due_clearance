let initialized = false;

export async function initSentry() {
    if (initialized) return;

    const dsn = import.meta.env.VITE_SENTRY_DSN;
    const env = import.meta.env.VITE_APP_ENV || 'development';

    if (!dsn) {
        if (import.meta.env.DEV) {
            // expected in dev; skip silently
            return;
        }
        console.warn('[Sentry] DSN not configured — skipping initialization');
        return;
    }

    // @sentry/react is code-split: the SDK (~30KB gzip) is only fetched when
    // a DSN is actually configured, keeping the initial bundle lean.
    const Sentry = await import('@sentry/react');

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
    });

    initialized = true;
    console.log(`[Sentry] Initialized (env: ${env})`);
}
