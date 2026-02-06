## Context

The application currently uses AI SDK v6's `ToolLoopAgent` with a single agent handling 24 tools across 3 domains. Mastra is a TypeScript-native agent framework that supports agent networks (routing agent + sub-agents) with built-in AI SDK compatibility.

**Stakeholders**: Frontend consumers of `useChat`, API route, agent config.

## Goals / Non-Goals

- **Goals**:
  - Replace monolithic agent with 4 specialized agents (1 router + 3 domain agents)
  - Maintain streaming compatibility with existing `useChat` frontend
  - Keep all existing tools unchanged — zero modifications to `lib/tools/`
  - Use OpenRouter model strings natively in Mastra (no AI SDK provider wrapper)
  - Persist network routing state with `@mastra/memory` + `@mastra/libsql`

- **Non-Goals**:
  - Model selection UI (deferred — keep selector as non-functional for now)
  - Custom stop conditions (Mastra uses LLM reasoning for completion)
  - MCP protocol integration (stays out of scope)
  - Separate Mastra server process (runs in-process within Next.js)

## Decisions

### 1. Streaming Approach: `handleChatStream` (Approach A)

- **Decision**: Use `handleChatStream` from `@mastra/ai-sdk` for the API route
- **Why**: Proven in Mastra's Next.js guide, directly compatible with `useChat` + `DefaultChatTransport`. The routing agent delegates to sub-agents via the `agents` property transparently.
- **Alternative considered**: `routingAgent.network()` + `toAISdkStream` (Approach B) — more control over network events, but adds complexity. Can migrate later if needed.

### 2. Model Configuration: OpenRouter String Format

- **Decision**: Use `"openrouter/google/gemini-3-flash-preview"` string directly in Agent `model` property
- **Why**: Mastra handles OpenRouter natively with string format. No need for `createOpenRouter()` AI SDK provider wrapper.
- **Requires**: `OPENROUTER_API_KEY` environment variable.

### 3. Memory: Required for `.network()` Routing

- **Decision**: Use `@mastra/memory` with `@mastra/libsql` (local SQLite file `mastra.db`)
- **Why**: Mastra requires memory for agent network execution. LibSQL provides local persistent storage without external services.

### 4. File Naming Convention: `{domain}.agent.ts` + `index.ts` Re-exports

- **Decision**: Agent definition files are named `{domain}.agent.ts` (e.g., `cbs.agent.ts`, `data-gov.agent.ts`). Each sub-folder has an `index.ts` that only re-exports from the agent file.
- **Why**: Clearer file names when multiple files are open in an editor. The `index.ts` stays minimal — just a barrel re-export — keeping the pattern consistent across all agent folders.
- **Structure**:
  ```
  agents/network/
  ├── datagov/
  │   ├── data-gov.agent.ts      # Agent definition
  │   ├── config.ts              # Instructions
  │   └── index.ts               # export { datagovAgent } from './data-gov.agent'
  ├── cbs/
  │   ├── cbs.agent.ts
  │   ├── config.ts
  │   └── index.ts               # export { cbsAgent } from './cbs.agent'
  ├── visualization/
  │   ├── visualization.agent.ts
  │   ├── config.ts
  │   └── index.ts               # export { visualizationAgent } from './visualization.agent'
  └── orchestrator/
      ├── routing.agent.ts
      ├── config.ts
      └── index.ts               # export { routingAgent } from './routing.agent'
  ```

### 5. Agent Instructions: Split from Monolithic

- **Decision**: Split current `agentInstructions` string into domain-specific instructions per agent
- **Orchestrator**: General routing logic, Hebrew response style, task completion guidance
- **DataGov agent**: data.gov.il CKAN-specific search patterns, display rules
- **CBS agent**: CBS/LMS-specific series, price, dictionary workflows
- **Visualization agent**: Chart creation rules, Hebrew labels, item limits

### 6. Tool Compatibility

- **Decision**: Pass AI SDK `tool()` definitions directly to Mastra agents
- **Why**: Mastra accepts AI SDK tool definitions natively — zero conversion needed
- **Verification**: Tool call parts stream as `tool-{toolKey}`, same format `MessageToolCalls.tsx` expects

## Risks / Trade-offs

| Risk | Severity | Mitigation |
|------|----------|------------|
| Mastra streaming format incompatible with `useChat` | Medium | Use `handleChatStream` + `DefaultChatTransport` (proven combo in docs) |
| Tool call rendering breaks in `MessageToolCalls.tsx` | Low | Mastra streams tool parts as `tool-{toolKey}` — same AI SDK format. Verify during testing. |
| Network completion detection differs from `taskCompletionStop` | Low | Embed completion guidance in orchestrator instructions instead of programmatic stop |
| `@mastra/libsql` adds SQLite file to project root | Low | Add `mastra.db` to `.gitignore` |
| Node.js version requirement (v22.13.0+) | Medium | Verify with `node -v` before install. Document in README if needed. |

## Migration Plan

1. Install dependencies (`@mastra/core`, `@mastra/ai-sdk`, `@mastra/memory`, `@mastra/libsql`)
2. Create agent network files under `agents/network/`
3. Create Mastra instance (`agents/mastra.ts`)
4. Modify API route to use `handleChatStream`
5. Add `DefaultChatTransport` to frontend `useChat`
6. Simplify `agent.config.ts` (remove completion markers, tool call config)
7. Deprecate `data-agent.ts` (re-export from network)
8. Add `mastra.db` to `.gitignore`
9. Verify: `tsc`, `npm run build`, `npm run lint`, `npm run vibecheck`
10. Manual browser testing across all domains

## Open Questions

- Should `handleNetworkStream` be used instead of `handleChatStream` for richer network event streaming? (Deferred — start with simpler approach)
- Should model selection be re-enabled per-agent or globally? (Deferred)
