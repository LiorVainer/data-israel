/**
 * Shared Zod Schema Fragments
 *
 * Reusable schema building blocks for data source tools.
 * Eliminates boilerplate in tool input/output definitions.
 */

import { z } from 'zod';

// ============================================================================
// Input Fragments
// ============================================================================

/** Common input fields shared by all data tools */
export const commonToolInput = {
    searchedResourceName: z.string().describe('Hebrew label for UI display. Use the title from search results.'),
};

// ============================================================================
// Output Fragments
// ============================================================================

/** External URL fields — extensible for future URL types */
export const externalUrls = {
    apiUrl: z.string().optional().describe('Direct API endpoint URL'),
    portalUrl: z.string().optional().describe('Human-readable page on the data source website'),
};

/** Common fields in success output */
export const commonSuccessOutput = {
    success: z.literal(true) as z.ZodLiteral<true>,
    ...externalUrls,
};

/** Typed shape of the common tool input fields (inferred from commonToolInput schema) */
export type CommonToolInput = z.infer<z.ZodObject<typeof commonToolInput>>;

/** Typed shape of the common success output (success flag + external URLs) */
export type CommonSuccessOutput = z.infer<typeof commonSuccessOutput>;

/** Common error output shape */
export const commonErrorOutput = z.object({
    success: z.literal(false),
    error: z.string(),
    ...externalUrls,
});

// ============================================================================
// Schema Builder
// ============================================================================

/**
 * Build a discriminated union output schema for a data tool.
 * Merges success-specific fields with common success/error shapes.
 *
 * @example
 * const outputSchema = toolOutputSchema({
 *   items: z.array(z.object({ name: z.string() })),
 *   totalItems: z.number(),
 * });
 */
export function toolOutputSchema<T extends z.ZodRawShape>(successFields: T) {
    return z.discriminatedUnion('success', [z.object({ ...commonSuccessOutput, ...successFields }), commonErrorOutput]);
}

/** Infer the output type from a toolOutputSchema result */
export type ToolOutputSchemaType<T extends z.ZodRawShape> = z.infer<ReturnType<typeof toolOutputSchema<T>>>;
