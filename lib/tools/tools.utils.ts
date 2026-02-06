import type { Tool } from '@mastra/core/tools';

/**
 * תוציא תיאורי כלים מאובייקט כלים ויצור מפה של תיאורים
 * @param tools - אובייקט של כלים (Tool objects)
 * @returns Record<string, string> - מפה של {toolId: toolDescription}
 */
export function extractToolDescriptions(tools: Record<string, Tool | unknown>): Record<string, string> {
    const toolDescriptions: Record<string, string> = {};

    Object.entries(tools).forEach(([toolId, tool]) => {
        // בדוק אם זה אובייקט עם property description
        if (tool && typeof tool === 'object' && 'description' in tool && typeof tool.description === 'string') {
            toolDescriptions[toolId] = tool.description;
        } else if (tool && typeof tool === 'object' && 'description' in tool) {
            // אם description קיים אבל לא string, המר לstring
            toolDescriptions[toolId] = String(tool.description || 'כלי ללא תיאור');
        } else {
            // אם אין description, השתמש בערך default
            console.warn(`Tool "${toolId}" does not have a description`);
            toolDescriptions[toolId] = `כלי: ${toolId}`;
        }
    });

    return toolDescriptions;
}

/**
 * גרסה חלופית עם הטיפול יותר מוקפד עבור edge cases
 */
export function extractToolDescriptionsStrict(tools: Record<string, Tool | unknown>): Record<string, string> {
    const toolDescriptions: Record<string, string> = {};

    Object.entries(tools).forEach(([toolId, tool]) => {
        try {
            if (!tool || typeof tool !== 'object') {
                console.warn(`Tool "${toolId}" is not an object`);
                toolDescriptions[toolId] = `כלי: ${toolId}`;
                return;
            }

            const description = (tool as Record<string, unknown>).description;

            if (description && typeof description === 'string' && description.trim()) {
                toolDescriptions[toolId] = description;
            } else {
                console.warn(`Tool "${toolId}" has missing or invalid description`, { description });
                toolDescriptions[toolId] = `כלי: ${toolId}`;
            }
        } catch (error) {
            console.error(`Error extracting description for tool "${toolId}":`, error);
            toolDescriptions[toolId] = `כלי: ${toolId}`;
        }
    });

    return toolDescriptions;
}

/**
 * גרסה עם הדפסת log מעידה לדיבוג
 */
export function extractToolDescriptionsWithLogging(
    tools: Record<string, Tool | unknown>,
    verbose: boolean = false,
): Record<string, string> {
    const toolDescriptions: Record<string, string> = {};

    console.log(`📦 Extracting descriptions from ${Object.keys(tools).length} tools...`);

    Object.entries(tools).forEach(([toolId, tool]) => {
        if (tool && typeof tool === 'object' && 'description' in tool && typeof tool.description === 'string') {
            toolDescriptions[toolId] = tool.description;
            if (verbose) {
                console.log(`✅ ${toolId}: ${tool.description.substring(0, 50)}...`);
            }
        } else {
            const fallback = `כלי: ${toolId}`;
            toolDescriptions[toolId] = fallback;
            if (verbose) {
                console.log(`⚠️ ${toolId}: using fallback`);
            }
        }
    });

    console.log(`✅ Successfully extracted ${Object.keys(toolDescriptions).length} tool descriptions`);

    return toolDescriptions;
}
