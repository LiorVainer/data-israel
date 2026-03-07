# Change: Fix sub-agent empty text response with processor + delegation hooks

## Why

Sub-agents (datagovAgent, cbsAgent) return `text: ""` to the routing agent despite making 16+ successful tool calls with real data. The routing agent sees empty text and concludes "not found". Root cause confirmed in Mastra core: `fullText` is built only from `text-delta` stream chunks — if the sub-agent exhausts its steps on tool calls without a final LLM text-generation step, the text stays empty. Instruction-only fixes are unreliable because the model still prioritizes tool calls over text generation.

## What Changes

### 1. EnsureTextOutput Processor (programmatic guarantee)
- New `processInputStep` processor on sub-agents that forces `toolChoice: 'none'` after 8+ tool-call steps with no text produced
- Injects a system message demanding Hebrew text summary
- Registered via `inputProcessors` on both datagovAgent and cbsAgent

### 2. Delegation Hooks (safety net + step budget)
- `onDelegationStart`: Sets explicit `modifiedMaxSteps: 15` for sub-agents
- `onDelegationComplete`: Injects feedback to routing agent when sub-agent text is empty, telling it to interpret tool results directly
- Passed via `delegation` in `handleChatStream` defaultOptions

### 3. Incremental Delegation Instructions
- Routing agent instructions updated to delegate smaller, focused tasks instead of entire user questions
- Sub-agent instructions updated to accept partial tasks and always produce text summaries
- Routing agent calls same sub-agent multiple times in sequence (natively supported by Mastra)

## Impact
- Affected specs: `agent-tools`
- Affected code:
  - `agents/processors/ensure-text-output.processor.ts` — **NEW** processor
  - `agents/network/datagov/data-gov.agent.ts` — register processor
  - `agents/network/cbs/cbs.agent.ts` — register processor
  - `app/api/chat/route.ts` — add delegation hooks to defaultOptions
  - `agents/network/routing/config.ts` — incremental delegation instructions
  - `agents/network/datagov/config.ts` — focused task instructions
  - `agents/network/cbs/config.ts` — focused task instructions
