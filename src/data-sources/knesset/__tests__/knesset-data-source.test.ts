/**
 * Knesset Data Source Contract Tests
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

let KnessetDataSource: typeof import('../index').KnessetDataSource;

beforeAll(async () => {
    const mod = await import('../index');
    KnessetDataSource = mod.KnessetDataSource;
});

// ============================================================================
// Tests
// ============================================================================

describe('Knesset data source contract', () => {
    it('satisfies DataSourceDefinition structure', () => {
        expect(KnessetDataSource.id).toBe('knesset');
        expect(KnessetDataSource.tools).toBeDefined();
        expect(typeof KnessetDataSource.agent.createAgent).toBe('function');
        expect(KnessetDataSource.agent.id).toBe('knessetAgent');
        expect(typeof KnessetDataSource.agent.name).toBe('string');
        expect(typeof KnessetDataSource.agent.description).toBe('string');
        expect(typeof KnessetDataSource.agent.instructions).toBe('string');
        expect(typeof KnessetDataSource.routingHint).toBe('string');
        expect(KnessetDataSource.display).toBeDefined();
        expect(typeof KnessetDataSource.display.label).toBe('string');
        expect(KnessetDataSource.display.icon).toBeDefined();
        expect(KnessetDataSource.display.badge).toBeDefined();
    });

    it('all translation keys exist in tools', () => {
        for (const key of Object.keys(KnessetDataSource.translations)) {
            expect(KnessetDataSource.tools).toHaveProperty(key);
        }
    });

    it('all sourceConfig keys exist in tools', () => {
        for (const key of Object.keys(KnessetDataSource.sourceConfigs ?? {})) {
            expect(KnessetDataSource.tools).toHaveProperty(key);
        }
    });

    it('agent factory returns Agent with id knessetAgent', () => {
        const agent = KnessetDataSource.agent.createAgent('openrouter/test/model');
        expect(agent.id).toBe('knessetAgent');
    });

    it('sourceConfigs have Hebrew title strings', () => {
        for (const config of Object.values(KnessetDataSource.sourceConfigs ?? {})) {
            expect(config).toBeDefined();
            expect(typeof config?.title).toBe('string');
            expect(config?.title.length).toBeGreaterThan(0);
        }
    });

    it('no tool output schema includes searchedResourceName', () => {
        for (const [name, tool] of Object.entries(KnessetDataSource.tools)) {
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

    it('tools contain expected Knesset tool names', () => {
        const expectedTools = [
            'searchKnessetBills',
            'getKnessetBillInfo',
            'getKnessetCommitteeInfo',
            'listKnessetCommittees',
            'getKnessetMembers',
            'getCurrentKnesset',
        ];
        for (const name of expectedTools) {
            expect(KnessetDataSource.tools).toHaveProperty(name);
        }
    });

    it('translations include icons as components (LucideIcon), not JSX elements', () => {
        for (const [key, translation] of Object.entries(KnessetDataSource.translations)) {
            if (!translation) continue;
            expect(translation.icon).toBeDefined();
            expect(translation.icon).not.toHaveProperty(
                '$$typeof',
                `Translation "${key}" icon should be a LucideIcon component, not a JSX element`,
            );
        }
    });
});
