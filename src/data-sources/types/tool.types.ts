/**
 * Tool Types
 *
 * Type definitions for tool source resolvers and tool translations.
 * Used by DataSourceDefinition to type-check per-tool metadata.
 */

import type { LucideIcon } from 'lucide-react';

/** Resolved source URL for a tool invocation */
export interface ToolSource {
    /** The URL to the data source (API endpoint or portal page) */
    url: string;
    /** Hebrew display title for the source chip */
    title: string;
    /** Whether this URL points to a portal page or raw API endpoint */
    urlType: 'portal' | 'api';
}

/**
 * Function that resolves a source URL from a tool's input and output.
 * Returns null if no meaningful source URL can be derived (e.g., on error).
 */
export type ToolSourceResolver = (input: unknown, output: unknown) => ToolSource | null;

/**
 * Hebrew translation metadata for a single tool.
 * Icons are LucideIcon components (not JSX elements).
 */
export interface ToolTranslation {
    /** Hebrew display name */
    name: string;
    /** Icon component for the tool in ChainOfThought UI */
    icon: LucideIcon;
    /** Format tool input for display in the timeline */
    formatInput: (input: unknown) => string | undefined;
    /** Format tool output for display in the timeline */
    formatOutput: (output: unknown) => string | undefined;
}
