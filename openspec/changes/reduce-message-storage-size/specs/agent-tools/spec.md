## ADDED Requirements

### Requirement: Tool Result Size Limits
The system SHALL enforce size limits on tool results at multiple layers to prevent message storage overflow and UI rendering crashes.

#### Scenario: Sub-agent tool results truncated before memory save
- **WHEN** a sub-agent finishes execution and its messages are about to be saved to memory
- **THEN** a `TruncateToolResultsProcessor` (outputProcessor) SHALL truncate `records` arrays to 3 items, `series[].observations` to 5 items, and `items` arrays to 10 items
- **AND** truncated results SHALL include `_truncated: true` and original count metadata
- **AND** the LLM SHALL have already consumed the full data during streaming (truncation is storage-only)

#### Scenario: Sub-agent tool results truncated in UI enrichment (safety net)
- **WHEN** the GET /api/chat route reconstructs sub-agent data via `enrichWithSubAgentData`
- **THEN** tool result data arrays SHALL be truncated using the same limits as the processor
- **AND** this serves as defense-in-depth for messages stored before the processor was added

#### Scenario: Chart data point limits
- **WHEN** the routing agent calls displayBarChart
- **THEN** the `data` array SHALL accept at most 30 items
- **WHEN** the routing agent calls displayLineChart
- **THEN** the `data` array SHALL accept at most 50 series entries
- **WHEN** the routing agent calls displayPieChart
- **THEN** the `data` array SHALL accept at most 15 slices

#### Scenario: Query field metadata limits
- **WHEN** queryDatastoreResource returns field metadata
- **THEN** the `fields` array SHALL be capped at 30 entries
