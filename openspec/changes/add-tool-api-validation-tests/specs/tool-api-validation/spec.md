# tool-api-validation Specification

## Purpose

Ensure every data source tool's `execute()` output conforms to its declared Zod `outputSchema` when called against real external APIs. Catches schema drift before it reaches production.

## ADDED Requirements

### Requirement: Live API Output Validation

Each data source with external API tools SHALL have an `{source}-api-validation.test.ts` file that calls every tool's `execute()` with minimal valid inputs and validates the result against the tool's `outputSchema`.

#### Scenario: Successful API response matches output schema

- **WHEN** a tool's `execute()` is called with valid minimal inputs against the real external API
- **THEN** the result SHALL pass `outputSchema.safeParse()` with `success: true`
- **AND** the result SHALL contain `success: true` or `success: false` (valid discriminated union branch)

#### Scenario: API error still produces valid schema output

- **WHEN** a tool's `execute()` encounters an API error (4xx, 5xx, timeout)
- **THEN** the result SHALL still pass `outputSchema.safeParse()` with `success: true`
- **AND** the result SHALL contain `{ success: false, error: string }`

#### Scenario: All tools in a data source are covered

- **WHEN** the test file is written for a data source
- **THEN** it SHALL include at least one test case per tool exported in the source's `tools/index.ts`
- **AND** no tool SHALL be silently skipped without an explicit `it.skip()` with reason

### Requirement: Test Isolation from Default Suite

API validation tests SHALL NOT run as part of the default `vitest run` command. They are on-demand only.

#### Scenario: Default test run excludes API validation

- **WHEN** `vitest run` is executed without flags
- **THEN** no `*-api-validation.test.ts` file SHALL be executed

#### Scenario: On-demand execution via path pattern

- **WHEN** `vitest run --testPathPattern api-validation` is executed
- **THEN** all `*-api-validation.test.ts` files SHALL be discovered and run

#### Scenario: Individual data source execution

- **WHEN** `vitest run src/data-sources/health/__tests__/health-api-validation.test.ts` is executed
- **THEN** only the Health API validation tests SHALL run

### Requirement: Test Timeouts and Sequential Execution

API validation tests SHALL use appropriate timeouts and avoid overwhelming external APIs.

#### Scenario: Individual test timeout

- **WHEN** a tool's API call is slow
- **THEN** each test SHALL have a 30-second timeout to accommodate slow APIs

#### Scenario: No parallel API calls within a source

- **WHEN** tests within a single data source file run
- **THEN** they SHALL execute sequentially (no concurrent API requests to the same host)

### Requirement: Minimal Valid Inputs

Each test SHALL use the smallest valid input that triggers a real API call and returns data.

#### Scenario: Input uses known-good parameters

- **WHEN** constructing test inputs for a tool
- **THEN** the test SHALL use well-known, stable parameters (e.g., Knesset number 25, drug name "אקמול", city "תל אביב")
- **AND** include `searchedResourceName` as required by `commonToolInput`

#### Scenario: Input avoids expensive queries

- **WHEN** a tool supports pagination or result limits
- **THEN** the test SHALL use small limits (e.g., `maxResults: 5`, `limit: 3`) to minimize API load

### Requirement: Budget Data Source Exclusion

The Budget data source SHALL NOT have API validation tests because its tools are dynamically loaded from an MCP endpoint at runtime.

#### Scenario: No budget API validation file

- **WHEN** the test suite is scanned
- **THEN** there SHALL be no `budget-api-validation.test.ts` file

### Requirement: Documentation for Future Data Sources

The "Adding a New Data Source" guides SHALL be updated to include API validation tests as a required step.

#### Scenario: CLAUDE.md includes API validation step

- **WHEN** a developer reads `src/data-sources/CLAUDE.md`
- **THEN** it SHALL include a step (after contract tests) documenting the `{source}-api-validation.test.ts` pattern
- **AND** specify that one test file is needed per sub-API folder (e.g., `health/tools/drugs/`, `health/tools/overview-data/`) or per general API folder

#### Scenario: add-data-source skill includes API validation

- **WHEN** the `/add-data-source` skill is invoked
- **THEN** `.claude/skills/add-data-source/SKILL.md` SHALL include API validation tests in its verification steps
- **AND** include them in the subfolder pattern section for multi-layer data sources

