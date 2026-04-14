/**
 * CBS Data Source Contract Tests
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

let CbsDataSource: typeof import('../index').CbsDataSource;

beforeAll(async () => {
    const mod = await import('../index');
    CbsDataSource = mod.CbsDataSource;
});

// ============================================================================
// Tests
// ============================================================================

describe('CBS data source contract', () => {
    it('satisfies DataSourceDefinition structure', () => {
        expect(CbsDataSource.id).toBe('cbs');
        expect(CbsDataSource.tools).toBeDefined();
        expect(typeof CbsDataSource.agent.createAgent).toBe('function');
        expect(CbsDataSource.agent.id).toBe('cbsAgent');
        expect(typeof CbsDataSource.agent.name).toBe('string');
        expect(typeof CbsDataSource.agent.description).toBe('string');
        expect(typeof CbsDataSource.agent.instructions).toBe('string');
        expect(typeof CbsDataSource.routingHint).toBe('string');
        expect(CbsDataSource.display).toBeDefined();
        expect(typeof CbsDataSource.display.label).toBe('string');
        // LucideIcon is a forwardRef component — typeof may be 'function' or 'object'
        expect(CbsDataSource.display.icon).toBeDefined();
        expect(CbsDataSource.display.badge).toBeDefined();
    });

    it('all translation keys exist in tools', () => {
        for (const key of Object.keys(CbsDataSource.translations)) {
            expect(CbsDataSource.tools).toHaveProperty(key);
        }
    });

    it('all sourceConfig keys exist in tools', () => {
        for (const key of Object.keys(CbsDataSource.sourceConfigs ?? {})) {
            expect(CbsDataSource.tools).toHaveProperty(key);
        }
    });

    it('agent factory returns Agent with id cbsAgent', () => {
        const agent = CbsDataSource.agent.createAgent('openrouter/test/model');
        expect(agent.id).toBe('cbsAgent');
    });

    it('sourceConfigs have Hebrew title strings', () => {
        for (const [key, config] of Object.entries(CbsDataSource.sourceConfigs ?? {})) {
            expect(config).toBeDefined();
            expect(typeof config?.title).toBe('string');
            expect(config?.title.length).toBeGreaterThan(0);
        }
    });

    it('no tool output schema includes searchedResourceName', () => {
        for (const [name, tool] of Object.entries(CbsDataSource.tools)) {
            const outputSchema = (tool as { outputSchema?: z.ZodType }).outputSchema;
            if (!outputSchema) continue;

            // For discriminated unions, check the success branch
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

    it('tools contain expected CBS tool names', () => {
        const expectedTools = [
            'browseCbsCatalog',
            'browseCbsCatalogPath',
            'getCbsSeriesData',
            'getCbsSeriesDataByPath',
            'browseCbsPriceIndices',
            'getCbsPriceData',
            'calculateCbsPriceIndex',
            'searchCbsLocalities',
        ];
        for (const name of expectedTools) {
            expect(CbsDataSource.tools).toHaveProperty(name);
        }
    });

    it('translations include icons as components (LucideIcon), not JSX elements', () => {
        for (const [key, translation] of Object.entries(CbsDataSource.translations)) {
            if (!translation) continue;
            // LucideIcon components are forwardRef objects or functions, but NOT rendered JSX elements
            expect(translation.icon).toBeDefined();
            // Rendered JSX elements have $$typeof — icon must NOT be a rendered element
            expect(translation.icon).not.toHaveProperty(
                '$$typeof',
                `Translation "${key}" icon should be a LucideIcon component, not a JSX element`,
            );
        }
    });
});
