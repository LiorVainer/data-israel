/**
 * Chat Stop Conditions
 *
 * Custom stop conditions for the agent streaming loop.
 */

import type { StopCondition } from 'ai';
import { AgentConfig } from '@/agents/agent.config';

const { CHAT } = AgentConfig;

/**
 * Requires BOTH a text response AND suggestFollowUps to have been called.
 *
 * Enforced flow:
 * 1. Agent calls data tools -> no text yet -> continue
 * 2. Agent calls source URL tools + suggestFollowUps -> has tool calls -> continue
 * 3. Agent writes final text -> text + no tool calls + suggestions called -> STOP
 *
 * If agent writes text without calling suggestFollowUps, loop continues so agent
 * can call it (instructions mandate this). MAX_STEPS is the safety fallback.
 */
export const hasCompletedWithSuggestions: StopCondition<any> = ({ steps }) => {
    if (steps.length > CHAT.MAX_STEPS) return true;

    const lastStep = steps[steps.length - 1];

    // Last step must be a pure text response (no tool calls in this step)
    const hasTextResponse = !!lastStep?.text && !lastStep?.toolCalls?.length;
    if (!hasTextResponse) return false;

    // suggestFollowUps must have been called in some step
    return steps.some((step) => step.toolCalls?.some((tc) => tc.toolName === CHAT.SUGGEST_TOOL_NAME));
};
