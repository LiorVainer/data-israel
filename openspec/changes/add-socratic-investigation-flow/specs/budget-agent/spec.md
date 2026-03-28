# Capability: Budget Agent

## Purpose
Provide a dedicated sub-agent for querying Israeli government budget data via the Budget Key (מפתח התקציב) open-source platform, including expenditure breakdown, budget execution rates, and government procurement.

## ADDED Requirements

### Requirement: Budget Key API Client
The system SHALL provide a typed API client for the Budget Key API (next.obudget.org).

#### Scenario: Search budget items by keyword
- **Given** a user asks about a specific government expenditure area
- **When** the budgetAgent delegates to `searchBudgetItems`
- **Then** the tool queries the Budget Key API and returns matching budget items with code, title, approved amount, and executed amount

#### Scenario: API error handling
- **Given** the Budget Key API returns an error or is unreachable
- **When** any Budget tool is invoked
- **Then** the tool returns a structured error message in Hebrew

### Requirement: Budget Exploration Tools
The Budget agent SHALL have tools for exploring government expenditure data.

#### Scenario: Get budget item details
- **Given** a user wants to understand a specific budget line
- **When** `getBudgetDetails` is called with a budget code
- **Then** the full budget item is returned: title, hierarchy (ministry → division → item), approved amount, revised amount, executed amount, execution rate percentage

#### Scenario: Get multi-year budget history
- **Given** a user wants to see how a budget item changed over time
- **When** `getBudgetHistory` is called with a budget code
- **Then** a yearly series is returned with approved and executed amounts, enabling trend analysis

#### Scenario: Search government procurement
- **Given** a user asks about government contracts or tenders
- **When** `searchProcurement` is called with keyword, optional ministry, optional year
- **Then** matching procurement records are returned with: description, supplier, amount, ministry, date

#### Scenario: Search government support requests
- **Given** a user asks about government transfers or subsidies
- **When** `searchSupportRequests` is called with keyword filters
- **Then** matching support records are returned with: recipient, amount, purpose, ministry

### Requirement: Budget Source URLs
Every budget data result SHALL link to the official Budget Key page.

#### Scenario: Generate Budget Key source URL
- **Given** a budget item was retrieved from the API
- **When** `generateBudgetSourceUrl` resolves the tool result
- **Then** a valid URL to the item on next.obudget.org is produced

### Requirement: Budget Agent Registration
The Budget agent SHALL integrate into the existing agent network.

#### Scenario: Routing agent delegates to Budget agent
- **Given** a user asks about government spending, budgets, or procurement
- **When** the routing agent processes the message
- **Then** it delegates to `budgetAgent` via the `agents: {}` mechanism

#### Scenario: Budget agent contextualizes numbers
- **Given** the Budget agent retrieves budget amounts
- **When** it presents results to the user
- **Then** it provides context: percentage of parent budget, year-over-year change, and inflation-adjusted values when relevant

## Related Capabilities
- `agent-tools` — Follows the same Zod-validated tool pattern
- `knesset-agent` — Sibling agent, same delegation pattern
- `claim-investigation-flow` — Budget agent serves the "budgetary lens"
