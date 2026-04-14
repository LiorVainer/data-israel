/**
 * FailedToolCallGuard Processor
 *
 * Deterministic guardrail that prevents the LLM from fabricating data
 * when tool calls have failed. Scans both step history and message history
 * for failed tool results and injects a system message reminding the agent
 * to report failures honestly.
 *
 * Note: Mastra may not populate `steps` for sub-agents (delegated agents),
 * so this processor also scans `messages` as a fallback.
 */

import type { ProcessInputStepArgs, ProcessInputStepResult, Processor } from '@mastra/core/processors';
import type { AIV4Type } from '@mastra/core/agent/message-list';

/** Shape of a failed tool result extracted from step/message history */
interface ToolFailure {
    readonly toolName: string;
    readonly error: string;
    readonly searchedResourceName: string | undefined;
}

/** Narrow type guard for tool outputs that indicate failure.
 *  Matches both `{ success: false, error: '...' }` (our standard pattern)
 *  and `{ error: true, message: '...' }` (Mastra validation errors). */
function isFailedToolOutput(output: unknown): output is {
    readonly success?: false;
    readonly error: string | true;
    readonly message?: string;
    readonly searchedResourceName?: string;
} {
    if (typeof output !== 'object' || output === null) return false;
    const obj = output as Record<string, unknown>;
    // Standard pattern: { success: false, error: '...' }
    if (obj.success === false && typeof obj.error === 'string') return true;
    // Mastra validation error: { error: true, message: '...' }
    if (obj.error === true && typeof obj.message === 'string') return true;
    return false;
}

function extractErrorString(output: { readonly error: string | true; readonly message?: string }): string {
    return typeof output.error === 'string' ? output.error : (output.message ?? 'Tool execution failed');
}

/** Extract failed tool calls from step history */
function extractFailedTools(steps: Readonly<ProcessInputStepArgs['steps']>): readonly ToolFailure[] {
    const failures: ToolFailure[] = [];

    for (const step of steps) {
        if (!step.toolResults?.length) continue;

        for (const toolResult of step.toolResults) {
            if (!isFailedToolOutput(toolResult.output)) continue;

            failures.push({
                toolName: toolResult.toolName,
                error: extractErrorString(toolResult.output),
                searchedResourceName: toolResult.output.searchedResourceName,
            });
        }
    }

    return failures;
}

/** Extract failed tool calls from message history (fallback when steps is empty).
 *  Scans assistant message parts for tool-* parts with output matching failure pattern. */
function extractFailedToolsFromMessages(messages: Readonly<ProcessInputStepArgs['messages']>): readonly ToolFailure[] {
    const failures: ToolFailure[] = [];

    for (const msg of messages) {
        if (msg.role !== 'assistant') continue;
        const parts = msg.content?.parts;
        if (!Array.isArray(parts)) continue;

        for (const part of parts) {
            if (part.type !== 'tool-invocation') continue;

            const { toolInvocation } = part as AIV4Type.ToolInvocationUIPart;
            if (toolInvocation.state !== 'result') continue;

            const result = toolInvocation.result;
            if (!isFailedToolOutput(result)) continue;

            failures.push({
                toolName: toolInvocation.toolName,
                error: extractErrorString(result),
                searchedResourceName: result.searchedResourceName,
            });
        }
    }

    return failures;
}

function buildGuardMessage(failures: readonly ToolFailure[]): string {
    const failureList = failures.map((f) => `- ${f.searchedResourceName ?? f.toolName}: ${f.error}`).join('\n');

    return `⚠️ CRITICAL — FAILED TOOL CALLS DETECTED ⚠️
The following data retrieval tools returned errors:
${failureList}

MANDATORY RULES:
1. Do NOT invent, estimate, or guess any numbers, percentages, or statistics for the failed data sources.
2. If the failed data was essential to answering the question — clearly state that the data retrieval failed and you cannot provide those specific numbers.
3. Only report data that was successfully retrieved (success: true) from tool results.
4. If you have partial data from successful tools, present only that data and explicitly note which parts could not be retrieved.

Violation of these rules causes real harm — users rely on this data for decisions.`;
}

/**
 * Scans previous step/message history for failed tool results and injects
 * a system message that forcefully prevents data fabrication.
 *
 * Uses two extraction paths:
 * 1. `steps` array (standard Mastra step history)
 * 2. `messages` array (fallback — Mastra may not populate steps for sub-agents)
 */
export class FailedToolCallGuardProcessor implements Processor {
    readonly id = 'failed-tool-call-guard';

    async processInputStep({
        steps,
        messages,
        systemMessages,
    }: ProcessInputStepArgs): Promise<ProcessInputStepResult | void> {
        // Try steps first (standard path), fall back to messages (sub-agent workaround)
        const failures = steps.length > 0 ? extractFailedTools(steps) : extractFailedToolsFromMessages(messages);

        if (!failures.length) return;

        return {
            systemMessages: [
                ...systemMessages,
                {
                    role: 'system' as const,
                    content: buildGuardMessage(failures),
                },
            ],
        };
    }
}
