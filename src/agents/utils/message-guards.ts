import type {
    MastraMessagePart,
    MastraToolInvocation,
    MastraToolInvocationPart,
} from '@mastra/core/agent/message-list';
import type { AgentDelegationResult } from '@/agents/types';

export type CompletedAgentDelegation = MastraToolInvocation & { result: AgentDelegationResult };
export type CompletedToolInvocation = MastraToolInvocation & { result: Record<string, unknown> };

export function isCompletedAgentDelegation(inv: MastraToolInvocation): inv is CompletedAgentDelegation {
    return (
        inv.state === 'result' &&
        inv.result != null &&
        typeof inv.result === 'object' &&
        inv.toolName.startsWith('agent-')
    );
}

export function isCompletedToolInvocation(inv: MastraToolInvocation): inv is CompletedToolInvocation {
    return (
        inv.state === 'result' &&
        inv.result != null &&
        typeof inv.result === 'object' &&
        !inv.toolName.startsWith('agent-')
    );
}

export function isToolInvocationPart(part: MastraMessagePart): part is MastraToolInvocationPart {
    return part.type === 'tool-invocation';
}

export function isDataToolAgentPart(part: MastraMessagePart): boolean {
    return (part as Record<string, unknown>).type === 'data-tool-agent';
}
