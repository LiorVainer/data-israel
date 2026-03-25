/**
 * Health Data Source Contract Tests
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
        AI_DRUGS_MODEL_ID: null,
        AI_HEALTH_MODEL_ID: null,
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

let HealthDataSource: typeof import('../index').HealthDataSource;

beforeAll(async () => {
    const mod = await import('../index');
    HealthDataSource = mod.HealthDataSource;
});

// ============================================================================
// Tests
// ============================================================================

describe('Health data source contract', () => {
    it('satisfies DataSourceDefinition structure', () => {
        expect(HealthDataSource.id).toBe('health');
        expect(HealthDataSource.tools).toBeDefined();
        expect(typeof HealthDataSource.agent.createAgent).toBe('function');
        expect(HealthDataSource.agent.id).toBe('healthAgent');
        expect(typeof HealthDataSource.agent.name).toBe('string');
        expect(typeof HealthDataSource.agent.description).toBe('string');
        expect(typeof HealthDataSource.agent.instructions).toBe('string');
        expect(typeof HealthDataSource.routingHint).toBe('string');
        expect(HealthDataSource.display).toBeDefined();
        expect(typeof HealthDataSource.display.label).toBe('string');
        expect(HealthDataSource.display.icon).toBeDefined();
        expect(HealthDataSource.display.badge).toBeDefined();
    });

    it('all translation keys exist in tools', () => {
        for (const key of Object.keys(HealthDataSource.translations)) {
            expect(HealthDataSource.tools).toHaveProperty(key);
        }
    });

    it('all sourceResolver keys exist in tools', () => {
        for (const key of Object.keys(HealthDataSource.sourceResolvers)) {
            expect(HealthDataSource.tools).toHaveProperty(key);
        }
    });

    it('agent factory returns Agent with id healthAgent', () => {
        const agent = HealthDataSource.agent.createAgent('openrouter/test/model');
        expect(agent.id).toBe('healthAgent');
    });

    it('source resolvers return null for failed output', () => {
        for (const resolver of Object.values(HealthDataSource.sourceResolvers)) {
            if (!resolver) continue;
            expect(resolver({}, { success: false })).toBeNull();
        }
    });

    it('source resolvers return ToolSource for valid output with apiUrl', () => {
        for (const resolver of Object.values(HealthDataSource.sourceResolvers)) {
            if (!resolver) continue;
            const result = resolver(
                { searchedResourceName: 'test' },
                { success: true, apiUrl: 'https://example.com/api' },
            );
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('title');
            expect(result).toHaveProperty('urlType');
        }
    });

    it('no tool output schema includes searchedResourceName', () => {
        for (const [name, tool] of Object.entries(HealthDataSource.tools)) {
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

    it('tools contain expected health tool names', () => {
        const expectedTools = [
            'getAvailableSubjects',
            'getHealthMetadata',
            'getHealthData',
            'getHealthLinks',
            'generateHealthSourceUrl',
        ];
        for (const name of expectedTools) {
            expect(HealthDataSource.tools).toHaveProperty(name);
        }
    });

    it('translations include icons as components (LucideIcon), not JSX elements', () => {
        for (const [key, translation] of Object.entries(HealthDataSource.translations)) {
            if (!translation) continue;
            expect(translation.icon).toBeDefined();
            expect(translation.icon).not.toHaveProperty(
                '$$typeof',
                `Translation "${key}" icon should be a LucideIcon component, not a JSX element`,
            );
        }
    });
});
