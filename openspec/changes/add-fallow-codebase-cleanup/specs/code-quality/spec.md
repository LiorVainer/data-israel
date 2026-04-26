## ADDED Requirements

### Requirement: Fallow Codebase-Intelligence Gate

The project SHALL run Fallow as the canonical static analyzer for dead code, duplicate exports, unused dependencies, and code duplication. Fallow output SHALL be the source of truth when answering "is this used?" questions during code review or AI-assisted edits.

#### Scenario: Fallow CLI is invocable from project root

- **WHEN** a developer runs `npm run fallow` (or `npx fallow`) at the project root
- **THEN** Fallow SHALL execute the default analysis suite (dead-code + duplication + complexity) and exit with code 0 when no error-severity issues are found
- **AND** the same command SHALL exit with code 1 when error-severity issues are present, without aborting on warnings

#### Scenario: Agents consume structured Fallow output

- **WHEN** an AI agent runs `npx fallow dead-code --format json --quiet` (or the equivalent MCP tool call)
- **THEN** Fallow SHALL emit a single JSON document on stdout containing `total_issues`, the per-issue-type arrays (`unused_files`, `unused_exports`, `unused_dependencies`, `duplicate_exports`, etc.), and structured `actions` arrays per finding
- **AND** stderr SHALL be discarded by the agent invocation pattern (`2>/dev/null`) so progress messages do not corrupt the JSON

### Requirement: Fallow Ignore Pattern Policy

The project SHALL maintain a single `.fallowrc.json` at the repository root that excludes vendored components, framework-managed entry points, and test fixtures from Fallow's scope. The exclusion list SHALL be reviewed whenever a new vendored library or generated-code directory is added.

#### Scenario: Vendored UI libraries are excluded

- **WHEN** Fallow runs against the project
- **THEN** files under `src/components/ai-elements/**` and `src/components/ui/**` SHALL be excluded from `unused_files`, `unused_exports`, and `unused_types` reports
- **BECAUSE** these directories are vendored from external libraries and CLAUDE.md prohibits modification

#### Scenario: Framework and test artifacts are excluded

- **WHEN** Fallow runs against the project
- **THEN** files matching `public/**`, `convex/_generated/**`, `**/*.test.ts`, `**/*.spec.ts`, `**/*.typecheck.ts`, and `**/__tests__/**` SHALL be excluded from analysis
- **BECAUSE** these are static assets, generated code, or test fixtures with no static-analysis-visible callers

#### Scenario: New vendored library triggers a config update

- **WHEN** a new vendored or generated directory is added to the repository
- **THEN** the change proposal introducing it SHALL update `.fallowrc.json` `ignorePatterns` in the same PR
- **AND** the proposal description SHALL state the rationale (vendored, generated, runtime-loaded, etc.)

### Requirement: Single Canonical Export per Symbol

Every exported symbol in the project SHALL have exactly one canonical source file. Re-exports through barrel files are permitted, but the same symbol SHALL NOT be defined in two unrelated modules.

#### Scenario: Duplicate-export detection passes on `main`

- **WHEN** `npx fallow dead-code --format json --quiet --duplicate-exports` runs on the `main` branch
- **THEN** the `duplicate_exports` array SHALL be empty (length 0)

#### Scenario: Cross-module utility lives in a shared module

- **WHEN** a utility function is needed by two or more data sources or unrelated capabilities
- **THEN** it SHALL be placed in a shared module (e.g., `src/data-sources/_shared/`, `src/lib/utils/`, or `convex/_shared/`) and imported from there
- **AND** local redefinitions SHALL be replaced with imports during the change that introduces the shared module

### Requirement: Post-Feature Quality Check Sequence

After completing a feature or bug fix, the implementer (human or AI agent) SHALL run a deterministic quality-check sequence and resolve any reported issues before declaring the work done.

#### Scenario: Sequence is documented in CLAUDE.md

- **WHEN** a developer or AI agent reads `CLAUDE.md`
- **THEN** they SHALL find a "Post-Feature Quality Checks" section listing the ordered sequence: `npx eslint --fix .` → `tsc --noEmit` → `npx fallow dead-code` → resolve issues → report done

#### Scenario: AI agents run the sequence before reporting completion

- **WHEN** an AI agent finishes implementing a task
- **THEN** the agent SHALL run the quality-check sequence
- **AND** the agent SHALL NOT report the task complete until each command exits successfully (exit 0) or every reported issue has been triaged with a documented suppression or follow-up
