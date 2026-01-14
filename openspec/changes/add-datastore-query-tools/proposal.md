# Change: Add Datastore Query Tools

## Why
The agent currently can only search dataset **metadata** (titles, descriptions, organizations) but cannot query the actual **data within resources**. Users need to explore and filter resource data (tables, CSV files) to answer specific questions about the datasets' contents.

## What Changes
- Add new `queryDatastoreResource` tool for querying tabular data within a resource
- Support pagination (limit, offset) for large datasets
- Support column filtering for precise data queries
- Enable sorting by column values
- Maintain Zod validation and TypeScript type safety
- Integrate with existing CKAN API client

## Impact
- Affected specs: `agent-tools`
- Affected code:
  - `lib/tools/` - New tool implementation
  - `lib/api/data-gov/client.ts` - New API method
  - `agents/data-agent.ts` - Register new tool
  - `app/api/agent/route.ts` - Tool availability in chat

This change enables the agent to answer questions like:
- "Show me the first 10 rows of this resource"
- "Filter rows where city equals 'Jerusalem'"
- "Find all records with population greater than 100,000"
