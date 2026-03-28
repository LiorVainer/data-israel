# Capability: Knesset Agent

## Purpose
Provide a dedicated sub-agent for querying Israeli Knesset Open Data, including legislation, votes, parliamentary questions, and committee protocols.

## ADDED Requirements

### Requirement: Knesset API Client
The system SHALL provide a typed API client for Knesset Open Data endpoints.

#### Scenario: Search legislation by keyword
- **Given** a user asks about a specific law or bill
- **When** the knessetAgent delegates to `searchLegislation`
- **Then** the tool queries the Knesset API with the keyword and returns matching bills with title, status, and proposer

#### Scenario: API error handling
- **Given** the Knesset API returns an error or is unreachable
- **When** any Knesset tool is invoked
- **Then** the tool returns a structured error message in Hebrew and the agent informs the user

### Requirement: Knesset Legislation Tools
The Knesset agent SHALL have tools for searching and inspecting bills.

#### Scenario: Search bills with filters
- **Given** a user wants to find bills about a topic
- **When** `searchLegislation` is called with keyword, optional status filter, and optional proposer
- **Then** matching bills are returned with: title, status (proposed/committee/approved/rejected), proposer name, date

#### Scenario: Get bill details
- **Given** a user wants details about a specific bill
- **When** `getBillDetails` is called with a bill ID
- **Then** the full bill record is returned including: title, full text summary, status history, committee assignments, vote results if applicable

### Requirement: Knesset Vote Tools
The Knesset agent SHALL have tools for querying plenary votes.

#### Scenario: Search votes by topic
- **Given** a user asks how the Knesset voted on a topic
- **When** `searchVotes` is called with a keyword and optional date range
- **Then** matching votes are returned with: topic, date, result (passed/failed), vote counts

#### Scenario: Get vote breakdown by party
- **Given** a user wants to know how each party voted
- **When** `getVoteDetails` is called with a vote ID
- **Then** the vote breakdown is returned: per-party for/against/abstain/absent counts

### Requirement: Knesset Member & Committee Tools
The Knesset agent SHALL support member lookups and committee protocol search.

#### Scenario: Get MK details
- **Given** a user asks about a specific Knesset member
- **When** `getMemberDetails` is called with a member name or ID
- **Then** the member's details are returned: full name, party, roles, committee memberships

#### Scenario: Search parliamentary questions
- **Given** a user asks about parliamentary questions (שאילתות) on a topic
- **When** `searchParliamentaryQuestions` is called with keyword, optional MK, optional ministry
- **Then** matching questions are returned with: question text, asking MK, target ministry, answer status

### Requirement: Knesset Source URLs
Every Knesset data result SHALL be linkable to the official source.

#### Scenario: Generate source URL for bill
- **Given** a bill was retrieved from the Knesset API
- **When** `generateKnessetSourceUrl` resolves the tool result
- **Then** a valid URL to the bill on knesset.gov.il is produced

### Requirement: Knesset Agent Registration
The Knesset agent SHALL integrate into the existing agent network.

#### Scenario: Routing agent delegates to Knesset agent
- **Given** a user asks a question about legislation, votes, or parliamentary activity
- **When** the routing agent processes the message
- **Then** it delegates to `knessetAgent` via the `agents: {}` mechanism

#### Scenario: Knesset agent uses separate memory thread
- **Given** the knessetAgent is invoked by the routing agent
- **When** it processes and responds
- **Then** its tool calls and results are stored in a separate Convex thread linked via `subAgentThreadId`

## Related Capabilities
- `agent-tools` — Follows the same Zod-validated tool pattern
- `budget-agent` — Sibling agent, same delegation pattern
- `claim-investigation-flow` — Knesset agent serves the "legislative lens"
