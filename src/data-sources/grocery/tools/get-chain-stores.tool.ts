/**
 * Get Chain Stores Tool
 *
 * Lists store branches for a specific supermarket chain.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import { fetchFeedIndex, fetchStores } from '../api/grocery.client';
import { ALL_CHAIN_IDS, getChainName, buildChainPortalUrl } from '../api/grocery.endpoints';
import type { ChainId } from '../api/grocery.endpoints';

// ============================================================================
// Schemas
// ============================================================================

export const getChainStoresInputSchema = z.object({
    chainId: z
        .enum(ALL_CHAIN_IDS as [string, ...string[]])
        .describe('Supermarket chain ID. Options: shufersal, rami-levy, yochananof, victory, osher-ad, tiv-taam'),
    city: z.string().optional().describe('Filter by city name in Hebrew (e.g., "תל אביב")'),
    ...commonToolInput,
});

const storeSchema = z.object({
    storeId: z.string(),
    name: z.string(),
    address: z.string(),
    city: z.string(),
    zipCode: z.string(),
    subChainId: z.string(),
});

export const getChainStoresOutputSchema = toolOutputSchema({
    chainId: z.string(),
    chainName: z.string(),
    stores: z.array(storeSchema),
    totalStores: z.number(),
});

export type GetChainStoresInput = z.infer<typeof getChainStoresInputSchema>;
export type GetChainStoresOutput = z.infer<typeof getChainStoresOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getChainStores = createTool({
    id: 'getChainStores',
    description:
        'List store branches for a specific Israeli supermarket chain. Optionally filter by city. Returns store name, address, and city for each branch.',
    inputSchema: getChainStoresInputSchema,
    outputSchema: getChainStoresOutputSchema,
    execute: async ({ chainId, city }) => {
        const typedChainId = chainId as ChainId;
        const portalUrl = buildChainPortalUrl(typedChainId);

        try {
            const feedFiles = await fetchFeedIndex(typedChainId);
            const storesFile = feedFiles.find((f) => f.feedType === 'Stores');

            if (!storesFile) {
                return {
                    success: false as const,
                    error: `לא נמצא קובץ סניפים עבור ${getChainName(typedChainId)}`,
                    portalUrl,
                };
            }

            let stores = await fetchStores(typedChainId, storesFile.fileUrl);

            // Filter by city if specified
            if (city) {
                stores = stores.filter((s) => s.city.includes(city));
            }

            return {
                success: true as const,
                chainId,
                chainName: getChainName(typedChainId),
                stores,
                totalStores: stores.length,
                portalUrl,
            };
        } catch (error) {
            return {
                success: false as const,
                error: error instanceof Error ? error.message : String(error),
                portalUrl,
            };
        }
    },
});
