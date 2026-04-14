/**
 * Data Sources — Shared Types
 *
 * Re-exports all type definitions and Zod schema fragments.
 */

// Zod schema fragments (runtime)
export {
    commonToolInput,
    externalUrls,
    commonSuccessOutput,
    commonErrorOutput,
    toolOutputSchema,
    type CommonToolInput,
    type CommonSuccessOutput,
    type ToolOutputSchemaType,
} from './tool-schemas';

// Display types
export { DATA_SOURCES_CATEGORIES } from './display.types';
export type {
    DataSource,
    DataSourceConfig,
    AgentDisplayInfo,
    DataSourceCategory,
    LandingConfig,
    SuggestionPrompt,
    SuggestionsConfig,
} from './display.types';

// Tool types
export type {
    ToolSource,
    ToolSourceConfig,
    ToolSourceResolver,
    ToolResourceExtractor,
    ToolTranslation,
} from './tool.types';

// Data source definition
export type { DataSourceDefinition } from './data-source.types';
