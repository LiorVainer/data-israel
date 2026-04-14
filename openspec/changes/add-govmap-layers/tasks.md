# Tasks: Add GovMap Map Layers

## Phase 1: API Client Layer

- [x] 1.1 Add `Origin` header to shared `govmapInstance` in `govmap.client.ts`
- [x] 1.2 Add layers-catalog endpoint paths to `govmap.endpoints.ts` (entitiesByPoint, layer metadata)
- [x] 1.3 Add new layer ID constants to `govmap.constants.ts` (SERVICE_LAYERS, PARCEL_LAYERS, TOURISM_LAYERS, CONTEXT_LAYERS)
- [x] 1.4 Create `api/layers/layers.types.ts` — request/response types (EntitiesByPointRequest, LayerEntity, LayerResult, CleanEntity)
- [x] 1.5 Create `api/layers/layers.endpoints.ts` — URL builder for layers-catalog paths
- [x] 1.6 Create `api/layers/layers.constants.ts` — layer group arrays and field mapping configs
- [x] 1.7 Create `api/layers/layers.client.ts` — `queryEntitiesByPoint()` and `getLayerMetadata()` using shared `govmapRequest`
- [x] 1.8 Add entity cleaning helper — strip WKT geom, flatten visible fields to `Record<string, string>`, extract primary name/address fields

## Phase 2: Tool Implementation

- [x] 2.1 Create `tools/layers/find-nearby-services.tool.ts` — queries 7 service layers, groups by type, sorts by distance
- [x] 2.2 Create `tools/layers/get-parcel-info.tool.ts` — queries parcel/block/neighborhood layers, extracts gush/helka/area
- [x] 2.3 Create `tools/layers/find-nearby-tourism.tool.ts` — queries 6 tourism layers, groups by type, sorts by distance
- [x] 2.4 Create `tools/layers/get-location-context.tool.ts` — queries neighborhood + statistical area, returns area profile
- [x] 2.5 Create `tools/layers/index.ts` — aggregate LayersTools + layersSourceConfigs
- [x] 2.6 Update `tools/index.ts` — spread `LayersTools` into `GovmapTools`, merge source configs

## Phase 3: Agent & UI Integration

- [x] 3.1 Add Hebrew translations for 4 new tools in `govmap.translations.tsx`
- [x] 3.2 Update govmap agent instructions in `govmap.agent.ts` — add layers section with tool descriptions and usage guidance
- [x] 3.3 Update `routingHint` in `index.ts` to cover layers capabilities (services, parcels, tourism, location context)

## Phase 4: Testing & Verification

- [x] 4.1 Update contract tests in `govmap-data-source.test.ts` — verify new tools in GovmapTools, translations, source configs
- [x] 4.2 Create `govmap-layers-api-validation.test.ts` — one test per tool hitting live API with small limits
- [x] 4.3 Run `tsc --noEmit` — zero errors
- [x] 4.4 Run `npm run build` — succeeds
- [ ] 4.5 Manual verification — start dev server, test all 4 tools via chat interface

## Additional Improvements

- [x] Update `buildGovmapPortalUrl` to support multiple layers via `string | readonly string[]` parameter
- [x] All 4 tools pass relevant layer IDs to portal URL for proper map visualization
- [x] Extract `z.infer` types to named type aliases (ParcelInfo, NeighborhoodInfo, etc.)
- [x] Export named output schemas from all tool files for API validation tests
