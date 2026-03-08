/**
 * Meta-prompt builder for prompt optimization.
 *
 * Takes the current agent prompt and grouped failure examples,
 * then produces a prompt for the optimizer LLM to revise the instruction.
 */

export interface FailureGroup {
    scorerId: string;
    avgScore: number;
    examples: Array<{ input: string; output: string; score: number; reason: string }>;
}

export function buildMetaPrompt(agentId: string, currentPrompt: string, failures: FailureGroup[]): string {
    const failureSections = failures
        .map(({ scorerId, avgScore, examples }) => {
            const exampleText = examples
                .slice(0, 5)
                .map(
                    (ex, i) =>
                        `  Example ${i + 1} (score: ${ex.score.toFixed(2)}):
    Input: ${ex.input.slice(0, 200)}
    Output: ${ex.output.slice(0, 500)}
    Reason: ${ex.reason}`,
                )
                .join('\n\n');

            return `### Scorer: ${scorerId} (avg score: ${avgScore.toFixed(2)})
${exampleText}`;
        })
        .join('\n\n');

    return `You are an expert prompt engineer specializing in Hebrew AI agent instructions.

## Task
Improve the system instruction for agent "${agentId}" to address the quality issues found by automated scorers.

## Current Instruction
\`\`\`
${currentPrompt}
\`\`\`

## Low-Scoring Examples (grouped by scorer)
${failureSections}

## Rules
1. Keep the instruction in Hebrew
2. Preserve ALL existing capabilities and rules — do not remove anything that works
3. Add specific guidance to address the failures shown above
4. Be concise — add minimal text to fix the issues
5. Return ONLY the revised instruction text, no explanation

## Revised Instruction`;
}
