# Notion OpenSpec Changes Database — Schema Reference

Complete schema for the project's Notion task board used for backlog management.

## Database Identifiers

| Item | Value |
|---|---|
| Database name | OpenSpec Changes |
| Data source URL | `collection://61973df7-c1a4-49d0-8baf-7fbf2d714968` |
| Parent page | Data Israel (`31d6dd80-0603-81c9-8114-c4444cd24106`) |

## SQL Schema

```sql
CREATE TABLE IF NOT EXISTS "collection://61973df7-c1a4-49d0-8baf-7fbf2d714968" (
  url TEXT UNIQUE,
  createdTime TEXT,
  "Category" TEXT,    -- one of ["Backend", "Frontend", "Full Stack", "Infrastructure", "DevOps", "UI/UX", "Bug Fix", "Refactor"]
  "Status" TEXT,      -- one of ["Backlog", "To Do", "In Progress", "Done", "Archived"]
  "date:Completed Date:start" TEXT,
  "date:Completed Date:end" TEXT,
  "date:Completed Date:is_datetime" INTEGER,
  "Change ID" TEXT,
  "Priority" TEXT,    -- one of ["High", "Medium", "Low"]
  "Name" TEXT
)
```

## Property Option IDs

### Status Options

| Value | Option URL |
|---|---|
| Backlog | `collectionPropertyOption://61973df7-c1a4-49d0-8baf-7fbf2d714968/XVVySg/ZWRkZjdjZGItOWIyZC00MmQ5LWE3YmYtYzUzNjI1OWYwOTY3` |
| To Do | `collectionPropertyOption://61973df7-c1a4-49d0-8baf-7fbf2d714968/XVVySg/ZDJlZDMyNjEtN2VkMC00ODkzLWJjMzItNWZlNmZhMTAxNGJj` |
| In Progress | `collectionPropertyOption://61973df7-c1a4-49d0-8baf-7fbf2d714968/XVVySg/NDM5YjlkNmQtOTViMS00MzUwLWFlYzAtZDJkZjMwZjE0ZjRi` |
| Done | `collectionPropertyOption://61973df7-c1a4-49d0-8baf-7fbf2d714968/XVVySg/ZmViOTg1ZWEtZmRjNy00NmVlLWJjNmItZjg2NGIyYTJiMGIy` |
| Archived | `collectionPropertyOption://61973df7-c1a4-49d0-8baf-7fbf2d714968/XVVySg/NGJiZDkwMmQtZDY3Yi00MThjLTlkYWItOGI4YjQzYzlhNGZm` |

### Category Options

| Value | Color |
|---|---|
| Backend | blue |
| Frontend | purple |
| Full Stack | green |
| Infrastructure | orange |
| DevOps | brown |
| UI/UX | pink |
| Bug Fix | red |
| Refactor | gray |

### Priority Options

| Value | Color |
|---|---|
| High | red |
| Medium | yellow |
| Low | green |

## MCP Tools Reference

### Create pages
- **Tool:** `mcp__claude_ai_Notion__notion-create-pages`
- **Parent:** `{ type: "data_source_id", data_source_id: "61973df7-c1a4-49d0-8baf-7fbf2d714968" }`

### Fetch page/database
- **Tool:** `mcp__claude_ai_Notion__notion-fetch`
- **Input:** Page URL, page ID, or `collection://61973df7-c1a4-49d0-8baf-7fbf2d714968`

### Search pages
- **Tool:** `mcp__claude_ai_Notion__notion-search`
- **Input:** Query string matching page titles or content

### Update page
- **Tool:** `mcp__claude_ai_Notion__notion-update-page`
- **Input:** Page ID + properties to update

## Content Format

Backlog item content uses Notion-flavored Markdown:

```markdown
## Overview

Brief description of the work item.

## API Details (if applicable)

- **Endpoint:** `POST https://example.gov.il/api/endpoint`
- **Auth:** None required / Token required
- **Input:** `{"param": "value"}`
- **Returns:** Description of response

## Discovery

How this item was found — research session, GitHub repo, user request.

## Value

- Why this matters for users
- What questions it enables answering
- How it connects to existing features

## Implementation Notes

- Technical considerations
- Dependencies on other work items
- Proxy tier classification needed
```
