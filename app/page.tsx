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
import { Loader } from '@/components/ai-elements/loader';
import { CopyIcon, RefreshCcwIcon, MessageSquare } from 'lucide-react';

interface ToolCallCardProps {
  part: {
    type: string;
    state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error' | 'approval-requested' | 'approval-responded' | 'output-denied';
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };
}

function ToolCallCard({ part }: ToolCallCardProps) {
  return (
    <Card className="my-2">
      <CardHeader>
        <CardTitle className="text-sm font-mono">
          {part.type.replace('tool-', '')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {part.state === 'input-streaming' && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
        {(part.state === 'input-available' || part.state === 'approval-requested') && (
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(part.input, null, 2)}
          </pre>
        )}
        {(part.state === 'output-available' || part.state === 'approval-responded') && (
          <pre className="text-xs overflow-x-auto">
            {JSON.stringify(part.output, null, 2)}
          </pre>
        )}
        {(part.state === 'output-error' || part.state === 'output-denied') && (
          <div className="text-sm text-red-500">
            Error: {part.errorText || 'Operation denied or failed'}
          </div>
        )}
      </CardContent>
    </Card>
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
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageSquare className="size-12 text-muted-foreground mb-4" />
                <h2 className="text-2xl font-semibold mb-2">
                  Ask about Israeli Open Data
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Search datasets, explore categories, and discover public data from data.gov.il
                </p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div key={message.id}>
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
                                  <MessageAction onClick={() => regenerate()} label="Retry">
                                    <RefreshCcwIcon className="size-3" />
                                  </MessageAction>
                                  <MessageAction
                                    onClick={() => navigator.clipboard.writeText(part.text)}
                                    label="Copy"
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
                        case 'tool-listTags':
                          return <ToolCallCard key={`${message.id}-${i}`} part={part} />;
                        default:
                          return null;
                      }
                    })}
                  </div>
                ))}
                {status === 'submitted' && <Loader />}
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
              placeholder="Ask about datasets, organizations, or data categories..."
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
