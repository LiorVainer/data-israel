# Durable Streaming Migration Plan

**Mastra Agents + Next.js + AI SDK → Workflow DevKit (Resumable
Streams)**

------------------------------------------------------------------------

## 1. Executive Summary

### Current Architecture

We currently use:

-   Next.js App Router
-   `/api/chat` POST endpoint
-   Mastra agents via `handleChatStream()`
-   AI SDK with `createUIMessageStreamResponse`
-   Frontend using `useChat`
-   Billing tracked in `onStepFinish` and `onFinish`
-   Mastra memory using `threadId` + `resourceId`

### Current Problem

Streaming is tied to a single HTTP request lifecycle.

If the user: - Closes the tab - Refreshes mid-response - Loses
connection

Then: - Agent execution stops - `onFinish` may never run - Billing may
not persist - Context snapshot may be incorrect - Partial token output
is lost - Tool calls may remain unfinished

------------------------------------------------------------------------

## 2. Definition: Durable + Resumable Streaming

Durable streaming means:

1.  Agent execution continues independently of the HTTP request.
2.  Streaming data is persisted server-side.
3.  Client can reconnect and resume receiving tokens mid-message.
4.  Billing and memory logic always complete.
5.  UI remains compatible with AI SDK `UIMessage` format.

Resumable streaming means: - If connection drops mid-stream, - The
client can reconnect using a run identifier, - And continue receiving
remaining chunks.

------------------------------------------------------------------------

## 3. Target Architecture

Frontend (useChat + WorkflowChatTransport) ↓ POST /api/chat → start
workflow ↓ Workflow.run() ├─ handleChatStream(mastra) ├─ accumulate
billing usage ├─ persist context + billing ├─ write UIMessage chunks to
durable stream └─ complete execution regardless of client state ↓
createUIMessageStreamResponse(workflow.readable)

Key principle: The workflow execution becomes the source of truth.\
The HTTP request becomes just a transport layer.

------------------------------------------------------------------------

## 4. Migration Missions

### Mission 1 --- Architecture Decision

-   Choose Workflow DevKit or alternative durable streaming infra.
-   Document tradeoffs and ADR.

### Mission 2 --- Durable Streaming POC

-   Wrap Mastra in Workflow.
-   Stream UIMessage chunks.
-   Use WorkflowChatTransport.
-   Validate reconnect mid-stream.

### Mission 3 --- Memory Integration

-   Pass `threadId` and `userId` explicitly.
-   Ensure memory recall works after reconnect.

### Mission 4 --- Billing Migration

-   Move usage tracking into workflow.
-   Persist billing idempotently using runId.

### Mission 5 --- Tool Resume Handling

-   Validate tool-call ordering.
-   Ensure no UIMessage corruption after reconnect.

### Mission 6 --- Production Hardening

-   Add throttling.
-   Add cancellation.
-   Add observability.
-   Validate retry safety.

------------------------------------------------------------------------

## 5. Definition of Done

-   Agent continues running after tab closes.
-   Reconnecting resumes stream correctly.
-   Billing persists exactly once.
-   Memory is consistent.
-   Tool calls behave correctly after resume.
-   No duplicate writes occur.

------------------------------------------------------------------------

## 6. Research Instructions for Claude

Claude should:

1.  Analyze Workflow DevKit documentation (durable workflows, resumable
    streams, WorkflowChatTransport).
2.  Design integration for Mastra `handleChatStream()` inside durable
    workflow.
3.  Provide staged migration plan with exit criteria.
4.  Define idempotent billing strategy.
5.  Address tool resume edge cases.
6.  Provide example server + client integration sketch.

Goal: Transform request-bound streaming into durable, resumable
workflow-driven AI execution without breaking Mastra agents, AI SDK
UIMessage format, billing logic, or memory architecture.
