/**
 * Get Current Knesset Tool
 *
 * Returns the current Knesset number (25).
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { CURRENT_KNESSET_NUM } from '../api/knesset.types';
import { buildKnessetPortalUrl } from '../api/knesset.endpoints';

// ============================================================================
// Schemas
// ============================================================================

export const getCurrentKnessetInputSchema = z.object({});

export const getCurrentKnessetOutputSchema = z.object({
    success: z.literal(true),
    currentKnessetNum: z.number(),
    portalUrl: z.string(),
});

// ============================================================================
// Tool Definition
// ============================================================================

export const getCurrentKnesset = createTool({
    id: 'getCurrentKnesset',
    description: 'מחזיר את מספר הכנסת הנוכחית. שימושי כשהמשתמש שואל על הכנסת הנוכחית ללא ציון מספר.',
    inputSchema: getCurrentKnessetInputSchema,
    outputSchema: getCurrentKnessetOutputSchema,
    execute: async () => {
        return {
            success: true as const,
            currentKnessetNum: CURRENT_KNESSET_NUM,
            portalUrl: buildKnessetPortalUrl(),
        };
    },
});
