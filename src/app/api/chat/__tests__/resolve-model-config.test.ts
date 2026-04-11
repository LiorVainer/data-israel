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

// Mock AgentConfig with all per-agent model IDs
vi.mock('@/agents/agent.config', () => ({
    AgentConfig: {
        MODEL: {
            DEFAULT_ID: 'env/default-model',
            DATAGOV_ID: 'env/datagov-model',
            CBS_ID: 'env/cbs-model',
            BUDGET_ID: 'env/budget-model',
            GOVMAP_ID: 'env/govmap-model',
            HEALTH_ID: 'env/health-model',
            KNESSET_ID: 'env/knesset-model',
            SHUFERSAL_ID: 'env/shufersal-model',
            RAMI_LEVY_ID: 'env/rami-levy-model',
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

/** Expected defaults when no Convex overrides are present */
const ENV_DEFAULTS = {
    routing: 'env/default-model',
    datagov: 'env/datagov-model',
    cbs: 'env/cbs-model',
    budget: 'env/budget-model',
    govmap: 'env/govmap-model',
    health: 'env/health-model',
    knesset: 'env/knesset-model',
    shufersal: 'env/shufersal-model',
    'rami-levy': 'env/rami-levy-model',
};

describe('resolveModelConfig', () => {
    beforeEach(() => {
        mockQuery.mockReset();
    });

    it('returns env defaults when Convex has no records', async () => {
        mockQuery.mockResolvedValue([]);
        const config = await resolveModelConfig();
        expect(config).toEqual(ENV_DEFAULTS);
    });

    it('overrides with Convex values when present', async () => {
        mockQuery.mockResolvedValue([{ agentId: 'datagovAgent', modelId: 'convex/custom-datagov' }]);
        const config = await resolveModelConfig();
        expect(config).toEqual({
            ...ENV_DEFAULTS,
            datagov: 'convex/custom-datagov',
        });
    });

    it('overrides all agents when Convex has all records', async () => {
        mockQuery.mockResolvedValue([
            { agentId: 'routing', modelId: 'convex/routing' },
            { agentId: 'datagovAgent', modelId: 'convex/datagov' },
            { agentId: 'cbsAgent', modelId: 'convex/cbs' },
            { agentId: 'budgetAgent', modelId: 'convex/budget' },
            { agentId: 'govmapAgent', modelId: 'convex/govmap' },
            { agentId: 'healthAgent', modelId: 'convex/health' },
            { agentId: 'knessetAgent', modelId: 'convex/knesset' },
            { agentId: 'shufersalAgent', modelId: 'convex/shufersal' },
            { agentId: 'ramiLevyAgent', modelId: 'convex/rami-levy' },
        ]);
        const config = await resolveModelConfig();
        expect(config).toEqual({
            routing: 'convex/routing',
            datagov: 'convex/datagov',
            cbs: 'convex/cbs',
            budget: 'convex/budget',
            govmap: 'convex/govmap',
            health: 'convex/health',
            knesset: 'convex/knesset',
            shufersal: 'convex/shufersal',
            'rami-levy': 'convex/rami-levy',
        });
    });

    it('falls back to env defaults when Convex query fails', async () => {
        mockQuery.mockRejectedValue(new Error('Connection failed'));
        const config = await resolveModelConfig();
        expect(config).toEqual(ENV_DEFAULTS);
    });

    it('ignores unknown agent IDs from Convex', async () => {
        mockQuery.mockResolvedValue([{ agentId: 'unknown-agent', modelId: 'convex/unknown' }]);
        const config = await resolveModelConfig();
        expect(config).toEqual(ENV_DEFAULTS);
    });
});
