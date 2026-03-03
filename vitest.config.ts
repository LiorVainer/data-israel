import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '.'),
        },
    },
    test: {
        environment: 'node',
        include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
        exclude: ['node_modules', '.next', 'mcp-ref', 'components-ref'],
        passWithNoTests: true,
    },
});
