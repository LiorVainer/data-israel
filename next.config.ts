import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
    serverExternalPackages: ['@mastra/core', '@mastra/memory', '@mastra/ai-sdk', '@mastra/convex'],
};

export default withSentryConfig(nextConfig, {
    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // Disable source map upload when no auth token is available
    sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
    },
});
