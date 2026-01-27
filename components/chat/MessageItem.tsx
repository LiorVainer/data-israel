'use client';

import type { DataAgentUIMessage } from '@/agents/data-agent';
import { MessageToolCalls } from './MessageToolCalls';
import { TextMessagePart } from './TextMessagePart';
import { ReasoningPart } from './ReasoningPart';
import { SourcesPart } from './SourcesPart';
import { ChartRenderer, ChartLoadingState, ChartError } from './ChartRenderer';
import type { ToolCallPart, SourceUrlUIPart } from './types';
import { isToolPart, getToolStatus } from './types';
import type { DisplayChartInput } from '@/lib/tools';

export interface MessageItemProps {
    message: DataAgentUIMessage;
    isLastMessage: boolean;
    isStreaming: boolean;
    onRegenerate: () => void;
}

export function MessageItem({ message, isLastMessage, isStreaming, onRegenerate }: MessageItemProps) {
    // Collect source-url parts for this message
    const sourceParts = message.parts.filter((part): part is SourceUrlUIPart => part.type === 'source-url');

    // Chart tool types that render separately (not in timeline)
    const chartToolTypes = ['tool-displayBarChart', 'tool-displayLineChart', 'tool-displayPieChart'];

    // Collect tool parts for this message (excluding chart tools which render separately)
    const toolParts = message.parts
        .map((part, index) => ({ part: part as ToolCallPart, index }))
        .filter(({ part }) => isToolPart(part) && !chartToolTypes.includes(part.type));

    console.log({ message });

    // Check if any tool is currently active (streaming/processing)
    const hasActiveTools = toolParts.some(({ part }) => isToolPart(part) && getToolStatus(part.state) === 'active');

    // Check if this message is currently being processed
    const isMessageProcessing = isLastMessage && isStreaming;

    return (
        <div className='animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-6 duration-300'>
            {/* Render tool calls in a ChainOfThought timeline */}
            {toolParts.length > 0 && (
                <MessageToolCalls
                    messageId={message.id}
                    toolParts={toolParts}
                    isProcessing={isMessageProcessing || hasActiveTools}
                />
            )}

            {/* Render non-tool parts and chart tools */}
            {message.parts.map((part, i) => {
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
                        const chartType = part.type.replace('tool-display', '').replace('Chart', '').toLowerCase() as 'bar' | 'line' | 'pie';

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
