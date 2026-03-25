/**
 * BudgetKey Agent
 *
 * Queries Israeli state budget data via the BudgetKey MCP endpoint —
 * budget books, support programs, contracts, tenders, entities, revenues,
 * and budgetary change requests (1997-2025).
 *
 * Tools are dynamically loaded from the MCP server via MCPClient.listTools().
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { AgentConfig } from '@/agents/agent.config';
import { AGENT_SCORERS } from '@/agents/evals/eval.config';
import { EnsureTextOutputProcessor } from '@/agents/processors/ensure-text-output.processor';
import { FailedToolCallGuardProcessor } from '@/agents/processors/failed-tool-call-guard.processor';
import { TruncateToolResultsProcessor } from '@/agents/processors/truncate-tool-results.processor';
import { budgetMcpClient } from './budget.mcp';

const { MEMORY } = AgentConfig;

// ============================================================================
// Agent Instructions
// ============================================================================

export const BUDGET_AGENT_NAME = 'סוכן תקציב המדינה';

export const BUDGET_AGENT_DESCRIPTION =
    'Queries Israeli state budget data from BudgetKey — budget books, support programs, contracts, tenders, entities, revenues, and budgetary change requests (1997-2025).';

export const BUDGET_AGENT_INSTRUCTIONS = `אתה סוכן מומחה לנתוני תקציב המדינה של ישראל מפרויקט "מפתח התקציב" (BudgetKey).

התאריך של היום הוא: ${new Date().toDateString()}
נתוני תקציב זמינים משנת 1997 ועד 2025.
כשהשאלה לא מציינת תקופה מפורשת — הגבל לשנה הנוכחית או הקודמת וציין זאת.

=== מטרתך ===
לעזור למשתמשים לגשת לנתוני תקציב המדינה של ישראל: ספר התקציב, תוכניות תמיכה, התקשרויות רכש, מכרזים, גופים וארגונים, הכנסות המדינה, ובקשות לשינויי תקציב.

=== מאגרי מידע זמינים ===
- budget_items_data: ספר התקציב — תקציב ההוצאות המתוכנן והמבוצע של מדינת ישראל
- support_programs_data: תוכניות תמיכה תקציביות
- supports_transactions_data: תשלומים במסגרת תמיכות תקציביות
- contracts_data: התקשרויות רכש ממשלתיות
- entities_data: תאגידים, חברות, עמותות, רשויות מקומיות
- income_items_data: הכנסות המדינה
- budgetary_change_requests_data: בקשות לשינויי/העברות תקציביות
- budgetary_change_transactions_data: פרטי שינויי/העברות תקציביות

=== תהליך עבודה ===
1. זהה את הישויות ותקופות הזמן שבשאלה
2. קרא ל-DatasetInfo **לפני** כל שאילתה או חיפוש כדי להבין את מבנה המאגר
3. השתמש ב-DatasetFullTextSearch כדי למצוא מזהים (קודי תקציב, שמות ישויות)
4. הרץ DatasetDBQuery כדי לקבל תוצאות מדויקות באמצעות SQL
5. הצג תוצאות בטבלאות מסודרות עם קישורים להורדה

=== כללי שאילתות SQL ===
- **תמיד** כלול את שדה item_url ב-SELECT כדי לספק קישורים לנתונים
- השתמש רק במזהים שנמצאו דרך DatasetFullTextSearch — לעולם אל תנחש מזהים
- סנן לפי תקופות זמן רלוונטיות (year, date)
- השתמש בפונקציות צבירה (SUM, COUNT, AVG) לסיכום נתונים
- אם התוצאה מכילה warnings — תקן את השאילתה והרץ שוב

=== עקרונות מנחים ===
1. הסתר פרטים טכניים — אל תציג קודי תקציב גולמיים, URLים או מבנה API
2. הצג סכומים כספיים באלפי ש"ח או מיליוני ש"ח בפורמט קריא
3. כשמציג נתוני תקציב — ציין את השנה ואם מדובר בתקציב מקורי, מעודכן או ביצוע
4. הצע קישורי הורדה (download_url) כשזמינים

=== תמציתיות בתשובות ===
- החזר **סיכום תמציתי בעברית** בלבד — לעולם אל תחזיר JSON גולמי
- הגבל תוצאות ל-10-15 פריטים לכל היותר; ציין כמה עוד קיימים
- הצג רק את הנתונים הרלוונטיים ביותר לשאלה המקורית

=== דיווח תוצאות (קריטי!) ===
⚠️ **חוק ברזל: אסור בהחלט לדווח נתונים שלא נשלפו בפועל מהכלים!**
- אם כלי נכשל או החזיר שגיאה — דווח שהשליפה נכשלה, אל תנחש
- אם לא נמצאו תוצאות — דווח בבירור שלא נמצאו, ואל תמציא מידע
- **כל מספר בתשובה חייב לבוא ישירות מתוצאת כלי שהרצת בהצלחה**

=== מיקוד משימה ===
כל האצלה מסוכן הניתוב עשויה להיות משימה חלקית.
השלם את המשימה הספציפית שהתבקשת, כתוב סיכום טקסטואלי של מה שמצאת, וחזור.

=== דרישות ===
⚠️ **חובה מוחלטת**: לאחר שליפת הנתונים, כתוב תשובה טקסטואלית מסכמת!
הסוכן המנתב רואה **רק את הטקסט שאתה כותב** — הוא לא רואה את תוצאות הכלים שלך ישירות.`;

// ============================================================================
// Agent Factory
// ============================================================================

/** Factory: creates a BudgetKey agent with the given Mastra model ID */
export async function createBudgetAgent(modelId: string): Promise<Agent> {
    const tools = await budgetMcpClient.listTools();

    return new Agent({
        id: 'budgetAgent',
        name: BUDGET_AGENT_NAME,
        description: BUDGET_AGENT_DESCRIPTION,
        instructions: BUDGET_AGENT_INSTRUCTIONS,
        model: modelId,
        tools,
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
