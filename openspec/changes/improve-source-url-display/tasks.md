## 1. Extend source type with metadata

- [x] 1.1 Extend source type in `components/chat/types.ts`

  `SourceUrlUIPart` may be from AI SDK. Check and extend locally:

  ```typescript
  import type { DataSource } from '@/constants/tool-data-sources';

  export type SourceUrlType = 'portal' | 'api';

  // Extend existing SourceUrlUIPart with provider metadata
  export interface EnrichedSourceUrl extends SourceUrlUIPart {
      dataSource?: DataSource;
      urlType: SourceUrlType;
  }
  ```

## 2. Update source-url-resolvers to return URL type

- [x] 2.1 Add `urlType` to `ToolSource` in `lib/tools/source-url-resolvers.ts`

  ```typescript
  export interface ToolSource {
      url: string;
      title: string;
      urlType: SourceUrlType; // import from types.ts
  }
  ```

  Update each switch case — `portalUrl` → `'portal'`, `apiUrl` → `'api'`:
  - `getDatasetDetails`: `urlType: 'portal'`
  - `getOrganizationDetails`: `urlType: 'portal'`
  - `getResourceDetails`: `urlType: portalUrl ? 'portal' : 'api'`
  - `queryDatastoreResource`: `urlType: 'api'`
  - `getCbsSeriesData/ByPath`: `urlType: 'api'`
  - `getCbsPriceData`: `urlType: 'api'`
  - `calculateCbsPriceIndex`: `urlType: 'api'`

## 3. Populate metadata during source collection

- [x] 3.1 Update `MessageItem.tsx` to produce `EnrichedSourceUrl[]` instead of `SourceUrlUIPart[]`

  For each source push, add `dataSource` and `urlType`:

  **Dedicated source tools** (~line 112-125):
  ```typescript
  dataSource: getToolDataSource(toolName),
  urlType: 'portal' as const,  // dedicated source tools generate portal URLs
  ```

  **Auto-resolved direct tools** (~line 130-145):
  ```typescript
  dataSource: getToolDataSource(toolName),
  urlType: resolved.urlType,
  ```

  **Sub-agent data-tool-agent** (~line 148-162):
  ```typescript
  const agentDs = AgentsDisplayMap[part.data.id]?.dataSource;
  dataSource: agentDs ?? getToolDataSource(toolResult.toolName),
  urlType: resolved.urlType,
  ```

  **Native source-url parts** (~line 109): default to `urlType: 'portal'`, `dataSource: undefined`.

  Imports needed: `getToolDataSource` from `@/constants/tool-data-sources`, `AgentsDisplayMap` from `@/constants/agents-display`.

## 4. Redesign SourcesPart using existing ai-elements

> Reuse existing `Sources`, `SourcesTrigger`, `SourcesContent` from `@/components/ai-elements/sources` (already built on shadcn Collapsible with animations).
> Split the flat chip list into provider-grouped sections inside the same wrapper.

- [x] 4.1 Update `components/chat/SourcesPart.tsx` props to accept `EnrichedSourceUrl[]`

- [x] 4.2 Group sources by `dataSource` and `urlType`

  ```typescript
  const grouped = useMemo(() => {
      const groups: Record<DataSource | 'other', { portal: EnrichedSourceUrl[]; api: EnrichedSourceUrl[] }> = {
          datagov: { portal: [], api: [] },
          cbs: { portal: [], api: [] },
          other: { portal: [], api: [] },
      };
      for (const s of sources) {
          const key = s.dataSource && s.dataSource in groups ? s.dataSource : 'other';
          groups[key][s.urlType].push(s);
      }
      return groups;
  }, [sources]);
  ```

- [x] 4.3 Update trigger to show provider breakdown

  ```tsx
  // "המידע הגיע מ-12 מקורות: למ"ס 7 · data.gov.il 5"
  <SourcesTrigger count={sources.length}>
      <span className='font-medium'>
          המידע הגיע מ-{sources.length} מקורות
          {providerSummary && `: ${providerSummary}`}
      </span>
      <ChevronDownIcon className='h-4 w-4' />
  </SourcesTrigger>
  ```

  Where `providerSummary` joins non-empty groups: `"למ"ס 7 · data.gov.il 5"`.

- [x] 4.4 Render provider sections inside `SourcesContent`

  For each non-empty provider group, render:
  - **Section header**: Provider name badge using `DATA_SOURCE_CONFIG[key].className` and `nameLabel` — styled as a colored right-border accent strip (RTL)
  - **Portal links** (if any): Full-width rows with `GlobeIcon` (lucide) + title + external link icon. Use provider color for subtle text/border tint
  - **API links**: If provider has only API links, show them directly (like CBS). If provider has BOTH portal + API, nest API links under a small "קישורים טכניים (N)" collapsible toggle within the section
  - Each link is an `<a>` with `target="_blank"` and `rel="noreferrer"`

  Use existing `Sources` Collapsible for the outer expand/collapse. For API links sub-toggle within a group, use a simple local state toggle or nested `Collapsible`.

  **Styling approach:**
  - Provider section: `border-r-2` (RTL right-border) using provider CSS var color
  - Portal chips: `bg-[provider-color]/10 text-[provider-color] border border-[provider-color]/20`
  - API chips: `bg-muted/50 text-muted-foreground` — subtler than portal
  - Icons: `GlobeIcon` (lucide) for portal, `CodeIcon` or `TerminalIcon` for API

## 5. Verification

- [ ] 5.1 Run `tsc`, `npm run build`
- [ ] 5.2 Test CBS query — sources grouped under orange section with API links
- [ ] 5.3 Test DataGov query — sources with portal links shown first, API links in sub-toggle
- [ ] 5.4 Test mixed query — both provider sections, trigger shows breakdown
- [ ] 5.5 Verify RTL layout, collapsible animations, link targets
