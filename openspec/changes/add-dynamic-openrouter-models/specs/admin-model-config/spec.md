## MODIFIED Requirements

### Requirement: Admin Model Configuration Panel
The system SHALL provide an admin panel at `/admin` that allows admins to view and change the model for each agent (routing, datagov, cbs). The panel SHALL fetch the available model list dynamically from the OpenRouter SDK (`client.models.list()`) via React Query. While loading, a loading skeleton SHALL be shown. On error, an error state with retry SHALL be shown. Non-admin users SHALL see an access denied message.

#### Scenario: Admin views panel with dynamic models
- **WHEN** an admin navigates to `/admin`
- **THEN** the model selectors display all text-capable models fetched from OpenRouter, grouped by provider

#### Scenario: Admin changes model
- **WHEN** an admin selects a new model for an agent and saves
- **THEN** the change is persisted to the Convex `ai_models` table

#### Scenario: Non-admin access denied
- **WHEN** a non-admin user navigates to `/admin`
- **THEN** an access denied message is displayed

#### Scenario: OpenRouter API unavailable
- **WHEN** the OpenRouter model list API fails or is unreachable
- **THEN** the admin panel shows an error message with a retry button

#### Scenario: Models loading state
- **WHEN** the admin panel is fetching models from the API
- **THEN** a loading skeleton is shown in place of the model selectors

## ADDED Requirements

### Requirement: OpenRouter Models React Hook
The system SHALL provide a `useOpenRouterModels()` hook that fetches the model list using the OpenRouter SDK (`client.models.list()`) via React Query, transforms results to `AvailableModel[]`, filters to text-capable models, and returns `{ models, isLoading, error }`. No static fallback SHALL be used.

#### Scenario: Successful fetch
- **WHEN** the hook is mounted and the API responds successfully
- **THEN** `models` contains the dynamic model list sorted by provider and name

#### Scenario: Loading state
- **WHEN** the API request is in flight
- **THEN** `isLoading` is `true` and `models` is an empty array

#### Scenario: API failure
- **WHEN** the API call fails
- **THEN** `models` is an empty array and `error` is set
