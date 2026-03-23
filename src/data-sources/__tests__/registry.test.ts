/**
 * Registry Tests
 *
 * Verifies the central data source registry aggregation:
 * - allDataSourceTools contains tools from all data sources
 * - getToolDataSource resolves tool → source ID correctly
 * - resolveToolSourceUrl delegates to correct resolver
 * - getAllTranslations merges per-source + auto-generated agent entries
 * - buildRoutingHints includes all agent IDs
 * - dataSourceAgents has entries for all registered data sources
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
    ConvexStore: class MockConvexStore {
        constructor() {}
    },
    ConvexVector: class MockConvexVector {
        constructor() {}
    },
}));

vi.mock('@openrouter/ai-sdk-provider', () => ({
    openrouter: {
        textEmbeddingModel: vi.fn(),
    },
}));

vi.mock('@/lib/env', () => ({
    ENV: {
        AI_DEFAULT_MODEL_ID: 'test/model',
        AI_DATAGOV_MODEL_ID: null,
        AI_CBS_MODEL_ID: null,
        AI_MAX_STEPS: 30,
        AI_TOOL_CALL_CONCURRENCY: 3,
        NEXT_PUBLIC_CONVEX_URL: undefined,
        CONVEX_ADMIN_KEY: undefined,
        NODE_ENV: 'test',
    },
}));

// ============================================================================
// Tests
// ============================================================================

describe('Data Source Registry', () => {
    let registry: typeof import('../registry');
    let serverRegistry: typeof import('../registry.server');

    beforeAll(async () => {
        registry = await import('../registry');
        serverRegistry = await import('../registry.server');
    });

    describe('allDataSourceTools', () => {
        it('contains CBS tools', () => {
            expect(registry.allDataSourceTools).toHaveProperty('browseCbsCatalog');
            expect(registry.allDataSourceTools).toHaveProperty('getCbsSeriesData');
            expect(registry.allDataSourceTools).toHaveProperty('calculateCbsPriceIndex');
        });

        it('contains DataGov tools', () => {
            expect(registry.allDataSourceTools).toHaveProperty('searchDatasets');
            expect(registry.allDataSourceTools).toHaveProperty('getDatasetDetails');
            expect(registry.allDataSourceTools).toHaveProperty('queryDatastoreResource');
        });
    });

    describe('getToolDataSource', () => {
        it('returns "cbs" for CBS tools', () => {
            expect(registry.getToolDataSource('browseCbsCatalog')).toBe('cbs');
        });

        it('returns "datagov" for DataGov tools', () => {
            expect(registry.getToolDataSource('searchDatasets')).toBe('datagov');
        });

        it('returns "cbs" for agent-cbsAgent', () => {
            expect(registry.getToolDataSource('agent-cbsAgent')).toBe('cbs');
        });

        it('returns "datagov" for agent-datagovAgent', () => {
            expect(registry.getToolDataSource('agent-datagovAgent')).toBe('datagov');
        });

        it('returns undefined for unknown tools', () => {
            expect(registry.getToolDataSource('unknownTool')).toBeUndefined();
        });
    });

    describe('resolveToolSourceUrl', () => {
        it('returns null for tools without resolver', () => {
            const result = registry.resolveToolSourceUrl('tool-searchDatasets', {}, { success: true });
            expect(result).toBeNull();
        });

        it('returns null for failed tool output', () => {
            const result = registry.resolveToolSourceUrl(
                'tool-getCbsSeriesData',
                { searchedResourceName: 'test' },
                { success: false, error: 'fail' },
            );
            expect(result).toBeNull();
        });
    });

    describe('getAllTranslations', () => {
        it('includes CBS translations', () => {
            const translations = registry.getAllTranslations();
            expect(translations).toHaveProperty('browseCbsCatalog');
            expect(translations.browseCbsCatalog?.name).toBe('חיפוש בנושאי הלמ"ס');
        });

        it('includes DataGov translations', () => {
            const translations = registry.getAllTranslations();
            expect(translations).toHaveProperty('searchDatasets');
            expect(translations.searchDatasets?.name).toBe('חיפוש מאגרי מידע');
        });

        it('includes auto-generated agent-cbsAgent entry', () => {
            const translations = registry.getAllTranslations();
            expect(translations).toHaveProperty('agent-cbsAgent');
        });

        it('includes auto-generated agent-datagovAgent entry', () => {
            const translations = registry.getAllTranslations();
            expect(translations).toHaveProperty('agent-datagovAgent');
        });

        it('auto-generated agent translations use display.label as name', () => {
            const translations = registry.getAllTranslations();
            const cbsEntry = translations['agent-cbsAgent'];
            expect(cbsEntry).toBeDefined();
            // Name should come from display.label
            expect(typeof cbsEntry!.name).toBe('string');
            expect(cbsEntry!.name.length).toBeGreaterThan(0);
        });

        it('auto-generated agent translations use display.icon as icon', () => {
            const translations = registry.getAllTranslations();
            const datagovEntry = translations['agent-datagovAgent'];
            expect(datagovEntry).toBeDefined();
            // Icon should be a LucideIcon (function or ForwardRef object with $$typeof)
            const icon = datagovEntry!.icon;
            expect(typeof icon === 'function' || (typeof icon === 'object' && icon !== null)).toBe(true);
        });
    });

    describe('buildRoutingHints', () => {
        it('returns string containing cbsAgent', () => {
            const hints = registry.buildRoutingHints();
            expect(hints).toContain('cbsAgent');
        });

        it('returns string containing datagovAgent', () => {
            const hints = registry.buildRoutingHints();
            expect(hints).toContain('datagovAgent');
        });
    });

    describe('dataSourceAgents (from registry.server)', () => {
        it('has entries for all registered data sources', () => {
            expect(serverRegistry.dataSourceAgents).toHaveProperty('cbsAgent');
            expect(serverRegistry.dataSourceAgents).toHaveProperty('datagovAgent');
        });

        it('agent entries have createAgent function', () => {
            expect(typeof serverRegistry.dataSourceAgents.cbsAgent.createAgent).toBe('function');
            expect(typeof serverRegistry.dataSourceAgents.datagovAgent.createAgent).toBe('function');
        });
    });

    describe('DATA_SOURCE_CONFIG', () => {
        it('has config for cbs', () => {
            expect(registry.DATA_SOURCE_CONFIG).toHaveProperty('cbs');
            expect(registry.DATA_SOURCE_CONFIG.cbs.urlLabel).toBe('cbs.gov.il');
        });

        it('has config for datagov', () => {
            expect(registry.DATA_SOURCE_CONFIG).toHaveProperty('datagov');
            expect(registry.DATA_SOURCE_CONFIG.datagov.urlLabel).toBe('data.gov.il');
        });
    });
});
