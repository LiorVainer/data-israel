'use client';

import { useMemo } from 'react';
import { ToolCallParts } from './ToolCallParts';
import { TextMessagePart } from './TextMessagePart';
import { ReasoningPart } from './ReasoningPart';
import { SourcesPart } from './SourcesPart';
import { LoadingShimmer } from './LoadingShimmer';
import { ChartError, ChartLoadingState, ChartRenderer } from './ChartRenderer';
import { getToolStatus, isToolPart, SourceUrlUIPart, ToolCallPart } from './types';
import { resolveToolSourceUrl } from '@/lib/tools/source-url-resolvers';
import { CLIENT_TOOL_NAMES, SOURCE_URL_TOOL_NAMES, toToolPartTypeSet } from '@/lib/tools/tool-names';
import type { DisplayChartInput } from '@/lib/tools';
import { UIMessage } from 'ai';

/**
 * Tool-prefixed type names for client-side tools and source URL tools.
 * These tools are excluded from the server-side tool call timeline
 * because they render their own UI (charts) or are handled separately (sources).
 */
const CLIENT_TOOL_TYPES = toToolPartTypeSet([...CLIENT_TOOL_NAMES, ...SOURCE_URL_TOOL_NAMES]);

/** Tool types that generate source URLs from dedicated tool results */
const SOURCE_TOOL_TYPES = toToolPartTypeSet(SOURCE_URL_TOOL_NAMES);

/** A segment is either a group of consecutive server-side tool parts or a single non-tool part */
type RenderSegment =
    | { kind: 'tool-group'; toolParts: Array<{ part: ToolCallPart; index: number }> }
    | { kind: 'part'; part: UIMessage['parts'][number]; index: number };

/** Parts that AI SDK emits as step boundaries between multi-step tool calls */
function isStepBoundaryPart(part: { type: string }): boolean {
    return part.type === 'reasoning' || part.type === 'step-start';
}

/**
 * Segments message parts into chronological render groups.
 * Consecutive server-side tool parts are combined into a single 'tool-group'.
 * Reasoning and step-start parts between tools are absorbed into the group
 * (AI SDK emits these as step boundaries during multi-step tool calls).
 * Only text parts and client tools break tool grouping.
 */
function segmentMessageParts(parts: UIMessage['parts']): RenderSegment[] {
    const segments: RenderSegment[] = [];
    // Buffer for reasoning/step-start parts that might be between tool calls
    let pendingParts: Array<{ part: UIMessage['parts'][number]; index: number }> = [];

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        // Server-side tool: group with adjacent server tools
        if (isToolPart(part) && !CLIENT_TOOL_TYPES.has(part.type)) {
            // Discard buffered step-boundary parts (they were between tools)
            pendingParts = [];

            const lastSegment = segments.at(-1);
            const toolEntry = { part: part as ToolCallPart, index: i };

            if (lastSegment && lastSegment.kind === 'tool-group') {
                lastSegment.toolParts.push(toolEntry);
            } else {
                segments.push({ kind: 'tool-group', toolParts: [toolEntry] });
            }
        } else if (isStepBoundaryPart(part) && segments.at(-1)?.kind === 'tool-group') {
            // Buffer reasoning/step-start when inside a tool group — might be discarded if more tools follow
            pendingParts.push({ part, index: i });
        } else if (part.type === 'data-tool-agent' && segments.at(-1)?.kind === 'tool-group') {
            // data-tool-agent: companion data for agent tools — absorb into preceding tool-group
            // (consumed by buildAgentInternalCallsMap via allParts, not rendered directly)
            pendingParts = [];
        } else {
            // Flush any buffered parts (tool group ended, followed by non-tool content)
            for (const pending of pendingParts) {
                segments.push({ kind: 'part', part: pending.part, index: pending.index });
            }
            pendingParts = [];

            segments.push({ kind: 'part', part, index: i });
        }
    }

    // Flush remaining buffered parts at end of message
    for (const pending of pendingParts) {
        segments.push({ kind: 'part', part: pending.part, index: pending.index });
    }

    return segments;
}

export interface MessageItemProps {
    message: UIMessage;
    isLastMessage: boolean;
    isStreaming: boolean;
    onRegenerate: () => void;
}

export function MessageItem({ message, isLastMessage, isStreaming, onRegenerate }: MessageItemProps) {
    // Native source-url parts (from AI SDK stream protocol)
    const nativeSourceParts = message.parts.filter((part): part is SourceUrlUIPart => part.type === 'source-url');

    // Source URLs from dedicated source URL tools (generateDataGovSourceUrl, generateCbsSourceUrl)
    const dedicatedSourceParts: SourceUrlUIPart[] = [];
    for (const part of message.parts) {
        if (!SOURCE_TOOL_TYPES.has(part.type) || !('state' in part)) continue;
        const toolPart = part as ToolCallPart;
        if (toolPart.state !== 'output-available') continue;
        const output = toolPart.output as { success: boolean; url: string; title?: string } | undefined;
        if (!output?.success) continue;
        dedicatedSourceParts.push({
            type: 'source-url' as const,
            sourceId: toolPart.toolCallId ?? '',
            url: output.url,
            title: output.title,
        });
    }

    // Auto-resolved source URLs from data tool outputs (searchDatasets, getCbsSeriesData, etc.)
    const autoSourceParts: SourceUrlUIPart[] = [];
    for (const part of message.parts) {
        if (!isToolPart(part)) continue;
        // Skip tools already handled above
        if (CLIENT_TOOL_TYPES.has(part.type)) continue;
        const toolPart = part as ToolCallPart;
        if (toolPart.state !== 'output-available') continue;

        const resolved = resolveToolSourceUrl(part.type, toolPart.input, toolPart.output);
        if (!resolved) continue;

        autoSourceParts.push({
            type: 'source-url' as const,
            sourceId: toolPart.toolCallId ?? `auto-${part.type}`,
            url: resolved.url,
            title: resolved.title,
        });
    }

    // Merge all sources and deduplicate by URL
    const seenUrls = new Set<string>();
    const allSources: SourceUrlUIPart[] = [];
    for (const source of [...nativeSourceParts, ...dedicatedSourceParts, ...autoSourceParts]) {
        if (seenUrls.has(source.url)) continue;
        seenUrls.add(source.url);
        allSources.push(source);
    }

    // Segment parts into chronological render groups
    const segments = useMemo(() => segmentMessageParts(message.parts), [message.parts]);

    // Find the last tool-group segment index for scoping the processing indicator
    const lastToolGroupIndex = useMemo(() => {
        for (let i = segments.length - 1; i >= 0; i--) {
            if (segments[i].kind === 'tool-group') return i;
        }
        return -1;
    }, [segments]);

    // Show loading shimmer when streaming but no visible content is actively being produced.
    // Text and reasoning parts stream visibly; tool groups show their own ChainOfThought indicator.
    // The shimmer is only needed when there are no tools at all and the model is thinking.
    const showLoadingShimmer = useMemo(() => {
        if (!isLastMessage || !isStreaming) return false;

        const lastPart = message.parts.at(-1);
        if (!lastPart) return true;

        // Text or reasoning: visible content being produced
        if (lastPart.type === 'text' || lastPart.type === 'reasoning') return false;

        // Active tool call: ToolCallParts / ChartLoadingState shows its own indicator
        if (isToolPart(lastPart) && 'state' in lastPart) {
            if (getToolStatus((lastPart as ToolCallPart).state) === 'active') return false;
        }

        // ChainOfThought already provides loading feedback for tool groups
        if (segments.some((s) => s.kind === 'tool-group')) return false;

        return true;
    }, [isLastMessage, isStreaming, message.parts, segments]);

    return (
        <div className='animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-6 duration-300'>
            {segments.map((segment, segIdx) => {
                if (segment.kind === 'tool-group') {
                    // Check if any tool in this group is active
                    const hasActiveTools = segment.toolParts.some(({ part }) => getToolStatus(part.state) === 'active');

                    // Only the last tool group gets the processing indicator
                    const isLastToolGroup = segIdx === lastToolGroupIndex;
                    const isProcessing = isLastToolGroup && isLastMessage && isStreaming && hasActiveTools;

                    // Default open if nothing meaningful follows (only reasoning or nothing after this group)
                    const isLastMeaningful = segments
                        .slice(segIdx + 1)
                        .every((s) => s.kind === 'part' && s.part.type === 'reasoning');

                    return (
                        <ToolCallParts
                            key={`${message.id}-tools-${segIdx}`}
                            messageId={message.id}
                            toolParts={segment.toolParts}
                            allParts={message.parts}
                            isProcessing={isProcessing}
                            defaultOpen={isLastMessage && isLastMeaningful}
                        />
                    );
                }

                // Single part rendering
                const { part, index: i } = segment;

                switch (part.type) {
                    case 'text': {
                        const isLastPart = i === message.parts.length - 1 && isLastMessage;

                        return (
                            <TextMessagePart
                                key={`${message.id}-${i}`}
                                messageId={message.id}
                                text={part.text}
                                role={message.role}
                                isLastMessage={isLastPart}
                                onRegenerate={onRegenerate}
                            />
                        );
                    }
                    case 'reasoning': {
                        const isCurrentlyReasoning = isStreaming && i === message.parts.length - 1 && isLastMessage;
                        return <ReasoningPart key={`${message.id}-${i}`} isCurrentlyReasoning={isCurrentlyReasoning} />;
                    }
                    case 'tool-displayBarChart':
                    case 'tool-displayLineChart':
                    case 'tool-displayPieChart': {
                        const toolPart = part as ToolCallPart;
                        const chartType = part.type.replace('tool-display', '').replace('Chart', '').toLowerCase() as
                            | 'bar'
                            | 'line'
                            | 'pie';

                        // Handle different tool states
                        if (toolPart.state === 'input-streaming') {
                            return <ChartLoadingState key={`${message.id}-${i}`} />;
                        }

                        if (toolPart.state === 'output-error') {
                            return <ChartError key={`${message.id}-${i}`} error={toolPart.errorText} />;
                        }

                        // Render chart when input is available or output is available
                        if (toolPart.state === 'input-available' || toolPart.state === 'output-available') {
                            // Add chartType to input for ChartRenderer
                            const input = toolPart.input as Record<string, unknown>;
                            const chartData = { ...input, chartType } as DisplayChartInput;
                            return <ChartRenderer key={`${message.id}-${i}`} data={chartData} />;
                        }

                        return null;
                    }
                    default:
                        return null;
                }
            })}

            {showLoadingShimmer && <LoadingShimmer text={'טוען...'} />}

            {/* Render collected sources only after the message is done streaming */}
            {!(isLastMessage && isStreaming) && <SourcesPart sources={allSources} />}
        </div>
    );
}
