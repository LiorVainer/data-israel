# Change: Add Chat UI with AI Elements and Shadcn/ui

## Why

The agent tools and API endpoint are implemented, but there's no user interface to interact with the agent. Users need a polished, professional chat interface to ask questions about Israeli open datasets and receive streamed responses with real-time tool call visibility.

## What Changes

- Replace the default Next.js homepage with an interactive chat interface
- Install and configure **Shadcn/ui** component library
- Install **AI Elements** (official AI SDK UI components library)
- Integrate AI SDK v6's `useChat` hook from `@ai-sdk/react` for chat state management
- Use AI Elements components for chat UI:
  - `Conversation` and `ConversationContent` for message container
  - `Message` and `MessageContent` for message bubbles
  - `PromptInput`, `PromptInputTextarea`, and `PromptInputSubmit` for user input
  - `ConversationScrollButton` for scroll-to-bottom functionality
  - `ConversationEmptyState` for initial state
- Use Shadcn/ui components where needed:
  - `Card` for tool call displays
  - `Button` for actions
  - `ScrollArea` for smooth scrolling
- Display messages with support for:
  - User and assistant messages with distinct styling
  - Real-time streaming of text responses
  - Tool call visualization (dataset searches, group listings, etc.)
  - Tool call states (input-streaming, output-available, error)
  - Copy and regenerate message actions
- Professional styling with Tailwind CSS + Shadcn design system

## Impact

- **Affected specs**: New capability `chat-ui`
- **Affected code**:
  - Modified file: `app/page.tsx` (replace landing page with chat interface)
  - New directory: `components/ai-elements/` (AI Elements components)
  - New directory: `components/ui/` (Shadcn components)
  - Configuration: `components.json` (Shadcn config)
- **Dependencies**:
  - AI Elements (installed via `npx ai-elements@latest` - also sets up Shadcn/ui automatically)
  - `ai`, `@ai-sdk/react`, `zod` (AI SDK core dependencies)
  - `lucide-react` (icons for AI Elements)
  - Shadcn/ui components (automatically configured by AI Elements installer)
- **AI SDK v6 Features Used**:
  - `useChat` hook for chat state management
  - `DefaultChatTransport` for API communication
  - AI Elements component library
  - Message parts rendering (text, tool calls)
  - Automatic streaming support

## Non-Breaking Change

This is mostly additive. The only modification is replacing the homepage placeholder content with the chat interface.
