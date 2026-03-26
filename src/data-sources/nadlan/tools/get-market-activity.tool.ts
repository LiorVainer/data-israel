/**
 * Get Market Activity Tool
 *
 * Analyzes market trends and price patterns for an area over time.
 * Returns yearly breakdown with statistics (no raw deals).
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { nadlanApi } from '../api/nadlan.client';
import { buildGovmapPortalUrl } from '../api/nadlan.endpoints';
import { commonToolInput, toolOutputSchema } from '@/data-sources/types';
import type { ToolSourceResolver } from '@/data-sources/types';

// ============================================================================
// Helpers
// ============================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function getString(obj: unknown, key: string): string | undefined {
    if (!isRecord(obj)) return undefined;
    const val = obj[key];
    return typeof val === 'string' ? val : undefined;
}

// ============================================================================
// Schemas
// ============================================================================

export const getMarketActivityInputSchema = z.object({
    address: z
        .string()
        .describe(
            'Full Israeli address in Hebrew including street name, house number, and city (e.g. "סוקולוב 38 חולון"). A city name alone will not return useful results.',
        ),
    yearsBack: z.number().int().min(1).max(10).optional().describe('Years of data to analyze (default: 3)'),
    radiusMeters: z.number().int().min(10).max(5000).optional().describe('Search radius in meters (default: 100)'),
    dealType: z
        .union([z.literal(1), z.literal(2)])
        .optional()
        .describe('1=first hand, 2=second hand (default: 2)'),
    ...commonToolInput,
});

export const getMarketActivityOutputSchema = toolOutputSchema({
    address: z.string(),
    yearsAnalyzed: z.number(),
    totalDealsAnalyzed: z.number(),
    yearlyTrends: z.record(
        z.string(),
        z.object({
            dealCount: z.number(),
            avgPrice: z.number().describe('Average price in NIS'),
            avgPricePerSqm: z.number().describe('Average price per sqm in NIS'),
            minPricePerSqm: z.number(),
            maxPricePerSqm: z.number(),
            totalVolume: z.number().describe('Total transaction volume in NIS'),
        }),
    ),
    trendAnalysis: z
        .object({
            priceTrendPercentage: z.number().describe('Price change % from first to last year'),
            volumeTrendPercentage: z.number().describe('Volume change % from first to last year'),
            firstYearAvgPricePerSqm: z.number(),
            lastYearAvgPricePerSqm: z.number(),
        })
        .optional(),
    topPropertyTypes: z.record(
        z.string(),
        z.object({
            dealCount: z.number(),
            avgPricePerSqm: z.number(),
        }),
    ),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getNadlanMarketActivity = createTool({
    id: 'getNadlanMarketActivity',
    description:
        'Analyze real estate market trends and activity for an area. Provide a FULL Hebrew address (street + number + city). Internally performs autocomplete, polygon discovery, and deal fetching. Returns yearly price trends, transaction volumes, and property type breakdown. No individual deals — just aggregated analysis.',
    inputSchema: getMarketActivityInputSchema,
    outputSchema: getMarketActivityOutputSchema,
    execute: async ({ address, yearsBack = 3, radiusMeters = 100, dealType = 2 }) => {
        const portalUrl = buildGovmapPortalUrl();

        try {
            const result = await nadlanApi.findRecentDealsForAddress(address, yearsBack, radiusMeters, 200, dealType);

            if (!result.deals.length) {
                const dealTypeDesc = dealType === 1 ? 'יד ראשונה' : 'יד שנייה';
                return {
                    success: false as const,
                    error: `לא נמצאו עסקאות ${dealTypeDesc} לניתוח שוק ליד "${address}"`,
                    portalUrl,
                };
            }

            // Group by year
            const yearlyData: Record<
                string,
                Array<{ price: number; area: number; pricePerSqm: number; assetType: string }>
            > = {};

            for (const deal of result.deals) {
                if (!deal.dealDate || !deal.dealAmount) continue;
                const year = deal.dealDate.slice(0, 4);
                const area = deal.assetArea;
                const pricePerSqm = deal.pricePerSqm;

                if (area && area > 0 && pricePerSqm && pricePerSqm > 0) {
                    if (!yearlyData[year]) yearlyData[year] = [];
                    yearlyData[year].push({
                        price: deal.dealAmount,
                        area,
                        pricePerSqm,
                        assetType: deal.assetType ?? 'לא ידוע',
                    });
                }
            }

            // Calculate yearly trends
            const yearlyTrends: Record<
                string,
                {
                    dealCount: number;
                    avgPrice: number;
                    avgPricePerSqm: number;
                    minPricePerSqm: number;
                    maxPricePerSqm: number;
                    totalVolume: number;
                }
            > = {};

            for (const [year, deals] of Object.entries(yearlyData)) {
                const prices = deals.map((d) => d.price);
                const ppsqm = deals.map((d) => d.pricePerSqm);

                yearlyTrends[year] = {
                    dealCount: deals.length,
                    avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
                    avgPricePerSqm: Math.round(ppsqm.reduce((a, b) => a + b, 0) / ppsqm.length),
                    minPricePerSqm: Math.round(Math.min(...ppsqm)),
                    maxPricePerSqm: Math.round(Math.max(...ppsqm)),
                    totalVolume: prices.reduce((a, b) => a + b, 0),
                };
            }

            // Trend analysis
            const yearsSorted = Object.keys(yearlyTrends).sort();
            let trendAnalysis:
                | {
                      priceTrendPercentage: number;
                      volumeTrendPercentage: number;
                      firstYearAvgPricePerSqm: number;
                      lastYearAvgPricePerSqm: number;
                  }
                | undefined;

            if (yearsSorted.length >= 2) {
                const firstYear = yearlyTrends[yearsSorted[0]];
                const lastYear = yearlyTrends[yearsSorted[yearsSorted.length - 1]];

                if (firstYear.avgPricePerSqm > 0 && firstYear.dealCount > 0) {
                    trendAnalysis = {
                        priceTrendPercentage:
                            Math.round(
                                ((lastYear.avgPricePerSqm - firstYear.avgPricePerSqm) / firstYear.avgPricePerSqm) *
                                    1000,
                            ) / 10,
                        volumeTrendPercentage:
                            Math.round(((lastYear.dealCount - firstYear.dealCount) / firstYear.dealCount) * 1000) / 10,
                        firstYearAvgPricePerSqm: firstYear.avgPricePerSqm,
                        lastYearAvgPricePerSqm: lastYear.avgPricePerSqm,
                    };
                }
            }

            // Property type breakdown (top 5)
            const typeMap: Record<string, { count: number; totalPpsqm: number }> = {};
            for (const deals of Object.values(yearlyData)) {
                for (const deal of deals) {
                    if (!typeMap[deal.assetType]) {
                        typeMap[deal.assetType] = { count: 0, totalPpsqm: 0 };
                    }
                    typeMap[deal.assetType].count += 1;
                    typeMap[deal.assetType].totalPpsqm += deal.pricePerSqm;
                }
            }

            const topPropertyTypes: Record<string, { dealCount: number; avgPricePerSqm: number }> = {};
            const sortedTypes = Object.entries(typeMap)
                .filter(([, v]) => v.count >= 2)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 5);

            for (const [type, data] of sortedTypes) {
                topPropertyTypes[type] = {
                    dealCount: data.count,
                    avgPricePerSqm: Math.round(data.totalPpsqm / data.count),
                };
            }

            return {
                success: true as const,
                address,
                yearsAnalyzed: yearsBack,
                totalDealsAnalyzed: result.deals.length,
                yearlyTrends,
                trendAnalysis,
                topPropertyTypes,
                portalUrl: result.searchCoordinates
                    ? buildGovmapPortalUrl(result.searchCoordinates.longitude, result.searchCoordinates.latitude)
                    : portalUrl,
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

// ============================================================================
// Source URL Resolver
// ============================================================================

export const resolveSourceUrl: ToolSourceResolver = (_input, output) => {
    const portalUrl = getString(output, 'portalUrl');
    if (!portalUrl) return null;
    const name = getString(_input, 'searchedResourceName');
    return {
        url: portalUrl,
        title: name ? `ניתוח שוק נדל"ן — ${name}` : 'ניתוח שוק נדל"ן — govmap.gov.il',
        urlType: 'portal',
    };
};
