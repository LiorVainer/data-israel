/**
 * Tool Result Field Constants
 *
 * Defines which fields from sub-agent tool results are preserved
 * when stripping large data for storage/UI replay.
 *
 * Consumers: truncate-tool-results.processor.ts, app/api/chat/route.ts
 * UI readers: ToolCallParts.tsx, source-url-resolvers.ts, AgentInternalCallsChain.tsx
 */

// -- Tool result output fields (from tool execute() return values) --

/** Scalar fields preserved from tool result objects */
export const TOOL_RESULT_KEEP_FIELDS = [
    'success',
    'error',
    'searchedResourceName',
    'apiUrl',
    'portalUrl',
    'total',
] as const;

export type ToolResultKeepField = (typeof TOOL_RESULT_KEEP_FIELDS)[number];

/** Nested object fields — only these sub-keys are preserved */
export const TOOL_RESULT_KEEP_NESTED = {
    dataset: ['title', 'name'] as const,
    organization: ['title', 'name'] as const,
    resource: ['name'] as const,
} satisfies Record<string, readonly string[]>;

export type ToolResultNestedKey = keyof typeof TOOL_RESULT_KEEP_NESTED;

// -- Tool call args fields (from tool input schemas) --

/** Fields preserved from tool call args (inputs) */
export const TOOL_ARGS_KEEP_FIELDS = [
    'searchedResourceName',
    'q',
] as const;

export type ToolArgsKeepField = (typeof TOOL_ARGS_KEEP_FIELDS)[number];

// -- Chart data limits --

export const CHART_MAX_DATA_POINTS = {
    bar: 30,
    line: 50,
    pie: 15,
} as const;

// -- Query limits --

export const QUERY_MAX_FIELDS = 30;
