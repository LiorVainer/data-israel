## ADDED Requirements

### Requirement: Chat Stream with Agent Delegation
The system SHALL use `handleChatStream` from `@mastra/ai-sdk` as the streaming handler for the chat API route. Sub-agents (datagovAgent, cbsAgent) SHALL be invoked as tool calls (`agent-datagovAgent`, `agent-cbsAgent`) via Mastra's automatic agent-to-tool conversion.

#### Scenario: Agent delegation via tool call
- **WHEN** a user asks a question about Israeli open data
- **THEN** the routing agent delegates to `agent-datagovAgent` or `agent-cbsAgent` as a tool call
- **AND** the tool call appears in the stream as a standard `tool-input-available` / `tool-output-available` part

#### Scenario: onFinish callback fires
- **WHEN** the agent stream completes
- **THEN** the `onFinish` callback fires with `totalUsage` and `model` data
- **AND** token usage is persisted to Convex via `insertThreadUsage`

#### Scenario: Stop condition enforces suggestFollowUps
- **WHEN** the agent produces a text response
- **THEN** the stream continues until `suggestFollowUps` has been called
- **AND** `MAX_STEPS` serves as a safety fallback
- **AND** no `SuggestFollowUpsProcessor` is needed (stopWhen replaces it)

### Requirement: Agent Delegation Visualization
The system SHALL render agent-as-tool calls (`agent-datagovAgent`, `agent-cbsAgent`) in the tool call timeline with agent-specific icons, Hebrew labels, and data-source badges. The agent's text output SHALL be displayed as a summary description.

#### Scenario: Agent tool call renders with Hebrew label and data-source badge
- **WHEN** a `tool-agent-datagovAgent` part appears in the message
- **THEN** the tool call timeline shows the agent's Hebrew label ("בודק במאגרי המידע הממשלתי") with the DatabaseIcon
- **AND** the "מידע ממשלתי" data-source badge is displayed next to the label
- **AND** the agent's response text is shown as the step description

#### Scenario: CBS agent tool call renders with badge
- **WHEN** a `tool-agent-cbsAgent` part appears in the message
- **THEN** the tool call timeline shows "בודק בנתוני הלשכה המרכזית לסטטיסטיקה" with the BarChart2Icon
- **AND** the "למ"ס" data-source badge is displayed next to the label

### Requirement: Type-Safe Agent Display Map
The system SHALL define `AgentsDisplayMap` as `Record<AgentName, AgentDisplayInfo>` where `AgentName` is derived from `keyof typeof agents`. Each entry MAY include a `dataSource` field for data-source badge resolution. Adding or removing agents in `agents/mastra.ts` SHALL produce a compile-time error if the display map is not updated.

#### Scenario: Missing agent entry causes compile error
- **WHEN** a new agent is added to `agents/mastra.ts`
- **THEN** TypeScript reports an error on `AgentsDisplayMap` until the new entry is added

#### Scenario: Data-source badge resolved from agent display map
- **WHEN** `getToolDataSource('agent-cbsAgent')` is called
- **THEN** it returns `'cbs'` (resolved via `AgentsDisplayMap.cbsAgent.dataSource`)

### Requirement: Type-Safe Tool IO Map
The system SHALL derive `ToolIOMap` from actual tool objects using AI SDK's `InferToolInput` / `InferToolOutput` utility types. The map SHALL include both regular tools (from `ClientTools`, `DataGovTools`, `CbsTools`) and agent-as-tool entries (from `agents` const). No manual synchronization SHALL be required.

#### Scenario: New tool automatically appears in ToolIOMap
- **WHEN** a new tool is added to `DataGovTools` (or `CbsTools` or `ClientTools`)
- **THEN** `ToolName` union includes the new tool name
- **AND** `ToolInput<'newTool'>` and `ToolOutput<'newTool'>` resolve correctly
- **AND** no changes to `lib/tools/types.ts` are needed

#### Scenario: Agent-as-tool entries derived from agents const
- **WHEN** a new agent is added to `agents/mastra.ts`
- **THEN** `ToolIOMap` includes `agent-{agentName}` with `{ input: { prompt: string }; output: { text: string } }`
