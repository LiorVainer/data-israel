/**
 * Tool Types
 *
 * Type definitions for tool source resolvers and tool translations.
 * Used by DataSourceDefinition to type-check per-tool metadata.
 */

import type { LucideIcon } from 'lucide-react';
import type { CommonToolInput, ToolOutputSchemaType } from './tool-schemas';

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
 * Declarative source URL config for standard tools.
 * The registry auto-generates a type-safe resolver from this config.
 */
export interface ToolSourceConfig {
    /** Hebrew title prefix (e.g., "סדרה סטטיסטית", "עסקאות נדל"ן") */
    title: string;
}

/**
 * Function that resolves source URLs from a tool's input and output.
 * Generic — defaults to common types; custom resolvers specify tool-specific schemas.
 *
 * @example Standard (uses defaults):
 *   const resolver: ToolSourceResolver = (input, output) => { ... }
 *
 * @example Custom (typed input/output):
 *   const resolver: ToolSourceResolver<MyToolInput, MyToolOutput> = (input, output) => { ... }
 */
export type ToolSourceResolver<TInput = CommonToolInput, TOutput = ToolOutputSchemaType<Record<string, never>>> = (
    input: TInput,
    output: TOutput,
) => ToolSource[];

/**
 * Extracts a display resource (name + optional URL) from a tool's input and output.
 * Used by ChainOfThought UI to show resource chips alongside tool calls.
 * Returns null if no meaningful resource can be derived.
 */
export type ToolResourceExtractor = (input: unknown, output: unknown) => { name?: string; url?: string } | null;

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
    formatInput?: (input: unknown) => string | undefined;
    /** Format tool output for display in the timeline */
    formatOutput?: (output: unknown) => string | undefined;
}
