## 1. Setup

- [x] 1.1 Install dependencies
  ```bash
  npm install @mastra/core @mastra/ai-sdk @mastra/memory @mastra/libsql
  ```

- [x] 1.2 Verify Node.js version >= 22.13.0 (`node -v`). Mastra requires it.

- [x] 1.3 Run `tsc` to confirm no type conflicts from new packages.

- [x] 1.4 Add `mastra.db` to `.gitignore`
  ```
  # Mastra local database
  mastra.db
  ```

---

## 2. Create Agent Network Files

### File structure

```
agents/network/
├── index.ts                          # barrel re-export
├── model.ts                          # shared model ID factory
├── datagov/
│   ├── index.ts                      # re-exports from data-gov.agent.ts
│   ├── data-gov.agent.ts             # DataGov agent definition
│   └── config.ts                     # DataGov instructions
├── cbs/
│   ├── index.ts                      # re-exports from cbs.agent.ts
│   ├── cbs.agent.ts                  # CBS agent definition
│   └── config.ts                     # CBS instructions
├── visualization/
│   ├── index.ts                      # re-exports from visualization.agent.ts
│   ├── visualization.agent.ts        # Visualization agent definition
│   └── config.ts                     # Visualization instructions
└── orchestrator/
    ├── index.ts                      # re-exports from routing.agent.ts
    ├── routing.agent.ts              # Routing agent definition
    └── config.ts                     # Orchestrator instructions
```

---

### 2.1 Create `agents/network/model.ts`

Shared model ID factory. Mastra uses `"openrouter/{provider}/{model}"` string format natively — no AI SDK provider wrapper needed. Reads from `AgentConfig.MODEL.DEFAULT_ID`.

```typescript
import { AgentConfig } from '../agent.config';

export const getModelId = (): string => {
    return `openrouter/${AgentConfig.MODEL.DEFAULT_ID}`;
};
```

- [x] 2.1 Done

---

### 2.2 Create `agents/network/datagov/config.ts`

Exports `DATAGOV_AGENT_CONFIG` with `name` and `instructions` (Hebrew). Instructions extracted from the DataGov-relevant parts of the current monolithic `agentInstructions` in `data-agent.ts`.

```typescript
export const DATAGOV_AGENT_CONFIG = {
    name: 'סוכן נתוני data.gov.il',
    instructions: `אתה סוכן מומחה לחיפוש וחקירת מאגרי נתונים פתוחים מאתר data.gov.il.
...
=== זרימת עבודה ===
1. חפש מאגרים רלוונטיים
2. בדוק פרטי המאגרים
3. שאל את הנתונים בפועל (DataStore)
4. סכם והצע המשך
...
=== כללי תצוגה ===
- הגבל ל-10-20 שורות וציין כמה יש בסך הכל
- כשמציג ממספר מאגרים - צור סיכום עם סטטיסטיקות
...`,
};
```

Key sections to include in instructions:
- Purpose: data.gov.il CKAN expert
- Workflow: search → details → query DataStore → summarize
- Display rules: row limits, statistics summaries
- Hide technical details (IDs, filenames)
- Hebrew response style

- [x] 2.2 Done

---

### 2.3 Create `agents/network/datagov/data-gov.agent.ts`

Mastra `Agent` with all 15 DataGov tools imported from `@/lib/tools`. The `description` field is critical — Mastra's routing agent uses it to decide delegation.

```typescript
import { Agent } from '@mastra/core/agent';
import {
    searchDatasets, listAllDatasets, getDatasetDetails, getDatasetActivity,
    getDatasetSchema, listOrganizations, getOrganizationDetails,
    getOrganizationActivity, listGroups, listTags, searchResources,
    getResourceDetails, queryDatastoreResource, getStatus, listLicenses,
} from '@/lib/tools';
import { getModelId } from '../model';
import { DATAGOV_AGENT_CONFIG } from './config';

export const datagovAgent = new Agent({
    id: 'datagov-agent',
    name: DATAGOV_AGENT_CONFIG.name,
    description: 'Searches and explores Israeli open datasets from data.gov.il — datasets, organizations, groups, tags, resources, and DataStore queries.',
    instructions: DATAGOV_AGENT_CONFIG.instructions,
    model: getModelId(),
    tools: {
        searchDatasets, listAllDatasets, getDatasetDetails, getDatasetActivity,
        getDatasetSchema, listOrganizations, getOrganizationDetails,
        getOrganizationActivity, listGroups, listTags, searchResources,
        getResourceDetails, queryDatastoreResource, getStatus, listLicenses,
    },
});
```

- [x] 2.3 Done

---

### 2.4 Create `agents/network/datagov/index.ts`

Re-export barrel for the datagov folder.

```typescript
export { datagovAgent } from './data-gov.agent';
```

- [x] 2.4 Done

---

### 2.5 Create `agents/network/cbs/config.ts`

Exports `CBS_AGENT_CONFIG` with `name` and `instructions` (Hebrew). Covers all 3 CBS sub-domains: statistical series, price indices, and locality dictionary.

```typescript
export const CBS_AGENT_CONFIG = {
    name: 'סוכן הלמ"ס',
    instructions: `אתה סוכן מומחה לנתוני הלשכה המרכזית לסטטיסטיקה (למ"ס/CBS).
...
=== יכולות ===
- סדרות סטטיסטיות: אוכלוסייה, כלכלה, חינוך (browseCbsCatalog, getCbsSeriesData)
- מדדי מחירים: מדד המחירים לצרכן, מחשבון הצמדה (browseCbsPriceIndices, getCbsPriceData, calculateCbsPriceIndex)
- מילון יישובים: חיפוש מידע על יישובים (searchCbsLocalities)
...
=== כללי תצוגה ===
- הצג נתונים בטבלאות מסודרות
- השתמש בתוויות בעברית
...`,
};
```

Key sections:
- Three sub-domains explained (series, price, dictionary)
- Tool-to-task mapping so the agent knows which tool to pick
- Hebrew display conventions

- [x] 2.5 Done

---

### 2.6 Create `agents/network/cbs/cbs.agent.ts`

Unified CBS agent with all 6 CBS tools (series + price + dictionary combined).

```typescript
import { Agent } from '@mastra/core/agent';
import {
    browseCbsCatalog, getCbsSeriesData,
    browseCbsPriceIndices, getCbsPriceData, calculateCbsPriceIndex,
    searchCbsLocalities,
} from '@/lib/tools';
import { getModelId } from '../model';
import { CBS_AGENT_CONFIG } from './config';

export const cbsAgent = new Agent({
    id: 'cbs-agent',
    name: CBS_AGENT_CONFIG.name,
    description: 'Queries Israeli Central Bureau of Statistics (CBS) — statistical series, price indices, CPI calculations, and locality dictionary.',
    instructions: CBS_AGENT_CONFIG.instructions,
    model: getModelId(),
    tools: {
        browseCbsCatalog, getCbsSeriesData,
        browseCbsPriceIndices, getCbsPriceData, calculateCbsPriceIndex,
        searchCbsLocalities,
    },
});
```

- [x] 2.6 Done

---

### 2.7 Create `agents/network/cbs/index.ts`

Re-export barrel for the cbs folder.

```typescript
export { cbsAgent } from './cbs.agent';
```

- [x] 2.7 Done

---

### 2.8 Create `agents/network/visualization/config.ts`

Exports `VISUALIZATION_AGENT_CONFIG` with chart-specific instructions.

```typescript
export const VISUALIZATION_AGENT_CONFIG = {
    name: 'סוכן תרשימים',
    instructions: `אתה סוכן מומחה ליצירת תרשימים והמחשות נתונים.
...
=== כללים ===
- השתמש בתוויות בעברית בתרשימים
- הגבל תרשימים ל-20 פריטים לקריאות טובה
- בחר סוג תרשים מתאים: עמודות להשוואה, קו למגמות, עוגה לחלוקה
...`,
};
```

Key sections:
- Chart type selection guidance (bar for comparison, line for trends, pie for distribution)
- Hebrew label requirement
- 20-item limit for readability
- Data formatting expectations

- [x] 2.8 Done

---

### 2.9 Create `agents/network/visualization/visualization.agent.ts`

Visualization agent with 3 chart tools.

```typescript
import { Agent } from '@mastra/core/agent';
import { displayBarChart, displayLineChart, displayPieChart } from '@/lib/tools';
import { getModelId } from '../model';
import { VISUALIZATION_AGENT_CONFIG } from './config';

export const visualizationAgent = new Agent({
    id: 'visualization-agent',
    name: VISUALIZATION_AGENT_CONFIG.name,
    description: 'Creates data visualizations — bar charts, line charts, and pie/donut charts from provided data.',
    instructions: VISUALIZATION_AGENT_CONFIG.instructions,
    model: getModelId(),
    tools: { displayBarChart, displayLineChart, displayPieChart },
});
```

- [x] 2.9 Done

---

### 2.10 Create `agents/network/visualization/index.ts`

Re-export barrel for the visualization folder.

```typescript
export { visualizationAgent } from './visualization.agent';
```

- [x] 2.10 Done

---

### 2.11 Create `agents/network/orchestrator/config.ts`

Exports `ORCHESTRATOR_CONFIG`. The routing agent does NOT have tools — it delegates. Instructions tell it how to route and when to combine agents.

```typescript
export const ORCHESTRATOR_CONFIG = {
    name: 'סוכן ניתוב',
    instructions: `אתה סוכן ניתוב שמנהל רשת של סוכנים מומחים לנתונים ישראליים.

=== מטרתך ===
לנתב את שאלות המשתמש לסוכן המתאים ביותר ולהחזיר תשובה מאוחדת.

=== סוכנים זמינים ===
- datagovAgent: מאגרי נתונים פתוחים מ-data.gov.il (חיפוש, פרטים, שאילתות DataStore)
- cbsAgent: נתוני הלמ"ס — סדרות סטטיסטיות, מדדי מחירים, מילון יישובים
- visualizationAgent: יצירת תרשימים (עמודות, קו, עוגה)

=== כללי ניתוב ===
- שאלות על מאגרי נתונים, ארגונים, קבוצות, תגיות → datagovAgent
- שאלות על סטטיסטיקה, מדדים, מחירים, יישובים, למ"ס → cbsAgent
- בקשות לתרשימים → visualizationAgent (בדרך כלל אחרי שליפת נתונים)
- שאלות מעורבות → שלב סוכנים לפי הצורך

=== סגנון ===
דבר בעברית, בגוף ראשון, בצורה ידידותית ומעודדת.
הסתר פרטים טכניים מהמשתמש.
תמיד הצע למשתמש מה לעשות הלאה.`,
};
```

Key sections:
- Available agents list with descriptions (so the LLM knows what each does)
- Routing rules mapping query types → agents
- Response style (Hebrew, friendly, hide technical details)
- Completion guidance (suggest next steps)

- [x] 2.11 Done

---

### 2.12 Create `agents/network/orchestrator/routing.agent.ts`

Routing agent with sub-agents and memory. Memory is **required** for `.network()` execution in Mastra.

```typescript
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';
import { getModelId } from '../model';
import { datagovAgent } from '../datagov';
import { cbsAgent } from '../cbs';
import { visualizationAgent } from '../visualization';
import { ORCHESTRATOR_CONFIG } from './config';

export const routingAgent = new Agent({
    id: 'routing-agent',
    name: ORCHESTRATOR_CONFIG.name,
    instructions: ORCHESTRATOR_CONFIG.instructions,
    model: getModelId(),
    agents: { datagovAgent, cbsAgent, visualizationAgent },
    memory: new Memory({
        storage: new LibSQLStore({
            id: 'mastra-storage',
            url: 'file:./mastra.db',
        }),
    }),
});
```

- [x] 2.12 Done

---

### 2.13 Create `agents/network/orchestrator/index.ts`

Re-export barrel for the orchestrator folder.

```typescript
export { routingAgent } from './routing.agent';
```

- [x] 2.13 Done

---

### 2.14 Create `agents/network/index.ts`

Top-level barrel re-export from each sub-folder's `index.ts`.

```typescript
export { routingAgent } from './orchestrator';
export { datagovAgent } from './datagov';
export { cbsAgent } from './cbs';
export { visualizationAgent } from './visualization';
export { getModelId } from './model';
```

- [x] 2.14 Done

---

## 3. Create Mastra Instance

### 3.1 Create `agents/mastra.ts`

Register all agents in a `Mastra` instance. This is the central entry point used by the API route.

```typescript
import { Mastra } from '@mastra/core';
import { routingAgent, datagovAgent, cbsAgent, visualizationAgent } from './network';

export const mastra = new Mastra({
    agents: { routingAgent, datagovAgent, cbsAgent, visualizationAgent },
});
```

- [x] 3.1 Done

---

## 4. Modify API Route

### 4.1 Update `app/api/chat/route.ts`

Replace entire file. Remove `createAgentUIStreamResponse`, `createDataAgent`, `AgentConfig` model validation. Use `handleChatStream` + `createUIMessageStreamResponse`.

**Before** (current):
```typescript
import { createAgentUIStreamResponse } from 'ai';
import { createDataAgent } from '@/agents/data-agent';
import { AgentConfig } from '@/agents/agent.config';

export async function POST(request: Request) {
    const { messages, model } = await request.json();
    const validModelIds = AgentConfig.AVAILABLE_MODELS.map((m) => m.id);
    const selectedModel = model && validModelIds.includes(model) ? model : AgentConfig.MODEL.DEFAULT_ID;
    const agent = createDataAgent(selectedModel);
    return createAgentUIStreamResponse({ agent, uiMessages: messages, sendReasoning: true, sendSources: true });
}
```

**After**:
```typescript
import { handleChatStream } from '@mastra/ai-sdk';
import { createUIMessageStreamResponse } from 'ai';
import { mastra } from '@/agents/mastra';

export async function POST(req: Request) {
    const params = await req.json();
    const stream = await handleChatStream({
        mastra,
        agentId: 'routing-agent',
        params,
    });
    return createUIMessageStreamResponse({ stream });
}
```

- [x] 4.1 Done

---

## 5. Modify Frontend

### 5.1 Update `app/page.tsx`

Two changes:
1. Add `DefaultChatTransport` to `useChat` hook
2. Remove `body: { model: modelRef.current }` from `sendMessage` calls

**Change 1** — `useChat` initialization:
```typescript
// Before
const { messages, sendMessage, status, regenerate, stop } = useChat<DataAgentUIMessage>({});

// After
import { DefaultChatTransport } from 'ai';

const { messages, sendMessage, status, regenerate, stop } = useChat<DataAgentUIMessage>({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
});
```

**Change 2** — `sendMessage` calls (2 occurrences):
```typescript
// Before
void sendMessage({ text: prompt }, { body: { model: modelRef.current } });

// After
void sendMessage({ text: prompt });
```

The `modelRef` state, `useEffect` sync, and `selectedModel` state can remain for now (model selector UI stays but has no backend effect).

- [x] 5.1 Done

---

## 6. Simplify Existing Files

### 6.1 Simplify `agents/agent.config.ts`

Remove `COMPLETION_MARKERS` (Mastra handles completion via LLM reasoning) and `TOOL_CALLS` (no custom stop condition needed). Keep `MODEL`, `AVAILABLE_MODELS`, `DISPLAY`, and `AvailableModel` type.

**Remove these two blocks**:
```typescript
// DELETE:
TOOL_CALLS: {
    MIN_STEPS_BEFORE_STOP: 0,
    MAX_STEPS: 25,
},

// DELETE:
COMPLETION_MARKERS: ['סיכום:', 'מצאתי את כל הנתונים', ...],
```

**Keep**:
- `AvailableModel` interface
- `MODEL.DEFAULT_ID`
- `AVAILABLE_MODELS` array
- `DISPLAY` limits

- [x] 6.1 Done

---

### 6.2 Deprecate `agents/data-agent.ts`

Replace entire file. Re-export `routingAgent` for backward compatibility. Update `DataAgentUIMessage` to use `UIMessage` from `ai` (since `InferAgentUIMessage` won't work with Mastra agents).

**After**:
```typescript
/**
 * @deprecated Use agents from '@/agents/network' directly.
 * This file exists for backward compatibility.
 */
import type { UIMessage } from 'ai';

export { routingAgent as dataAgent } from './network';

/** Message type for UI components */
export type DataAgentUIMessage = UIMessage;
```

- [x] 6.2 Done

---

## 7. Verification

- [x] 7.1 Run `tsc` — no type errors
- [x] 7.2 Run `npm run build` — production build succeeds
- [x] 7.3 Run `npm run lint` — no linting issues
- [x] 7.4 Run `npm run vibecheck` — code quality check passes
- [ ] 7.5 Manual browser testing:
  - DataGov: "חפש מאגרים על תחבורה"
  - CBS series: "הצג סדרות סטטיסטיות על אוכלוסייה"
  - CBS prices: "מה מדד המחירים לצרכן?"
  - CBS dictionary: "חפש מידע על תל אביב"
  - Visualization: "הצג תרשים" (after data fetched)
  - Multi-domain: "חפש נתוני תחבורה והצג בתרשים"
- [ ] 7.6 Verify streaming works end-to-end (messages appear progressively)
- [ ] 7.7 Verify tool calls render correctly in `MessageToolCalls.tsx`
