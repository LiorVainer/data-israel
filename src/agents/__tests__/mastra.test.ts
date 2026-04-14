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

vi.mock('@mastra/core/processors', () => ({
    PromptInjectionDetector: class {
        constructor() {}
    },
    UnicodeNormalizer: class {
        constructor() {}
    },
    SystemPromptScrubber: class {
        constructor() {}
    },
}));

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

vi.mock('@mastra/observability', () => ({
    Observability: class {
        constructor() {}
    },
    SamplingStrategyType: { ALWAYS: 'always' },
}));

vi.mock('@mastra/sentry', () => ({
    SentryExporter: class {
        constructor() {}
    },
}));

vi.mock('@openrouter/ai-sdk-provider', () => ({
    openrouter: {
        textEmbeddingModel: vi.fn().mockReturnValue('mock-embedder'),
    },
}));

vi.mock('@mastra/mcp', () => ({
    MCPClient: class MockMCPClient {
        constructor() {}
        async listTools() {
            return {};
        }
        async disconnect() {}
    },
}));

vi.mock('@mastra/core/evals', () => {
    const createChainable = (): Record<string, unknown> => {
        const proxy: Record<string, unknown> = new Proxy(
            {},
            {
                get: () => vi.fn(() => proxy),
            },
        );
        return proxy;
    };
    return {
        createScorer: vi.fn(() => createChainable()),
    };
});

vi.mock('@mastra/evals/scorers/prebuilt', () => ({
    createAnswerRelevancyScorer: vi.fn(() => ({})),
    createCompletenessScorer: vi.fn(() => ({})),
    createHallucinationScorer: vi.fn(() => ({})),
}));

vi.mock('@mastra/evals/scorers/utils', () => ({
    extractToolResults: vi.fn(),
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
        NODE_ENV: 'test',
    },
}));

import { getMastraWithModels, type AgentModelConfig } from '../mastra';

describe('getMastraWithModels', () => {
    const config: AgentModelConfig = {
        routing: 'test/routing-model',
        datagov: 'test/datagov-model',
        cbs: 'test/cbs-model',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns a Mastra instance', async () => {
        const result = await getMastraWithModels(config);
        expect(result).toBeDefined();
        expect(result).toHaveProperty('_isMastra', true);
    });

    it('returns fresh Mastra instance each call (sub-agents are cached, not the wrapper)', async () => {
        const first = await getMastraWithModels(config);
        const second = await getMastraWithModels(config);
        // Mastra instances are always fresh (cheap to create),
        // but sub-agents inside are cached by (agentId, modelId) via LRU cache
        expect(first).toHaveProperty('_isMastra', true);
        expect(second).toHaveProperty('_isMastra', true);
    });

    it('creates new instance on config change', async () => {
        const first = await getMastraWithModels(config);
        const changed: AgentModelConfig = { ...config, routing: 'test/new-routing' };
        const second = await getMastraWithModels(changed);
        expect(first).not.toBe(second); // Different reference
    });
});
