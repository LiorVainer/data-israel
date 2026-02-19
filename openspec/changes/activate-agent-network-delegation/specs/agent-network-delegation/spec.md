# Capability: Agent Network Delegation

## MODIFIED Requirements

### Requirement: Routing Agent Delegates to Sub-Agents

The routing agent MUST use the Mastra `agents` property to delegate domain queries to `cbsAgent` and `datagovAgent`. It MUST NOT hold CBS or DataGov tools directly.

#### Scenario: Routing agent has agents property
- Given the routing agent configuration
- When the agent is instantiated
- Then it MUST have `agents: { datagovAgent, cbsAgent }` configured
- And it MUST NOT have CBS or DataGov tools in its `tools` property
- And it MUST retain `ClientTools` (charts, suggestions, source URLs)

#### Scenario: Sub-agents have domain tools
- Given the CBS and DataGov agent configurations
- When each agent is instantiated
- Then `cbsAgent` MUST have all CBS tools via `CbsTools`
- And `datagovAgent` MUST have all DataGov tools via `DataGovTools`
- And neither sub-agent MUST have `outputProcessors` or explicit `memory`

---

### Requirement: Mastra Instance Registers All Agents

The Mastra instance MUST register `routingAgent`, `cbsAgent`, and `datagovAgent`.

#### Scenario: All agents registered
- Given the Mastra instance configuration
- When the instance is created
- Then `agents` MUST include `routingAgent`, `cbsAgent`, and `datagovAgent`

---

### Requirement: API Route Uses handleNetworkStream

The chat API route MUST use `handleNetworkStream` instead of `handleChatStream` from `@mastra/ai-sdk`.

#### Scenario: POST /api/chat uses handleNetworkStream
- Given a POST request to /api/chat
- When the request is processed
- Then `handleNetworkStream` MUST be called with `mastra`, `agentId: 'routingAgent'`, and request params
- And the response MUST be wrapped with `createUIMessageStreamResponse`
- And the stream MUST include `data-network` parts for agent delegation steps

---

## ADDED Requirements

### Requirement: Network Data Parts Render in Message Timeline

Network data parts (`data-network`) MUST render within the message using `ChainOfThought` components, matching the design language of `ToolCallParts`.

#### Scenario: Network step renders during processing
- Given a message with `data-network` parts where status is `running`
- When the message renders
- Then a `ChainOfThought` accordion MUST display with a shimmer processing label
- And each agent step MUST show with its Hebrew label and active status indicator

#### Scenario: Network step renders after completion
- Given a message with `data-network` parts where all steps are complete
- When the message renders
- Then the `ChainOfThought` header MUST show the completed step count
- And each step MUST show its completion status with Hebrew text

#### Scenario: Network step shows errors
- Given a message with `data-network` parts where a step has `failed` status
- When the message renders
- Then the failed step MUST display in red with error text
- And the header MUST include error count
