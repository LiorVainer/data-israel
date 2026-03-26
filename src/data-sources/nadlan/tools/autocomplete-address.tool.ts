/**
 * Autocomplete Address Tool
 *
 * Search and autocomplete Israeli addresses via the Govmap API.
 * Returns matching addresses with coordinates for subsequent deal lookups.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { nadlanApi } from '../api/nadlan.client';
import { toolOutputSchema } from '@/data-sources/types';

// ============================================================================
// Schemas
// ============================================================================

export const autocompleteAddressInputSchema = z.object({
    searchText: z
        .string()
        .describe(
            'Full Israeli address in Hebrew including street name, house number, and city (e.g. "סוקולוב 38 חולון"). A city name alone will not return address results.',
        ),
});

export const autocompleteAddressOutputSchema = toolOutputSchema({
    results: z.array(
        z.object({
            text: z.string().describe('Full address text'),
            id: z.string().describe('Address identifier'),
            type: z.string().describe('Result type (address, street, city)'),
            score: z.number().describe('Relevance score'),
            longitude: z.number().optional().describe('ITM X coordinate'),
            latitude: z.number().optional().describe('ITM Y coordinate'),
        }),
    ),
    totalResults: z.number(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const autocompleteNadlanAddress = createTool({
    id: 'autocompleteNadlanAddress',
    description:
        'Search and autocomplete Israeli addresses. Provide a FULL Hebrew address (street + number + city, e.g. "סוקולוב 38 חולון") — a city name alone will not return useful results. Returns matching addresses with ITM coordinates for subsequent deal lookups.',
    inputSchema: autocompleteAddressInputSchema,
    outputSchema: autocompleteAddressOutputSchema,
    execute: async ({ searchText }) => {
        try {
            const result = await nadlanApi.autocompleteAddress(searchText);

            if (!result.results.length) {
                return {
                    success: false as const,
                    error: `לא נמצאו כתובות עבור "${searchText}"`,
                };
            }

            return {
                success: true as const,
                results: result.results.map((r) => ({
                    text: r.text,
                    id: r.id,
                    type: r.type,
                    score: r.score,
                    longitude: r.coordinates?.longitude,
                    latitude: r.coordinates?.latitude,
                })),
                totalResults: result.results.length,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    },
});
