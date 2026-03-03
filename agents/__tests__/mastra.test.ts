/**
 * Tests for agents/mastra.ts
 *
 * Verifies getMastraWithModels returns cached or fresh Mastra instances
 * based on the provided AgentModelConfig.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all heavy dependencies before importing the module under test

vi.mock('@mastra/core', () => {
    class MockMastra {
        _isMastra = true;
        constructor() {
            // no-op
        }
    }
    return { Mastra: MockMastra };
});

vi.mock('@mastra/core/agent', () => {
    class MockAgent {
        _isAgent = true;
        id: string;
        model: string;
        constructor(config: { id: string; model: string }) {
            this.id = config.id;
            this.model = config.model;
        }
    }
    return { Agent: MockAgent };
});

vi.mock('@mastra/memory', () => {
    class MockMemory {
        _isMemory = true;
    }
    return { Memory: MockMemory };
});

vi.mock('@mastra/convex', () => {
    class MockConvexStore {
        _isStore = true;
    }
    class MockConvexVector {
        _isVector = true;
    }
    return { ConvexStore: MockConvexStore, ConvexVector: MockConvexVector };
});

vi.mock('@openrouter/ai-sdk-provider', () => ({
    openrouter: {
        textEmbeddingModel: vi.fn().mockReturnValue('mock-embedder'),
    },
}));

vi.mock('@/lib/env', () => ({
    ENV: {
        AI_DEFAULT_MODEL_ID: 'test/default',
        AI_DATAGOV_MODEL_ID: undefined,
        AI_CBS_MODEL_ID: undefined,
        AI_MAX_STEPS: 25,
        AI_TOOL_CALL_CONCURRENCY: 10,
        NEXT_PUBLIC_CONVEX_URL: undefined,
        CONVEX_ADMIN_KEY: undefined,
    },
}));

vi.mock('@/lib/tools/datagov', () => ({ DataGovTools: {} }));
vi.mock('@/lib/tools/cbs', () => ({ CbsTools: {} }));
vi.mock('@/lib/tools/client', () => ({ ClientTools: {} }));

// Mock agent config modules
vi.mock('../network/datagov/config', () => ({
    DATAGOV_AGENT_CONFIG: { name: 'test-datagov', instructions: 'test' },
}));
vi.mock('../network/cbs/config', () => ({
    CBS_AGENT_CONFIG: { name: 'test-cbs', instructions: 'test' },
}));
vi.mock('../network/routing/config', () => ({
    ROUTING_CONFIG: { name: 'test-routing', instructions: 'test' },
}));

// Mock the static agent instances (they run at module init in the real files)
vi.mock('../network', () => ({
    routingAgent: { _isAgent: true, id: 'routingAgent' },
    datagovAgent: { _isAgent: true, id: 'datagovAgent' },
    cbsAgent: { _isAgent: true, id: 'cbsAgent' },
}));

// Mock the factory functions
vi.mock('../network/routing/routing.agent', () => ({
    createRoutingAgent: vi.fn().mockImplementation(() => ({
        _isAgent: true,
        id: 'routingAgent',
    })),
}));
vi.mock('../network/datagov/data-gov.agent', () => ({
    createDatagovAgent: vi.fn().mockImplementation(() => ({
        _isAgent: true,
        id: 'datagovAgent',
    })),
}));
vi.mock('../network/cbs/cbs.agent', () => ({
    createCbsAgent: vi.fn().mockImplementation(() => ({
        _isAgent: true,
        id: 'cbsAgent',
    })),
}));

import { getMastraWithModels, type AgentModelConfig } from '../mastra';

describe('getMastraWithModels', () => {
    const config: AgentModelConfig = {
        routing: 'test/routing-model',
        datagov: 'test/datagov-model',
        cbs: 'test/cbs-model',
    };

    beforeEach(() => {
        // Reset module-level cache by importing a fresh module on each test.
        // Since vi.resetModules() is heavy, we rely on distinct config objects
        // for the "creates new instance" test.
        vi.clearAllMocks();
    });

    it('returns a Mastra instance', () => {
        const result = getMastraWithModels(config);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('_isMastra', true);
    });

    it('caches instance for same config', () => {
        const first = getMastraWithModels(config);
        const second = getMastraWithModels(config);
        expect(first).toBe(second); // Same reference
    });

    it('creates new instance on config change', () => {
        const first = getMastraWithModels(config);
        const changed: AgentModelConfig = { ...config, routing: 'test/new-routing' };
        const second = getMastraWithModels(changed);
        expect(first).not.toBe(second); // Different reference
    });
});
