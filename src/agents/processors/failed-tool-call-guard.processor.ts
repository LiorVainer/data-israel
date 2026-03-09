/**
 * FailedToolCallGuard Processor
 *
 * Deterministic guardrail that prevents the LLM from fabricating data
 * when tool calls have failed. Uses `processInputStep` to scan previous
 * steps for tool results with `success: false` and injects a forceful
 * system message reminding the agent to report failures honestly.
 */

import type {
    Processor,
    ProcessInputStepArgs,
    ProcessInputStepResult,
} from '@mastra/core/processors';

/** Shape of a failed tool result extracted from step history */
interface ToolFailure {
    readonly toolName: string;
    readonly error: string;
    readonly searchedResourceName: string | undefined;
}

/** Narrow type guard for tool outputs that follow the success/failure discriminator pattern */
function isFailedToolOutput(
    output: unknown,
): output is { readonly success: false; readonly error: string; readonly searchedResourceName?: string } {
    if (typeof output !== 'object' || output === null) return false;
    return (
        'success' in output &&
        output.success === false &&
        'error' in output &&
        typeof (output as { error: unknown }).error === 'string'
    );
}

/** Extract failed tool calls from all previous steps */
function extractFailedTools(steps: Readonly<ProcessInputStepArgs['steps']>): readonly ToolFailure[] {
    const failures: ToolFailure[] = [];

    for (const step of steps) {
        if (!step.toolResults?.length) continue;

        for (const toolResult of step.toolResults) {
            if (!isFailedToolOutput(toolResult.output)) continue;

            failures.push({
                toolName: toolResult.toolName,
                error: toolResult.output.error,
                searchedResourceName: toolResult.output.searchedResourceName,
            });
        }
    }

    return failures;
}

function buildGuardMessage(failures: readonly ToolFailure[]): string {
    const failureList = failures
        .map((f) => `- ${f.searchedResourceName ?? f.toolName}: ${f.error}`)
        .join('\n');

    return `⚠️ CRITICAL — FAILED TOOL CALLS DETECTED ⚠️
The following data retrieval tools returned errors (success: false):
${failureList}

MANDATORY RULES:
1. Do NOT invent, estimate, or guess any numbers, percentages, or statistics for the failed data sources.
2. If the failed data was essential to answering the question — clearly state that the data retrieval failed and you cannot provide those specific numbers.
3. Only report data that was successfully retrieved (success: true) from tool results.
4. If you have partial data from successful tools, present only that data and explicitly note which parts could not be retrieved.

Violation of these rules causes real harm — users rely on this data for decisions.`;
}

/**
 * Scans previous step tool results for `success: false` and injects
 * a system message that forcefully prevents data fabrication.
 *
 * This processor is deterministic: it triggers based on actual tool
 * result data, not heuristics or LLM judgment.
 */
export class FailedToolCallGuardProcessor implements Processor {
    readonly id = 'failed-tool-call-guard';

    async processInputStep({
        steps,
        systemMessages,
    }: ProcessInputStepArgs): Promise<ProcessInputStepResult | void> {
        if (!steps.length) return;

        const failures = extractFailedTools(steps);
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
