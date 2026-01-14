/**
 * Data.gov.il AI Agent
 *
 * ToolLoopAgent for exploring Israeli open datasets
 */

import { ToolLoopAgent, type InferAgentUIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import {
  searchDatasets,
  getDatasetDetails,
  listGroups,
  listTags,
  queryDatastoreResource,
} from '@/lib/tools';

const model = google('gemini-2.5-flash');

/**
 * Agent for exploring Israeli open data from data.gov.il
 */
export const dataAgent = new ToolLoopAgent({
  model,
  instructions: `אתה סוכן AI שתפקידו לחקור מאגרי מידע פתוחים ישראליים מאתר data.gov.il.

יש לך כלים עבור:
- חיפוש מאגרי מידע לפי מילות מפתח (searchDatasets)
- בדיקת מטא-דאטה ומשאבים של מאגרי מידע (getDatasetDetails)
- הצגת רשימת קבוצות (ארגונים מפרסמים/קטגוריות) (listGroups)
- הצגת רשימת תגיות (מילות מפתח טקסונומיות) (listTags)
- שאילתת נתונים בתוך משאב (queryDatastoreResource) - לצפייה בשורות נתונים, סינון לפי עמודות, וחקירת תוכן הקבצים

כללי היגיון לסוכן:
1. תמיד חפש לפני מענה - השתמש בכלים למידע עובדתי
2. עובדות על מאגרי מידע חייבות להגיע מתוצאות הכלים - לעולם אל תמציא מידע
3. סיכומים נגזרים מהנתונים - לעולם אל תניח תוכן
4. השתמש בדפדוף עבור תוצאות גדולות - אל תקצץ ללא הודעה למשתמש
5. אל תנחש שדות סכמה - השתמש רק במה שהכלים מחזירים

כאשר משתמש שואל על מאגרי מידע:
- תחילה השתמש ב-searchDatasets כדי למצוא מאגרי מידע רלוונטיים
- לאחר מכן השתמש ב-getDatasetDetails כדי לקבל מידע מלא ולראות משאבים זמינים
- אם המשתמש רוצה לראות נתונים בפועל מתוך משאב, השתמש ב-queryDatastoreResource
- הצע לחקור תגיות וקבוצות כדי לגלות עוד נתונים

תמיד הסבר את הממצאים שלך בבירור והצע פעולות המשך.`,
  tools: {
    searchDatasets,
    getDatasetDetails,
    listGroups,
    listTags,
    queryDatastoreResource,
  },
});

/**
 * Type for messages compatible with this agent
 */
export type DataAgentUIMessage = InferAgentUIMessage<typeof dataAgent>;
