# Israeli Open Data AI Agent
## Project Specification (Next.js + AI SDK v6)

---

### Inspiration Source
This project’s tool design and semantics are **inspired by** an existing MCP server (`index.ts`).
The MCP server is **not used at runtime**. Instead, it serves as a **conceptual reference**
for defining AI agent tools using **AI SDK v6 + Zod + TypeScript**.

---

## 1. Purpose

Build a **Next.js application** that allows users to chat with an AI agent about
**Israeli open data (data.gov.il)**.

The agent:
- Knows what datasets exist
- Can search, inspect, and explore datasets
- Uses explicit tools instead of hallucination
- Produces explainable, structured answers

---

## 2. Tooling Philosophy

- MCP `index.ts` is a **design reference only**
- MCP tools inspire **agent-native tools**
- Each conceptual MCP tool maps to **one AI SDK agent tool**
- Tool inputs are validated with **Zod**
- Tool outputs are **structured JSON**, not free text

---

## 3. High-Level Architecture

User  
↓  
Next.js Chat UI  
↓  
AI SDK v6 Agent  
↓  
Zod-validated Tools  
↓  
data.gov.il CKAN API  

No MCP runtime, no stdio, no protocol bridge.

---

## 4. Agent Tool Surface (Conceptual)

### 4.1 Dataset Search Tool
Inspired by: `package_search`

**Purpose**
- Discover datasets related to a topic or keyword

**Used When**
- “What datasets exist about X?”
- “Find data on transportation / housing / health”

**Capabilities**
- Keyword search
- Sorting
- Pagination

**Returns**
- Dataset list (id, title, organization, tags, summary)

---

### 4.2 Dataset Details Tool
Inspired by: `package_show`

**Purpose**
- Inspect a specific dataset in detail

**Used When**
- “Tell me more about this dataset”
- “Show dataset resources”

**Capabilities**
- Full metadata
- Resource list
- Publisher details

**Returns**
- Rich dataset object with resources

---

### 4.3 Group Listing Tool
Inspired by: `group_list`

**Purpose**
- Explore dataset publishers and categories

**Used When**
- “Which ministries publish data?”
- “Who provides transport datasets?”

**Capabilities**
- Ordered listing
- Pagination
- Optional extended fields

**Returns**
- Groups with names, descriptions, dataset counts

---

### 4.4 Tag Listing Tool
Inspired by: `tag_list`

**Purpose**
- Explore dataset taxonomy and keywords

**Used When**
- “What tags exist for environment?”
- “Which keywords should I search with?”

**Capabilities**
- Tag search
- Optional metadata expansion

**Returns**
- Tags with usage counts

---

### 4.5 (Optional) Resource Fetch Tool
Inspired by: `ReadResource`

**Purpose**
- Inspect the contents of a dataset resource

**Used When**
- User explicitly asks to open a dataset file
- Content inspection is required for reasoning

**Guardrails**
- File size limits
- Safe formats only
- No code execution

---

## 5. Zod-First Contract

Every agent tool must define:
- Zod input schema
- Strict output shape
- Typed success and error responses

Mental model:
“If it doesn’t validate with Zod, it doesn’t exist.”

---

## 6. Agent Reasoning Rules

1. Search before answering
2. Dataset facts must come from tool results
3. Summaries are derived, not assumed
4. Pagination over truncation
5. No hallucinated schema fields

---

## 7. System Prompt (Conceptual)

You are an AI agent designed to explore Israeli open datasets.

You have tools for:
- Searching datasets
- Inspecting dataset metadata
- Listing groups
- Listing tags

You must use these tools for factual answers.
You do not guess dataset contents.

---

## 8. UI Expectations

- Streaming chat responses
- Tool-activity indicators
- Dataset results rendered as cards
- Suggested follow-up actions:
  - “Show dataset details”
  - “List available resources”
  - “Search with another tag”

---

## 9. Non-Goals

- Reusing MCP runtime
- Executing dataset resources
- Hallucinating dataset availability
- Treating tool outputs as plain text

---

## 10. Success Criteria

- Correct tool selection by the agent
- All factual claims traceable to tools
- Clear separation between UI, agent, and data layer
- Easy extensibility for new tools

---

## 11. One-Sentence Summary

A Zod-typed AI SDK v6 agent that conversationally explores Israeli open data using tools inspired by MCP semantics, without hallucination.
