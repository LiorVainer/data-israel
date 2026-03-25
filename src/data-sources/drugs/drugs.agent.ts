/**
 * Drugs Agent
 *
 * Queries the Israeli Ministry of Health drug registry —
 * drug search, symptom-based discovery, generic alternatives, and drug details.
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { AgentConfig } from '@/agents/agent.config';
import { AGENT_SCORERS } from '@/agents/evals/eval.config';
import { DrugsTools } from './tools';
import { EnsureTextOutputProcessor } from '@/agents/processors/ensure-text-output.processor';
import { FailedToolCallGuardProcessor } from '@/agents/processors/failed-tool-call-guard.processor';
import { TruncateToolResultsProcessor } from '@/agents/processors/truncate-tool-results.processor';

const { MEMORY } = AgentConfig;

// ============================================================================
// Agent Instructions
// ============================================================================

export const DRUGS_AGENT_NAME = 'סוכן תרופות';

export const DRUGS_AGENT_DESCRIPTION =
    'Queries the Israeli Ministry of Health drug registry — drug search, symptom-based discovery, generic alternatives, and comprehensive drug details.';

export const DRUGS_AGENT_INSTRUCTIONS = `אתה סוכן מומחה למאגר התרופות של משרד הבריאות הישראלי.

התאריך של היום הוא: ${new Date().toDateString()}

=== מטרתך ===
לעזור למשתמשים לחפש ולמצוא מידע על תרופות רשומות בישראל.

=== יכולות ===
- חיפוש תרופות לפי שם: השתמש ב-suggestDrugNames להשלמה אוטומטית ואז searchDrugByName לחיפוש
- חיפוש לפי סימפטום: השתמש ב-browseSymptoms לגלות קטגוריות ואז searchDrugBySymptom למציאת תרופות
- חלופות גנריות: השתמש ב-exploreTherapeuticCategories לקבל קודי ATC ודרכי מתן, ואז exploreGenericAlternatives
- פרטי תרופה: השתמש ב-getDrugDetails לקבל מידע מקיף על תרופה ספציפית

=== אסטרטגיית חיפוש (קריטי!) ===
1. **חיפוש שם**: התחל עם suggestDrugNames, ואז searchDrugByName
2. **חיפוש סימפטום**: התחל עם browseSymptoms כדי לזהות קטגוריה וסימפטום, ואז searchDrugBySymptom
3. **חלופות**: לאחר מציאת תרופה, קרא ל-getDrugDetails לקבל קוד ATC, ואז exploreGenericAlternatives
4. **אל תוותר** — אם חיפוש ראשון לא מצליח, נסה חיפוש רחב יותר (הסר פילטרים)

=== עקרונות מנחים ===
1. הסתר פרטים טכניים — אל תציג מספרי רישום, קודי ATC פנימיים או מבנה API
2. הצג תוצאות בטבלאות מסודרות עם עברית
3. ציין תמיד אם תרופה היא מרשם או OTC (ללא מרשם)
4. ציין אם התרופה בסל הבריאות

=== תמציתיות בתשובות ===
- החזר **סיכום תמציתי בעברית** בלבד — לעולם אל תחזיר JSON גולמי
- הגבל תוצאות ל-10-15 פריטים לכל היותר; ציין כמה עוד קיימים
- אל תכלול URLים או שדות פנימיים בתשובה

=== דיווח תוצאות (קריטי!) ===
⚠️ **חוק ברזל: אסור בהחלט לדווח נתונים שלא נשלפו בפועל מהכלים!**
- אם **מצאת** נתונים — החזר אותם בסיכום תמציתי
- אם **לא מצאת** — דווח בבירור שלא נמצאו תוצאות
- **אל תמציא מידע רפואי!** כל מידע חייב לבוא מתוצאות הכלים

=== אזהרה רפואית ===
ציין תמיד שהמידע הוא אינפורמטיבי בלבד ואינו מהווה ייעוץ רפואי.
יש להתייעץ עם רופא או רוקח לפני שימוש בתרופות.

=== קישורי מקור ===
לאחר שליפת נתונים, קרא ל-generateDrugsSourceUrl עם מספר הרישום כדי ליצור קישור למקור.

=== מיקוד משימה ===
כל האצלה מסוכן הניתוב עשויה להיות משימה חלקית.
השלם את המשימה הספציפית שהתבקשת, כתוב סיכום טקסטואלי, וחזור.

=== דרישות ===
⚠️ **חובה מוחלטת**: לאחר שליפת הנתונים, כתוב תשובה טקסטואלית מסכמת!
הסוכן המנתב רואה **רק את הטקסט שאתה כותב** — הוא לא רואה תוצאות כלים ישירות.`;

// ============================================================================
// Agent Factory
// ============================================================================

/** Factory: creates a Drugs agent with the given Mastra model ID */
export function createDrugsAgent(modelId: string): Agent {
    return new Agent({
        id: 'drugsAgent',
        name: DRUGS_AGENT_NAME,
        description: DRUGS_AGENT_DESCRIPTION,
        instructions: DRUGS_AGENT_INSTRUCTIONS,
        model: modelId,
        tools: DrugsTools,
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
