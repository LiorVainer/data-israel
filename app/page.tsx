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
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { CodeBlock, CodeBlockCopyButton } from '@/components/ai-elements/code-block';
import { Skeleton } from '@/components/ui/skeleton';
import { CopyIcon, RefreshCcwIcon, MessageSquare, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ToolCallCardProps {
  part: {
    type: string;
    state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error' | 'approval-requested' | 'approval-responded' | 'output-denied';
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };
  isLatest?: boolean;
}

function ToolCallCard({ part, isLatest = false }: ToolCallCardProps) {
  const [isOpen, setIsOpen] = useState(isLatest);
  const toolName = part.type.replace('tool-', '');

  return (
    <Card className="my-2 transition-all duration-200 hover:shadow-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-mono">{toolName}</CardTitle>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isOpen ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
                <span className="sr-only">החלף תצוגה</span>
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            {part.state === 'input-streaming' ? (
              <div className="text-sm text-muted-foreground">טוען...</div>
            ) : (part.state === 'input-available' || part.state === 'approval-requested') && part.input ? (
              <CodeBlock code={JSON.stringify(part.input, null, 2)} language="json">
                <CodeBlockCopyButton />
              </CodeBlock>
            ) : (part.state === 'output-available' || part.state === 'approval-responded') && part.output ? (
              <CodeBlock code={JSON.stringify(part.output, null, 2)} language="json">
                <CodeBlockCopyButton />
              </CodeBlock>
            ) : (part.state === 'output-error' || part.state === 'output-denied') ? (
              <div className="text-sm text-red-500">
                שגיאה: {part.errorText || 'הפעולה נדחתה או נכשלה'}
              </div>
            ) : null}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
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
  const { messages, sendMessage, status, regenerate } = useChat();

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    if (!hasText) return;

    sendMessage({ text: message.text || '' });
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <Conversation className="h-full">
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
                <div className="flex flex-col gap-2 w-full max-w-md text-sm">
                  <div className="text-muted-foreground font-medium mb-1">דוגמאות לשאלות:</div>
                  <div className="p-3 rounded-lg bg-muted/50 text-right hover:bg-muted/70 transition-colors cursor-default">
                    מה מאגרי הנתונים הזמינים על תחבורה ציבורית?
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-right hover:bg-muted/70 transition-colors cursor-default">
                    הצג לי נתונים על חינוך בישראל
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-right hover:bg-muted/70 transition-colors cursor-default">
                    אילו ארגונים מפרסמים נתונים פתוחים?
                  </div>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, messageIndex) => (
                  <div key={message.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                        case 'tool-searchDatasets':
                        case 'tool-getDatasetDetails':
                        case 'tool-listGroups':
                        case 'tool-listTags': {
                          const isLatestToolCall = messageIndex === messages.length - 1;
                          return (
                            <ToolCallCard
                              key={`${message.id}-${i}`}
                              part={part}
                              isLatest={isLatestToolCall}
                            />
                          );
                        }
                        default:
                          return null;
                      }
                    })}
                  </div>
                ))}
                {status === 'submitted' && <MessageSkeleton />}
              </>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4">
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              placeholder="שאל על מאגרי מידע, ארגונים או קטגוריות נתונים..."
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputSubmit disabled={!input && !status} status={status} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
