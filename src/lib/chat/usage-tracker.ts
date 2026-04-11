/**
 * Usage Tracker
 *
 * Tracks token usage across agent steps for context window snapshots and billing.
 */

export interface UsageSnapshot {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    reasoningTokens: number;
    cachedInputTokens: number;
}

function emptySnapshot(): UsageSnapshot {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0, reasoningTokens: 0, cachedInputTokens: 0 };
}

/**
 * Creates a usage tracker with two accumulators:
 * - `context`: overwritten each step (last step = actual context window size)
 * - `billing`: summed across all steps (real API cost per turn)
 */
export function createUsageTracker() {
    const context = emptySnapshot();
    const billing = emptySnapshot();

    function onStepFinish({ usage }: { usage: Partial<UsageSnapshot> }) {
        // Context snapshot: override (last step = context window size)
        context.inputTokens = usage.inputTokens ?? 0;
        context.outputTokens = usage.outputTokens ?? 0;
        context.totalTokens = usage.totalTokens ?? 0;
        context.reasoningTokens = usage.reasoningTokens ?? 0;
        context.cachedInputTokens = usage.cachedInputTokens ?? 0;
        // Billing: accumulate (sum of all steps = real API cost)
        billing.inputTokens += usage.inputTokens ?? 0;
        billing.outputTokens += usage.outputTokens ?? 0;
        billing.totalTokens += usage.totalTokens ?? 0;
        billing.reasoningTokens += usage.reasoningTokens ?? 0;
        billing.cachedInputTokens += usage.cachedInputTokens ?? 0;
    }

    return { context, billing, onStepFinish };
}

/** Converts a UsageSnapshot to the shape expected by Convex upsertThread mutations. */
export function toConvexUsage(snapshot: UsageSnapshot) {
    return {
        promptTokens: snapshot.inputTokens,
        completionTokens: snapshot.outputTokens,
        totalTokens: snapshot.totalTokens,
        reasoningTokens: snapshot.reasoningTokens || undefined,
        cachedInputTokens: snapshot.cachedInputTokens || undefined,
    };
}
