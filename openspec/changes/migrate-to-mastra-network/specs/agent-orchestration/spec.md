## ADDED Requirements

### Requirement: Agent Network Architecture
The system SHALL use a Mastra Agent Network consisting of one routing agent and three specialized sub-agents for handling user queries about Israeli open data.

#### Scenario: Routing agent delegates to DataGov agent
- **WHEN** a user asks about datasets, organizations, groups, tags, or resources from data.gov.il
- **THEN** the routing agent SHALL delegate the query to the DataGov Search Agent
- **AND** the DataGov agent SHALL use its 15 tools to fulfill the request

#### Scenario: Routing agent delegates to CBS agent
- **WHEN** a user asks about statistical series, price indices, CPI calculations, or locality data from CBS
- **THEN** the routing agent SHALL delegate the query to the CBS Agent
- **AND** the CBS agent SHALL use its 6 tools to fulfill the request

#### Scenario: Routing agent delegates to Visualization agent
- **WHEN** a user requests a chart or data visualization
- **THEN** the routing agent SHALL delegate to the Visualization Agent
- **AND** the Visualization agent SHALL use its 3 chart tools to create the visualization

#### Scenario: Multi-domain query
- **WHEN** a user query spans multiple domains (e.g., "find transportation data and show a chart")
- **THEN** the routing agent SHALL coordinate between relevant sub-agents sequentially

### Requirement: Sub-Agent Specialization
Each sub-agent SHALL carry domain-specific instructions and a focused toolset, rather than sharing a single monolithic instruction set.

#### Scenario: DataGov agent has domain-specific instructions
- **WHEN** the DataGov agent processes a query
- **THEN** it SHALL follow instructions specific to data.gov.il CKAN API search patterns and data display rules

#### Scenario: CBS agent has domain-specific instructions
- **WHEN** the CBS agent processes a query
- **THEN** it SHALL follow instructions specific to CBS series browsing, price index calculation, and locality dictionary lookups

#### Scenario: Visualization agent has domain-specific instructions
- **WHEN** the Visualization agent creates a chart
- **THEN** it SHALL follow instructions for Hebrew labels, item limits, and chart type selection

### Requirement: Streaming Compatibility
The agent network SHALL stream responses to the frontend using the same `useChat` hook interface as the previous single-agent architecture.

#### Scenario: Chat stream via API route
- **WHEN** the frontend sends a POST request to `/api/chat`
- **THEN** the API route SHALL use `handleChatStream` from `@mastra/ai-sdk` and `createUIMessageStreamResponse` from `ai` to stream the response

#### Scenario: Frontend transport
- **WHEN** the `useChat` hook is initialized
- **THEN** it SHALL use `DefaultChatTransport` from `ai` pointing to `/api/chat`

#### Scenario: Tool call rendering
- **WHEN** the agent network executes tool calls
- **THEN** tool call parts SHALL stream as `tool-{toolKey}` format compatible with `MessageToolCalls.tsx`

### Requirement: Tool Compatibility
The agent network SHALL accept existing AI SDK `tool()` definitions from `lib/tools/` without any modifications.

#### Scenario: AI SDK tools passed to Mastra agents
- **WHEN** Mastra agents are configured with tools from `lib/tools/`
- **THEN** the tools SHALL work identically to their behavior under `ToolLoopAgent`
- **AND** no tool files SHALL be modified

### Requirement: Network Memory
The routing agent SHALL use persistent memory storage for network execution task history.

#### Scenario: Memory configured with LibSQL
- **WHEN** the routing agent is instantiated
- **THEN** it SHALL be configured with `@mastra/memory` using `@mastra/libsql` storage
- **AND** the database file SHALL be stored locally as `mastra.db`

### Requirement: Model Configuration
All agents SHALL use the same OpenRouter model via Mastra's native string format.

#### Scenario: OpenRouter model string
- **WHEN** an agent is configured with a model
- **THEN** it SHALL use the format `"openrouter/{provider}/{model}"` (e.g., `"openrouter/google/gemini-3-flash-preview"`)
- **AND** authentication SHALL use the `OPENROUTER_API_KEY` environment variable
