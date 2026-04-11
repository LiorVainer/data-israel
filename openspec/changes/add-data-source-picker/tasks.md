## 1. Registry: Export picker data
- [x] 1.1 Add `ALL_DATA_SOURCE_IDS` constant to `registry.ts` (derived from `DATA_SOURCE_METAS.map(ds => ds.id)`)
- [x] 1.2 Add `getDataSourcePickerItems()` to `registry.ts` — returns `{ id, label, icon, logo, category, categoryOrder }[]`

## 2. Backend: Filter sub-agents by enabled sources
- [x] 2.1 Add `enabledSources?: DataSourceId[]` param to `getMastraWithModels` in `mastra.ts`
- [x] 2.2 Filter `dataSourceAgents` entries when `enabledSources` is provided
- [x] 2.3 Include sorted `enabledSources` in cache key

## 3. API Route: Accept and forward source filter
- [x] 3.1 Read `enabledSources` from request body in `POST /api/chat`
- [x] 3.2 Validate values against `ALL_DATA_SOURCE_IDS`
- [x] 3.3 Pass validated array to `getMastraWithModels`

## 4. DataSourcePicker component
- [x] 4.1 Create `src/components/chat/DataSourcePicker.tsx` using shadcn `Popover` + `Command`
- [x] 4.2 Trigger: pill button with `DatabaseIcon` + label ("בחר מקורות מידע" / "X מקורות מידע נבחרו")
- [x] 4.3 Popover: `CommandInput` search + `CommandGroup` per `DATA_SOURCES_CATEGORIES`
- [x] 4.4 Items: source logo (img with icon fallback) + Hebrew label + `CheckIcon` when selected
- [x] 4.5 Toggle logic: click toggles source; if last source deselected → re-enable all
- [x] 4.6 RTL support, disabled state while streaming

## 5. Integration: Wire picker into chat flow
- [x] 5.1 Add `enabledSources` state to `ChatThread` (default: all source IDs)
- [x] 5.2 Pass `enabledSources` + toggle handler to `InputSection`
- [x] 5.3 Add `PromptInputFooter` to `InputSection` with `DataSourcePicker` trigger + submit button
- [x] 5.4 Include `enabledSources` in transport body via `prepareSendMessagesRequest` (omit when all selected)

## 6. Verification
- [x] 6.1 `tsc` passes
- [x] 6.2 `npm run lint` passes (0 errors, warnings are pre-existing)

## 7. Rename (additional)
- [x] 7.1 Rename `LANDING_CATEGORIES` → `DATA_SOURCES_CATEGORIES` in `display.types.ts`
- [x] 7.2 Rename `LandingCategory` → `DataSourceCategory` in `display.types.ts`
- [x] 7.3 Update re-exports in `types/index.ts`
- [x] 7.4 Update `SourcesSection.tsx`
- [x] 7.5 Update `EmptyConversation.tsx`
