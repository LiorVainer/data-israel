import type { LucideIcon } from 'lucide-react';

/**
 * Re-export UI-related types from AI SDK
 * @see https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message
 */
export type {
    UIMessage,
    TextUIPart,
    ReasoningUIPart,
    SourceUrlUIPart,
    SourceDocumentUIPart,
    FileUIPart,
    UIToolInvocation,
} from 'ai';

/**
 * Tool state values matching AI SDK's UIToolInvocation states.
 * These states represent the lifecycle of a tool call.
 * Extracted from AIToolInvocation type for standalone use.
 * @see https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message
 */
export type ToolState =
    | 'input-streaming'
    | 'input-available'
    | 'output-available'
    | 'output-error'
    | 'approval-requested'
    | 'approval-responded'
    | 'output-denied';

/**
 * Simplified interface for tool call parts in messages.
 * This is a simplified version compatible with AI SDK's ToolUIPart structure
 * without requiring the full generic type parameters.
 *
 * Note: AI SDK's ToolUIPart is a complex generic type that requires UITools,
 * so we use this simplified interface that captures the common fields we need.
 */
export interface ToolCallPart {
    type: string;
    toolCallId?: string;
    state: ToolState;
    input?: unknown;
    output?: unknown;
    errorText?: string;
}

/**
 * Tool info containing display name and icon
 */
export interface ToolInfo {
    name: string;
    icon: LucideIcon;
}

/**
 * ChainOfThought step status
 */
export type StepStatus = 'complete' | 'active' | 'pending';

/**
 * Check if a part is a tool call
 */
export function isToolPart(part: { type: string }): part is ToolCallPart {
    return part.type.startsWith('tool-');
}

/**
 * Map tool state to ChainOfThoughtStep status
 */
export function getToolStatus(state: ToolState): StepStatus {
    switch (state) {
        case 'input-streaming':
        case 'input-available':
        case 'approval-requested':
            return 'active';
        case 'output-available':
        case 'approval-responded':
        case 'output-error':
        case 'output-denied':
            return 'complete';
        default:
            return 'pending';
    }
}

// ============================================================================
// Agent Data Part Types (for data-tool-agent streaming parts)
// ============================================================================

/** A tool call made internally by a sub-agent */
export interface AgentDataToolCall {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
}

/** A tool result from a sub-agent's internal execution */
export interface AgentDataToolResult {
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    result: Record<string, unknown>;
}

/**
 * Data payload of a `data-tool-agent` part emitted by Mastra's handleChatStream.
 * Contains the sub-agent's aggregated tool calls, results, and execution metadata.
 */
export interface AgentDataPartData {
    /** Agent name (e.g., 'datagovAgent') */
    id: string;
    /** Execution status */
    status: 'running' | 'finished';
    /** Final text output from the sub-agent */
    text: string;
    /** All tool calls the sub-agent initiated */
    toolCalls: AgentDataToolCall[];
    /** All tool results the sub-agent received */
    toolResults: AgentDataToolResult[];
    /** Raw step data */
    steps: unknown[];
    /** Why the sub-agent stopped */
    finishReason: string;
    /** Token usage */
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
}

/** The full shape of a data-tool-agent part in the UIMessage parts array */
export interface AgentDataPart {
    type: 'data-tool-agent';
    id: string;
    data: AgentDataPartData;
}

/** Type guard for data-tool-agent parts */
export function isAgentDataPart(part: { type: string }): part is AgentDataPart {
    return part.type === 'data-tool-agent';
}

