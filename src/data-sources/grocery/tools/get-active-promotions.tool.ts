/**
 * Get Active Promotions Tool
 *
 * Fetches current promotions/deals from a specific supermarket chain.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import { fetchFeedIndex, fetchPromotions } from '../api/grocery.client';
import { ALL_CHAIN_IDS, getChainName, buildChainPortalUrl } from '../api/grocery.endpoints';
import type { ChainId } from '../api/grocery.endpoints';

// ============================================================================
// Schemas
// ============================================================================

export const getActivePromotionsInputSchema = z.object({
    chainId: z
        .enum(ALL_CHAIN_IDS as [string, ...string[]])
        .describe('Supermarket chain ID. Options: shufersal, rami-levy, yochananof, victory, osher-ad, tiv-taam'),
    limit: z.number().int().min(1).max(50).optional().describe('Maximum number of promotions to return (default 20)'),
    ...commonToolInput,
});

const promotionSchema = z.object({
    promotionId: z.string(),
    description: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    minQty: z.number(),
    maxQty: z.number(),
    discountRate: z.number(),
    discountType: z.string(),
    itemCodes: z.array(z.string()),
});

export const getActivePromotionsOutputSchema = toolOutputSchema({
    chainId: z.string(),
    chainName: z.string(),
    promotions: z.array(promotionSchema),
    totalPromotions: z.number(),
});

export type GetActivePromotionsInput = z.infer<typeof getActivePromotionsInputSchema>;
export type GetActivePromotionsOutput = z.infer<typeof getActivePromotionsOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getActivePromotions = createTool({
    id: 'getActivePromotions',
    description:
        'Get current active promotions and deals from a specific Israeli supermarket chain. Returns promotion details including discount rate, dates, and participating product barcodes.',
    inputSchema: getActivePromotionsInputSchema,
    outputSchema: getActivePromotionsOutputSchema,
    execute: async ({ chainId, limit }) => {
        const typedChainId = chainId as ChainId;
        const portalUrl = buildChainPortalUrl(typedChainId);
        const maxResults = limit ?? 20;

        try {
            const feedFiles = await fetchFeedIndex(typedChainId);
            const promosFile = feedFiles.find((f) => f.feedType === 'Promos');

            if (!promosFile) {
                return {
                    success: false as const,
                    error: `לא נמצא קובץ מבצעים עבור ${getChainName(typedChainId)}`,
                    portalUrl,
                };
            }

            const allPromotions = await fetchPromotions(typedChainId, promosFile.fileUrl);

            // Filter for currently active promotions
            const now = new Date();
            const active = allPromotions.filter((p) => {
                if (!p.endDate) return true; // No end date = still active
                try {
                    return new Date(p.endDate) >= now;
                } catch {
                    return true; // If date parsing fails, include it
                }
            });

            const promotions = active.slice(0, maxResults);

            return {
                success: true as const,
                chainId,
                chainName: getChainName(typedChainId),
                promotions,
                totalPromotions: active.length,
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
