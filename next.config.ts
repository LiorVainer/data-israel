import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    serverExternalPackages: [
        '@mastra/core',
        '@mastra/memory',
        '@mastra/ai-sdk',
        '@mastra/convex',
    ],
};

export default nextConfig;
