/**
 * Drugs Data Source Contract Tests
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

let DrugsDataSource: typeof import('../index').DrugsDataSource;

beforeAll(async () => {
    const mod = await import('../index');
    DrugsDataSource = mod.DrugsDataSource;
});

// ============================================================================
// Tests
// ============================================================================

describe('Drugs data source contract', () => {
    it('satisfies DataSourceDefinition structure', () => {
        expect(DrugsDataSource.id).toBe('drugs');
        expect(DrugsDataSource.tools).toBeDefined();
        expect(typeof DrugsDataSource.agent.createAgent).toBe('function');
        expect(DrugsDataSource.agent.id).toBe('drugsAgent');
        expect(typeof DrugsDataSource.agent.name).toBe('string');
        expect(typeof DrugsDataSource.agent.description).toBe('string');
        expect(typeof DrugsDataSource.agent.instructions).toBe('string');
        expect(typeof DrugsDataSource.routingHint).toBe('string');
        expect(DrugsDataSource.display).toBeDefined();
        expect(typeof DrugsDataSource.display.label).toBe('string');
        expect(DrugsDataSource.display.icon).toBeDefined();
        expect(DrugsDataSource.display.badge).toBeDefined();
    });

    it('all translation keys exist in tools', () => {
        for (const key of Object.keys(DrugsDataSource.translations)) {
            expect(DrugsDataSource.tools).toHaveProperty(key);
        }
    });

    it('all sourceResolver keys exist in tools', () => {
        for (const key of Object.keys(DrugsDataSource.sourceResolvers)) {
            expect(DrugsDataSource.tools).toHaveProperty(key);
        }
    });

    it('agent factory returns Agent with id drugsAgent', () => {
        const agent = DrugsDataSource.agent.createAgent('openrouter/test/model');
        expect(agent.id).toBe('drugsAgent');
    });

    it('source resolvers return null for failed output', () => {
        for (const resolver of Object.values(DrugsDataSource.sourceResolvers)) {
            if (!resolver) continue;
            expect(resolver({}, { success: false })).toBeNull();
        }
    });

    it('source resolvers return ToolSource for valid output', () => {
        for (const resolver of Object.values(DrugsDataSource.sourceResolvers)) {
            if (!resolver) continue;
            const result = resolver(
                { searchedResourceName: 'test' },
                { success: true, apiUrl: 'https://example.com/api', portalUrl: 'https://example.com' },
            );
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('title');
            expect(result).toHaveProperty('urlType');
        }
    });

    it('no tool output schema includes searchedResourceName', () => {
        for (const [name, tool] of Object.entries(DrugsDataSource.tools)) {
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

    it('tools contain expected drugs tool names', () => {
        const expectedTools = [
            'searchDrugByName',
            'searchDrugBySymptom',
            'exploreGenericAlternatives',
            'exploreTherapeuticCategories',
            'browseSymptoms',
            'getDrugDetails',
            'suggestDrugNames',
            'generateDrugsSourceUrl',
        ];
        for (const name of expectedTools) {
            expect(DrugsDataSource.tools).toHaveProperty(name);
        }
    });

    it('translations include icons as components (LucideIcon), not JSX elements', () => {
        for (const [key, translation] of Object.entries(DrugsDataSource.translations)) {
            if (!translation) continue;
            expect(translation.icon).toBeDefined();
            expect(translation.icon).not.toHaveProperty(
                '$$typeof',
                `Translation "${key}" icon should be a LucideIcon component, not a JSX element`,
            );
        }
    });
});
