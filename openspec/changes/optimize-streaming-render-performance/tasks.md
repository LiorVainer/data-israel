# Tasks: Optimize Streaming Render Performance

## 1.0 Stream Throttling & Debug Cleanup (ChatThread)
- [x] 1.1 Remove `console.log({ messages })` at `ChatThread.tsx:250`
- [x] 1.2 Add `experimental_throttle: 50` to `useChat` options in `ChatThread.tsx:145`
- [x] 1.3 Remove `console.log` at `NotificationPrompt.tsx:51`

## 2.0 MessageItem Memoization & CSS Content-Visibility
- [x] 2.1 Wrap `MessageItem` export with `React.memo()` in `MessageItem.tsx`
- [x] 2.2 Stabilize `isStreaming` prop: change `isStreaming={isStreaming}` to `isStreaming={isStreaming && messageIndex === messages.length - 1}` in `ChatThread.tsx:270`
- [x] 2.3 Create `MessageItem.module.css` with `content-visibility: auto`, `contain-intrinsic-size: 0 120px`, and `@apply flex flex-col gap-6`
- [x] 2.4 Import CSS module in `MessageItem.tsx` and apply class to outer div (keep animation classes inline)

## 3.0 DataSourcePicker Memoization (Highest Self-Time)
- [x] 3.1 Memoize context value in `DataSourcePicker` component with `useMemo` depending on `[enabledSources, onToggle, onSelectAll, onUnselectAll]` in `DataSourcePicker.tsx:86`
- [x] 3.2 Wrap `DataSourcePickerContent` with `React.memo()` in `DataSourcePicker.tsx`

## 4.0 InputSection & Child Memoization
- [x] 4.1 Wrap `InputSection` export with `React.memo()` in `InputSection.tsx`
- [x] 4.2 Wrap `NotificationPrompt` export with `React.memo()` in `NotificationPrompt.tsx`
- [x] 4.3 Wrap `Suggestions` export with `React.memo()` in `Suggestions.tsx`

## 5.0 Navigation Component Memoization
- [x] 5.1 Wrap `HomeLogoButton` with `React.memo()` in `AppSidebar.tsx`
- [x] 5.2 Wrap `AmbientGlow` with `React.memo()` in `AmbientGlow.tsx`
- [x] 5.3 Hoist inline style objects in `AmbientGlow` to module-level constants

## 6.0 Verification
- [x] 6.1 Run `tsc` — no type errors
- [x] 6.2 Run `npm run lint` — no lint errors (0 errors, 6 pre-existing warnings)
- [ ] 6.3 Record new React Profiler session during streaming and compare:
  - Total commits: target <70 (was 165)
  - Total render time: target <1.5s (was 3.2s)
  - DataSourcePickerContent renders when closed: target 0 (was 68)
  - MessageItem (non-last) renders during stream: target 0 (was 68)
