# Tasks: Add Reasoning & Sources Display to Chat UI

## 1. Code Refactoring

- [x] 1.1 Extract `ToolCallCard` component from `app/page.tsx` to `components/chat/ToolCallCard.tsx`
- [x] 1.2 Update `app/page.tsx` to import `ToolCallCard` from new location

## 2. Backend Changes

- [x] 2.1 Update `app/api/chat/route.ts` to enable `sendReasoning: true`
- [x] 2.2 Update `app/api/chat/route.ts` to enable `sendSources: true`

## 3. Frontend UI - Reasoning Display

- [x] 3.1 Import ai-elements `Reasoning`, `ReasoningTrigger`, `ReasoningContent` components
- [x] 3.2 Add case handler for `reasoning` message part type in message rendering
- [x] 3.3 Render reasoning using collapsible Reasoning component with Hebrew labels
- [x] 3.4 Support streaming state with `isStreaming` prop

## 4. Frontend UI - Sources Display

- [x] 4.1 Import ai-elements `Sources`, `SourcesTrigger`, `SourcesContent`, `Source` components
- [x] 4.2 Add case handler for `source-url` message part type in message rendering
- [x] 4.3 Collect sources per message and render grouped Sources component
- [x] 4.4 Display source title and URL with proper RTL styling

## 5. Verification

- [x] 5.1 Run `tsc` to verify no TypeScript errors
- [x] 5.2 Run `npm run build` to verify production build
- [x] 5.3 Run `npm run lint` to verify linting passes (changed files only)
- [ ] 5.4 Run `npm run vibecheck` to verify code quality
- [ ] 5.5 Manual test: Verify reasoning appears and auto-collapses after streaming
- [ ] 5.6 Manual test: Verify sources appear when available
- [ ] 5.7 Manual test: Verify ToolCallCard still works after extraction
