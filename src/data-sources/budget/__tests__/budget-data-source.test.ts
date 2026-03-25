/**
 * BudgetKey Data Source Contract Tests
 *
 * Verifies the data source definition structure, translation/resolver key alignment,
 * and agent factory behavior. MCP dependencies are mocked since tools are loaded
 * dynamically from the remote MCP server.
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';

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

vi.mock('@mastra/mcp', () => ({
    MCPClient: class MockMCPClient {
        constructor() {}
        async listTools() {
            return {
                budgetkey_DatasetInfo: { name: 'budgetkey_DatasetInfo' },
                budgetkey_DatasetFullTextSearch: { name: 'budgetkey_DatasetFullTextSearch' },
                budgetkey_DatasetDBQuery: { name: 'budgetkey_DatasetDBQuery' },
            };
        }
        async disconnect() {}
    },
}));

vi.mock('@/lib/env', () => ({
    ENV: {
        AI_DEFAULT_MODEL_ID: 'test/model',
        AI_DATAGOV_MODEL_ID: null,
        AI_CBS_MODEL_ID: null,
        AI_BUDGET_MODEL_ID: null,
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

let BudgetDataSource: typeof import('../index').BudgetDataSource;

beforeAll(async () => {
    const mod = await import('../index');
    BudgetDataSource = mod.BudgetDataSource;
});

// ============================================================================
// Tests
// ============================================================================

describe('BudgetKey data source contract', () => {
    it('satisfies DataSourceDefinition structure', () => {
        expect(BudgetDataSource.id).toBe('budget');
        expect(BudgetDataSource.tools).toBeDefined();
        expect(typeof BudgetDataSource.agent.createAgent).toBe('function');
        expect(BudgetDataSource.agent.id).toBe('budgetAgent');
        expect(typeof BudgetDataSource.agent.name).toBe('string');
        expect(typeof BudgetDataSource.agent.description).toBe('string');
        expect(typeof BudgetDataSource.agent.instructions).toBe('string');
        expect(typeof BudgetDataSource.routingHint).toBe('string');
        expect(BudgetDataSource.display).toBeDefined();
        expect(typeof BudgetDataSource.display.label).toBe('string');
        expect(BudgetDataSource.display.icon).toBeDefined();
        expect(BudgetDataSource.display.badge).toBeDefined();
    });

    it('all translation keys exist in tools', () => {
        for (const key of Object.keys(BudgetDataSource.translations)) {
            expect(BudgetDataSource.tools).toHaveProperty(key);
        }
    });

    it('all sourceResolver keys exist in tools', () => {
        for (const key of Object.keys(BudgetDataSource.sourceResolvers)) {
            expect(BudgetDataSource.tools).toHaveProperty(key);
        }
    });

    it('agent factory returns Agent with id budgetAgent (async)', async () => {
        const agent = await BudgetDataSource.agent.createAgent('openrouter/test/model');
        expect(agent.id).toBe('budgetAgent');
    });

    it('source resolvers return null for missing input', () => {
        for (const resolver of Object.values(BudgetDataSource.sourceResolvers)) {
            if (!resolver) continue;
            expect(resolver({}, {})).toBeNull();
        }
    });

    it('source resolvers return ToolSource for valid input', () => {
        const infoResolver = BudgetDataSource.sourceResolvers.budgetkey_DatasetInfo;
        if (infoResolver) {
            const result = infoResolver({ dataset: 'budget_items_data' }, {});
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('url');
            expect(result).toHaveProperty('title');
            expect(result).toHaveProperty('urlType');
        }

        const searchResolver = BudgetDataSource.sourceResolvers.budgetkey_DatasetFullTextSearch;
        if (searchResolver) {
            const result = searchResolver({ q: 'חינוך', dataset: 'budget_items_data' }, {});
            expect(result).not.toBeNull();
            expect(result).toHaveProperty('url');
        }

        const queryResolver = BudgetDataSource.sourceResolvers.budgetkey_DatasetDBQuery;
        if (queryResolver) {
            const result = queryResolver(
                { dataset: 'budget_items_data' },
                { download_url: 'https://next.obudget.org/download' },
            );
            expect(result).not.toBeNull();
            expect(result?.urlType).toBe('api');
        }
    });

    it('tools contain expected BudgetKey tool names', () => {
        const expectedTools = ['budgetkey_DatasetInfo', 'budgetkey_DatasetFullTextSearch', 'budgetkey_DatasetDBQuery'];
        for (const name of expectedTools) {
            expect(BudgetDataSource.tools).toHaveProperty(name);
        }
    });

    it('translations include icons as components (LucideIcon), not JSX elements', () => {
        for (const [key, translation] of Object.entries(BudgetDataSource.translations)) {
            if (!translation) continue;
            expect(translation.icon).toBeDefined();
            expect(translation.icon).not.toHaveProperty(
                '$$typeof',
                `Translation "${key}" icon should be a LucideIcon component, not a JSX element`,
            );
        }
    });

    it('badge config has required fields', () => {
        const badge = BudgetDataSource.display.badge;
        expect(badge.urlLabel).toBe('next.obudget.org');
        expect(badge.nameLabel).toBe('תקציב המדינה');
        expect(badge.url).toBe('https://next.obudget.org');
        expect(typeof badge.className).toBe('string');
    });
});
