<div align="center">

<img src="public/data-israel-readme.svg" alt="Data Israel" width="200" />

# Data Israel - Israeli Public Data AI Agents

### Ask questions in Hebrew. Get answers backed by real data.

[data-israel.org](https://data-israel.org)

</div>

---

Israel has a massive amount of open data: CBS statistics, price indices, population, housing, transportation, education, budgets, real estate transactions, pharmaceutical databases, and more. The problem? The data exists, but it's not truly accessible.

**Data Israel** is a network of AI agents that connects in real-time to **8 Israeli government and public data sources** -- data.gov.il, CBS, state budgets, real estate transactions, pharmaceutical databases, health dashboards, supermarket prices, and parliamentary data. Anyone can ask questions in Hebrew and receive answers grounded in official data -- with context, tables, and charts. A routing agent orchestrates specialized sub-agents, each with its own tools and memory, to search, cross-reference, and summarize data autonomously.

No manual searching, no CSVs, and no need to know what a DataStore API is.

## Why Use It

This is not "just another AI chat". The agent:

- **Connects live** to 8 Israeli data APIs -- every answer comes from real API calls, not hallucination
- **Multi-agent network** with specialized sub-agents that autonomously search, cross-reference, and summarize data
- **Transparent reasoning** - see exactly which tools each agent calls, with live progress and colored status chips
- **Context window tracking** - a usage bar per thread shows how much context has been consumed
- **Preserves conversation history** so you can compare, revisit, and go deeper
- **Supports Google sign-in** for a continuous personal experience
- **Speaks Hebrew natively** with full RTL interface

## Who Is It For

- Curious citizens who want to understand what the data says
- Journalists investigating public data
- Entrepreneurs exploring market opportunities
- Researchers working with Israeli datasets
- Anyone who prefers facts over gut feelings

## Example Questions

> How has the cost of living in my city changed over time?

> Where is there a gap between population growth and infrastructure?

> How do housing prices compare to salaries across different regions?

## Data Sources

| Source | Agent | Tools | API | Description |
|--------|-------|-------|-----|-------------|
| **data.gov.il** | `datagovAgent` | 16 | CKAN REST | Israeli open data portal -- datasets, organizations, resources, DataStore queries |
| **CBS (הלמ"ס)** | `cbsAgent` | 9 | REST | Central Bureau of Statistics -- time series, price indices, CPI, locality dictionary |
| **BudgetKey** | `budgetAgent` | 3 | MCP (hosted) | State budget 1997-2025, procurement contracts, tenders, support programs, entities, revenues |
| **GovMap** | `govmapAgent` | 11 | REST (GovMap) | Real estate (deals, trends, valuations) + nearby services, land parcels, tourism, area demographics |
| **Israel Drugs** | `drugsAgent` | 8 | REST | Pharmaceutical database -- drug search, generic alternatives, health basket, ATC categories |
| **IL Health** | `healthAgent` | 5 | REST | Ministry of Health dashboards -- HMO data, service quality, war casualties, child health |
| **Grocery Prices** | `groceryAgent` | 5 | REST/XML | Supermarket price transparency -- product search, cross-chain comparison, promotions |
| **Knesset** | `knessetAgent` | -- | OData | *(Planned)* Parliamentary data -- bills, committees, Knesset members |

**57 data tools** + **4 client tools** (charts, follow-up suggestions) = **61 total tools**

## Tool-First Architecture

The core principle: **if there's no real data, there's no answer.**

The routing agent delegates to specialized sub-agents, each with their own Zod-validated tools. Every response is grounded in verifiable data from official Israeli government APIs.

### Client Tools (4) — `routingAgent` (direct)

| Tool | Purpose |
|------|---------|
| `displayBarChart` | Render bar charts from data |
| `displayLineChart` | Render line charts from data |
| `displayPieChart` | Render pie charts from data |
| `suggestFollowUps` | Suggest follow-up questions |

## Agent Network

The system uses a **multi-agent network** where the routing agent delegates to specialized sub-agents. Each sub-agent runs autonomously with its own tools and memory thread, while the routing agent orchestrates the overall flow.

```
User Question (Hebrew)
        |
   Routing Agent (orchestrator)
   4 direct tools + 7 sub-agents
   Convex memory + vector search
        |
   +--------+--------+--------+--------+--------+--------+--------+
   |        |        |        |        |        |        |        |
 datagov  cbs    budget  govmap  drugs  health grocery  Client
 Agent    Agent  Agent   Agent  Agent  Agent   Agent    Tools
 16 tools 9 tools 3 tools 11 tools 8 tools 5 tools 5 tools charts+suggestions
   |        |      |        |       |       |       |
 CKAN    CBS    MCP     GovMap  MOH    MOH    XML
 API     API   endpoint  API    Drug   Dash   feeds
```

| Agent | Role |
|-------|------|
| **Routing Agent** | Orchestrator -- delegates to sub-agents, manages memory, creates charts |
| **DataGov Agent** | Israeli open data via CKAN API (data.gov.il) |
| **CBS Agent** | Central Bureau of Statistics (series, prices, localities) |
| **Budget Agent** | State budget data via BudgetKey MCP (1997-2025) |
| **GovMap Agent** | Geospatial data via GovMap (real estate, services, parcels, tourism, demographics) |
| **Drugs Agent** | Pharmaceutical database (Ministry of Health) |
| **Health Agent** | Public health dashboards (Ministry of Health) |
| **Grocery Agent** | Supermarket price transparency (XML feeds) |

Sub-agents store their tool call results in **separate Convex memory threads**, linked back to the routing agent via `subAgentThreadId`. On page reload, the API reconstructs sub-agent tool call data through a two-pass recall strategy, so the full chain-of-thought UI is preserved.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | **Next.js 16** (App Router + React Server Components) |
| UI | **React 19**, Tailwind CSS 4, Radix UI, Framer Motion |
| Agent Framework | **Mastra 1.1** with AI SDK v6 |
| Model Provider | **OpenRouter** (Google Gemini 3 Flash) |
| Validation | **Zod** (all tool inputs and outputs) |
| Memory & RAG | **Convex** (threads, vector search, dataset sync) |
| Charts | **Nivo** (bar, line, pie) |
| Auth | **Clerk** (Google sign-in) |
| Language | **TypeScript 5** (strict mode) |
| Full Hebrew RTL interface |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file with:

```env
OPENROUTER_API_KEY=          # OpenRouter API key
NEXT_PUBLIC_CONVEX_URL=      # Convex deployment URL
CONVEX_ADMIN_KEY=            # Convex admin key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=  # Clerk publishable key
CLERK_SECRET_KEY=            # Clerk secret key
```

### Development

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

## Contributing

This project is in its early stages. If you find a bug, an inaccurate answer, or have an idea for a feature or additional data source -- contributions and feedback are welcome.

## License

This project is private. All rights reserved.
