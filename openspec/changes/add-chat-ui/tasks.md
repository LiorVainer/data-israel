# Implementation Tasks

## 1. Setup AI Elements and Dependencies
- [x] 1.1 Install AI Elements (also sets up Shadcn/ui automatically):
  ```bash
  npx ai-elements@latest
  ```
  - This creates `components/ai-elements/` directory with all chat components
  - Automatically configures Shadcn/ui if not already set up
  - Creates or updates `components.json`
- [x] 1.2 Install Shadcn Card component for tool call displays:
  ```bash
  npx shadcn@latest add card
  ```
- [x] 1.3 Install AI SDK core dependencies:
  ```bash
  npm install ai @ai-sdk/react zod
  ```
- [x] 1.4 Run `npm run build && npm run lint && npm run vibecheck` to verify setup

## 2. Implement Chat Page Component
- [x] 2.1 Update `app/page.tsx` with 'use client' directive and imports:
  ```typescript
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
  import { CopyIcon, RefreshCcwIcon } from 'lucide-react';
  ```
- [x] 2.2 Initialize useChat hook:
  ```typescript
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, regenerate } = useChat();
  ```
- [x] 2.3 Create form submit handler:
  ```typescript
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    if (!hasText) return;

    sendMessage({ text: message.text || '' });
    setInput('');
  };
  ```
- [x] 2.4 Run `npm run build && npm run lint && npm run vibecheck`

## 3. Implement Main Layout Structure
- [x] 3.1 Create the main page layout:
  ```typescript
  export default function Home() {
    // ... hooks and handlers ...

    return (
      <div className="max-w-4xl mx-auto p-6 relative size-full h-screen">
        <div className="flex flex-col h-full">
          <Conversation className="h-full">
            <ConversationContent>
              {/* Messages will go here */}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput onSubmit={handleSubmit} className="mt-4">
            {/* Input will go here */}
          </PromptInput>
        </div>
      </div>
    );
  }
  ```
- [x] 3.2 Run `npm run build && npm run lint && npm run vibecheck`

## 4. Implement Message Rendering
- [x] 4.1 Add message mapping inside ConversationContent:
  ```typescript
  <ConversationContent>
    {messages.map((message) => (
      <div key={message.id}>
        {message.parts.map((part, i) => {
          switch (part.type) {
            case 'text':
              return (
                <Message key={`${message.id}-${i}`} from={message.role}>
                  <MessageContent>
                    <MessageResponse>{part.text}</MessageResponse>
                  </MessageContent>
                </Message>
              );
            default:
              return null;
          }
        })}
      </div>
    ))}
    {status === 'submitted' && <Loader />}
  </ConversationContent>
  ```
- [x] 4.2 Run `npm run build && npm run lint && npm run vibecheck`

## 5. Implement Tool Call Rendering
- [x] 5.1 Create ToolCallCard helper component (add before the Home component):
  ```typescript
  interface ToolCallCardProps {
    part: {
      type: string;
      state: 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
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
          {part.state === 'input-available' && (
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(part.input, null, 2)}
            </pre>
          )}
          {part.state === 'output-available' && (
            <pre className="text-xs overflow-x-auto">
              {JSON.stringify(part.output, null, 2)}
            </pre>
          )}
          {part.state === 'output-error' && (
            <div className="text-sm text-red-500">
              Error: {part.errorText}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  ```
- [x] 5.2 Add tool call cases to the switch statement in message rendering:
  ```typescript
  case 'tool-searchDatasets':
  case 'tool-getDatasetDetails':
  case 'tool-listGroups':
  case 'tool-listTags':
    return <ToolCallCard key={`${message.id}-${i}`} part={part} />;
  ```
- [x] 5.3 Run `npm run build && npm run lint && npm run vibecheck`

## 6. Implement Input Component
- [x] 6.1 Add PromptInput structure with all required subcomponents:
  ```typescript
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
  ```
- [x] 6.2 Run `npm run build && npm run lint && npm run vibecheck`

## 7. Add Message Actions (Copy, Regenerate)
- [x] 7.1 Update the text case in message rendering to include actions:
  ```typescript
  case 'text':
    const isLastMessage = i === message.parts.length - 1 &&
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
  ```
- [x] 7.2 Run `npm run build && npm run lint && npm run vibecheck`

## 8. Verify API Route Compatibility
- [x] 8.1 Check that `app/api/chat/route.ts` returns proper UI message stream:
  ```typescript
  // Ensure the route uses toUIMessageStreamResponse()
  return result.toUIMessageStreamResponse();
  ```
- [x] 8.2 If needed, update to include tool call streaming (already enabled by default in AI SDK v6)
- [x] 8.3 Run `npm run build && npm run lint && npm run vibecheck`

## 9. Styling and Polish
- [x] 9.1 Verify responsive layout works on mobile (use browser DevTools)
- [x] 9.2 Check color scheme matches Shadcn/AI Elements theme
- [x] 9.3 Ensure proper spacing and padding throughout
- [x] 9.4 Verify scroll behavior works correctly
- [x] 9.5 Test ConversationScrollButton appears when scrolled up
- [x] 9.6 Check tool call cards display properly with long JSON
- [x] 9.7 Verify Loader appears when status === 'submitted'
- [x] 9.8 Run `npm run build && npm run lint && npm run vibecheck`

## 10. Final Integration & Testing
- [x] 10.1 Start development server: `npm run dev`
- [x] 10.2 Test complete user flow:
  - Page loads (verify no errors in console)
  - User sends a message
  - Loader appears while waiting
  - Agent responds with streaming text
  - Agent uses tools (verify Card display)
  - Tool results display correctly in Cards
  - Copy button works
  - Regenerate button works
- [x] 10.3 Test error handling:
  - Network errors (disconnect during stream)
  - Tool call errors (verify error display in Card)
  - Empty messages prevented
- [x] 10.4 Test streaming behavior:
  - Text streams token by token
  - Loader appears during 'submitted' status
  - Scroll follows new content
- [x] 10.5 Test on different browsers (Chrome, Firefox, Safari if available)
- [x] 10.6 Test on different screen sizes (mobile, tablet, desktop)
- [x] 10.7 Verify all imports use `@/` path alias
- [x] 10.8 Check no `any` types exist (proper types from AI SDK)
- [x] 10.9 Verify minimal `as` type assertions
- [x] 10.10 Run full build: `npm run build`
- [x] 10.11 Run linting: `npm run lint`
- [x] 10.12 Run vibecheck: `npm run vibecheck`
- [x] 10.13 Verify TypeScript strict mode passes
