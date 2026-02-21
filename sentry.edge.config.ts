import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    sendDefaultPii: true,

    // Performance: full visibility in dev, sampled in production
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

    // Structured logging
    enableLogs: true,
});
