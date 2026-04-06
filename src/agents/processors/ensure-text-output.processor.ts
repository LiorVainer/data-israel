/**
 * EnsureTextOutput Processor
 *
 * Forces text generation after a threshold of tool-call-only steps.
 * Solves the sub-agent empty text problem: when a sub-agent exhausts all
 * its steps on tool calls without producing any text, the routing agent
 * receives `text: ""` and cannot synthesize a response.
 *
 * Uses `processInputStep` to set `toolChoice: 'none'` once the step count
 * reaches the threshold and no text has been produced yet.
 */

import type { Processor, ProcessInputStepArgs, ProcessInputStepResult } from '@mastra/core/processors';

/**
 * After `stepThreshold` steps with tool calls but no text output,
 * forces the next LLM step to generate text by disabling tool calls.
 */
export class EnsureTextOutputProcessor implements Processor {
    readonly id = 'ensure-text-output';

    constructor(private readonly stepThreshold: number = 8) {}

    async processInputStep({
        stepNumber,
        steps,
        systemMessages,
    }: ProcessInputStepArgs): Promise<ProcessInputStepResult | void> {
        const hasToolCalls = steps.some((s) => s.toolCalls?.length);
        if (!hasToolCalls) return; // First step or no tool calls yet — don't interfere

        const hasText = steps.some((s) => s.text?.trim());
        if (stepNumber >= this.stepThreshold && !hasText) {
            return {
                toolChoice: 'none' as const, // Force text generation, no more tool calls
                systemMessages: [
                    ...systemMessages,
                    {
                        role: 'system' as const,
                        content:
                            'חובה: כתוב עכשיו תשובה טקסטואלית מסכמת בעברית. סכם את כל הממצאים מתוצאות הכלים. אסור לקרוא לכלים נוספים.',
                    },
                ],
            };
        }
    }
}
