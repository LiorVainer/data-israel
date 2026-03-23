/**
 * DataGov Data Source Contract Tests
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
        const proxy: Record<string, unknown> = new Proxy({}, {
            get: () => vi.fn(() => proxy),
        });
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

let DataGovDataSource: typeof import('../index').DataGovDataSource;

beforeAll(async () => {
    const mod = await import('../index');
    DataGovDataSource = mod.DataGovDataSource;
});

// ============================================================================
// Tests
// ============================================================================

describe('DataGov data source contract', () => {
    it('satisfies DataSourceDefinition structure', () => {
        expect(DataGovDataSource.id).toBe('datagov');
        expect(DataGovDataSource.tools).toBeDefined();
        expect(typeof DataGovDataSource.agent.createAgent).toBe('function');
        expect(DataGovDataSource.agent.id).toBe('datagovAgent');
        expect(typeof DataGovDataSource.agent.name).toBe('string');
        expect(typeof DataGovDataSource.agent.description).toBe('string');
        expect(typeof DataGovDataSource.agent.instructions).toBe('string');
        expect(typeof DataGovDataSource.routingHint).toBe('string');
        expect(DataGovDataSource.display).toBeDefined();
        expect(typeof DataGovDataSource.display.label).toBe('string');
        // LucideIcon is a forwardRef component — typeof may be 'function' or 'object'
        expect(DataGovDataSource.display.icon).toBeDefined();
        expect(DataGovDataSource.display.badge).toBeDefined();
    });

    it('all translation keys exist in tools', () => {
        for (const key of Object.keys(DataGovDataSource.translations)) {
            expect(DataGovDataSource.tools).toHaveProperty(key);
        }
    });

    it('all sourceResolver keys exist in tools', () => {
        for (const key of Object.keys(DataGovDataSource.sourceResolvers)) {
            expect(DataGovDataSource.tools).toHaveProperty(key);
        }
    });

    it('agent factory returns Agent with id datagovAgent', () => {
        const agent = DataGovDataSource.agent.createAgent('openrouter/test/model');
        expect(agent.id).toBe('datagovAgent');
    });

    it('source resolvers return null for failed output', () => {
        for (const resolver of Object.values(DataGovDataSource.sourceResolvers)) {
            if (!resolver) continue;
            expect(resolver({}, { success: false })).toBeNull();
        }
    });

    it('source resolvers return ToolSource for valid output with portalUrl or apiUrl', () => {
        for (const [key, resolver] of Object.entries(DataGovDataSource.sourceResolvers)) {
            if (!resolver) continue;

            // queryDatastoreResource uses apiUrl, others use portalUrl
            const output =
                key === 'queryDatastoreResource'
                    ? { success: true, apiUrl: 'https://data.gov.il/api/3/action/datastore_search' }
                    : { success: true, portalUrl: 'https://data.gov.il/he/datasets/org/dataset' };

            const result = resolver({ searchedResourceName: 'test' }, output);
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('title');
            expect(result).toHaveProperty('urlType');
        }
    });

    it('no tool output schema includes searchedResourceName', () => {
        for (const [name, tool] of Object.entries(DataGovDataSource.tools)) {
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

    it('tools contain expected DataGov tool names', () => {
        const expectedTools = [
            'searchDatasets',
            'listAllDatasets',
            'getDatasetDetails',
            'getDatasetActivity',
            'getDatasetSchema',
            'listOrganizations',
            'getOrganizationDetails',
            'getOrganizationActivity',
            'listGroups',
            'listTags',
            'searchResources',
            'getResourceDetails',
            'queryDatastoreResource',
            'getStatus',
            'listLicenses',
            'generateDataGovSourceUrl',
        ];
        for (const name of expectedTools) {
            expect(DataGovDataSource.tools).toHaveProperty(name);
        }
    });

    it('translations include icons as components (LucideIcon), not JSX elements', () => {
        for (const [key, translation] of Object.entries(DataGovDataSource.translations)) {
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
