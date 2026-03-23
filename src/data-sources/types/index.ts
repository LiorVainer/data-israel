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
    type ToolOutputSchemaType,
} from './tool-schemas';

// Display types
export type { DataSource, DataSourceConfig, AgentDisplayInfo } from './display.types';

// Tool types
export type { ToolSource, ToolSourceResolver, ToolTranslation } from './tool.types';

// Data source definition
export type { DataSourceDefinition } from './data-source.types';
