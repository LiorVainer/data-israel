# Tasks: Add Socratic Investigation Flow & Data Source Expansion

## Phase 1: Knesset Agent (Priority: High)

### 1.0 Knesset API Client & Tools
- [ ] 1.1 Research and document Knesset Open Data API endpoints (OData + Open Knesset REST)
- [ ] 1.2 Create `src/lib/api/knesset/` API client with typed responses
- [ ] 1.3 Create `src/lib/tools/knesset/` directory with tool definitions:
  - [ ] 1.3.1 `search-legislation.ts` — Search bills by keyword, status, proposer
  - [ ] 1.3.2 `get-bill-details.ts` — Get bill details with status history
  - [ ] 1.3.3 `search-votes.ts` — Search plenary votes by topic, date
  - [ ] 1.3.4 `get-vote-details.ts` — Vote breakdown by party (for/against/abstain)
  - [ ] 1.3.5 `search-committee-protocols.ts` — Committee meeting protocols
  - [ ] 1.3.6 `get-member-details.ts` — MK details, roles, party
  - [ ] 1.3.7 `search-parliamentary-questions.ts` — שאילתות by topic, MK, ministry
  - [ ] 1.3.8 `generate-source-url.ts` — Knesset source URL builder
- [ ] 1.4 Create `src/lib/tools/knesset/index.ts` barrel export
- [ ] 1.5 Add Hebrew tool translations to `src/constants/tool-translations.tsx`
- [ ] 1.6 Add tool→data source mappings to `src/constants/tool-data-sources.ts`

### 2.0 Knesset Sub-Agent
- [ ] 2.1 Create `src/agents/network/knesset/` directory
- [ ] 2.2 Create Knesset agent definition with Hebrew system prompt
- [ ] 2.3 Register knessetAgent in Mastra instance (`src/agents/mastra.ts`)
- [ ] 2.4 Add knessetAgent to routing agent's `agents: {}` delegation
- [ ] 2.5 Update routing agent prompt to know when to delegate to Knesset agent
- [ ] 2.6 Add agent display config to `src/constants/agents-display.ts`
- [ ] 2.7 Verify build + lint + vibecheck pass

## Phase 2: Budget Agent (Priority: High)

### 3.0 Budget Key API Client & Tools
- [ ] 3.1 Research and document Budget Key API endpoints (https://next.obudget.org/api/)
- [ ] 3.2 Create `src/lib/api/budget/` API client with typed responses
- [ ] 3.3 Create `src/lib/tools/budget/` directory with tool definitions:
  - [ ] 3.3.1 `search-budget-items.ts` — Search by keyword, ministry, year
  - [ ] 3.3.2 `get-budget-details.ts` — Budget item details (approved vs. actual)
  - [ ] 3.3.3 `get-budget-history.ts` — Multi-year budget trend
  - [ ] 3.3.4 `search-support-requests.ts` — Government support/transfers
  - [ ] 3.3.5 `search-procurement.ts` — Government contracts
  - [ ] 3.3.6 `generate-source-url.ts` — Budget Key source URL builder
- [ ] 3.4 Create `src/lib/tools/budget/index.ts` barrel export
- [ ] 3.5 Add Hebrew tool translations to `src/constants/tool-translations.tsx`
- [ ] 3.6 Add tool→data source mappings to `src/constants/tool-data-sources.ts`

### 4.0 Budget Sub-Agent
- [ ] 4.1 Create `src/agents/network/budget/` directory
- [ ] 4.2 Create Budget agent definition with Hebrew system prompt
- [ ] 4.3 Register budgetAgent in Mastra instance
- [ ] 4.4 Add budgetAgent to routing agent's `agents: {}` delegation
- [ ] 4.5 Update routing agent prompt for budget delegation
- [ ] 4.6 Add agent display config to `src/constants/agents-display.ts`
- [ ] 4.7 Verify build + lint + vibecheck pass

## Phase 3: Claim Investigation Flow (Priority: Medium)

### 5.0 Investigation Mode — Agent Side
- [ ] 5.1 Update routing agent system prompt with claim-detection heuristics
- [ ] 5.2 Create `suggestInvestigationLenses` client tool definition
- [ ] 5.3 Define lens types and Hebrew translations for common lens categories:
  - תקציבית (budgetary), סטטיסטית (statistical), חקיקתית (legislative), דמוגרפית (demographic)
- [ ] 5.4 Update routing agent to orchestrate multi-step investigation:
  - Claim parsing → lens suggestion → delegated data retrieval → analysis presentation → conclusion options
- [ ] 5.5 Add investigation-related prompts to `src/constants/prompts.ts`
- [ ] 5.6 Verify build + lint + vibecheck pass

### 6.0 Investigation Mode — UI Side
- [ ] 6.1 Create `LensSelectionCard` component for displaying lens options
- [ ] 6.2 Create `InvestigationProgress` component (step indicator)
- [ ] 6.3 Update `MessageItem` to render `suggestInvestigationLenses` tool results
- [ ] 6.4 Add investigation-related prompt cards to `EmptyConversation.tsx`
  - e.g., "בדוק טענה פוליטית", "חקור הצהרה של פוליטיקאי"
- [ ] 6.5 Verify build + lint + vibecheck pass

## Phase 4: Shareable Output (Priority: Low)

### 7.0 Shareable Investigation Cards
- [ ] 7.1 Create `generateShareableCard` client tool definition
- [ ] 7.2 Create `/api/og/investigation` route for server-side card rendering (Satori)
- [ ] 7.3 Design Hebrew RTL card template (1200x630, social-optimized)
- [ ] 7.4 Create `ShareableCardPreview` component in chat UI
- [ ] 7.5 Add download-as-PNG and copy-link actions
- [ ] 7.6 Verify build + lint + vibecheck pass

## Validation & Integration

### 8.0 End-to-End Testing
- [ ] 8.1 Test Knesset agent with real queries (legislation search, vote lookup)
- [ ] 8.2 Test Budget agent with real queries (ministry budget, procurement)
- [ ] 8.3 Test full investigation flow: claim → lenses → data → conclusion → card
- [ ] 8.4 Test cross-agent delegation (investigation using data from 3+ agents)
- [ ] 8.5 Verify source URLs are correct and clickable for all new agents
- [ ] 8.6 Final build + lint + vibecheck pass

## Notes

- **Parallelizable**: Phase 1 (Knesset) and Phase 2 (Budget) are independent and can be built in parallel
- **Dependencies**: Phase 3 depends on at least one of Phase 1/2 being complete (needs >2 agents for meaningful investigation). Phase 4 depends on Phase 3.
- **API Research**: Tasks 1.1 and 3.1 should be done first to validate API availability before committing to tool designs
