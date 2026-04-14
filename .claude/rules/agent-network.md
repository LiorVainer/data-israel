---
paths:
  - "src/agents/**"
  - "src/app/api/chat/**"
  - "src/constants/prompts.ts"
---

# Agent Network & Streaming Architecture

The Mastra agent network uses a **routing agent** that delegates to 7 specialized sub-agents. Sub-agents run as tool calls (`tool-agent-<agentId>`) with their own memory threads. This rule covers the wiring, streaming protocol, memory model, and implementation details that matter when touching any file under `src/agents/**`, `src/app/api/chat/**`, or `src/constants/prompts.ts`.

## Agents

| Agent | Hebrew Name | Tools | Role |
|-------|-------------|-------|------|
| `routingAgent` | סוכן ניתוב | 4 direct + 7 sub-agents | Orchestrator — delegates to sub-agents, manages memory, creates charts |
| `datagovAgent` | סוכן data.gov.il | 16 | Israeli open data search (CKAN API) — runs as sub-agent |
| `cbsAgent` | סוכן הלמ"ס | 9 | Central Bureau of Statistics (series, prices, localities) — runs as sub-agent |
| `budgetAgent` | סוכן תקציב המדינה | 3 (MCP) | State budget via BudgetKey MCP endpoint (1997-2025) — runs as sub-agent |
| `govmapAgent` | סוכן GovMap | 8 | GovMap geospatial data (real estate transactions, market trends) — runs as sub-agent |
| `drugsAgent` | סוכן תרופות | 8 | Pharmaceutical database (Ministry of Health) — runs as sub-agent |
| `healthAgent` | סוכן בריאות | 5 | Public health dashboards (Ministry of Health) — runs as sub-agent |
| `groceryAgent` | סוכן מחירי מזון | 5 | Supermarket price transparency (XML feeds) — runs as sub-agent |

## Agent Network Flow

```
User (/) → submit message → crypto.randomUUID() → /chat/:id?new
                                                        ↓
                                              useChat + DefaultChatTransport
                                              body: { messages, memory: { thread, resource }, model }
                                                        ↓
                                              POST /api/chat
                                              handleChatStream(mastra, 'routingAgent', params)
                                                        ↓
                                    ┌─── Routing Agent (סוכן ניתוב) ───┐
                                    │  Client Tools (4) + 7 Sub-Agents │
                                    │  Memory: Convex Vector + Storage │
                                    │  Decides intent → delegates      │
                                    └──────────────────────────────────┘
                                                        ↓
         ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
         ↓          ↓          ↓          ↓          ↓          ↓          ↓          ↓
     datagov     cbs       budget     govmap     drugs      health    grocery    Client
     Agent       Agent     Agent      Agent      Agent      Agent     Agent      Tools
         ↓          ↓          ↓          ↓          ↓          ↓          ↓
     Own Convex memory thread per sub-agent (linked via subAgentThreadId)
         ↓
     Final Hebrew response → Stream to UI
```

## Streaming Architecture (handleChatStream)

When the routing agent delegates to a sub-agent, Mastra's `handleChatStream` emits **two companion message parts**:

1. **`tool-agent-<name>`** — Standard tool call part:
   - input: prompt for the sub-agent
   - output: `{ text, subAgentThreadId, subAgentResourceId }`
2. **`data-tool-agent`** — Streaming-only artifact containing the sub-agent's internal `toolCalls`, `toolResults`, and `steps`.

The `data-tool-agent` parts are **not stored in memory** — they are streaming artifacts only. On page reload, `enrichWithSubAgentData()` in `GET /api/chat` reconstructs them via **two-pass recall**:

1. Scan recalled messages for `tool-agent-*` parts with `subAgentThreadId`
2. Fetch each sub-agent's separate memory thread via `memory.recall()`
3. Extract tool invocations and reconstruct `data-tool-agent` parts

## Memory & Storage

- **Instance-level storage**: `ConvexStore` on the Mastra instance (all agents inherit).
- **Vector search**: `ConvexVector` on routing agent for semantic recall (topK: 3).
- **Thread management**: UUID-based, passed from frontend via `memory: { thread, resource }`.
- **Convex deployment**: `decisive-alpaca-889.convex.cloud`.
- **Graceful fallback**: If Convex env vars are missing, storage/vector are disabled (in-memory only).
- **Sub-agent threads**: each sub-agent stores its own results in a separate Convex thread, linked back to the routing agent's thread via `subAgentThreadId`.

## AI Agent Implementation

The agent uses **Mastra 1.1** with AI SDK v6 tools.

- **Framework**: Mastra agent network with `handleChatStream` for streaming.
- **Model**: OpenRouter provider, default `google/gemini-3-flash-preview`.
- **Architecture**: Routing agent delegates to 7 sub-agents via `agents: {}` — **not** direct tool registration.
- **Routing agent tools**: 4 direct (`displayBarChart`, `displayLineChart`, `displayPieChart`, `suggestFollowUps`) + 7 sub-agents.
- **Sub-agent tools**: DataGov (16), CBS (9), Budget (3 MCP), GovMap/Nadlan (8), Drugs (8), Health (5), Grocery (5) — each with its own memory thread.
- **Processors**: `ToolResultSummarizerProcessor` converts raw API results to Hebrew summaries. Also: `TextOutputProcessor`, `ResponseLengthValidatorProcessor`.
- **Two-pass recall**: `GET /api/chat` fetches routing agent thread, then sub-agent threads to reconstruct internal tool call data for the UI.
- **Chat routing**: UUID-based threads at `/chat/:id`; new conversations use `?new` query param to skip message loading.
