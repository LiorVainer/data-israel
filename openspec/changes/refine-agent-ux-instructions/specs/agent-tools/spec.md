## MODIFIED Requirements

### Requirement: Agent System Instructions
The agent SHALL use natural language instructions that emphasize user-friendly output and hide technical implementation details.

#### Scenario: Natural language dataset descriptions
- **WHEN** the agent finds a dataset
- **THEN** it SHALL describe the dataset using its title and description
- **AND** it SHALL NOT expose dataset IDs or technical identifiers to users

#### Scenario: Hide resource identifiers
- **WHEN** the agent references a resource
- **THEN** it SHALL use descriptive names (e.g., "נתוני 2020" instead of "data2020.csv")
- **AND** it SHALL NOT show resource IDs, filenames, or UUIDs

#### Scenario: Conversational data presentation
- **WHEN** the agent presents data to users
- **THEN** it SHALL format output in natural language or markdown tables
- **AND** it SHALL NOT show raw JSON or technical structures
- **AND** it SHALL offer actionable next steps

#### Scenario: Tool selection for metadata queries
- **WHEN** user asks "what datasets exist" or "tell me about this dataset"
- **THEN** the agent SHALL use `getDatasetDetails` tool
- **AND** explain this is for exploring dataset metadata and structure

#### Scenario: Tool selection for data queries
- **WHEN** user asks "show me the data" or "filter by city" or "how many records"
- **THEN** the agent SHALL use `queryDatastoreResource` tool
- **AND** retrieve actual data rows from the resource

#### Scenario: Hebrew conversational tone
- **WHEN** responding in Hebrew
- **THEN** the agent SHALL use natural, friendly Hebrew
- **AND** avoid transliterated technical terms (e.g., say "מאגר מידע" not "דאטה-סט")
- **AND** present information as a helpful assistant, not a technical system

## ADDED Requirements

### Requirement: Tool Selection Decision Logic
The agent SHALL follow clear decision logic for choosing between tools based on user intent.

#### Scenario: Metadata exploration with getDatasetDetails
- **WHEN** user query implies exploration without specific data needs
- **THEN** use `getDatasetDetails` to show what the dataset contains
- **EXAMPLE** queries: "מה יש במאגר הזה", "ספר לי על המאגר", "מה המידע הזמין"

#### Scenario: Data retrieval with queryDatastoreResource
- **WHEN** user query requests specific data, filtering, or analysis
- **THEN** use `queryDatastoreResource` to fetch actual records
- **EXAMPLE** queries: "תראה לי את הנתונים", "סנן לפי ירושלים", "כמה רשומות יש"

#### Scenario: Chain tools when needed
- **WHEN** user asks for data but doesn't specify which dataset
- **THEN** first use `searchDatasets`, then `getDatasetDetails` to identify resources, then `queryDatastoreResource` to fetch data
- **AND** explain the process naturally: "מחפש מאגרים רלוונטיים... מצאתי מאגר אחד... מביא את הנתונים..."

### Requirement: Output Formatting Guidelines
The agent SHALL format all outputs for end-user readability, not technical accuracy.

#### Scenario: Dataset discovery results
- **WHEN** presenting search results
- **THEN** show dataset titles and brief descriptions
- **AND** omit organization details unless asked
- **AND** omit technical metadata (IDs, created dates, formats)

#### Scenario: Data table presentation
- **WHEN** presenting query results from queryDatastoreResource
- **THEN** format as markdown tables with Hebrew headers
- **AND** limit to 10-20 rows unless user requests more
- **AND** summarize: "מציג 10 מתוך 150 רשומות" with option to see more

#### Scenario: Suggest next actions
- **WHEN** completing any task
- **THEN** suggest 2-3 natural next steps the user might want
- **EXAMPLE**: "רוצה שאסנן לפי עיר מסוימת? או שאציג סטטיסטיקות?"

## REMOVED Requirements
None - this change only refines existing agent behavior without removing capabilities.
