'use client';

import { useMemo } from 'react';
import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtHeader,
    ChainOfThoughtSearchResult,
    ChainOfThoughtSearchResults,
    ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import { DataIsraelLoader } from './DataIsraelLoader';
import { LoadingShimmer } from './LoadingShimmer';
import { getToolInfo } from './MessageToolCalls';
import { useAutoOpen } from './use-auto-open';
import type { AgentInternalToolCall } from './ToolCallParts';
import type { LucideIcon } from 'lucide-react';
import type { StepStatus } from './types';

/** A group of internal tool calls with the same tool name. */
interface InternalCallGroup {
    toolName: string;
    name: string;
    icon: LucideIcon;
    calls: AgentInternalToolCall[];
    completedCount: number;
    failedCount: number;
    activeCount: number;
}

/** Group internal calls by toolName, preserving first-seen order. */
function groupInternalCalls(calls: AgentInternalToolCall[], isAgentActive: boolean): InternalCallGroup[] {
    const map = new Map<string, InternalCallGroup>();

    for (const call of calls) {
        let group = map.get(call.toolName);
        if (!group) {
            const { name, icon } = getToolInfo(call.toolName);
            group = {
                toolName: call.toolName,
                name,
                icon,
                calls: [],
                completedCount: 0,
                failedCount: 0,
                activeCount: 0,
            };
            map.set(call.toolName, group);
        }
        group.calls.push(call);
        if (call.success === false) group.failedCount++;
        else if (call.isComplete) group.completedCount++;
        else if (isAgentActive) group.activeCount++;
    }

    return Array.from(map.values());
}

function getGroupStatus(group: InternalCallGroup): StepStatus {
    if (group.activeCount > 0) return 'active';
    return 'complete';
}

export interface AgentInternalCallsChainProps {
    calls: AgentInternalToolCall[];
    isAgentActive: boolean;
}

/**
 * Nested ChainOfThought showing a sub-agent's internal tool calls.
 * Calls are grouped by tool name — each group renders one step with colored result chips.
 *
 * Auto-opens while the agent is active, collapses when done.
 * Once the user manually toggles, their choice is respected.
 */
export function AgentInternalCallsChain({ calls, isAgentActive }: AgentInternalCallsChainProps) {
    const { isOpen, handleOpenChange } = useAutoOpen(isAgentActive);

    const completedCount = calls.filter((c) => c.isComplete).length;
    const failedCount = calls.filter((c) => c.success === false).length;
    const activeCount = calls.filter((c) => !c.isComplete && isAgentActive).length;

    const groups = useMemo(() => groupInternalCalls(calls, isAgentActive), [calls, isAgentActive]);

    const getHeaderContent = () => {
        if (activeCount > 0) {
            return (
                <span className='inline-flex items-center gap-1.5'>
                    <DataIsraelLoader size={12} />
                    <span>{completedCount > 0 ? `${completedCount} פעולות הושלמו` : 'בפעולה...'}</span>
                </span>
            );
        }
        if (failedCount > 0 && completedCount === 0) {
            return <span className='text-error'>{failedCount} פעולות נכשלו</span>;
        }
        if (failedCount > 0) {
            return (
                <span>
                    {completedCount} פעולות הושלמו
                    <span className='text-error mr-1'> ({failedCount} שגיאות)</span>
                </span>
            );
        }
        return `${calls.length} פעולות הושלמו`;
    };

    return (
        <ChainOfThought open={isOpen} onOpenChange={handleOpenChange}>
            <ChainOfThoughtHeader>{getHeaderContent()}</ChainOfThoughtHeader>
            <ChainOfThoughtContent>
                {groups.map((group) => {
                    const status = getGroupStatus(group);
                    const hasAllFailed = group.failedCount > 0 && group.completedCount === 0;

                    // Collect chips: named results with per-call color
                    const chips = group.calls
                        .filter((c) => c.searchedResourceName)
                        .map((c) => ({
                            key: c.toolCallId,
                            label: c.searchedResourceName!,
                            className:
                                c.success === false
                                    ? 'text-error bg-red-100/40 dark:bg-red-700/10'
                                    : c.isComplete
                                      ? 'bg-emerald-100/40 text-success dark:bg-emerald-700/10'
                                      : undefined,
                        }));

                    return (
                        <ChainOfThoughtStep
                            key={group.toolName}
                            icon={group.icon}
                            label={<span className={hasAllFailed ? 'text-error' : undefined}>{group.name}</span>}
                            description={
                                hasAllFailed ? (
                                    <span className='text-error'>שגיאה</span>
                                ) : status === 'active' ? undefined : group.completedCount > 1 ? (
                                    <span className='text-muted-foreground'>{group.completedCount} הושלמו</span>
                                ) : (
                                    <span className='text-muted-foreground'>הושלם</span>
                                )
                            }
                            status={status}
                        >
                            {status === 'active' && <LoadingShimmer showIcon={false} text='מעבד...' />}
                            {chips.length > 0 && (
                                <ChainOfThoughtSearchResults>
                                    {chips.map((chip) => (
                                        <ChainOfThoughtSearchResult key={chip.key} className={chip.className}>
                                            <span className='max-w-[200px] truncate text-[10px]'>{chip.label}</span>
                                        </ChainOfThoughtSearchResult>
                                    ))}
                                </ChainOfThoughtSearchResults>
                            )}
                        </ChainOfThoughtStep>
                    );
                })}
            </ChainOfThoughtContent>
        </ChainOfThought>
    );
}
