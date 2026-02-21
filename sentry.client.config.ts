import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    sendDefaultPii: true,

    // Performance: full visibility in dev, sampled in production
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
            maskAllInputs: true,
        }),
    ],

    // Session Replay: 10% of normal sessions, 100% of error sessions
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Structured logging
    enableLogs: true,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
