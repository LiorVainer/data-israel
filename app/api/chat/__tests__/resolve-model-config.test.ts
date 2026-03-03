/**
 * Tests for app/api/chat/resolve-model-config.ts
 *
 * Verifies that resolveModelConfig correctly merges Convex overrides
 * with environment variable defaults, and handles failures gracefully.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.hoisted ensures the variable is available before vi.mock factory runs
const { mockQuery } = vi.hoisted(() => ({
    mockQuery: vi.fn(),
}));

// Mock convex client
vi.mock('@/lib/convex/client', () => ({
    convexClient: { query: mockQuery },
}));

// Mock AgentConfig
vi.mock('@/agents/agent.config', () => ({
    AgentConfig: {
        MODEL: {
            DEFAULT_ID: 'env/default-model',
            DATAGOV_ID: 'env/datagov-model',
            CBS_ID: 'env/cbs-model',
        },
    },
}));

// Mock the generated Convex API
vi.mock('@/convex/_generated/api', () => ({
    api: {
        aiModels: {
            getAll: 'mock-getAll-ref',
        },
    },
}));

import { resolveModelConfig } from '../resolve-model-config';

describe('resolveModelConfig', () => {
    beforeEach(() => {
        mockQuery.mockReset();
    });

    it('returns env defaults when Convex has no records', async () => {
        mockQuery.mockResolvedValue([]);
        const config = await resolveModelConfig();
        expect(config).toEqual({
            routing: 'env/default-model',
            datagov: 'env/datagov-model',
            cbs: 'env/cbs-model',
        });
    });

    it('overrides with Convex values when present', async () => {
        mockQuery.mockResolvedValue([{ agentId: 'datagov', modelId: 'convex/custom-datagov' }]);
        const config = await resolveModelConfig();
        expect(config).toEqual({
            routing: 'env/default-model',
            datagov: 'convex/custom-datagov',
            cbs: 'env/cbs-model',
        });
    });

    it('overrides all agents when Convex has all records', async () => {
        mockQuery.mockResolvedValue([
            { agentId: 'routing', modelId: 'convex/routing' },
            { agentId: 'datagov', modelId: 'convex/datagov' },
            { agentId: 'cbs', modelId: 'convex/cbs' },
        ]);
        const config = await resolveModelConfig();
        expect(config).toEqual({
            routing: 'convex/routing',
            datagov: 'convex/datagov',
            cbs: 'convex/cbs',
        });
    });

    it('falls back to env defaults when Convex query fails', async () => {
        mockQuery.mockRejectedValue(new Error('Connection failed'));
        const config = await resolveModelConfig();
        expect(config).toEqual({
            routing: 'env/default-model',
            datagov: 'env/datagov-model',
            cbs: 'env/cbs-model',
        });
    });

    it('ignores unknown agent IDs from Convex', async () => {
        mockQuery.mockResolvedValue([{ agentId: 'unknown-agent', modelId: 'convex/unknown' }]);
        const config = await resolveModelConfig();
        expect(config).toEqual({
            routing: 'env/default-model',
            datagov: 'env/datagov-model',
            cbs: 'env/cbs-model',
        });
    });
});
