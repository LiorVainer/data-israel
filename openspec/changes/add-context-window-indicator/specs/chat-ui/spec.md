## ADDED Requirements

### Requirement: Token Usage Tracking
The system SHALL log actual token usage reported by the model provider after each agent generation to a `thread_usage` Convex table, storing threadId, userId, agentName, model, provider, usage breakdown via `vUsage` (promptTokens, completionTokens, totalTokens, plus optional reasoningTokens and cachedInputTokens), and optional providerMetadata.

#### Scenario: Usage logged after response
- **WHEN** the agent finishes streaming a response
- **THEN** the API route SHALL extract `totalUsage` from the `onFinish` callback (pre-summed across all steps by Mastra) and insert all token fields (including optional `reasoningTokens` and `cachedInputTokens`) into the `usage` column of the `thread_usage` table, with the actual model and provider from the callback args

#### Scenario: Usage accumulated per generation
- **WHEN** multiple messages are exchanged in a thread
- **THEN** each generation SHALL produce its own usage row (append-only log, no upserts)

#### Scenario: Multi-step agent run
- **WHEN** the agent performs multiple steps (tool calls) in a single generation
- **THEN** the `totalUsage` field provided by Mastra's `onFinish` callback SHALL already be summed across all steps

### Requirement: Context Window Usage Indicator
The system SHALL display a visual indicator in the chat thread showing what percentage of the model's context window is occupied, based on the latest `totalTokens` from the `thread_usage` Convex table.

#### Scenario: No usage data yet
- **WHEN** a new thread has no stored token usage (first message not yet completed)
- **THEN** the indicator SHALL show 0% usage or be hidden

#### Scenario: Partial context usage
- **WHEN** the latest stored total tokens are 50,000 and the max context window is 200,000 tokens
- **THEN** the indicator SHALL show approximately 25% usage with a progress bar

#### Scenario: High context usage warning
- **WHEN** the latest stored total token usage exceeds 70% of the max context window
- **THEN** the indicator SHALL visually change to a warning color (amber)

#### Scenario: Critical context usage
- **WHEN** the latest stored total token usage exceeds 90% of the max context window
- **THEN** the indicator SHALL visually change to a danger color (red)

#### Scenario: Real-time reactivity via Convex
- **WHEN** the API route inserts a new usage row in Convex after a response completes
- **THEN** the frontend indicator SHALL update automatically via Convex's reactive query subscription

### Requirement: Context Window Configuration
The agent configuration SHALL include a `MAX_CONTEXT_TOKENS` constant representing the model's context window size in tokens.

#### Scenario: Default configuration
- **WHEN** the application is configured with the default model
- **THEN** `MAX_CONTEXT_TOKENS` SHALL be set to 200,000
