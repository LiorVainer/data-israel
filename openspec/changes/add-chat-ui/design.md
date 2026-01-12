# Chat UI Design

## Context

The Israeli Open Data Agent has a functional backend (agent tools, API client, and streaming endpoint) but no user interface. Users need an intuitive way to interact with the agent to explore datasets from data.gov.il. The AI SDK v6 provides the `useChat` hook and related primitives specifically designed for building chat interfaces with agent streaming support.

## Goals / Non-Goals

### Goals
- Provide a simple, functional chat interface for users to interact with the agent
- Support real-time streaming of agent responses and tool calls
- Display tool usage transparently (show what the agent is doing)
- Use AI SDK v6 patterns as documented in official examples
- Maintain type safety with TypeScript
- Keep the implementation minimal and focused

### Non-Goals
- Advanced chat features (history persistence, export, multi-session)
- Authentication or user management
- Custom tool execution UI (e.g., confirmation buttons for tools)
- Markdown rendering or syntax highlighting
- Chat settings or configuration UI

## Decisions

### Decision 1: Use AI SDK v6 `useChat` Hook

**What**: Leverage the `@ai-sdk/react` package's `useChat` hook for chat state management.

**Why**:
- Official AI SDK pattern for chat interfaces
- Handles message state, streaming, and transport automatically
- Type-safe integration with our agent's message format
- Minimal boilerplate compared to building from scratch
- Supports tool call streaming out of the box

**Alternatives considered**:
- **Custom fetch + state management**: More control but significantly more code and complexity
- **AI SDK's `useCompletion`**: Designed for single completions, not multi-turn chat

### Decision 2: Replace Homepage Instead of New Route

**What**: Replace `app/page.tsx` content with the chat interface.

**Why**:
- This is a single-purpose application focused on the data agent
- Users expect the agent to be immediately accessible
- No need for separate landing page since the agent is the product
- Simpler navigation (no routing needed)

**Alternatives considered**:
- **Create `/chat` route**: Adds unnecessary routing complexity for single-purpose app
- **Add chat widget to existing homepage**: Splits focus, more UI code

### Decision 3: Display All Tool Calls in Chat

**What**: Show tool invocations with input/output directly in the message stream.

**Why**:
- Transparency: users see what data the agent is querying
- Educational: helps users understand how the agent works
- Debugging: easier to spot incorrect tool usage
- Follows AI SDK examples for tool call rendering

**Alternatives considered**:
- **Hide tool calls entirely**: Less transparent, harder to debug
- **Show only tool names**: Not enough information for users to understand agent behavior
- **Collapsible tool calls**: Adds UI complexity for minimal benefit in v1

### Decision 4: Use AI Elements + Shadcn/ui for Professional UI

**What**: Use AI SDK's official AI Elements component library with Shadcn/ui components for polished UI.

**Why**:
- **AI Elements** is specifically designed for AI SDK chat interfaces
- Pre-built components handle complex chat patterns (streaming, tool calls, sources, reasoning)
- Follows AI SDK best practices and design patterns
- **Shadcn/ui** provides accessible, customizable base components
- Both libraries use Tailwind CSS (already configured)
- Professional look without custom styling overhead
- Components are copy-paste (Shadcn) or documented (AI Elements), no heavy dependencies
- Active maintenance from Vercel/AI SDK team

**Alternatives considered**:
- **Plain Tailwind only**: Would require building all chat UI patterns from scratch, more code
- **Custom CSS modules**: More files to manage, less consistency, no accessibility features
- **Component library (MUI, Chakra)**: Heavy dependencies, not designed for AI chat patterns
- **Headless UI only**: Still requires building chat-specific patterns

### Decision 5: Client-Side Only Component

**What**: Make `app/page.tsx` a client component with `'use client'` directive.

**Why**:
- `useChat` hook requires client-side rendering
- Chat state (messages, input) is inherently client-side
- No SEO concerns for an interactive chat application
- Simpler than trying to mix server/client components

**Alternatives considered**:
- **Server Components wrapper**: Adds complexity without benefits for chat UI
- **Islands architecture**: Overkill for a full-page interactive component

## Architecture

### Component Structure

```
app/page.tsx (Client Component)
├── useChat hook
│   ├── messages state
│   ├── sendMessage function
│   ├── regenerate function
│   └── DefaultChatTransport → /api/chat
├── Conversation (AI Elements)
│   ├── ConversationContent
│   │   ├── ConversationEmptyState (when no messages)
│   │   └── Message (AI Elements) for each message
│   │       ├── MessageContent
│   │       │   ├── MessageResponse (text parts)
│   │       │   └── Card (Shadcn) for tool calls
│   │       └── MessageActions (copy, regenerate)
│   └── ConversationScrollButton
└── PromptInput (AI Elements)
    ├── PromptInputTextarea
    └── PromptInputSubmit
```

### Component Libraries

**AI Elements** (from AI SDK documentation):
- `Conversation`, `ConversationContent`, `ConversationEmptyState`, `ConversationScrollButton`
- `Message`, `MessageContent`, `MessageResponse`, `MessageActions`, `MessageAction`
- `PromptInput`, `PromptInputTextarea`, `PromptInputSubmit`

**Shadcn/ui** (installed via CLI):
- `Card`, `CardHeader`, `CardContent` (for tool call displays)
- `Button` (for additional actions if needed)
- `ScrollArea` (if needed for custom scrolling)

### Data Flow

```
User Input → sendMessage() → POST /api/chat
                                ↓
                          createAgentUIStreamResponse
                                ↓
                          ToolLoopAgent execution
                                ↓
                          Stream chunks → useChat
                                ↓
                          Update messages state
                                ↓
                          Re-render UI
```

### Message Part Types

Based on AI SDK v6 and our agent tools:

```typescript
type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'tool-searchDatasets'; state: ToolState; input?: {...}; output?: {...} }
  | { type: 'tool-getDatasetDetails'; state: ToolState; input?: {...}; output?: {...} }
  | { type: 'tool-listGroups'; state: ToolState; input?: {...}; output?: {...} }
  | { type: 'tool-listTags'; state: ToolState; input?: {...}; output?: {...} }

type ToolState = 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
```

## Implementation Pattern

Following AI SDK v6 and AI Elements documentation patterns:

1. **Hook initialization**:
   ```typescript
   const { messages, sendMessage, status, regenerate } = useChat({
     transport: new DefaultChatTransport({ api: '/api/chat' }),
   });
   ```

2. **Conversation container with empty state**:
   ```typescript
   <Conversation>
     <ConversationContent>
       {messages.length === 0 ? (
         <ConversationEmptyState
           icon={<MessageSquare className="size-12" />}
           title="Ask about Israeli Open Data"
           description="Search datasets, explore categories, and discover public data"
         />
       ) : (
         // Message rendering
       )}
     </ConversationContent>
     <ConversationScrollButton />
   </Conversation>
   ```

3. **Message rendering with AI Elements**:
   ```typescript
   messages.map((message) => (
     <Message from={message.role} key={message.id}>
       <MessageContent>
         {message.parts.map((part, i) => {
           switch (part.type) {
             case 'text':
               return <MessageResponse key={i}>{part.text}</MessageResponse>;
             case 'tool-searchDatasets':
             case 'tool-getDatasetDetails':
             case 'tool-listGroups':
             case 'tool-listTags':
               return <ToolCallCard key={i} part={part} />;
           }
         })}
       </MessageContent>
     </Message>
   ))
   ```

4. **Tool call rendering with Shadcn Card**:
   ```typescript
   <Card className="my-2">
     <CardHeader>
       <CardTitle className="text-sm font-mono">{part.type}</CardTitle>
     </CardHeader>
     <CardContent>
       {part.state === 'input-available' && (
         <pre className="text-xs">{JSON.stringify(part.input, null, 2)}</pre>
       )}
       {part.state === 'output-available' && (
         <pre className="text-xs">{JSON.stringify(part.output, null, 2)}</pre>
       )}
       {part.state === 'output-error' && (
         <div className="text-red-500">Error: {part.errorText}</div>
       )}
     </CardContent>
   </Card>
   ```

5. **Input with AI Elements**:
   ```typescript
   <PromptInput onSubmit={handleSubmit} className="mt-4 w-full max-w-2xl mx-auto">
     <PromptInputTextarea
       value={input}
       placeholder="Ask about datasets..."
       onChange={(e) => setInput(e.currentTarget.value)}
       className="pr-12"
     />
     <PromptInputSubmit
       status={status === 'streaming' ? 'streaming' : 'ready'}
       disabled={!input.trim()}
       className="absolute bottom-1 right-1"
     />
   </PromptInput>
   ```

## Styling Approach

### Design System
- **AI Elements**: Provides default chat UI styling consistent with modern chat interfaces
- **Shadcn/ui**: Uses CSS variables for theming, accessible by default
- **Tailwind CSS**: Already configured, used for spacing, sizing, and custom tweaks

### Color Scheme (Shadcn default theme)
- User messages: Distinct styling via AI Elements `Message` component
- Assistant messages: Default styling via AI Elements
- Tool calls: Shadcn `Card` component with subtle border and background
- Primary color: Tailwind blue scale for buttons and active states
- Error states: Tailwind red scale

### Layout
- Container: `max-w-4xl mx-auto p-6` (readable width, centered)
- Full height: `h-screen` with flex column layout
- Conversation: Flex-1 with overflow handling
- Input: Fixed at bottom with proper spacing

### Component Styling
- **AI Elements components** come with built-in styles
- **Shadcn Card** for tool calls: subtle border, rounded corners, padding
- **Icons** from lucide-react: `MessageSquare`, `CopyIcon`, `RefreshCcwIcon`

### Responsive Behavior
- AI Elements and Shadcn components are responsive by default
- Mobile-friendly touch targets
- Input stays accessible on all screen sizes
- Proper scroll behavior handled by `ConversationContent` and `ConversationScrollButton`

## Risks / Trade-offs

### Risk: Type Safety with Tool Parts

**Risk**: Tool part types may not match exactly between agent definition and UI rendering.

**Mitigation**:
- Use TypeScript's discriminated unions for part types
- Add runtime type checking with switch statements
- Let TypeScript infer types from AI SDK rather than defining manually

### Risk: Tool Output Size

**Risk**: Some datasets may have large outputs that break the UI layout.

**Mitigation**:
- Use `JSON.stringify` with pretty printing for structured display
- Add `overflow-x-auto` to prevent horizontal scroll issues
- Consider truncating very large outputs in future iteration (not in v1)

### Trade-off: Simple vs. Feature-Rich

**Trade-off**: We're building a minimal chat UI instead of a feature-rich interface.

**Rationale**:
- V1 should focus on core functionality (message exchange, tool visibility)
- Can add features later based on user feedback
- Simpler code is easier to maintain and debug
- Faster time to working prototype

## Migration Plan

### Step 1: Install AI Elements
```bash
npx ai-elements@latest
```
This command:
- Sets up Shadcn/ui automatically if not already configured
- Installs AI Elements components to `components/ai-elements/`
- Configures Tailwind CSS for AI Elements
- Creates necessary component files

### Step 2: Install Shadcn Components
```bash
npx shadcn@latest add card
```

### Step 3: Install AI SDK Dependencies
```bash
npm install ai @ai-sdk/react zod
```

### Step 4: Update `app/page.tsx`
- Replace existing content with chat component using AI Elements
- Import required components
- Implement useChat hook integration
- No data migration needed (no state to preserve)

### Step 5: Test
- Manual testing in development mode (`npm run dev`)
- Verify streaming works correctly
- Test tool call display with Shadcn Card components
- Check responsive behavior
- Test message actions (copy, regenerate)
- Verify empty state displays correctly

### Step 6: Deploy
- Standard Next.js build and deployment (`npm run build`)
- No database changes
- No environment variable changes
- AI Elements CSS bundled with Tailwind

### Rollback
- Revert `app/page.tsx` to previous version
- Remove `components/ai-elements/` and `components/ui/` directories
- Remove dependencies: `@ai-sdk/react`, Shadcn packages, `lucide-react`
- Revert `components.json` if it didn't exist before

## Open Questions

None at this time. The AI SDK v6 documentation provides clear patterns for this implementation.

## References

- AI SDK v6 Chat Documentation: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-with-tool-calling
- AI SDK useChat Hook: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
- Next.js App Router: https://nextjs.org/docs/app
- Tailwind CSS: https://tailwindcss.com/docs
