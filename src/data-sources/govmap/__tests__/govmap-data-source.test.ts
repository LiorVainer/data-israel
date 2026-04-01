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

    it('all sourceResolver keys exist in tools', () => {
        for (const key of Object.keys(GovmapDataSource.sourceResolvers)) {
            expect(GovmapDataSource.tools).toHaveProperty(key);
        }
    });

    it('agent factory returns Agent with id govmapAgent', () => {
        const agent = GovmapDataSource.agent.createAgent('openrouter/test/model');
        expect(agent.id).toBe('govmapAgent');
    });

    it('source resolvers return null for failed output', () => {
        for (const resolver of Object.values(GovmapDataSource.sourceResolvers)) {
            if (!resolver) continue;
            expect(resolver({}, { success: false })).toBeNull();
        }
    });

    it('source resolvers return ToolSource for valid output with portalUrl or apiUrl', () => {
        for (const resolver of Object.values(GovmapDataSource.sourceResolvers)) {
            if (!resolver) continue;
            // Test with portalUrl (used by findRecentDeals, etc.)
            const portalResult = resolver(
                { searchedResourceName: 'test' },
                { success: true, portalUrl: 'https://www.govmap.gov.il/?lay=REALESTATE' },
            );
            // Test with apiUrl (used by getStreetDeals, etc.)
            const apiResult = resolver(
                { searchedResourceName: 'test' },
                { success: true, apiUrl: 'https://www.govmap.gov.il/api/real-estate/street-deals/123' },
            );
            // At least one should succeed
            const result = portalResult ?? apiResult;
            expect(result).not.toBeNull();
            if (result) {
                expect(result).toHaveProperty('url');
                expect(result).toHaveProperty('title');
                expect(result).toHaveProperty('urlType');
            }
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
            'generateNadlanSourceUrl',
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
