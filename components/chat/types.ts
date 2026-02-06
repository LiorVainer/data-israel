import type { LucideIcon } from 'lucide-react';
import type { NetworkDataPart } from '@mastra/ai-sdk';

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
 * Check if a part is a tool call
 */
export function isAgentsNetworkDataPart(part: { type: string }): part is NetworkDataPart {
    return part.type === 'data-network';
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
