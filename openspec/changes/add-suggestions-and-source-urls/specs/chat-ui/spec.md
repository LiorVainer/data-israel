## ADDED Requirements

### Requirement: Follow-Up Suggestions Display
The chat UI SHALL render AI-generated follow-up suggestions after the last assistant message, using the `Suggestions` component.

Suggestions SHALL be extracted from the `suggestFollowUps` client tool output in the last assistant message's parts.

Suggestions SHALL only appear when:
- The chat is not currently streaming
- The last message is from the assistant
- The `suggestFollowUps` tool output is available with state `output-available` or `input-available`

Clicking a suggestion SHALL submit it as the next user message via `sendMessage`.

#### Scenario: Suggestions rendered after response completes
- **WHEN** the agent finishes responding and the message includes a `suggestFollowUps` tool part with suggestions ["חפש מאגרי מידע נוספים", "הצג בגרף"]
- **THEN** the Suggestions component renders below the conversation with those two suggestions as clickable buttons

#### Scenario: Suggestion click submits message
- **WHEN** the user clicks the suggestion "חפש מאגרי מידע נוספים"
- **THEN** the text "חפש מאגרי מידע נוספים" is submitted as a new user message
- **AND** the suggestions disappear as the new response streams

#### Scenario: Suggestions hidden during streaming
- **WHEN** the agent is currently streaming a response
- **THEN** no suggestions are displayed

### Requirement: Data Source URLs from Tool Results
The chat UI SHALL extract portal/API source URLs from `generateDataGovSourceUrl` and `generateCbsSourceUrl` tool results and display them using the `SourcesPart` component.

Source URLs SHALL be extracted from tool output when the tool state is `output-available` and the output contains `success: true`.

Extracted sources SHALL be merged with any existing `source-url` message parts and rendered together in the `SourcesPart` component at the end of each message.

#### Scenario: DataGov portal link displayed as source
- **WHEN** a message includes a `generateDataGovSourceUrl` tool part with output `{ url: "https://data.gov.il/dataset/orl-prices/resource/abc123", title: "מחירי אורל", success: true }`
- **THEN** the SourcesPart component renders a clickable link with title "מחירי אורל" pointing to the portal URL

#### Scenario: CBS source link displayed alongside other sources
- **WHEN** a message includes both a `source-url` message part and a `generateCbsSourceUrl` tool result
- **THEN** both sources are rendered together in the SourcesPart component

#### Scenario: Failed source URL tool does not render
- **WHEN** a `generateDataGovSourceUrl` tool part has output `{ success: false, error: "..." }`
- **THEN** no source link is rendered for that tool result

## MODIFIED Requirements

### Requirement: Suggestions Component Props
The `Suggestions` component SHALL accept an optional `suggestions` prop of type `string[]`.

When `suggestions` prop is provided, the component SHALL render those suggestions instead of the hardcoded `PROMPTS_EXAMPLES`.

When `suggestions` prop is not provided (landing page usage), the component SHALL continue rendering `PROMPTS_EXAMPLES` as before.

#### Scenario: Custom suggestions via props
- **WHEN** the Suggestions component receives `suggestions={["שאלה 1", "שאלה 2"]}`
- **THEN** it renders "שאלה 1" and "שאלה 2" as buttons

#### Scenario: Default suggestions on landing page
- **WHEN** the Suggestions component is rendered without a `suggestions` prop
- **THEN** it renders the hardcoded prompts from `PROMPTS_EXAMPLES`
