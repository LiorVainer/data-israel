## Context

Mastra sub-agents return `text: ""` when they exhaust all steps on tool calls. The `text` field is built only from `text-delta` stream chunks (confirmed in `@mastra/core` chunk-BCSVBOAN.cjs:20600-20647). If no final LLM step generates text, `fullText` remains empty. The routing agent reads `result.text` and concludes "not found".

## Goals / Non-Goals

- Goals:
  - Programmatically guarantee sub-agents produce text before completing
  - Provide safety net when text is still empty despite processor
  - Reduce per-delegation complexity to improve text generation likelihood
- Non-Goals:
  - Modifying Mastra framework internals
  - Changing the streaming architecture
  - Migrating from `.network()` to supervisor pattern (future work)

## Decisions

### Decision 1: Use `processInputStep` processor with `toolChoice: 'none'`

Mastra's `processInputStep` runs before each LLM step. It can return `{ toolChoice: 'none' }` to prevent tool calls, forcing text generation. This is the most reliable mechanism because it's enforced at the framework level, not dependent on model following instructions.

- Threshold: 8 steps (0-indexed). Most queries need 4-6 tool calls.
- Only triggers when `steps` has tool calls but no text yet.
- Alternatives considered:
  - Instruction-only: Already tried, unreliable
  - `processOutputResult` post-processing (existing `ToolResultSummarizerProcessor`): Runs too late — text is already empty in the stream
  - Custom `maxSteps` only: Doesn't force text generation, just stops the loop

### Decision 2: Use delegation hooks as safety net

`onDelegationComplete` can inject `feedback` into the routing agent's conversation when sub-agent text is empty. This tells the routing agent to interpret tool results directly rather than reporting "not found".

`onDelegationStart` sets explicit `modifiedMaxSteps: 15` so sub-agents have a known budget. Without this, sub-agents inherit an undefined maxSteps which may not interact correctly with the processor threshold.

### Decision 3: Incremental delegation via instructions

The routing agent can call `tool-agent-datagovAgent` multiple times natively. Each call is a separate tool call in the routing agent's agentic loop. By instructing the routing agent to delegate smaller tasks, each sub-agent execution is shorter and more likely to produce text.

This is instruction-based (not programmatic) but complements the processor by reducing the chance the processor needs to fire at all.

## Risks / Trade-offs

- Processor fires at step 8: May cut short queries needing 10+ tool calls. Mitigation: 8 is conservative; can tune up. Also, the processor only fires when there's NO text — if the sub-agent produces text at any step, it won't trigger.
- Incremental delegation adds latency: 2 delegations ~2x time. Mitigation: simple queries still complete in 1 delegation.
- `delegation` hooks are runtime options: They're passed per-request in `handleChatStream`, not per-agent. This means they apply uniformly to all sub-agents. For now this is fine since both sub-agents have the same issue.

## Open Questions

- Should the step threshold be configurable per-agent? (Currently hardcoded at 8 for both)
- Should we migrate from `.network()` to supervisor pattern for more control? (Future work)
