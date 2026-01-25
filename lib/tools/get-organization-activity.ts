/**
 * Get Organization Activity Tool
 *
 * AI SDK tool for retrieving activity stream of an organization
 */

import { tool } from 'ai';
import { z } from 'zod';
import { dataGovApi } from '@/lib/api/data-gov/client';

// ============================================================================
// Schemas (Single Source of Truth)
// ============================================================================

export const getOrganizationActivityInputSchema = z.object({
  id: z.string().describe('Organization ID or name (short form)'),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Pagination offset'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe('Maximum number of activities to return'),
});

export const getOrganizationActivityOutputSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    activities: z.array(z.object({
      id: z.string(),
      timestamp: z.string(),
      activityType: z.string(),
      userId: z.string(),
    })),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
]);

export type GetOrganizationActivityInput = z.infer<typeof getOrganizationActivityInputSchema>;
export type GetOrganizationActivityOutput = z.infer<typeof getOrganizationActivityOutputSchema>;

// ============================================================================
// Tool Definition
// ============================================================================

export const getOrganizationActivity = tool({
  description:
    'Get the activity stream (change history) of a specific organization. Use when user wants to know about recent updates or activities by an organization.',
  inputSchema: getOrganizationActivityInputSchema,
  execute: async ({ id, offset, limit }) => {
    try {
      const activities = await dataGovApi.organization.activity(id, { offset, limit });

      return {
        success: true,
        activities: activities.map((a) => ({
          id: a.id,
          timestamp: a.timestamp,
          activityType: a.activity_type,
          userId: a.user_id,
        })),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
