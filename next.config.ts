import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
    serverExternalPackages: ['@mastra/core', '@mastra/memory', '@mastra/ai-sdk', '@mastra/convex'],
    experimental: {
        proxyClientMaxBodySize: '25mb',
    },
    async headers() {
        return [
            {
                source: '/sw.js',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'application/javascript; charset=utf-8',
                    },
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self'",
                    },
                ],
            },
        ];
    },
};

export default withSentryConfig(nextConfig, {
    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // Disable source map upload when no auth token is available
    sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
    },
});
