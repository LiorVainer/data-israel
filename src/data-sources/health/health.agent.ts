/**
 * Health Agent
 *
 * Queries the Israeli Ministry of Health data dashboard —
 * health statistics, medical services, beach quality, HMO data, and more.
 */

import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { AgentConfig } from '@/agents/agent.config';
import { AGENT_SCORERS } from '@/agents/evals/eval.config';
import { HealthTools } from './tools';
import { EnsureTextOutputProcessor } from '@/agents/processors/ensure-text-output.processor';
import { FailedToolCallGuardProcessor } from '@/agents/processors/failed-tool-call-guard.processor';
import { TruncateToolResultsProcessor } from '@/agents/processors/truncate-tool-results.processor';

const { MEMORY } = AgentConfig;

// ============================================================================
// Agent Instructions
// ============================================================================

export const HEALTH_AGENT_NAME = 'סוכן בריאות';

export const HEALTH_AGENT_DESCRIPTION =
    'Queries the Israeli Ministry of Health data dashboard — health statistics, medical services, beach quality, HMO data, child immunizations, and service quality.';

export const HEALTH_AGENT_INSTRUCTIONS = `אתה סוכן מומחה לנתוני לוח המחוונים של משרד הבריאות הישראלי.

התאריך של היום הוא: ${new Date().toDateString()}

=== מטרתך ===
לעזור למשתמשים לגשת לנתוני בריאות ציבורית ממשרד הבריאות.

=== יכולות ===
- גילוי נושאים: השתמש ב-getAvailableSubjects לראות את כל הנושאים הזמינים
- מטא-דאטה: השתמש ב-getHealthMetadata לגלות נקודות נתונים זמינות לנושא
- שליפת נתונים: השתמש ב-getHealthData עם שם endpoint מתוצאות המטא-דאטה
- קישורים: השתמש ב-getHealthLinks לקבל קישורים ומסמכים רלוונטיים

=== נושאים זמינים ===
- warCasualties — נפגעי מלחמה ופעולות איבה
- medicalServices — שירותי רפואה ובתי חולים
- beaches — איכות מי רחצה בחופי ישראל
- HMO_insured_main — מבוטחי קופות חולים
- childKi — חיסוני ילדים ותינוקות
- childCheckup — בדיקות התפתחותיות לילדים
- serviceQuality — מדדי איכות השירות במערכת הבריאות

=== אסטרטגיית חיפוש (קריטי!) ===
1. התחל ב-getAvailableSubjects אם המשתמש לא ציין נושא ספציפי
2. קרא ל-getHealthMetadata כדי לגלות endpoints זמינים
3. שלוף נתונים עם getHealthData — **תמיד שלוף נתונים** לפני שאתה עונה!
4. אם יש קישורים רלוונטיים, השתמש ב-getHealthLinks

=== עקרונות מנחים ===
1. הסתר פרטים טכניים — אל תציג שמות endpoints או מבנה API
2. הצג נתונים בטבלאות מסודרות עם תוויות בעברית
3. אם endpoint מחזיר embedLink (מפה), ציין שיש מפה אינטראקטיבית

=== תמציתיות בתשובות ===
- החזר **סיכום תמציתי בעברית** בלבד — לעולם אל תחזיר JSON גולמי
- הגבל תוצאות ל-10-15 פריטים; ציין כמה עוד קיימים
- אל תכלול URLים או שדות פנימיים בתשובה

=== דיווח תוצאות (קריטי!) ===
⚠️ **חוק ברזל: אסור בהחלט לדווח נתונים שלא נשלפו בפועל מהכלים!**
- אם **מצאת** נתונים — החזר סיכום תמציתי
- אם **לא מצאת** — דווח בבירור
- **אל תמציא נתונים!** כל מספר חייב לבוא מתוצאות כלי

=== קישורי מקור ===
לאחר שליפת נתונים, קרא ל-generateHealthSourceUrl עם שם הנושא כדי ליצור קישור למקור.

=== מיקוד משימה ===
כל האצלה מסוכן הניתוב עשויה להיות משימה חלקית.
השלם את המשימה הספציפית, כתוב סיכום טקסטואלי, וחזור.

=== דרישות ===
⚠️ **חובה מוחלטת**: לאחר שליפת הנתונים, כתוב תשובה טקסטואלית מסכמת!
הסוכן המנתב רואה **רק את הטקסט שאתה כותב**.`;

// ============================================================================
// Agent Factory
// ============================================================================

/** Factory: creates a Health agent with the given Mastra model ID */
export function createHealthAgent(modelId: string): Agent {
    return new Agent({
        id: 'healthAgent',
        name: HEALTH_AGENT_NAME,
        description: HEALTH_AGENT_DESCRIPTION,
        instructions: HEALTH_AGENT_INSTRUCTIONS,
        model: modelId,
        tools: HealthTools,
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
