# Capability: Claim Investigation Flow

## Purpose
Enable a Socratic investigation mode where users can systematically verify political claims or statements using data from multiple official sources, guided by analysis "lenses" (עדשות) that structure the investigation.

## ADDED Requirements

### Requirement: Claim Detection
The routing agent SHALL detect verifiable claims and offer investigation mode.

#### Scenario: User inputs a political claim in quotes
- **Given** a user submits a message containing a quoted statement (e.g., "הממשלה הגדילה את תקציב החינוך ב-20%")
- **When** the routing agent processes the message
- **Then** the agent recognizes this as a verifiable claim and offers to enter investigation mode

#### Scenario: User inputs a statement with verification language
- **Given** a user asks "האם נכון ש..." or "האם הטענה ש... מדויקת?"
- **When** the routing agent processes the message
- **Then** the agent offers investigation mode

#### Scenario: User declines investigation mode
- **Given** the agent offers investigation mode
- **When** the user declines (e.g., "לא, רק תענה לי")
- **Then** the agent answers the question in free-form mode as usual

### Requirement: Lens Suggestion
The agent SHALL suggest relevant analysis lenses for the claim.

#### Scenario: Suggest lenses for a budget claim
- **Given** a claim about government spending
- **When** the agent enters investigation mode
- **Then** it suggests 3 lenses such as: budgetary (תקציבית), statistical (סטטיסטית), legislative (חקיקתית) — each with emoji, title, and 1-line description in Hebrew

#### Scenario: User selects lenses
- **Given** the agent presents lens options via `suggestInvestigationLenses` tool
- **When** the user selects 1-2 lenses
- **Then** the agent proceeds with data retrieval for the selected lenses

#### Scenario: User suggests a custom lens
- **Given** the agent presents lens options
- **When** the user suggests a different angle (e.g., "תבדוק גם מבחינה דמוגרפית")
- **Then** the agent adds the custom lens and proceeds

### Requirement: Guided Data Retrieval
The agent SHALL retrieve data from relevant sub-agents based on selected lenses.

#### Scenario: Multi-agent data retrieval
- **Given** the user selected a budgetary lens and a legislative lens
- **When** the agent executes the investigation
- **Then** it delegates to `budgetAgent` for budget data AND `knessetAgent` for legislative data, presenting results per lens

#### Scenario: Lens-to-agent mapping
- **Given** a lens is selected
- **When** the agent determines which sub-agent to use
- **Then** it maps: budgetary → budgetAgent, statistical → cbsAgent/datagovAgent, legislative → knessetAgent, demographic → cbsAgent

#### Scenario: Partial data availability
- **Given** one sub-agent's API is unavailable
- **When** data retrieval fails for one lens
- **Then** the agent reports the unavailability and continues with available lenses

### Requirement: Analysis Without Editorial Conclusion
The agent SHALL present findings without imposing a conclusion.

#### Scenario: Present raw findings per lens
- **Given** data has been retrieved for all selected lenses
- **When** the agent presents analysis
- **Then** it shows: key numbers, trends, source context — all backed by source URLs — WITHOUT stating a definitive editorial conclusion

#### Scenario: Offer conclusion directions
- **Given** findings have been presented
- **When** the agent reaches the conclusion step
- **Then** it offers 2-3 possible interpretive directions (e.g., "הנתונים מראים גידול בפועל, אך נמוך מהנטען" / "הגידול תלוי בשיטת החישוב")

#### Scenario: User formulates their own conclusion
- **Given** the agent offered conclusion directions
- **When** the user selects one or writes their own
- **Then** the agent acknowledges the user's conclusion and optionally offers to generate a shareable card

### Requirement: Investigation Client Tool
The `suggestInvestigationLenses` tool SHALL render as interactive UI.

#### Scenario: Lens tool renders as cards
- **Given** the agent calls `suggestInvestigationLenses`
- **When** the tool result is rendered in the chat UI
- **Then** it displays as selectable cards with emoji, title, and description — similar to suggestion chips

#### Scenario: Lens selection sends follow-up message
- **Given** the user clicks a lens card
- **When** the selection is made
- **Then** a follow-up message is sent to the chat (e.g., "בחרתי: עדשה תקציבית ועדשה חקיקתית")

## Related Capabilities
- `knesset-agent` — Serves the legislative lens
- `budget-agent` — Serves the budgetary lens
- `agent-tools` — cbsAgent serves statistical/demographic lenses
- `shareable-output` — Generates visual output from investigation results
