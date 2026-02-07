'use client';

import { ToolCallParts } from './ToolCallParts';
import { TextMessagePart } from './TextMessagePart';
import { ReasoningPart } from './ReasoningPart';
import { SourcesPart } from './SourcesPart';
import { ChartError, ChartLoadingState, ChartRenderer } from './ChartRenderer';
import { getToolStatus, isAgentsNetworkDataPart, isToolPart, SourceUrlUIPart, ToolCallPart } from './types';
import type { DisplayChartInput } from '@/lib/tools';
import { ClientTools } from '@/lib/tools/client';
import { UIMessage } from 'ai';

/** Tool-prefixed type names for client-side tools (e.g. 'tool-displayBarChart') */
const CLIENT_TOOL_TYPES = new Set(Object.keys(ClientTools).map((name) => `tool-${name}`));

export interface MessageItemProps {
    message: UIMessage;
    isLastMessage: boolean;
    isStreaming: boolean;
    onRegenerate: () => void;
}

export function MessageItem({ message, isLastMessage, isStreaming, onRegenerate }: MessageItemProps) {
    // Collect source-url parts for this message
    const sourceParts = message.parts.filter((part): part is SourceUrlUIPart => part.type === 'source-url');

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

            {/* Render collected sources at the end of the message */}
            <SourcesPart sources={sourceParts} />
        </div>
    );
}
