'use client';

import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtHeader,
    ChainOfThoughtSearchResult,
    ChainOfThoughtSearchResults,
    ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import { cn } from '@/lib/utils';
import { DataIsraelLoader } from './DataIsraelLoader';
import { LoadingShimmer } from './LoadingShimmer';
import { getToolDataSourceConfig } from '../../constants/tool-data-sources';
import { getToolInfo } from './MessageToolCalls';
import type { AgentInternalToolCall } from './ToolCallParts';
import type { LucideIcon } from 'lucide-react';
import type { StepStatus } from './types';

/**
 * Represents an external resource accessed by a tool call.
 * Contains the API URL and an optional Hebrew display name.
 */
export interface ToolResource {
    /** The full API URL that was called */
    url: string;
    /** Optional Hebrew display name for the resource (searchedResourceName) */
    name?: string;
}

export interface GroupedToolCall {
    toolKey: string;
    name: string;
    icon: LucideIcon;
    /** Total number of tool calls in this group */
    count: number;
    /** Number of completed tool calls (success) */
    completedCount: number;
    /** Number of failed tool calls */
    failedCount: number;
    /** Whether any tool in the group is currently active */
    isActive: boolean;
    /** External resources (API URLs) accessed by this tool group - only those with searchedResourceName */
    resources: ToolResource[];
    /** For agent-* tools: internal tool calls made by the sub-agent */
    internalCalls?: AgentInternalToolCall[];
}

export interface ToolCallStepProps {
    step: GroupedToolCall;
}

/**
 * Get status display based on tool call group state
 */
function getStepStatus(step: GroupedToolCall): StepStatus {
    if (step.isActive) return 'active';
    return 'complete';
}

/**
 * Get the description element showing status
 * Shows only succeeded count, not X/Y format
 */
function getStatusDescription(step: GroupedToolCall) {
    const { completedCount, failedCount, isActive } = step;

    // In progress - show loader
    if (isActive) {
        return (
            <span className='inline-flex items-center gap-1.5'>
                <DataIsraelLoader size={12} />
                <span>בפעולה...</span>
            </span>
        );
    }

    // All failed
    if (failedCount > 0 && completedCount === 0) {
        return <span className='text-red-500'>שגיאה</span>;
    }

    // Some failed, some succeeded
    if (failedCount > 0) {
        return (
            <span>
                <span className='text-muted-foreground'>{completedCount} הושלמו</span>
                {' • '}
                <span className='text-red-500'>{failedCount} נכשלו</span>
            </span>
        );
    }

    // All succeeded - show count only if more than 1
    if (completedCount > 1) {
        return <span className='text-muted-foreground'>{completedCount} הושלמו</span>;
    }

    return <span className='text-muted-foreground'>הושלם</span>;
}

export function ToolCallStep({ step }: ToolCallStepProps) {
    const status = getStepStatus(step);
    const hasAllFailed = step.failedCount > 0 && step.completedCount === 0;

    // Get data source config for badge display
    const dataSourceConfig = getToolDataSourceConfig(step.toolKey);

    // Only show resources that have a searchedResourceName (Hebrew display name)
    const namedResources = step.resources.filter((r) => r.name);

    // Agent tool with internal calls — render nested chain of thought
    const hasInternalCalls = !!step.internalCalls && step.internalCalls.length > 0;

    return (
        <ChainOfThoughtStep
            icon={step.icon}
            label={
                <span className={cn('inline-flex items-center gap-2', hasAllFailed && 'text-red-500')}>
                    {step.name}
                    {dataSourceConfig && (
                        <a
                            href={dataSourceConfig.url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className={cn(
                                'rounded-sm px-1.5 py-0.5 text-[10px] font-medium transition-colors',
                                dataSourceConfig.className,
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {dataSourceConfig.nameLabel}
                        </a>
                    )}
                </span>
            }
            description={!hasInternalCalls ? getStatusDescription(step) : undefined}
            status={status}
        >
            {namedResources.length > 0 && (
                <ChainOfThoughtSearchResults>
                    {namedResources.map((resource, i) => (
                        <ChainOfThoughtSearchResult key={i}>
                            <span className='max-w-[200px] truncate text-[10px]'>{resource.name}</span>
                        </ChainOfThoughtSearchResult>
                    ))}
                </ChainOfThoughtSearchResults>
            )}
            {hasInternalCalls && <AgentInternalCallsChain calls={step.internalCalls!} isAgentActive={step.isActive} />}
        </ChainOfThoughtStep>
    );
}

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

/**
 * Nested ChainOfThought showing a sub-agent's internal tool calls.
 * Calls are grouped by tool name — each group renders one step with colored result chips.
 */
function AgentInternalCallsChain({ calls, isAgentActive }: { calls: AgentInternalToolCall[]; isAgentActive: boolean }) {
    const completedCount = calls.filter((c) => c.isComplete).length;
    const failedCount = calls.filter((c) => c.success === false).length;
    const activeCount = calls.filter((c) => !c.isComplete && isAgentActive).length;

    const groups = groupInternalCalls(calls, isAgentActive);

    const getInternalHeaderContent = () => {
        if (activeCount > 0) {
            return (
                <span className='inline-flex items-center gap-1.5'>
                    <DataIsraelLoader size={12} />
                    <span>{completedCount > 0 ? `${completedCount} פעולות הושלמו` : 'בפעולה...'}</span>
                </span>
            );
        }
        if (failedCount > 0 && completedCount === 0) {
            return <span className='text-red-500'>{failedCount} פעולות נכשלו</span>;
        }
        if (failedCount > 0) {
            return (
                <span>
                    {completedCount} פעולות הושלמו
                    <span className='text-red-500 mr-1'> ({failedCount} שגיאות)</span>
                </span>
            );
        }
        return `${calls.length} פעולות הושלמו`;
    };

    return (
        <ChainOfThought defaultOpen>
            <ChainOfThoughtHeader>{getInternalHeaderContent()}</ChainOfThoughtHeader>
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
                                    ? 'border-red-500 text-red-500'
                                    : c.isComplete
                                      ? 'border-green-500 text-green-500'
                                      : undefined,
                        }));

                    return (
                        <ChainOfThoughtStep
                            key={group.toolName}
                            icon={group.icon}
                            label={<span className={hasAllFailed ? 'text-red-500' : undefined}>{group.name}</span>}
                            description={
                                hasAllFailed ? (
                                    <span className='text-red-500'>שגיאה</span>
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
