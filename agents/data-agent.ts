/**
 * Data.gov.il AI Agent
 *
 * ToolLoopAgent for exploring Israeli open datasets
 */

import { ToolLoopAgent, type InferAgentUIMessage, type StepResult, type ToolSet } from 'ai';
import {
    // System tools
    getStatus,
    listLicenses,
    getDatasetSchema,
    // Dataset tools
    searchDatasets,
    listAllDatasets,
    getDatasetDetails,
    getDatasetActivity,
    // Organization tools
    listOrganizations,
    getOrganizationDetails,
    getOrganizationActivity,
    // Group and tag tools
    listGroups,
    listTags,
    // Resource tools
    searchResources,
    getResourceDetails,
    queryDatastoreResource,
    // Chart display tools
    displayBarChart,
    displayLineChart,
    displayPieChart,
} from '@/lib/tools';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { AgentConfig } from './agent.config';

/** Agent tools for type inference */
const agentTools = {
    getStatus,
    listLicenses,
    getDatasetSchema,
    searchDatasets,
    listAllDatasets,
    getDatasetActivity,
    getDatasetDetails,
    listOrganizations,
    getOrganizationDetails,
    getOrganizationActivity,
    listGroups,
    listTags,
    searchResources,
    getResourceDetails,
    queryDatastoreResource,
    // Chart display tools
    displayBarChart,
    displayLineChart,
    displayPieChart,
} satisfies ToolSet;

type AgentTools = typeof agentTools;

const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
});

/** Get model instance by ID */
const getModel = (modelId: string) => openrouter.chat(modelId);

/**
 * Custom stop condition for task completion
 * Stops when agent signals completion or hits safety limit
 */
const taskCompletionStop = ({ steps }: { steps: StepResult<AgentTools>[] }): boolean => {
    const stepCount = steps.length;
    const lastStep = steps[steps.length - 1];

    // Safety: Hard limit at max steps
    if (stepCount >= AgentConfig.TOOL_CALLS.MAX_STEPS) {
        return true;
    }

    // Minimum steps before stopping
    if (stepCount < AgentConfig.TOOL_CALLS.MIN_STEPS_BEFORE_STOP) {
        return false;
    }

    // Check for completion markers in agent's text response
    if (lastStep.text) {
        const hasCompletionMarker = AgentConfig.COMPLETION_MARKERS.some((marker) => lastStep.text?.includes(marker));

        if (hasCompletionMarker) {
            return true;
        }
    }

    // Stop if agent produced text without tool calls (done thinking)
    if (lastStep.text && (!lastStep.toolCalls || lastStep.toolCalls.length === 0)) {
        return true;
    }

    return false;
};

/** Agent instructions for data.gov.il exploration */
const agentInstructions = `אתה עוזר AI ידידותי שעוזר למשתמשים למצוא ולחקור נתונים פתוחים ישראליים מאתר data.gov.il.

=== מטרתך ===
לעזור לאנשים רגילים (לא מפתחים) למצוא מידע ממאגרי הנתונים הפתוחים של ישראל. אתה הגשר בין הנתונים הטכניים לבין המשתמש.

=== עקרונות מנחים ===
1. הסתר פרטים טכניים - אל תציג מזהים (IDs), שמות קבצים, או מונחים טכניים
2. דבר בשפה פשוטה - "מצאתי מאגר על בתי ספר" ולא "מצאתי dataset d882fbb6..."
3. הצג מידע מסודר - השתמש בטבלאות, רשימות וסיכומים
4. היה פרואקטיבי - תמיד הצע למשתמש מה לעשות הלאה
5. סיים משימות - אל תעצור באמצע, השלם את כל התהליך לפני שאתה עונה

=== זרימת עבודה טיפוסית ===
1. חפש מאגרים רלוונטיים
2. בדוק פרטי המאגרים שמצאת
3. שאל את הנתונים בפועל
4. הצג תרשים אם מתאים
5. סכם והצע המשך

=== כללי תצוגה ===
- הגבל ל-10-20 שורות וציין כמה יש בסך הכל
- כשמציג ממספר מאגרים - צור סיכום עם סטטיסטיקות (ממוצע, מינימום, מקסימום)
- השתמש בתוויות בעברית בתרשימים
- הגבל תרשימים ל-20 פריטים לקריאות טובה

=== סיום משימה ===
✅ מצאת נתונים: התחל ב-"סיכום:" והסבר מה מצאת
❌ לא מצאת: "לא מצאתי נתונים על [נושא]"
💡 הצע המשך: "רוצה שאחפש משהו נוסף?"

=== סגנון ===
דבר בגוף ראשון ("מצאתי", "אעזור לך"), היה ידידותי ומעודד.`;

/**
 * Factory function to create a data agent with a specific model
 */
export function createDataAgent(modelId: string = AgentConfig.MODEL.DEFAULT_ID) {
    return new ToolLoopAgent({
        model: getModel(modelId),
        toolChoice: 'auto',
        instructions: agentInstructions,
        tools: agentTools,
        stopWhen: taskCompletionStop,
    });
}

/**
 * Default agent instance for backwards compatibility
 */
export const dataAgent = createDataAgent();

/**
 * Type for messages compatible with this agent
 */
export type DataAgentUIMessage = InferAgentUIMessage<typeof dataAgent>;
