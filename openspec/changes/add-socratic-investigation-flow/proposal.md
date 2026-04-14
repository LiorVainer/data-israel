# Proposal: Add Socratic Investigation Flow & Expand Data Sources

## Change ID
`add-socratic-investigation-flow`

## Why

The project currently covers 2 of 10+ identified Israeli public data sources. Two internal documents (sources mapping + product spec) define a clear vision: expand data coverage and add a Socratic investigation flow that transforms the agent from a Q&A chatbot into a claim verification tool. The highest-impact additions (Knesset + Budget Key) have public APIs and directly enable political claim verification — the product's core value proposition.

## Summary

Evolve the data-israel agent from a general data Q&A chatbot into a **Socratic investigation tool** that helps users verify political claims and explore Israeli public data through guided "lenses" (עדשות). This proposal also expands the agent network with two high-value new data sources identified in the sources mapping document: **Knesset Open Data** and **Budget Key (מפתח התקציב)**.

## Motivation

Two internal documents drive this proposal:

1. **Sources List (מסמך מיפוי מקורות)** — Mapped 10+ Israeli public data sources. The project currently covers data.gov.il and CBS. The two highest-impact additions are:
   - **Knesset Open Data** — Legislation, committee protocols, votes, parliamentary questions. Has Open Data API access.
   - **Budget Key (מפתח התקציב)** — Government expenditure breakdown, approved vs. actual budgets. Open-source, highly accessible technically.

2. **Product Spec (מסמך אפיון דור Why)** — Defines a Socratic AI agent vision where users investigate political claims through structured steps: input a claim → choose analysis "lenses" → guided data retrieval → user-driven conclusions → shareable visual output.

The current agent already has the tool-first architecture and sub-agent delegation pattern needed. This proposal layers the Socratic investigation flow on top and adds the data sources that make claim verification meaningful.

## Scope

### In Scope (4 capabilities)

1. **Knesset Agent** — New sub-agent with tools for Knesset Open Data (legislation, votes, parliamentary questions)
2. **Budget Agent** — New sub-agent with tools for Budget Key API (government expenditure data)
3. **Claim Investigation Flow** — Socratic investigation mode: claim input → lens selection → guided data retrieval → conclusion synthesis
4. **Shareable Output** — Generate shareable summary cards with key data points and source citations

### Out of Scope (deferred)

- State Comptroller reports (requires PDF RAG pipeline — different effort)
- Government Decisions database (requires scraping, no stable API)
- Nevo legal database (paid access, requires subscription)
- Associations Registry (OCR for scanned PDFs, low relevance)
- WhatsApp Bot interface (separate product surface)
- Image generation engine (Nano Banana / similar — can use chart tools instead)
- The Monitor / Zman Knesset (unofficial sources, reliability concerns)

## Phasing

### Phase 1: Data Source Expansion (Knesset + Budget agents)
Add the two new sub-agents to the existing agent network. The routing agent learns to delegate to them alongside datagovAgent and cbsAgent. This is a straightforward extension of the current pattern.

### Phase 2: Claim Investigation Flow
Add a new interaction mode where the agent recognizes claim/statement inputs and switches to the Socratic investigation process. This modifies the routing agent's prompt and adds new client-side UI for lens selection and investigation progress.

### Phase 3: Shareable Output
Generate summary cards (using server-side rendering, not external image APIs) that users can share. Includes the claim, key data point, source citations, and a visual element.

## Key Design Decisions

### Why Knesset + Budget Key first?
- Both have public APIs or open-source data access (no scraping needed)
- They complement existing sources: data.gov.il (raw datasets) + CBS (statistics) + Knesset (legislation/votes) + Budget (expenditure) = comprehensive public data picture
- They directly serve claim verification: "Did the government increase education spending?" requires budget data + legislative data

### Why not all 10 sources?
- Sources like State Comptroller (PDF-only), Nevo (paid), and Associations Registry (scanned PDFs) require fundamentally different ingestion pipelines
- The 4-source combination (data.gov.il + CBS + Knesset + Budget) covers the highest-value use cases identified in the pilot focus selection

### Socratic flow vs. free-form chat
- The Socratic flow is an **additional mode**, not a replacement for free-form chat
- When the agent detects a political claim or verifiable statement, it offers to switch to investigation mode
- Users can always continue with free-form questions

### Shareable output approach
- Use server-side HTML→image rendering (e.g., Satori/OG-image pattern) rather than external image generation APIs
- This keeps the stack self-contained and avoids external API costs
- Charts already exist via client tools; the shareable card wraps them with context

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Knesset API instability/undocumented | Medium | Build with graceful fallback; cache responses |
| Budget Key API changes (open-source project) | Low | Pin to known API version; monitor upstream |
| Socratic flow feels forced | Medium | Make it opt-in; agent suggests but doesn't require |
| Shareable images have wrong data | High | All data must link to source; validation before render |
| Scope creep into all 10 sources | High | Strict phase gates; defer other sources to future proposals |

## Dependencies

- Existing agent network pattern (routing → sub-agents)
- Existing Convex memory infrastructure
- Existing chart tools (for data visualization in shareable cards)
- Knesset Open Data API (public, no auth needed)
- Budget Key API (open-source, https://next.obudget.org)

## Success Criteria

- Agent can answer questions about Knesset legislation and votes
- Agent can answer questions about government budget allocation and execution
- Users can initiate a claim investigation and receive a structured analysis
- Users can generate and share a visual summary of their investigation
- All data points are backed by source URLs (no hallucination)
