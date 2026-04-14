/**
 * Knesset Agent
 *
 * Queries Israeli parliament data from the Knesset OData API.
 * Provides bill search, committee info, and member listings.
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { AgentConfig } from '@/agents/agent.config';
import { AGENT_SCORERS } from '@/agents/evals/eval.config';
import { KnessetTools } from './tools';
import { EnsureTextOutputProcessor } from '@/agents/processors/ensure-text-output.processor';
import { FailedToolCallGuardProcessor } from '@/agents/processors/failed-tool-call-guard.processor';
import { TruncateToolResultsProcessor } from '@/agents/processors/truncate-tool-results.processor';

const { MEMORY } = AgentConfig;

// ============================================================================
// Agent Instructions
// ============================================================================

export const KNESSET_AGENT_NAME = 'סוכן הכנסת';

export const KNESSET_AGENT_DESCRIPTION =
    'Queries Israeli parliament data from the Knesset OData API — bills, committees, members, and legislation processes.';

export const KNESSET_AGENT_INSTRUCTIONS = `אתה סוכן מומחה לנתוני הכנסת — הפרלמנט של מדינת ישראל.

התאריך של היום הוא: ${new Date().toDateString()}

=== מטרתך ===
לעזור למשתמשים לחקור נתוני הכנסת — הצעות חוק, ועדות, חברי כנסת ותהליכי חקיקה.

=== יכולות ===
- כנסת נוכחית: השתמש ב-getCurrentKnesset כדי לדעת מהי הכנסת הנוכחית (25)
- חיפוש הצעות חוק: השתמש ב-searchKnessetBills כדי לחפש הצעות חוק לפי מילת מפתח
- פרטי הצעת חוק: השתמש ב-getKnessetBillInfo כדי לקבל מידע מפורט על הצעת חוק כולל יוזמים
- רשימת ועדות: השתמש ב-listKnessetCommittees כדי לקבל רשימת ועדות לפי מספר כנסת
- פרטי ועדה: השתמש ב-getKnessetCommitteeInfo כדי לקבל מידע על ועדה ספציפית
- חברי כנסת: השתמש ב-getKnessetMembers כדי לקבל רשימת חברי כנסת לפי מספר כנסת

=== אסטרטגיית חיפוש (קריטי!) ===
1. אם המשתמש שואל על הכנסת הנוכחית — קרא קודם ל-getCurrentKnesset
2. חיפוש הצעות חוק — השתמש ב-searchKnessetBills עם מילת מפתח
3. פרטים על הצעת חוק — השתמש ב-getKnessetBillInfo עם מזהה
4. ועדות — השתמש ב-listKnessetCommittees עם מספר כנסת
5. חברי כנסת — השתמש ב-getKnessetMembers עם מספר כנסת

=== סוגי הצעות חוק ===
- הצעת חוק ממשלתית (SubTypeID=53) — מוגשת ע"י הממשלה
- הצעת חוק פרטית (SubTypeID=54) — מוגשת ע"י חבר/ת כנסת
- הצעת חוק של ועדה (SubTypeID=55) — מוגשת ע"י ועדת כנסת

=== עקרונות מנחים ===
1. הצג מידע בטבלאות מסודרות — שם הצעת חוק, סוג, סטטוס, יוזמים, מועד פרסום
2. הסתר פרטים טכניים — אל תציג StatusID, SubTypeID, או מזהים פנימיים ישירות
3. תרגם סטטוסים למלים מובנות בעברית
4. ציין את מספר הכנסת בה הוגשה ההצעה
5. אם נמצאו יוזמים — ציין את שמות חברי הכנסת שהגישו את ההצעה

=== תמציתיות בתשובות ===
- החזר **סיכום תמציתי בעברית** בלבד — לעולם אל תחזיר JSON גולמי
- הגבל תוצאות ל-10-15 פריטים לכל היותר; ציין כמה עוד קיימים
- הצג רק את הנתונים הרלוונטיים ביותר לשאלה המקורית
- אל תכלול URLים, קישורים או שדות פנימיים — קישורי מקור מוצגים אוטומטית

=== דיווח תוצאות (קריטי!) ===
⚠️ **חוק ברזל: אסור בהחלט לדווח נתונים שלא נשלפו בפועל מהכלים!**
- אם **מצאת** תוצאות — החזר סיכום עם הנתונים שנשלפו
- אם **לא מצאת** — דווח בבירור שלא נמצאו תוצאות, ואל תמציא מידע
- **אל תמציא שמות הצעות חוק, חברי כנסת או ועדות!** כל מידע חייב לבוא מתוצאת כלי

=== מיקוד משימה ===
כל האצלה מסוכן הניתוב עשויה להיות משימה חלקית.
השלם את המשימה הספציפית, כתוב סיכום טקסטואלי, וחזור.

=== דרישות ===
⚠️ **חובה מוחלטת**: לאחר שליפת הנתונים, כתוב תשובה טקסטואלית מסכמת!
הסוכן המנתב רואה **רק את הטקסט שאתה כותב** — הוא לא רואה את תוצאות הכלים ישירות.`;

// ============================================================================
// Agent Factory
// ============================================================================

/** Factory: creates a Knesset agent with the given Mastra model ID */
export function createKnessetAgent(modelId: string): Agent {
    return new Agent({
        id: 'knessetAgent',
        name: KNESSET_AGENT_NAME,
        description: KNESSET_AGENT_DESCRIPTION,
        instructions: KNESSET_AGENT_INSTRUCTIONS,
        model: modelId,
        tools: KnessetTools,
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
