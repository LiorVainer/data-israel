'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from '@/components/ai-elements/message';
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ai-elements/reasoning';
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from '@/components/ai-elements/sources';
import { EnhancedChatInput } from '@/components/chat/EnhancedChatInput';
import { PromptSuggestions } from '@/components/chat/PromptSuggestions';
import { ToolCallCard } from '@/components/chat/ToolCallCard';
import { Skeleton } from '@/components/ui/skeleton';
import { CopyIcon, RefreshCcwIcon, MessageSquare } from 'lucide-react';
import { DataAgentUIMessage } from '@/agents/data-agent';
import type { ReactNode } from 'react';

/**
 * Hebrew reasoning message for the Reasoning component trigger
 */
function getHebrewThinkingMessage(isStreaming: boolean, duration?: number): ReactNode {
  if (isStreaming || duration === 0) {
    return <span>חושב...</span>;
  }
  if (duration === undefined) {
    return <span>חשב כמה שניות</span>;
  }

  return <span>חשב {duration} שניות</span>;
}

/**
 * Interface for source-url parts from AI SDK
 */
interface SourceUrlPart {
  type: 'source-url';
  sourceId: string;
  url: string;
  title?: string;
}

function MessageSkeleton() {
  return (
    <div className="flex gap-3 animate-in fade-in duration-300">
      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export default function Home() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, regenerate } = useChat<DataAgentUIMessage>();

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput('');
  };

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt);
  };

  console.log(messages);

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <Conversation className="h-full flex-1">
          <ConversationContent>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 animate-in fade-in duration-500">
                <MessageSquare className="size-16 text-muted-foreground mb-6 animate-pulse" />
                <h2 className="text-3xl font-semibold mb-3">
                  שאל על נתונים פתוחים ישראליים
                </h2>
                <p className="text-muted-foreground max-w-md mb-6">
                  חפש מאגרי מידע, חקור קטגוריות וגלה נתונים ציבוריים מאתר data.gov.il
                </p>
                <div className="w-full max-w-2xl">
                  <div className="text-muted-foreground font-medium mb-3 text-center">דוגמאות לשאלות:</div>
                  <PromptSuggestions onSuggestionClick={handleSuggestionClick} />
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, messageIndex) => {
                  // Collect source-url parts for this message
                  const sourceParts = message.parts.filter(
                    (part): part is SourceUrlPart => part.type === 'source-url'
                  );

                  return (
                    <div key={message.id} className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-2 duration-300">
                      {message.parts.map((part, i) => {
                        switch (part.type) {
                          case 'text': {
                            const isLastMessage =
                              i === message.parts.length - 1 &&
                              message.id === messages.at(-1)?.id;

                            return (
                              <Message key={`${message.id}-${i}`} from={message.role}>
                                <MessageContent>
                                  <MessageResponse>{part.text}</MessageResponse>
                                </MessageContent>
                                {message.role === 'assistant' && isLastMessage && (
                                  <MessageActions>
                                    <MessageAction onClick={() => regenerate()} label="נסה שוב">
                                      <RefreshCcwIcon className="size-3" />
                                    </MessageAction>
                                    <MessageAction
                                      onClick={() => navigator.clipboard.writeText(part.text)}
                                      label="העתק"
                                    >
                                      <CopyIcon className="size-3" />
                                    </MessageAction>
                                  </MessageActions>
                                )}
                              </Message>
                            );
                          }
                          case 'reasoning': {
                            const reasoningPart = part as { type: 'reasoning'; text: string };
                            return (
                              <Reasoning
                                key={`${message.id}-${i}`}
                                isStreaming={status === 'streaming' && i === message.parts.length - 1 && message.id === messages.at(-1)?.id}
                                defaultOpen={false}
                              >
                                <ReasoningTrigger labelOnly getThinkingMessage={getHebrewThinkingMessage} />
                              </Reasoning>
                            );
                          }
                          case 'source-url': {
                            // Sources are collected and rendered after all parts
                            return null;
                          }
                          case 'tool-searchDatasets':
                          case 'tool-getDatasetDetails':
                          case 'tool-listGroups':
                          case 'tool-listTags':
                          case 'tool-queryDatastoreResource': {
                            return (
                              <ToolCallCard
                                key={`${message.id}-${i}`}
                                part={part}
                              />
                            );
                          }
                          default:
                            return null;
                        }
                      })}
                      {/* Render collected sources at the end of the message */}
                      {sourceParts.length > 0 && (
                        <Sources>
                          <SourcesTrigger count={sourceParts.length}>
                            <span className="font-medium">השתמש ב-{sourceParts.length} מקורות</span>
                          </SourcesTrigger>
                          <SourcesContent>
                            {sourceParts.map((source) => (
                              <Source
                                key={source.sourceId}
                                href={source.url}
                                title={source.title ?? new URL(source.url).hostname}
                              />
                            ))}
                          </SourcesContent>
                        </Sources>
                      )}
                    </div>
                  );
                })}
                {status === 'submitted' && <MessageSkeleton />}
              </>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <EnhancedChatInput
          value={input}
          setValue={setInput}
          onSubmit={handleSubmit}
          placeholder="שאל על מאגרי מידע"
          isLoading={status === 'submitted'}
          className="mt-4"
        />
      </div>
    </div>
  );
}
