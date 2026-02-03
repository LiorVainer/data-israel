'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader } from '@/components/ai-elements/chain-of-thought';
import { Shimmer } from '@/components/ai-elements/shimmer';
import type { ToolCallPart } from './types';
import { getToolStatus } from './types';
import { getToolInfo } from './MessageToolCalls';
import { type GroupedToolCall, ToolCallStep, type ToolResource } from './ToolCallStep';

/**
 * Type guard to check if an object has apiUrl field
 */
function hasApiUrl(output: unknown): output is { apiUrl: string } {
    return (
        typeof output === 'object' &&
        output !== null &&
        'apiUrl' in output &&
        typeof (output as { apiUrl: unknown }).apiUrl === 'string'
    );
}

/**
 * Type guard to check if an object has searchedResourceName field
 */
function hasSearchedResourceName(output: unknown): output is { searchedResourceName: string } {
    return (
        typeof output === 'object' &&
        output !== null &&
        'searchedResourceName' in output &&
        typeof (output as { searchedResourceName: unknown }).searchedResourceName === 'string'
    );
}

/**
 * Extracts a ToolResource from a tool output if apiUrl is present
 */
function extractToolResource(output: unknown): ToolResource | null {
    if (!hasApiUrl(output)) {
        return null;
    }
    return {
        url: output.apiUrl,
        name: hasSearchedResourceName(output) ? output.searchedResourceName : undefined,
    };
}

interface ToolCallStats {
    total: number;
    completed: number;
    failed: number;
    active: number;
}

/**
 * Calculate overall statistics from tool parts
 */
function calculateStats(toolParts: ReadonlyArray<{ part: ToolCallPart; index: number }>): ToolCallStats {
    return toolParts.reduce(
        (stats, { part }) => {
            const status = getToolStatus(part.state);
            return {
                total: stats.total + 1,
                completed: stats.completed + (status === 'complete' && part.state !== 'output-error' ? 1 : 0),
                failed: stats.failed + (part.state === 'output-error' ? 1 : 0),
                active: stats.active + (status === 'active' ? 1 : 0),
            };
        },
        { total: 0, completed: 0, failed: 0, active: 0 },
    );
}

/**
 * Groups tool calls by tool name, tracking completed/failed/active counts
 */
function groupToolCalls(toolParts: ReadonlyArray<{ part: ToolCallPart; index: number }>): GroupedToolCall[] {
    const groups = new Map<string, GroupedToolCall>();

    for (const { part } of toolParts) {
        const toolKey = part.type.replace('tool-', '');
        const status = getToolStatus(part.state);
        const isFailed = part.state === 'output-error';
        const isActive = status === 'active';
        const isCompleted = status === 'complete' && !isFailed;

        // Extract resource from tool output if available
        const resource = extractToolResource(part.output);

        const existing = groups.get(toolKey);

        if (existing) {
            existing.count += 1;
            existing.completedCount += isCompleted ? 1 : 0;
            existing.failedCount += isFailed ? 1 : 0;
            existing.isActive = existing.isActive || isActive;
            // Add resource if present and not already in the list (dedupe by URL)
            if (resource && !existing.resources.some((r) => r.url === resource.url)) {
                existing.resources.push(resource);
            }
        } else {
            const { name, icon } = getToolInfo(toolKey);
            groups.set(toolKey, {
                toolKey,
                name,
                icon,
                count: 1,
                completedCount: isCompleted ? 1 : 0,
                failedCount: isFailed ? 1 : 0,
                isActive,
                resources: resource ? [resource] : [],
            });
        }
    }

    return Array.from(groups.values());
}

export interface ToolCallPartsProps {
    messageId: string;
    toolParts: Array<{ part: ToolCallPart; index: number }>;
    isProcessing: boolean;
}

/**
 * Container component for rendering tool calls in a ChainOfThought timeline.
 * Tool calls are grouped by tool name with progress tracking.
 */
export function ToolCallParts({ messageId, toolParts, isProcessing }: ToolCallPartsProps) {
    const [userToggled, setUserToggled] = useState(false);
    const [userWantsOpen, setUserWantsOpen] = useState(false);
    const wasProcessing = useRef(isProcessing);

    const processingLabels = useMemo(() => ['מחפש מידע...', 'מעבד נתונים...', 'מנתח תוצאות...'], []);
    const [labelIndex, setLabelIndex] = useState(0);

    useEffect(() => {
        if (!isProcessing) return;
        const interval = setInterval(() => {
            setLabelIndex((prev) => (prev + 1) % processingLabels.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isProcessing, processingLabels]);

    const stats = useMemo(() => calculateStats(toolParts), [toolParts]);
    const groupedTools = useMemo(() => groupToolCalls(toolParts), [toolParts]);

    // Auto-close when processing finishes, unless user has manually toggled
    useEffect(() => {
        if (wasProcessing.current && !isProcessing && !userToggled) {
            setUserWantsOpen(false);
        }
        wasProcessing.current = isProcessing;
    }, [isProcessing, userToggled]);

    const handleOpenChange = (open: boolean) => {
        setUserToggled(true);
        setUserWantsOpen(open);
    };

    // Force open while processing, otherwise respect user preference
    const isOpen = isProcessing ? true : userWantsOpen;

    // Build header text - show only succeeded count
    const getHeaderContent = () => {
        // Still processing
        if (isProcessing || stats.active > 0) {
            return (
                <Shimmer as='span' duration={1.5}>
                    {processingLabels[labelIndex]}
                </Shimmer>
            );
        }

        // All done - show only succeeded count
        if (stats.failed > 0) {
            return (
                <span>
                    {stats.completed} פעולות הושלמו
                    <span className='text-red-500 mr-1'> ({stats.failed} שגיאות)</span>
                </span>
            );
        }

        return `${stats.completed} פעולות הושלמו`;
    };

    return (
        <ChainOfThought open={isOpen} onOpenChange={handleOpenChange}>
            <ChainOfThoughtHeader>{getHeaderContent()}</ChainOfThoughtHeader>
            <ChainOfThoughtContent>
                {groupedTools.map((step) => (
                    <ToolCallStep key={`${messageId}-${step.toolKey}`} step={step} />
                ))}
            </ChainOfThoughtContent>
        </ChainOfThought>
    );
}
