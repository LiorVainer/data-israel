# Design: Merge Drugs and Health into Unified Health Data Source

## Architecture Overview

### Current Structure (Two Separate Data Sources)
```
src/data-sources/
├── drugs/
│   ├── api/
│   │   ├── drugs.client.ts          # Axios POST client → israeldrugs.health.gov.il
│   │   ├── drugs.endpoints.ts       # Base URLs, 9 POST paths
│   │   └── drugs.types.ts           # Drug request/response interfaces
│   ├── tools/
│   │   ├── search-drug-by-name.tool.ts
│   │   ├── search-drug-by-symptom.tool.ts
│   │   ├── explore-generic-alternatives.tool.ts
│   │   ├── explore-therapeutic-categories.tool.ts
│   │   ├── browse-symptoms.tool.ts
│   │   ├── get-drug-details.tool.ts
│   │   ├── suggest-drug-names.tool.ts
│   │   ├── generate-source-url.tool.ts
│   │   └── index.ts                 # DrugsTools (8 tools)
│   ├── drugs.agent.ts               # drugsAgent factory
│   ├── drugs.display.ts
│   ├── drugs.translations.tsx
│   └── index.ts
│
├── health/
│   ├── api/
│   │   ├── health.client.ts         # Two Axios GET clients → datadashboard.health.gov.il
│   │   ├── health.endpoints.ts      # Base URLs, subjects enum, path builders
│   │   └── health.types.ts          # Dashboard response interfaces
│   ├── tools/
│   │   ├── get-available-subjects.tool.ts
│   │   ├── get-health-metadata.tool.ts
│   │   ├── get-health-data.tool.ts
│   │   ├── get-health-links.tool.ts
│   │   ├── generate-source-url.tool.ts
│   │   └── index.ts                 # HealthTools (5 tools)
│   ├── health.agent.ts              # healthAgent factory
│   ├── health.display.ts
│   ├── health.translations.tsx
│   └── index.ts
```

### Target Structure (Unified with Domain Subfolders)
```
src/data-sources/health/
├── api/
│   ├── drugs/
│   │   ├── drugs.client.ts          # Unchanged — POST client
│   │   ├── drugs.endpoints.ts       # Unchanged — 9 POST paths
│   │   └── drugs.types.ts           # Unchanged — drug interfaces
│   └── overview-data/
│       ├── overview-data.client.ts        # Renamed from health.client.ts
│       ├── overview-data.endpoints.ts     # Renamed from health.endpoints.ts
│       └── overview-data.types.ts         # Renamed from health.types.ts
├── tools/
│   ├── drugs/
│   │   ├── search-drug-by-name.tool.ts      # Unchanged tool ID
│   │   ├── search-drug-by-symptom.tool.ts   # Unchanged
│   │   ├── explore-generic-alternatives.tool.ts
│   │   ├── explore-therapeutic-categories.tool.ts
│   │   ├── browse-symptoms.tool.ts
│   │   ├── get-drug-details.tool.ts
│   │   ├── suggest-drug-names.tool.ts
│   │   ├── generate-source-url.tool.ts
│   │   └── index.ts                 # DrugsTools (8 tools) + resolvers
│   ├── overview-data/
│   │   ├── get-available-subjects.tool.ts
│   │   ├── get-health-metadata.tool.ts
│   │   ├── get-health-data.tool.ts
│   │   ├── get-health-links.tool.ts
│   │   ├── generate-source-url.tool.ts
│   │   └── index.ts                 # GeneralTools (5 tools) + resolvers
│   └── index.ts                     # HealthTools = { ...DrugsTools, ...GeneralTools }
├── health.agent.ts                  # Unified healthAgent (13 tools)
├── health.display.ts                # Single display config
├── health.translations.tsx          # Merged translations (13 entries)
└── index.ts                         # HealthDataSource definition
```

## Key Design Decisions

### 1. Domain Subfolder Naming: `drugs/` + `overview-data/`
The drugs domain keeps its name since it maps to a distinct API (`israeldrugs.health.gov.il`). The overview-data health data domain is named `overview-data/` — it covers the health data dashboard (`datadashboard.health.gov.il`) and can host future overview-data health tools. This follows the govmap pattern where `nadlan/` is a layer within `govmap/`.

### 2. Tool ID Stability
All 13 tool IDs remain unchanged. This is critical for:
- Persisted conversation data in Convex (tool call references)
- Source URL resolution (tool name → resolver mapping)
- Translation lookups (tool name → Hebrew name + icon)

| Domain | Tool ID | Unchanged |
|--------|---------|-----------|
| drugs | `searchDrugByName` | yes |
| drugs | `searchDrugBySymptom` | yes |
| drugs | `exploreGenericAlternatives` | yes |
| drugs | `exploreTherapeuticCategories` | yes |
| drugs | `browseSymptoms` | yes |
| drugs | `getDrugDetails` | yes |
| drugs | `suggestDrugNames` | yes |
| drugs | `generateDrugsSourceUrl` | yes |
| overview-data | `getAvailableSubjects` | yes |
| overview-data | `getHealthMetadata` | yes |
| overview-data | `getHealthData` | yes |
| overview-data | `getHealthLinks` | yes |
| overview-data | `generateHealthSourceUrl` | yes |

### 3. Agent Merger Strategy
The unified `healthAgent` instructions will have:
- **Shared section**: Purpose, output formatting, guidelines
- **Drugs section**: Drug search strategy (name → symptom → ATC → generic)
- **General section**: Subject discovery strategy (subjects → metadata → data)
- **Routing hints**: Combined description covering both drugs and dashboard

### 4. Data Source ID: Keep `'health'`, Remove `'drugs'`
- `'health'` remains as the canonical ID
- `'drugs'` is removed from the `DataSource` type union
- Backwards compat: tool-to-source mapping for drug tools points to `'health'`
- Badge styling: single badge for all health tools

### 5. Display & Landing Merge
Single landing card: "משרד הבריאות" with combined stats:
- Tools: 13 (8 drugs + 5 overview-data)
- Domains: תרופות + בריאות ציבורית
- Icon: `HeartPulseIcon` (health umbrella)

### 6. API Client Independence
The two API clients stay completely independent — different base URLs, different request methods (POST vs GET), different response shapes. No shared HTTP helper is needed. They just live under the same data source umbrella.

## Data Source ID Cascade

| Location | Before | After |
|----------|--------|-------|
| `display.types.ts` DataSource union | `'drugs' \| 'health'` | `'health'` |
| `registry.ts` DATA_SOURCE_METAS | 2 entries (drugs + health) | 1 entry (health) |
| `registry.server.ts` imports | drugsAgent + healthAgent | healthAgent |
| `agent.config.ts` / `model.ts` | drugs + health switch cases | health only |
| `globals.css` badge vars | `--badge-drugs*` + `--badge-health*` | `--badge-health*` only |
| Routing agent hints | 2 separate hints | 1 combined hint |

## Future Domain Addition Pattern
To add a new health domain (e.g., mental health, vaccinations):
1. Create `api/mental-health/` with client, endpoints, types
2. Create `tools/mental-health/` with tool files + index.ts
3. Spread `MentalHealthTools` into `tools/index.ts`
4. Add translations to `health.translations.tsx`
5. Extend agent instructions with mental health section
