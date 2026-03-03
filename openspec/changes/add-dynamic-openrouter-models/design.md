## Context
The admin panel at `/admin` lets admins pick which OpenRouter model each agent uses. Today it renders a static 3-item list from `AgentConfig.AVAILABLE_MODELS`. We want to show all models available on OpenRouter.

## Goals / Non-Goals
- Goals:
  - Fetch model catalog from the public OpenRouter models API
  - Display the full model list in the admin panel model selectors
  - Gracefully fall back to the static list on failure
- Non-Goals:
  - Changing the chat selector (stays static/curated)
  - Persisting the model catalog in Convex
  - Adding a server-side proxy route

## Decisions
- **OpenRouter SDK** (`@openrouter/sdk`): Use the official SDK's `client.models.list()` for typed model listing. Instantiate the client without an API key (the models endpoint is public).
- **React Query** (`useQuery`): The project already uses TanStack Query (`context/QueryClientProvider.tsx`). The hook wraps `useQuery` with `queryKey: ['openrouter-models']` and `staleTime: 5 * 60 * 1000` (5 min).
- **`AvailableModel` transform**: The API returns rich model objects; we map to the existing `AvailableModel` shape (`id`, `name`, `provider`, `providerSlug`) so the admin UI code changes are minimal. Provider slug is derived from the model `id` (format: `provider/model-name`).
- **Filter to text models**: Only include models whose modalities support text input and text output.
- **No fallback / no placeholder**: While loading, show a loading skeleton. No static list fallback — if the API fails, show an error state with a retry option.

## Risks / Trade-offs
- OpenRouter API could be slow or unavailable → mitigated by error state with retry + React Query caching
- Model list could be very large (300+) → the `ModelSelectorInput` search already handles filtering; grouping by provider keeps it navigable

## Open Questions
- None
