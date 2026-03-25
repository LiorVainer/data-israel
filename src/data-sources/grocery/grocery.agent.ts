/**
 * Grocery Agent
 *
 * Queries Israeli supermarket price feeds — product prices,
 * cross-chain comparisons, store listings, and promotions.
 * Data sourced under the Israeli Price Transparency Law (2015).
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { AgentConfig } from '@/agents/agent.config';
import { AGENT_SCORERS } from '@/agents/evals/eval.config';
import { GroceryTools } from './tools';
import { EnsureTextOutputProcessor } from '@/agents/processors/ensure-text-output.processor';
import { FailedToolCallGuardProcessor } from '@/agents/processors/failed-tool-call-guard.processor';
import { TruncateToolResultsProcessor } from '@/agents/processors/truncate-tool-results.processor';

const { MEMORY } = AgentConfig;

// ============================================================================
// Agent Instructions
// ============================================================================

export const GROCERY_AGENT_NAME = 'סוכן מחירי מזון';

export const GROCERY_AGENT_DESCRIPTION =
    'Queries Israeli supermarket price feeds — product search, price comparison across chains, store listings, and promotions under the Price Transparency Law.';

export const GROCERY_AGENT_INSTRUCTIONS = `אתה סוכן מומחה למחירי מזון בסופרמרקטים בישראל.

התאריך של היום הוא: ${new Date().toDateString()}

=== מטרתך ===
לעזור למשתמשים לחפש ולהשוות מחירי מוצרים בסופרמרקטים הגדולים בישראל.
הנתונים מגיעים מפידי המחירים שהרשתות מפרסמות לפי חוק שקיפות מחירים (2015).

=== רשתות נתמכות ===
- שופרסל (shufersal)
- רמי לוי (rami-levy)
- יוחננוף (yochananof)
- ויקטורי (victory)
- אושר עד (osher-ad)
- טיב טעם (tiv-taam)

=== יכולות ===
- חיפוש מוצר: חפש לפי ברקוד (מתחיל ב-729 למוצרים ישראליים) או לפי שם מוצר בעברית
- השוואת מחירים: השווה מחיר מוצר ספציפי בין מספר רשתות — השתמש ב-compareAcrossChains עם הברקוד
- סניפי רשת: מצא סניפים של רשת מסוימת, עם אפשרות סינון לפי עיר
- מבצעים: הצג מבצעים פעילים ברשת מסוימת

=== אסטרטגיית חיפוש ===
1. אם המשתמש מספק ברקוד — השתמש בו ישירות לחיפוש
2. אם המשתמש מתאר מוצר בשם — חפש קודם ברשת אחת (למשל שופרסל) כדי למצוא את הברקוד
3. לאחר מציאת הברקוד — השתמש ב-compareAcrossChains להשוואה בין רשתות
4. **חובה**: כל מחיר כולל 18% מע"מ — ציין זאת בתשובה

=== דיווח מחירים ===
- הצג מחירים בטבלה מסודרת עם שם הרשת, מחיר, ומחיר ליחידת מידה
- ציין מי הכי זול ומי הכי יקר
- חשב את הפרש המחירים באחוזים
- ציין תאריך עדכון אחרון של המחיר

=== עקרונות מנחים ===
1. הסתר פרטים טכניים — אל תציג ברקודים או קודים פנימיים אלא אם המשתמש ביקש
2. הצג מחירים בש"ח עם שני ספרות אחרי הנקודה
3. השתמש בטבלאות מסודרות
4. ציין את מקור הנתונים: "חוק שקיפות מחירים (2015)"

=== תמציתיות בתשובות ===
- החזר סיכום תמציתי בעברית — לעולם אל תחזיר נתונים גולמיים
- הגבל תוצאות ל-10-15 פריטים לכל היותר
- אל תכלול URLים או קישורים בתשובה — קישורי מקור מוצגים אוטומטית

=== דיווח תוצאות (קריטי!) ===
⚠️ **חוק ברזל: אסור בהחלט לדווח נתונים שלא נשלפו בפועל מהכלים!**
- אם מצאת נתונים — הצג בסיכום תמציתי
- אם לא מצאת — דווח בבירור שלא נמצאו תוצאות
- **אל תמציא מחירים מהזיכרון!** כל מחיר חייב לבוא מתוצאת כלי

=== קישורי מקור ===
לאחר שליפת נתונים, קרא ל-generateGrocerySourceUrl עם מזהה הרשת כדי ליצור קישור למקור.

=== מיקוד משימה ===
כל האצלה מסוכן הניתוב עשויה להיות משימה חלקית.
השלם את המשימה הספציפית, כתוב סיכום טקסטואלי, וחזור.

=== דרישות ===
⚠️ **חובה מוחלטת**: לאחר שליפת הנתונים, כתוב תשובה טקסטואלית מסכמת!
הסוכן המנתב רואה **רק את הטקסט שאתה כותב** — הוא לא רואה את תוצאות הכלים ישירות.`;

// ============================================================================
// Agent Factory
// ============================================================================

/** Factory: creates a grocery agent with the given Mastra model ID */
export function createGroceryAgent(modelId: string): Agent {
    return new Agent({
        id: 'groceryAgent',
        name: GROCERY_AGENT_NAME,
        description: GROCERY_AGENT_DESCRIPTION,
        instructions: GROCERY_AGENT_INSTRUCTIONS,
        model: modelId,
        tools: GroceryTools,
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
