'use client';

import {
    ChainOfThoughtSearchResult,
    ChainOfThoughtSearchResults,
    ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import { cn } from '@/lib/utils';
import { DataIsraelLoader } from './DataIsraelLoader';
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

    // Only show resources that have a searchedResourceName (Hebrew display name)
    console.log({ resources: step.resources });
    const namedResources = step.resources.filter((r) => r.name);

    return (
        <ChainOfThoughtStep
            icon={step.icon}
            label={<span className={cn(hasAllFailed && 'text-red-500')}>{step.name}</span>}
            description={getStatusDescription(step)}
            status={status}
        >
            {namedResources.length > 0 && (
                <ChainOfThoughtSearchResults>
                    {namedResources.map((resource, i) => (
                        <ChainOfThoughtSearchResult key={i} asChild>
                            <a
                                href={resource.url}
                                target='_blank'
                                rel='noopener noreferrer'
                                title={resource.url}
                                className='max-w-[200px] truncate'
                            >
                                {resource.name}
                            </a>
                        </ChainOfThoughtSearchResult>
                    ))}
                </ChainOfThoughtSearchResults>
            )}
        </ChainOfThoughtStep>
    );
}
