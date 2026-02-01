'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader } from '@/components/ai-elements/chain-of-thought';
import { Shimmer } from '@/components/ai-elements/shimmer';
import type { ToolCallPart } from './types';
import { getToolStatus } from './types';
import { getToolInfo } from './MessageToolCalls';
import { type GroupedToolCall, ToolCallStep } from './ToolCallStep';

function groupToolCalls(toolParts: ReadonlyArray<{ part: ToolCallPart; index: number }>): GroupedToolCall[] {
    const groupKey = (toolKey: string, failed: boolean) => `${toolKey}:${failed ? 'failed' : 'other'}` as const;

    return Array.from(
        toolParts
            .reduce((groups, { part }) => {
                const toolKey = part.type.replace('tool-', '');
                const failed = part.state === 'output-error';
                const isActive = getToolStatus(part.state) === 'active';
                const key = groupKey(toolKey, failed);
                const existing = groups.get(key);

                if (existing) {
                    existing.count += 1;
                    existing.isActive = existing.isActive || isActive;
                } else {
                    const { name, icon } = getToolInfo(toolKey);
                    groups.set(key, { toolKey, name, icon, count: 1, failed, isActive });
                }

                return groups;
            }, new Map<string, GroupedToolCall>())
            .values(),
    );
}

export interface ToolCallPartsProps {
    messageId: string;
    toolParts: Array<{ part: ToolCallPart; index: number }>;
    isProcessing: boolean;
}

/**
 * Container component for rendering tool calls in a ChainOfThought timeline.
 * Tool calls are grouped by tool name and status (failed vs non-failed).
 */
export function ToolCallParts({ messageId, toolParts, isProcessing }: ToolCallPartsProps) {
    const [userToggled, setUserToggled] = useState(false);
    const [userWantsOpen, setUserWantsOpen] = useState(true);
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

    const hasCompletedTools = toolParts.some(({ part }) => getToolStatus(part.state) === 'complete');
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

    return (
        <ChainOfThought open={isOpen} onOpenChange={handleOpenChange}>
            <ChainOfThoughtHeader>
                {hasCompletedTools && !isProcessing ? (
                    `${groupedTools.length} פעולות הושלמו`
                ) : (
                    <Shimmer as='span' duration={1.5}>
                        {processingLabels[labelIndex]}
                    </Shimmer>
                )}
            </ChainOfThoughtHeader>
            <ChainOfThoughtContent>
                {groupedTools.map((step) => (
                    <ToolCallStep key={`${messageId}-${step.toolKey}-${step.failed ? 'failed' : 'ok'}`} step={step} />
                ))}
            </ChainOfThoughtContent>
        </ChainOfThought>
    );
}
