/**
 * Display GovMap Tool (Client-Side Rendering)
 *
 * Renders an interactive GovMap iframe in the chat when a portal URL is available.
 * The routing agent calls this after a sub-agent returns a GovMap portalUrl.
 */

import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const displayGovmapInputSchema = z.object({
    portalUrl: z
        .string()
        .describe(
            "כתובת URL של פורטל GovMap — העתק את ה-portalUrl מתוצאות כלי GovMap (findNearbyServices, findNearbyTourism, getParcelInfo, וכו')",
        ),
    title: z.string().optional().describe('כותרת למפה בעברית, לדוגמה: "תחנות אוטובוס ליד דרך המכבים"'),
});

export const displayGovmapOutputSchema = z.object({
    rendered: z.boolean(),
});

export type DisplayGovmapInput = z.infer<typeof displayGovmapInputSchema>;
export type DisplayGovmapOutput = z.infer<typeof displayGovmapOutputSchema>;

export const displayGovmap = createTool({
    id: 'displayGovmap',
    description: `הצגת מפה אינטראקטיבית של GovMap בצ'אט.

השתמש בכלי זה כאשר תוצאות של כלי GovMap (שירותים קרובים, תיירות, חלקות, נדל"ן) כוללות portalUrl — הצג למשתמש את המפה ישירות בשיחה.

הנחיות:
- העבר את ה-portalUrl בדיוק כפי שהוחזר מכלי ה-GovMap
- הוסף כותרת בעברית שמתארת מה מוצג במפה
- אל תשנה או תבנה URL ידנית — תמיד השתמש ב-portalUrl מהתוצאה`,
    inputSchema: displayGovmapInputSchema,
    execute: async () => {
        return { rendered: true };
    },
});
