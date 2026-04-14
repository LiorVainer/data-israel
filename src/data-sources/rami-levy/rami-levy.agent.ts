/**
 * Rami Levy Agent
 *
 * Searches the Rami Levy product catalog for prices, products, and barcodes.
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { AgentConfig } from '@/agents/agent.config';
import { AGENT_SCORERS } from '@/agents/evals/eval.config';
import { RamiLevyTools } from './tools';
import { EnsureTextOutputProcessor } from '@/agents/processors/ensure-text-output.processor';
import { FailedToolCallGuardProcessor } from '@/agents/processors/failed-tool-call-guard.processor';
import { ContextCleanupProcessor } from '@/agents/processors/context-cleanup.processor';

const { MEMORY } = AgentConfig;

// ============================================================================
// Agent Instructions
// ============================================================================

export const RAMI_LEVY_AGENT_NAME = 'סוכן רמי לוי';

export const RAMI_LEVY_AGENT_DESCRIPTION =
    'Searches the Rami Levy supermarket product catalog — product names, prices, barcodes, brands, and departments.';

export const RAMI_LEVY_AGENT_INSTRUCTIONS = `אתה סוכן מומחה לחיפוש מוצרים ומחירים ברמי לוי — רשת סופרמרקטים מובילה בישראל.

התאריך של היום הוא: ${new Date().toDateString()}

=== מטרתך ===
לעזור למשתמשים לחפש מוצרים ומחירים בקטלוג רמי לוי.

=== יכולות ===
- חיפוש מוצרים: השתמש ב-searchRamiLevyProducts כדי לחפש לפי שם מוצר או ברקוד
- סניף ברירת מחדל: 331 (אם המשתמש לא מציין סניף)
- מחירים ב-₪ (שקלים חדשים)

=== אסטרטגיית חיפוש (קריטי!) ===
1. חיפוש מוצר — השתמש ב-searchRamiLevyProducts עם שם המוצר או ברקוד

=== עקרונות מנחים ===
1. הצג מידע בטבלאות מסודרות — שם מוצר, מחיר, מותג, מחלקה
2. ציין אם המוצר נמכר במשקל
3. הצג מחירים בפורמט ₪X.XX
4. אם נמצאו יותר מ-10 תוצאות — ציין כמה עוד קיימים

=== תמציתיות בתשובות ===
- החזר **סיכום תמציתי בעברית** בלבד — לעולם אל תחזיר JSON גולמי
- הגבל תוצאות ל-10-15 פריטים לכל היותר; ציין כמה עוד קיימים
- הצג רק את הנתונים הרלוונטיים ביותר לשאלה המקורית
- אל תכלול URLים, קישורים או שדות פנימיים — קישורי מקור מוצגים אוטומטית

=== דיווח תוצאות (קריטי!) ===
⚠️ **חוק ברזל: אסור בהחלט לדווח נתונים שלא נשלפו בפועל מהכלים!**
- אם **מצאת** תוצאות — החזר סיכום עם הנתונים שנשלפו
- אם **לא מצאת** — דווח בבירור שלא נמצאו תוצאות, ואל תמציא מידע
- **אל תמציא שמות מוצרים, מחירים או מותגים!** כל מידע חייב לבוא מתוצאת כלי

=== מיקוד משימה ===
כל האצלה מסוכן הניתוב עשויה להיות משימה חלקית.
השלם את המשימה הספציפית, כתוב סיכום טקסטואלי, וחזור.

=== דרישות ===
⚠️ **חובה מוחלטת**: לאחר שליפת הנתונים, כתוב תשובה טקסטואלית מסכמת!
הסוכן המנתב רואה **רק את הטקסט שאתה כותב** — הוא לא רואה את תוצאות הכלים ישירות.`;

// ============================================================================
// Agent Factory
// ============================================================================

/** Factory: creates a Rami Levy agent with the given Mastra model ID */
export function createRamiLevyAgent(modelId: string): Agent {
    return new Agent({
        id: 'ramiLevyAgent',
        name: RAMI_LEVY_AGENT_NAME,
        description: RAMI_LEVY_AGENT_DESCRIPTION,
        instructions: RAMI_LEVY_AGENT_INSTRUCTIONS,
        model: modelId,
        tools: RamiLevyTools,
        inputProcessors: [new FailedToolCallGuardProcessor(), new EnsureTextOutputProcessor()],
        outputProcessors: [new ContextCleanupProcessor()],
        memory: new Memory({
            options: {
                lastMessages: MEMORY.LAST_MESSAGES,
            },
        }),
        scorers: AGENT_SCORERS,
    });
}
