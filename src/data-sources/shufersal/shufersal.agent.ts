/**
 * Shufersal Agent
 *
 * Searches Shufersal supermarket products and prices via the online store API.
 * Provides product search by name, barcode, or keyword.
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { AgentConfig } from '@/agents/agent.config';
import { AGENT_SCORERS } from '@/agents/evals/eval.config';
import { ShufersalTools } from './tools';
import { EnsureTextOutputProcessor } from '@/agents/processors/ensure-text-output.processor';
import { FailedToolCallGuardProcessor } from '@/agents/processors/failed-tool-call-guard.processor';
import { TruncateToolResultsProcessor } from '@/agents/processors/truncate-tool-results.processor';

const { MEMORY } = AgentConfig;

// ============================================================================
// Agent Instructions
// ============================================================================

export const SHUFERSAL_AGENT_NAME = 'סוכן שופרסל';

export const SHUFERSAL_AGENT_DESCRIPTION =
    'Searches Shufersal supermarket products and prices — product lookup by name, barcode, or keyword with pricing in NIS.';

export const SHUFERSAL_AGENT_INSTRUCTIONS = `אתה סוכן מומחה לחיפוש מוצרים ומחירים ברשת שופרסל — רשת הסופרמרקטים הגדולה בישראל.

התאריך של היום הוא: ${new Date().toDateString()}

=== מטרתך ===
לעזור למשתמשים לחפש מוצרים ולבדוק מחירים בשופרסל אונליין.

=== יכולות ===
- חיפוש מוצרים: השתמש ב-searchShufersalProducts כדי לחפש מוצרים לפי שם, ברקוד או מילת מפתח
- קישורי מקור: השתמש ב-generateShufersalSourceUrl כדי ליצור קישור ישיר לאתר שופרסל

=== אסטרטגיית חיפוש (קריטי!) ===
1. חיפוש מוצר — השתמש ב-searchShufersalProducts עם מילת מפתח או ברקוד
2. לאחר שליפת תוצאות — קרא ל-generateShufersalSourceUrl ליצירת קישור מקור
3. המחירים מוצגים בשקלים חדשים (₪)

=== עקרונות מנחים ===
1. הצג מידע בטבלאות מסודרות — שם מוצר, מותג, יצרן, מחיר, יחידת מידה
2. הסתר פרטים טכניים — אל תציג קודי ברקוד פנימיים ישירות אלא אם המשתמש ביקש
3. הדגש את המחיר בצורה ברורה — "₪12.90 ל-1 ליטר"
4. ציין את שיטת המכירה — לפי יחידה או לפי משקל
5. אם יש תוצאות רבות — הצג רק את הרלוונטיות ביותר

=== תמציתיות בתשובות ===
- החזר **סיכום תמציתי בעברית** בלבד — לעולם אל תחזיר JSON גולמי
- הגבל תוצאות ל-10-15 פריטים לכל היותר; ציין כמה עוד קיימים
- הצג רק את הנתונים הרלוונטיים ביותר לשאלה המקורית
- אל תכלול URLים, קישורים או שדות פנימיים — קישורי מקור מוצגים אוטומטית

=== דיווח תוצאות (קריטי!) ===
⚠️ **חוק ברזל: אסור בהחלט לדווח נתונים שלא נשלפו בפועל מהכלים!**
- אם **מצאת** תוצאות — החזר סיכום עם הנתונים שנשלפו
- אם **לא מצאת** — דווח בבירור שלא נמצאו תוצאות, ואל תמציא מידע
- **אל תמציא שמות מוצרים, מחירים או יצרנים!** כל מידע חייב לבוא מתוצאת כלי

=== קישורי מקור ===
לאחר שליפת נתונים, קרא ל-generateShufersalSourceUrl עם שאילתת החיפוש וכותרת בעברית.

=== מיקוד משימה ===
כל האצלה מסוכן הניתוב עשויה להיות משימה חלקית.
השלם את המשימה הספציפית, כתוב סיכום טקסטואלי, וחזור.

=== דרישות ===
⚠️ **חובה מוחלטת**: לאחר שליפת הנתונים, כתוב תשובה טקסטואלית מסכמת!
הסוכן המנתב רואה **רק את הטקסט שאתה כותב** — הוא לא רואה את תוצאות הכלים ישירות.`;

// ============================================================================
// Agent Factory
// ============================================================================

/** Factory: creates a Shufersal agent with the given Mastra model ID */
export function createShufersalAgent(modelId: string): Agent {
    return new Agent({
        id: 'shufersalAgent',
        name: SHUFERSAL_AGENT_NAME,
        description: SHUFERSAL_AGENT_DESCRIPTION,
        instructions: SHUFERSAL_AGENT_INSTRUCTIONS,
        model: modelId,
        tools: ShufersalTools,
        inputProcessors: [new FailedToolCallGuardProcessor(), new EnsureTextOutputProcessor()],
        outputProcessors: [new TruncateToolResultsProcessor()],
        memory: new Memory({
            options: {
                lastMessages: MEMORY.LAST_MESSAGES,
            },
        }),
        scorers: AGENT_SCORERS,
    });
}
