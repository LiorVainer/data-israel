/**
 * Rami Levy Data Source Contract Tests
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
        AI_RAMI_LEVY_MODEL_ID: null,
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

let RamiLevyDataSource: typeof import('../index').RamiLevyDataSource;

beforeAll(async () => {
    const mod = await import('../index');
    RamiLevyDataSource = mod.RamiLevyDataSource;
});

// ============================================================================
// Tests
// ============================================================================

describe('Rami Levy data source contract', () => {
    it('satisfies DataSourceDefinition structure', () => {
        expect(RamiLevyDataSource.id).toBe('rami-levy');
        expect(RamiLevyDataSource.tools).toBeDefined();
        expect(typeof RamiLevyDataSource.agent.createAgent).toBe('function');
        expect(RamiLevyDataSource.agent.id).toBe('ramiLevyAgent');
        expect(typeof RamiLevyDataSource.agent.name).toBe('string');
        expect(typeof RamiLevyDataSource.agent.description).toBe('string');
        expect(typeof RamiLevyDataSource.agent.instructions).toBe('string');
        expect(typeof RamiLevyDataSource.routingHint).toBe('string');
        expect(RamiLevyDataSource.display).toBeDefined();
        expect(typeof RamiLevyDataSource.display.label).toBe('string');
        expect(RamiLevyDataSource.display.icon).toBeDefined();
        expect(RamiLevyDataSource.display.badge).toBeDefined();
    });

    it('all translation keys exist in tools', () => {
        for (const key of Object.keys(RamiLevyDataSource.translations)) {
            expect(RamiLevyDataSource.tools).toHaveProperty(key);
        }
    });

    it('sourceResolvers is empty (uses declarative sourceConfigs)', () => {
        expect(Object.keys(RamiLevyDataSource.sourceResolvers)).toHaveLength(0);
    });

    it('agent factory returns Agent with id ramiLevyAgent', () => {
        const agent = RamiLevyDataSource.agent.createAgent('openrouter/test/model');
        expect(agent.id).toBe('ramiLevyAgent');
    });

    it('no tool output schema includes searchedResourceName', () => {
        for (const [name, tool] of Object.entries(RamiLevyDataSource.tools)) {
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

    it('tools contain expected Rami Levy tool names', () => {
        const expectedTools = ['searchRamiLevyProducts'];
        for (const name of expectedTools) {
            expect(RamiLevyDataSource.tools).toHaveProperty(name);
        }
    });

    it('translations include icons as components (LucideIcon), not JSX elements', () => {
        for (const [key, translation] of Object.entries(RamiLevyDataSource.translations)) {
            if (!translation) continue;
            expect(translation.icon).toBeDefined();
            expect(translation.icon).not.toHaveProperty(
                '$$typeof',
                `Translation "${key}" icon should be a LucideIcon component, not a JSX element`,
            );
        }
    });
});
