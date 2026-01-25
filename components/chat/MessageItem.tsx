'use client';

import type { DataAgentUIMessage } from '@/agents/data-agent';
import { MessageToolCalls } from './MessageToolCalls';
import { TextMessagePart } from './TextMessagePart';
import { ReasoningPart } from './ReasoningPart';
import { SourcesPart } from './SourcesPart';
import type { ToolCallPart, SourceUrlUIPart } from './types';
import { isToolPart, getToolStatus } from './types';

export interface MessageItemProps {
    message: DataAgentUIMessage;
    isLastMessage: boolean;
    isStreaming: boolean;
    onRegenerate: () => void;
}

export function MessageItem({ message, isLastMessage, isStreaming, onRegenerate }: MessageItemProps) {
    // Collect source-url parts for this message
    const sourceParts = message.parts.filter((part): part is SourceUrlUIPart => part.type === 'source-url');

    // Collect tool parts for this message
    const toolParts = message.parts
        .map((part, index) => ({ part: part as ToolCallPart, index }))
        .filter(({ part }) => isToolPart(part));

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

            {/* Render non-tool parts */}
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
                    default:
                        return null;
                }
            })}

            {/* Render collected sources at the end of the message */}
            <SourcesPart sources={sourceParts} />
        </div>
    );
}
