<div align="center">

<img src="public/data-israel-readme.svg" alt="Data Israel" width="200" />

# Data Israel - Israeli Public Data AI Agent

### Ask questions in Hebrew. Get answers backed by real data.

[data-israel.org](https://data-israel.org)

</div>

---

Israel has a massive amount of open data: CBS statistics, price indices, population, housing, transportation, education, budgets, and more. The problem? The data exists, but it's not truly accessible.

**Data Israel** is an AI agent that connects in real-time to [data.gov.il](https://data.gov.il) and the Central Bureau of Statistics (CBS), letting anyone ask questions in Hebrew and receive answers grounded in official data -- with context, tables, and charts.

No manual searching, no CSVs, and no need to know what a DataStore API is.

## Why Use It

This is not "just another AI chat". The agent:

- **Connects live** to data.gov.il and CBS APIs -- every answer comes from real API calls, not hallucination
- **Cross-references sources** to produce insights, not just raw numbers
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

## Tool-First Architecture

The core principle: **if there's no real data, there's no answer.**

The agent uses **29 Zod-validated tools** across three categories to ensure every response is grounded in verifiable data:

### data.gov.il Tools (16)

| Tool | Purpose |
|------|---------|
| `searchDatasets` | Keyword search across all datasets |
| `listAllDatasets` | Browse the full dataset catalog |
| `getDatasetDetails` | Inspect a specific dataset's metadata |
| `getDatasetActivity` | View recent changes to a dataset |
| `getDatasetSchema` | Get field-level schema of a dataset |
| `listOrganizations` | Browse publishing organizations |
| `getOrganizationDetails` | Details of a specific organization |
| `getOrganizationActivity` | Recent activity of an organization |
| `listGroups` | Explore dataset categories |
| `listTags` | Browse dataset taxonomy |
| `searchResources` | Find specific data resources |
| `getResourceDetails` | Inspect a resource's metadata |
| `queryDatastoreResource` | Query data with filters, sorting, pagination |
| `getStatus` | Check API health |
| `listLicenses` | Available data licenses |
| `generateDataGovSourceUrl` | Generate source attribution links |

### CBS Tools (9)

| Tool | Purpose |
|------|---------|
| `browseCbsCatalog` | Navigate the CBS statistical catalog |
| `browseCbsCatalogPath` | Drill into a specific catalog path |
| `getCbsSeriesData` | Fetch statistical time series |
| `getCbsSeriesDataByPath` | Fetch series by catalog path |
| `browseCbsPriceIndices` | Browse CPI and price index categories |
| `getCbsPriceData` | Fetch price index data |
| `calculateCbsPriceIndex` | Calculate CPI-based cost changes |
| `searchCbsLocalities` | Search the CBS locality dictionary |
| `generateCbsSourceUrl` | Generate CBS source attribution links |

### Client Tools (4)

| Tool | Purpose |
|------|---------|
| `displayBarChart` | Render bar charts from data |
| `displayLineChart` | Render line charts from data |
| `displayPieChart` | Render pie charts from data |
| `suggestFollowUps` | Suggest follow-up questions |

## Agent Network

The system uses a multi-agent network with a routing orchestrator:

```
User Question (Hebrew)
        |
   Routing Agent (orchestrator)
   29 tools, Convex memory + vector search
        |
   +---------+---------+
   |         |         |
DataGov   CBS     Client
 Agent    Agent    Tools
   |         |
 CKAN API  CBS API
```

| Agent | Role |
|-------|------|
| **Routing Agent** | Orchestrator -- routes queries, manages memory, calls tools |
| **DataGov Agent** | Israeli open data via CKAN API (data.gov.il) |
| **CBS Agent** | Central Bureau of Statistics (series, prices, localities) |

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
