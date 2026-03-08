import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';

// Load .env into process.env for eval tests that need API keys
const envPath = path.resolve(__dirname, '.env');
if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) continue;
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}

export default defineConfig({
    resolve: {
        alias: {
            '@/convex': path.resolve(__dirname, 'convex'),
            '@': path.resolve(__dirname, 'src'),
        },
    },
    test: {
        environment: 'node',
        include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
        exclude: ['node_modules', '.next', 'mcp-ref', 'components-ref'],
        passWithNoTests: true,
    },
});
