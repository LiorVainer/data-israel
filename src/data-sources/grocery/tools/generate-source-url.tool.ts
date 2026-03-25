/**
 * Generate Grocery Source URL Tool
 *
 * Generates a clickable source URL for supermarket price feeds
 * so users can view the chain's price data portal directly.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { ALL_CHAIN_IDS, getChainName, buildChainPortalUrl } from '../api/grocery.endpoints';
import type { ChainId } from '../api/grocery.endpoints';

export const generateGrocerySourceUrlInputSchema = z.object({
    chainId: z.enum(ALL_CHAIN_IDS as [string, ...string[]]).describe('Supermarket chain ID'),
    title: z.string().describe('Hebrew display title for the source link'),
});

export const generateGrocerySourceUrlOutputSchema = z.discriminatedUnion('success', [
    z.object({
        success: z.literal(true),
        url: z.string(),
        title: z.string(),
    }),
    z.object({
        success: z.literal(false),
        error: z.string(),
    }),
]);

export type GenerateGrocerySourceUrlInput = z.infer<typeof generateGrocerySourceUrlInputSchema>;
export type GenerateGrocerySourceUrlOutput = z.infer<typeof generateGrocerySourceUrlOutputSchema>;

export const generateGrocerySourceUrl = createTool({
    id: 'generateGrocerySourceUrl',
    description: 'Generate a source URL for a supermarket chain price feed portal.',
    inputSchema: generateGrocerySourceUrlInputSchema,
    outputSchema: generateGrocerySourceUrlOutputSchema,
    execute: async ({ chainId, title }) => {
        const typedChainId = chainId as ChainId;
        const url = buildChainPortalUrl(typedChainId);
        const chainName = getChainName(typedChainId);

        return {
            success: true as const,
            url,
            title: title || `מחירון ${chainName}`,
        };
    },
});
