# Implementation Tasks

## 1. Agent Instruction Refinement
- [x] 1.1 Rewrite agent system prompt to emphasize natural language output
- [x] 1.2 Add explicit rules to hide technical identifiers (IDs, filenames)
- [x] 1.3 Add clear tool selection guidance (getDatasetDetails vs queryDatastoreResource)
- [x] 1.4 Add output formatting guidelines (tables, summaries, conversational style)
- [x] 1.5 Add examples of good vs bad responses in Hebrew

## 2. Tool Selection Guidelines
- [x] 2.1 Document when to use getDatasetDetails (metadata exploration)
- [x] 2.2 Document when to use queryDatastoreResource (actual data retrieval)
- [x] 2.3 Add decision tree logic to instructions

## 3. Output Formatting Rules
- [x] 3.1 Add rule: Never show dataset IDs to users
- [x] 3.2 Add rule: Never show resource IDs to users
- [x] 3.3 Add rule: Replace filenames with descriptive names
- [x] 3.4 Add rule: Use natural language for data presentation
- [x] 3.5 Add rule: Offer next steps to users

## 4. Testing & Validation
- [x] 4.1 Test with sample queries to verify technical details are hidden
- [x] 4.2 Verify agent chooses correct tool based on query type
- [x] 4.3 Verify conversational tone in responses
- [ ] 4.4 Test in Hebrew to ensure natural language flow (requires manual testing)

## 5. Documentation
- [x] 5.1 Update CLAUDE.md with agent UX philosophy
- [x] 5.2 Mark tasks as complete
