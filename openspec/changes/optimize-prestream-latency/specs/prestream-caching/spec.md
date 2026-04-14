# Capability: Pre-Stream Caching

Optimizes the time between user message submission and first streaming token by caching agent instances and deferring non-critical blocking operations.

## ADDED Requirements

### Requirement: LRU Agent Instance Cache
The system SHALL cache individual sub-agent instances in-memory using `lru-cache`, keyed by `(agentId, modelId)`. This MUST enable fine-grained reuse when `enabledSources` or model config changes partially.

#### Scenario: Cache hit for unchanged agent
Given a sub-agent was created with model `openrouter/google/gemini-3-flash-preview`
When a new request uses the same model for that agent
Then the cached Agent instance is returned without calling the agent factory

#### Scenario: Cache miss on model change
Given a sub-agent was cached with model `openrouter/google/gemini-3-flash-preview`
When the admin changes that agent's model to `openrouter/anthropic/claude-sonnet-4.5`
Then the agent factory is called with the new model ID
And the new Agent instance replaces the old one in cache

#### Scenario: Partial enabledSources change
Given agents A, B, C are cached from a previous request with `enabledSources: [a, b, c]`
When a new request uses `enabledSources: [a, c]`
Then agents A and C are served from cache
And agent B is not created (filtered out)
And no full cache invalidation occurs

#### Scenario: Cache respects TTL
Given a sub-agent was cached 6 minutes ago with a 5-minute TTL
When a new request needs that agent
Then the cache treats it as a miss
And a fresh Agent instance is created

### Requirement: MCP Tool List Cache
The system SHALL cache MCP tool lists (e.g., from BudgetKey endpoint) separately with a longer TTL since they change infrequently. This MUST eliminate the HTTP roundtrip to the MCP endpoint on most requests.

#### Scenario: Budget agent uses cached MCP tools
Given the MCP tool list for `budgetkey` was fetched 3 minutes ago (TTL: 10 min)
When `createBudgetAgent()` is called
Then `budgetMcpClient.listTools()` is NOT called
And the cached tool list is used to construct the Agent

#### Scenario: MCP tool cache miss triggers fresh fetch
Given the MCP tool cache for `budgetkey` has expired
When `createBudgetAgent()` is called
Then `budgetMcpClient.listTools()` is called
And the result is cached for subsequent requests

### Requirement: Non-Blocking User Message Pre-Save
The system SHALL move the `preSaveUserMessage()` call out of the blocking path before streaming. It MUST execute as fire-and-forget with error logging.

#### Scenario: Pre-save runs without blocking stream
Given a user submits a message
When the POST handler processes the request
Then `handleChatStream` is called without waiting for `preSaveUserMessage` to complete
And the user sees the loading indicator sooner

#### Scenario: Pre-save failure does not affect streaming
Given `preSaveUserMessage()` fails (e.g., Convex timeout)
When the stream is already in progress
Then streaming continues unaffected
And the failure is logged as a warning

## REMOVED Requirements

### Requirement: Single-Entry Mastra Instance Cache
The old `cachedConfigKey`/`cachedMastra` single-entry cache is removed in favor of per-agent LRU caching.

#### Scenario: Full cache miss no longer occurs on partial config change
Given the old cache invalidated on any config key change
When replaced with per-agent LRU cache
Then only agents with changed model IDs are recreated
