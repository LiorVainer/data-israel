# Design: Socratic Investigation Flow & Data Source Expansion

## Architecture Overview

```
User → Claim / Question
         ↓
┌─── Routing Agent (סוכן ניתוב) ──────────────────────────┐
│  Detects intent:                                          │
│  • Free-form data question → delegate to sub-agent        │
│  • Verifiable claim → offer investigation mode            │
│                                                           │
│  Sub-agents (delegated via agents: {}):                   │
│  ├── datagovAgent (existing, 16 tools)                    │
│  ├── cbsAgent (existing, 9 tools)                         │
│  ├── knessetAgent (NEW, ~8 tools)                         │
│  └── budgetAgent (NEW, ~6 tools)                          │
│                                                           │
│  Direct tools:                                            │
│  ├── displayBarChart, displayLineChart, displayPieChart   │
│  ├── suggestFollowUps                                     │
│  ├── suggestInvestigationLenses (NEW)                     │
│  └── generateShareableCard (NEW)                          │
└───────────────────────────────────────────────────────────┘
```

## 1. Knesset Agent Design

### Data Source: Knesset Open Data
- **Base URL**: `https://knesset.gov.il/Odata/ParliamentInfo.svc/` (OData protocol)
- **Alternative**: `https://oknesset.org/api/v2/` (Open Knesset — community project, REST API)
- **Recommended**: Use Open Knesset API first (simpler REST), fall back to official OData if needed

### Proposed Tools (~8)

| Tool | Description | API Endpoint |
|------|-------------|--------------|
| `searchLegislation` | Search bills by keyword, status, proposer | Bills endpoint |
| `getBillDetails` | Get full bill details including status history | Bill by ID |
| `searchVotes` | Search plenary votes by topic, date range | Votes endpoint |
| `getVoteDetails` | Get vote breakdown (for/against/abstain by party) | Vote by ID |
| `searchCommitteeProtocols` | Search committee meeting protocols | Protocols endpoint |
| `getMemberDetails` | Get MK details, roles, party affiliation | Members endpoint |
| `searchParliamentaryQuestions` | Search שאילתות by topic, MK, ministry | Questions endpoint |
| `generateKnessetSourceUrl` | Generate source URL for Knesset data | Local URL builder |

### Agent Prompt (Hebrew)
The Knesset agent will specialize in legislative data: bills, votes, committee activity, and parliamentary questions. It follows the same tool-first pattern as existing agents.

### Memory
Separate Convex thread per invocation (same pattern as datagovAgent/cbsAgent).

## 2. Budget Agent Design

### Data Source: Budget Key (מפתח התקציב)
- **Base URL**: `https://next.obudget.org/api/` (REST API)
- **Operator**: The Public Knowledge Workshop (הסדנא לידע ציבורי)
- **Open Source**: https://github.com/OpenBudget

### Proposed Tools (~6)

| Tool | Description | API Endpoint |
|------|-------------|--------------|
| `searchBudgetItems` | Search budget items by keyword, ministry, year | `/search/budget` |
| `getBudgetDetails` | Get budget item details (approved vs. actual) | `/get/budget/{code}` |
| `getBudgetHistory` | Get multi-year budget trend for an item | `/get/budget/{code}/history` |
| `searchSupportRequests` | Search government support/transfer requests | `/search/supports` |
| `searchProcurement` | Search government procurement/contracts | `/search/procurement` |
| `generateBudgetSourceUrl` | Generate source URL for Budget Key | Local URL builder |

### Agent Prompt (Hebrew)
The Budget agent specializes in government expenditure: budget allocation, execution rates, transfers, and procurement. It will contextualize numbers (e.g., "this is 2.3% of the total education budget").

## 3. Claim Investigation Flow Design

### Detection
The routing agent's system prompt is extended with claim-detection heuristics:
- Input contains a quote (within quotation marks)
- Input uses verifiable language ("האם נכון ש...", "טוען ש...", "לפי...")
- Input references a political figure or party
- Input asks about a specific policy outcome

When detected, the agent offers to enter investigation mode (opt-in).

### Investigation Steps (Socratic Method)

```
Step 1: Claim Parsing
  Agent extracts: subject, claim, implied metric, time frame
  Presents back to user for confirmation

Step 2: Lens Selection (עדשות)
  Agent suggests 3 analysis lenses relevant to the claim:
  e.g., for "הממשלה הגדילה את תקציב החינוך":
    🔍 עדשה תקציבית — בדיקת הקצאה מול ביצוע בפועל
    📊 עדשה סטטיסטית — השוואה היסטורית של ההוצאה
    📜 עדשה חקיקתית — החלטות ממשלה והצעות חוק רלוונטיות
  User selects 1-2 lenses (or suggests their own)

Step 3: Data Retrieval
  Agent delegates to relevant sub-agents based on selected lenses:
  - Budget lens → budgetAgent
  - Statistical lens → cbsAgent / datagovAgent
  - Legislative lens → knessetAgent
  Each returns raw data with source URLs

Step 4: Analysis Presentation
  Agent presents findings per lens WITHOUT editorial conclusion
  Highlights: key numbers, trends, contradictions, context
  All backed by source URLs

Step 5: User Conclusion
  Agent offers 2-3 possible interpretive directions
  User selects or writes their own "bottom line"
  This ensures the USER forms the opinion, not the AI

Step 6: Shareable Output (optional)
  Generate a shareable card with:
  - Original claim
  - Key data point(s)
  - User's conclusion
  - Source citations
  - Verification badge (all sources are official)
```

### New Tool: `suggestInvestigationLenses`
- **Type**: Client tool (rendered in UI as selectable cards)
- **Input**: `{ claim: string, lenses: Array<{ id: string, emoji: string, title: string, description: string }> }`
- **Output**: User selection (sent back via follow-up message)

### UI Changes
- Lens selection renders as clickable cards (similar to existing suggestion chips)
- Investigation progress shown as a step indicator
- "Generate shareable card" button appears at Step 5

## 4. Shareable Output Design

### Approach: Server-Side Rendering
Use `@vercel/og` (Satori) pattern to render HTML→PNG on the server:
- API route: `GET /api/og/investigation?data=<encoded>`
- Input: claim, key data point, conclusion, sources
- Output: 1200x630 PNG (social media optimized)

### Card Layout
```
┌──────────────────────────────────────────┐
│  🔍 בדיקת טענה                           │
│                                          │
│  "הממשלה הגדילה את תקציב החינוך ב-20%"   │
│                                          │
│  📊 נתון מרכזי:                           │
│  תקציב החינוך עלה ב-12.4% (2023-2025)    │
│  אך בניכוי אינפלציה: עלייה של 4.1%       │
│                                          │
│  מסקנה: הגידול נמוך מהנטען                │
│                                          │
│  מקורות: מפתח התקציב, למ"ס               │
│  ✅ מאומת ממקורות רשמיים                   │
│                                          │
│  סוכני המידע הציבורי                      │
└──────────────────────────────────────────┘
```

### Sharing
- Download as PNG
- Copy shareable link (leads to investigation thread if public sharing is enabled in future)
- No external image generation APIs needed

## Cross-Cutting Concerns

### Error Handling
- If a data source API is down, the agent explicitly tells the user which lens is unavailable
- Investigation can proceed with available lenses only
- Graceful degradation: if only 1 source works, the investigation still produces useful output

### Hebrew RTL
- All new tools produce Hebrew output (same pattern as existing tools)
- Shareable card is RTL-native
- Lens names and descriptions are in Hebrew

### Memory
- Investigation sessions stored as regular chat threads
- Sub-agent threads linked via `subAgentThreadId` (existing pattern)
- No new memory infrastructure needed

### Performance
- Target: <5s for each investigation step
- Parallel sub-agent delegation when lenses map to different agents
- Cache Knesset/Budget API responses (same Upstash Redis pattern)
