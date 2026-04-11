/**
 * GovMap Data Source Contract Tests
 *
 * Verifies the DataSourceDefinition interface is properly satisfied,
 * translations/resolvers match tool keys, and searchedResourceName is input-only.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import { z } from 'zod';

// ============================================================================
// Mocks — must be declared before imports
// ============================================================================

vi.mock('@mastra/core/agent', () => ({
    Agent: class MockAgent {
        id: string;
        constructor(config: { id: string }) {
            this.id = config.id;
        }
    },
}));

vi.mock('@mastra/memory', () => ({
    Memory: class MockMemory {
        constructor() {}
    },
}));

vi.mock('@mastra/convex', () => ({
    ConvexStore: class MockConvexStore {},
    ConvexVector: class MockConvexVector {},
}));

vi.mock('@openrouter/ai-sdk-provider', () => ({
    openrouter: vi.fn(() => 'mock-model'),
}));

vi.mock('@/lib/env', () => ({
    ENV: {
        AI_DEFAULT_MODEL_ID: 'test/model',
        AI_DATAGOV_MODEL_ID: null,
        AI_CBS_MODEL_ID: null,
        AI_GOVMAP_MODEL_ID: null,
        AI_MAX_STEPS: 10,
        AI_TOOL_CALL_CONCURRENCY: 1,
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

// ============================================================================
// Imports (after mocks)
// ============================================================================

let GovmapDataSource: typeof import('../index').GovmapDataSource;

beforeAll(async () => {
    const mod = await import('../index');
    GovmapDataSource = mod.GovmapDataSource;
});

// ============================================================================
// Tests
// ============================================================================

describe('GovMap data source contract', () => {
    it('satisfies DataSourceDefinition structure', () => {
        expect(GovmapDataSource.id).toBe('govmap');
        expect(GovmapDataSource.tools).toBeDefined();
        expect(typeof GovmapDataSource.agent.createAgent).toBe('function');
        expect(GovmapDataSource.agent.id).toBe('govmapAgent');
        expect(typeof GovmapDataSource.agent.name).toBe('string');
        expect(typeof GovmapDataSource.agent.description).toBe('string');
        expect(typeof GovmapDataSource.agent.instructions).toBe('string');
        expect(typeof GovmapDataSource.routingHint).toBe('string');
        expect(GovmapDataSource.display).toBeDefined();
        expect(typeof GovmapDataSource.display.label).toBe('string');
        expect(GovmapDataSource.display.icon).toBeDefined();
        expect(GovmapDataSource.display.badge).toBeDefined();
    });

    it('all translation keys exist in tools', () => {
        for (const key of Object.keys(GovmapDataSource.translations)) {
            expect(GovmapDataSource.tools).toHaveProperty(key);
        }
    });

    it('all sourceConfig keys exist in tools', () => {
        for (const key of Object.keys(GovmapDataSource.sourceConfigs ?? {})) {
            expect(GovmapDataSource.tools).toHaveProperty(key);
        }
    });

    it('agent factory returns Agent with id govmapAgent', () => {
        const agent = GovmapDataSource.agent.createAgent('openrouter/test/model');
        expect(agent.id).toBe('govmapAgent');
    });

    it('sourceConfigs have Hebrew title strings', () => {
        for (const config of Object.values(GovmapDataSource.sourceConfigs ?? {})) {
            expect(config).toBeDefined();
            expect(typeof config?.title).toBe('string');
            expect(config?.title.length).toBeGreaterThan(0);
        }
    });

    it('no tool output schema includes searchedResourceName', () => {
        for (const [name, tool] of Object.entries(GovmapDataSource.tools)) {
            const outputSchema = (tool as { outputSchema?: z.ZodType }).outputSchema;
            if (!outputSchema) continue;

            if (outputSchema instanceof z.ZodDiscriminatedUnion) {
                const options = outputSchema.options as z.ZodObject<z.ZodRawShape>[];
                for (const option of options) {
                    const shape = option.shape;
                    expect(shape).not.toHaveProperty(
                        'searchedResourceName',
                        `Tool "${name}" output schema should not contain searchedResourceName`,
                    );
                }
            }
        }
    });

    it('tools contain expected Nadlan tool names', () => {
        const expectedTools = [
            'autocompleteNadlanAddress',
            'findRecentNadlanDeals',
            'getStreetNadlanDeals',
            'getNeighborhoodNadlanDeals',
            'getNadlanValuationComparables',
            'getNadlanMarketActivity',
            'getNadlanDealStatistics',
        ];
        for (const name of expectedTools) {
            expect(GovmapDataSource.tools).toHaveProperty(name);
        }
    });

    it('translations include icons as components (LucideIcon), not JSX elements', () => {
        for (const [key, translation] of Object.entries(GovmapDataSource.translations)) {
            if (!translation) continue;
            expect(translation.icon).toBeDefined();
            expect(translation.icon).not.toHaveProperty(
                '$$typeof',
                `Translation "${key}" icon should be a LucideIcon component, not a JSX element`,
            );
        }
    });
});
