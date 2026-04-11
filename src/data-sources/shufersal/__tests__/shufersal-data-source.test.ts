/**
 * Shufersal Data Source Contract Tests
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
        AI_KNESSET_MODEL_ID: null,
        AI_SHUFERSAL_MODEL_ID: null,
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

let ShufersalDataSource: typeof import('../index').ShufersalDataSource;

beforeAll(async () => {
    const mod = await import('../index');
    ShufersalDataSource = mod.ShufersalDataSource;
});

// ============================================================================
// Tests
// ============================================================================

describe('Shufersal data source contract', () => {
    it('satisfies DataSourceDefinition structure', () => {
        expect(ShufersalDataSource.id).toBe('shufersal');
        expect(ShufersalDataSource.tools).toBeDefined();
        expect(typeof ShufersalDataSource.agent.createAgent).toBe('function');
        expect(ShufersalDataSource.agent.id).toBe('shufersalAgent');
        expect(typeof ShufersalDataSource.agent.name).toBe('string');
        expect(typeof ShufersalDataSource.agent.description).toBe('string');
        expect(typeof ShufersalDataSource.agent.instructions).toBe('string');
        expect(typeof ShufersalDataSource.routingHint).toBe('string');
        expect(ShufersalDataSource.display).toBeDefined();
        expect(typeof ShufersalDataSource.display.label).toBe('string');
        expect(ShufersalDataSource.display.icon).toBeDefined();
        expect(ShufersalDataSource.display.badge).toBeDefined();
    });

    it('all translation keys exist in tools', () => {
        for (const key of Object.keys(ShufersalDataSource.translations)) {
            expect(ShufersalDataSource.tools).toHaveProperty(key);
        }
    });

    it('sourceResolvers is empty (uses declarative sourceConfigs)', () => {
        expect(Object.keys(ShufersalDataSource.sourceResolvers)).toHaveLength(0);
    });

    it('agent factory returns Agent with id shufersalAgent', () => {
        const agent = ShufersalDataSource.agent.createAgent('openrouter/test/model');
        expect(agent.id).toBe('shufersalAgent');
    });

    it('no tool output schema includes searchedResourceName', () => {
        for (const [name, tool] of Object.entries(ShufersalDataSource.tools)) {
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

    it('tools contain expected Shufersal tool names', () => {
        const expectedTools = ['searchShufersalProducts'];
        for (const name of expectedTools) {
            expect(ShufersalDataSource.tools).toHaveProperty(name);
        }
    });

    it('translations include icons as components (LucideIcon), not JSX elements', () => {
        for (const [key, translation] of Object.entries(ShufersalDataSource.translations)) {
            if (!translation) continue;
            expect(translation.icon).toBeDefined();
            expect(translation.icon).not.toHaveProperty(
                '$$typeof',
                `Translation "${key}" icon should be a LucideIcon component, not a JSX element`,
            );
        }
    });
});
