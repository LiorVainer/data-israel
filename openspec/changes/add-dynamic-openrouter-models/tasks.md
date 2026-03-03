## 1. Setup
- [x] 1.1 Install `@openrouter/sdk` dependency via pnpm

## 2. Client Hook
- [x] 2.1 Create `hooks/use-openrouter-models.ts`
- [x] 2.2 Initialize OpenRouter SDK client (no API key — models endpoint is public)
- [x] 2.3 Use React Query `useQuery` with `queryKey: ['openrouter-models']` and `staleTime: 5 * 60 * 1000`
- [x] 2.4 Call `client.models.list()` and transform response to `AvailableModel[]`
- [x] 2.5 Filter to text-capable models (input/output modalities include "text")
- [x] 2.6 Sort by provider name then model name
- [x] 2.7 Return `{ models, isLoading, error }` — no fallback to static list

## 3. Admin Panel Integration
- [x] 3.1 Update `app/admin/page.tsx` to use `useOpenRouterModels()` instead of static list
- [x] 3.2 Show loading skeleton while models are fetching (no placeholder data)
- [x] 3.3 Show error state with retry button if fetch fails
- [x] 3.4 Derive providers dynamically from fetched models
- [x] 3.5 Ensure selected model display works for any model ID (from Convex records)

## 4. Verification
- [x] 4.1 Run `tsc` — no type errors
- [x] 4.2 Run `npm run build` — build succeeds
- [x] 4.3 Run `npm run lint` — no lint errors
- [x] 4.4 Run `npm run vibecheck` — code quality check
