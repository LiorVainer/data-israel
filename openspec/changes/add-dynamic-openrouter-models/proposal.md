# Change: Add Dynamic OpenRouter Model Fetching for Admin Panel

## Why
The admin panel currently shows a static, hardcoded list of 3 models (`AgentConfig.AVAILABLE_MODELS`). Admins cannot discover or select from the 300+ models available on OpenRouter. Fetching the model catalog dynamically gives admins full flexibility without manual config updates.

## What Changes
- Install `@openrouter/sdk` and use `client.models.list()` to fetch available models
- Add a React Query hook (`useOpenRouterModels`) that calls the SDK client-side
- Update the admin panel to render the dynamic model list with a loading skeleton while fetching
- The chat selector keeps its current curated static list (unchanged)

## Impact
- Affected specs: `admin-model-config` (MODIFIED: Admin Model Configuration Panel requirement)
- Affected code:
  - `hooks/use-openrouter-models.ts` (new)
  - `app/admin/page.tsx` (updated)
  - `package.json` (new dependency: `@openrouter/sdk`)
