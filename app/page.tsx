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
import { Loader } from '@/components/ai-elements/loader';
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
  const [isOpen, setIsOpen] = useState(false);
  const toolName = part.type.replace('tool-', '');

  return (
    <Card className={`my-2 transition-all duration-200 hover:shadow-md ${!isOpen ? 'w-fit mx-auto' : ''}`}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className={`pb-3 transition-all cursor-pointer hover:bg-muted/50 ${!isOpen ? 'px-6 py-4' : ''}`}>
            <div className={`flex items-center gap-2 ${!isOpen ? '' : 'justify-between'}`}>
              <CardTitle className="text-sm font-mono md:text-xs">{toolName}</CardTitle>
              {isOpen && (
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}>
                  <ChevronUpIcon className="h-4 w-4 md:h-3.5 md:w-3.5" />
                  <span className="sr-only">החלף תצוגה</span>
                </Button>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="md:text-xs">
            {part.state === 'input-streaming' ? (
              <div className="text-sm text-muted-foreground md:text-xs">טוען...</div>
            ) : (part.state === 'input-available' || part.state === 'approval-requested') && part.input ? (
              <div className="text-xs md:text-[10px]" dir="ltr">
                <CodeBlock code={JSON.stringify(part.input, null, 2)} language="json">
                  <CodeBlockCopyButton />
                </CodeBlock>
              </div>
            ) : (part.state === 'output-available' || part.state === 'approval-responded') && part.output ? (
              <div className="text-xs md:text-[10px]" dir="ltr">
                <CodeBlock code={JSON.stringify(part.output, null, 2)} language="json">
                  <CodeBlockCopyButton />
                </CodeBlock>
              </div>
            ) : (part.state === 'output-error' || part.state === 'output-denied') ? (
              <div className="text-sm text-red-500 md:text-xs">
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

const examplePrompts = [
  'מה מאגרי הנתונים הזמינים על תחבורה ציבורית?',
  'הצג לי נתונים על חינוך בישראל',
  'אילו ארגונים מפרסמים נתונים פתוחים?',
];

export default function Home() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, regenerate } = useChat();

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    if (!hasText) return;

    sendMessage({ text: message.text || '' });
    setInput('');
  };

  const handleExampleClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
      <div className="flex flex-col h-full">
        <Conversation className="h-full" data-scroll-container>
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
                  {examplePrompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-3 text-right justify-start whitespace-normal"
                      onClick={() => handleExampleClick(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
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
          <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border bg-background">
            <PromptInputBody className="flex-1">
              <PromptInputTextarea
                onChange={(e) => setInput(e.target.value)}
                value={input}
                placeholder="שאל על מאגרי מידע, ארגונים או קטגוריות נתונים..."
                className="resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                rows={1}
              />
            </PromptInputBody>
            <PromptInputSubmit disabled={!input && !status} status={status} className="shrink-0" />
          </div>
        </PromptInput>
      </div>
    </div>
  );
}
