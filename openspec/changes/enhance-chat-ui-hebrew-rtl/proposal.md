# Change: Enhance Chat UI with Hebrew RTL, Better Animations, and Advanced Components

## Why

The current chat UI is basic and English-focused. For an Israeli open data agent, the interface should be Hebrew-first with proper RTL (right-to-left) support. Additionally, the UI needs better visual feedback with animations, a skeleton loader instead of a basic spinner, collapsible tool displays, and syntax-highlighted JSON for better data exploration.

## What Changes

- **Hebrew-first RTL layout**: Add `dir="rtl"` and Hebrew translations for all UI text and agent instructions
- **Hebrew agent instructions**: Translate AI agent system prompt from English to Hebrew to ensure consistent Hebrew-first experience throughout the application
- **Collapsible tool cards**: Make tool call displays hideable using Shadcn's Collapsible component
- **Code/JSON syntax highlighting**: Replace plain `<pre>` with AI Elements `CodeBlock` component (uses Shiki) for beautiful syntax highlighting with copy button
- **Skeleton loader**: Replace basic `<Loader />` with Shadcn's Skeleton component with shimmer animation
- **Enhanced empty state**: Improve with Hebrew text, better icon, and subtle animations
- **Smooth animations**: Add Framer Motion or CSS transitions for message appearance, tool expansion, and scroll behaviors
- **Better typography**: Optimize Hebrew font rendering with Geist Sans or system fonts

## Impact

- **Affected specs**: `chat-ui` (modified)
- **Affected code**:
  - `app/page.tsx` - Add RTL support, Hebrew text, collapsible tools, CodeBlock for JSON/code
  - `app/layout.tsx` - Add `dir="rtl"` to HTML root
  - `app/globals.css` - Add RTL-aware styles and animations
  - `agents/data-agent.ts` - Translate agent instructions to Hebrew
  - Add Shadcn Skeleton component if not present
  - Add AI Elements CodeBlock component if not present
- **Dependencies**:
  - AI Elements `CodeBlock` component (uses Shiki for syntax highlighting)
  - Shadcn `Skeleton` component
  - Shadcn `Collapsible` component
  - No external dependencies needed (AI Elements and Shadcn already installed)
- **Breaking changes**: None (purely UI enhancement)

## Non-Breaking Change

This is a visual enhancement that improves UX without changing any APIs or data structures.
