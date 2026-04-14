# Capability: Streaming Render Performance

Optimized React rendering during AI chat streaming to eliminate jank and unnecessary re-renders.

## ADDED Requirements

### Requirement: Stream Update Throttling

The `useChat` hook SHALL throttle streaming chunk updates to batch React renders.

#### Scenario: Throttled streaming renders

- **Given** a streaming AI response emitting chunks every ~10-20ms
- **When** `experimental_throttle: 50` is configured on `useChat`
- **Then** React commits are batched into ~50ms windows, reducing total commits by ~3x

### Requirement: Component Memoization

Chat UI components SHALL be wrapped with `React.memo()` to skip re-renders when props haven't changed.

#### Scenario: MessageItem skips re-render for non-streaming messages

- **Given** a conversation with 5 messages and the AI is streaming message 6
- **When** a new streaming chunk arrives
- **Then** only the last MessageItem (message 6) re-renders; messages 1-5 are skipped by `React.memo()`

#### Scenario: DataSourcePickerContent skips re-render when closed

- **Given** the DataSourcePicker dialog/drawer is closed
- **When** streaming chunks cause ChatThread to re-render
- **Then** DataSourcePickerContent does not re-render (skipped by `React.memo()`)

#### Scenario: Navigation components skip re-render during streaming

- **Given** HomeLogoButton, AmbientGlow, and SidebarTrigger are rendered in the sidebar
- **When** streaming chunks cause parent re-renders
- **Then** these components do not re-render (skipped by `React.memo()`)

### Requirement: Prop Stability During Streaming

Props passed to memoized components SHALL be referentially stable when their semantic value hasn't changed.

#### Scenario: isStreaming prop is stable for non-last messages

- **Given** MessageItem components rendered in a `.map()` loop
- **When** the streaming status changes
- **Then** only the last MessageItem receives `isStreaming=true`; all others receive a stable `false`

#### Scenario: Context value is memoized in DataSourcePicker

- **Given** DataSourcePicker creates a context value object
- **When** the parent re-renders but `enabledSources` and callbacks haven't changed
- **Then** the context value is the same reference (via `useMemo`)

### Requirement: CSS Content-Visibility for Message Items

Off-screen message items SHALL use `content-visibility: auto` to skip layout/paint.

#### Scenario: Long conversation scrolled to bottom

- **Given** a conversation with 20+ messages scrolled to the bottom
- **When** the browser performs layout
- **Then** off-screen message items are skipped (browser uses `contain-intrinsic-size` estimate)

### Requirement: No Debug Logging in Render Paths

Production render paths SHALL NOT contain `console.log` calls that execute on every render.

#### Scenario: ChatThread render path

- **Given** ChatThread renders during streaming
- **When** the component function executes
- **Then** no `console.log` of the messages array occurs

#### Scenario: NotificationPrompt render path

- **Given** NotificationPrompt renders during streaming
- **When** the component function executes
- **Then** no `console.log` of component state occurs
