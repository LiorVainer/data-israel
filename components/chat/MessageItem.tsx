'use client';

import { ToolCallParts } from './ToolCallParts';
import { TextMessagePart } from './TextMessagePart';
import { ReasoningPart } from './ReasoningPart';
import { SourcesPart } from './SourcesPart';
import { ChartError, ChartLoadingState, ChartRenderer } from './ChartRenderer';
import { getToolStatus, isAgentsNetworkDataPart, isToolPart, SourceUrlUIPart, ToolCallPart } from './types';
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

    // Collect tool parts for this message (excluding client tools which render separately)
    const toolParts = message.parts
        .map((part, index) => ({ part: part as ToolCallPart, index }))
        .filter(({ part }) => isToolPart(part) && !CLIENT_TOOL_TYPES.has(part.type));

    const agentsNetworkDataParts = message.parts.filter((part) => isAgentsNetworkDataPart(part));

    // Check if any tool is currently active (streaming/processing)
    const hasActiveTools = toolParts.some(({ part }) => isToolPart(part) && getToolStatus(part.state) === 'active');

    // Check if the last part is a server-side tool call (not a client tool like charts)
    const lastPart = message.parts.at(-1);
    const isLastPartServerTool =
        lastPart !== undefined && isToolPart(lastPart) && !CLIENT_TOOL_TYPES.has(lastPart.type);

    // Processing is true only when streaming AND the last part is a server tool
    const isToolsStillRunning = isLastMessage && isStreaming && isLastPartServerTool;

    console.log({ message });

    return (
        <div className='animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-6 duration-300'>
            {/*/!* Render tool calls in a ChainOfThought timeline *!/*/}
            {/*{agentsNetworkDataParts.length > 0 && (*/}
            {/*    <AgentsNetworkDataParts messageId={message.id} parts={agentsNetworkDataParts} />*/}
            {/*)}*/}
            {toolParts.length > 0 && (
                <ToolCallParts
                    messageId={message.id}
                    toolParts={toolParts}
                    isProcessing={isToolsStillRunning || hasActiveTools}
                    isLastMessage={isLastMessage}
                />
            )}

            {/* Render non-tool parts and chart tools */}
            {message.parts.map((part, i) => {
                switch (part.type) {
                    // TODO: Re-enable network data part rendering when needed
                    // case 'data-network': {
                    //     const isLastPart = i === message.parts.length - 1 && isLastMessage;
                    //     const typedPart = part as NetworkDataPart;
                    //     const text = (typedPart.data.steps.at(-1)?.output as string) ?? '';
                    //
                    //     return (
                    //         <TextMessagePart
                    //             key={`${message.id}-${i}`}
                    //             messageId={message.id}
                    //             text={text}
                    //             role={message.role}
                    //             isLastMessage={isLastPart}
                    //             onRegenerate={onRegenerate}
                    //         />
                    //     );
                    // }
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

            {/* Render collected sources only after the message is done streaming */}
            {!(isLastMessage && isStreaming) && <SourcesPart sources={allSources} />}
        </div>
    );
}
