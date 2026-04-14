---
name: backlog
description: "This skill should be used when the user asks to 'add to backlog', 'create a backlog item', 'show backlog', 'list backlog tasks', 'what's in the backlog', 'move to backlog', 'check backlog', 'backlog status', 'fetch backlog', 'get all backlog items', or mentions managing future work items, ideas, or deferred tasks in the project's Notion task board."
---

# Backlog Management

Manage the project's backlog of future work items via the Notion "OpenSpec Changes" database. The backlog is a column/status in the existing task board, not a separate system.

## Notion Database Details

- **Data source:** `collection://61973df7-c1a4-49d0-8baf-7fbf2d714968`
- **Database name:** OpenSpec Changes
- **Parent page:** "Data Israel" (`31d6dd80-0603-81c9-8114-c4444cd24106`)

### Status Values

| Status | Purpose |
|---|---|
| `Backlog` | Future work — ideas, research findings, deferred features |
| `To Do` | Approved and ready for implementation |
| `In Progress` | Currently being worked on |
| `Done` | Completed |
| `Archived` | No longer relevant |

### Required Properties

| Property | Type | Values |
|---|---|---|
| `Name` | title | Descriptive title for the work item |
| `Change ID` | text | kebab-case identifier (e.g., `add-land-authority-planning`) |
| `Category` | select | `Backend`, `Frontend`, `Full Stack`, `Infrastructure`, `DevOps`, `UI/UX`, `Bug Fix`, `Refactor` |
| `Priority` | select | `High`, `Medium`, `Low` |
| `Status` | select | `Backlog`, `To Do`, `In Progress`, `Done`, `Archived` |
| `Completed Date` | date | Set when status moves to `Done` |

## Core Operations

### Add a Backlog Item

Use `mcp__claude_ai_Notion__notion-create-pages` with:

```
parent: { type: "data_source_id", data_source_id: "61973df7-c1a4-49d0-8baf-7fbf2d714968" }
pages: [{
  properties: {
    "Name": "Descriptive title",
    "Change ID": "kebab-case-id",
    "Category": "Backend",        // or Frontend, Full Stack, etc.
    "Priority": "Medium",         // High, Medium, or Low
    "Status": "Backlog"
  },
  icon: "emoji",                  // relevant emoji
  content: "## Overview\n\nDescription of the work item...\n\n## Value\n\n- Why this matters...\n\n## Notes\n\n- Implementation considerations..."
}]
```

**Content guidelines for backlog items:**
- Start with `## Overview` — what the work item is
- Include `## Value` — why it matters, what user need it serves
- Include `## Notes` — technical considerations, API details, discovery context
- Keep content concise but informative enough for future implementation

### Fetch All Backlog Items

Use `mcp__claude_ai_Notion__notion-search` to find backlog items:

```
query: "Backlog"
```

Or use `mcp__claude_ai_Notion__notion-fetch` with the data source ID to get the full database schema and then filter.

For targeted lookups, search by name or Change ID keywords.

### Fetch a Specific Backlog Item

Use `mcp__claude_ai_Notion__notion-fetch` with the page ID or URL:

```
id: "page-uuid-here"
```

Or search by Change ID using `mcp__claude_ai_Notion__notion-search`:

```
query: "add-land-authority-planning"
```

### Move Item Out of Backlog

Use `mcp__claude_ai_Notion__notion-update-page` to change status:

```
page_id: "page-uuid"
properties: { "Status": "To Do" }
```

This promotes a backlog item to active work. Optionally update Priority at the same time.

### Update a Backlog Item

Use `mcp__claude_ai_Notion__notion-update-page` to modify any property or content:

```
page_id: "page-uuid"
properties: { "Priority": "High" }
content: "Updated content..."
```

## Workflow Patterns

### Research → Backlog

When discovering a new API, data source, or feature opportunity during research:
1. Document findings in the backlog item's content (endpoint URLs, auth requirements, sample responses)
2. Set priority based on user value
3. Include discovery context (how it was found, which repo/project revealed it)

### Backlog → OpenSpec Proposal

When promoting a backlog item to active work:
1. Change status from `Backlog` to `To Do`
2. Create an OpenSpec proposal in `openspec/changes/{change-id}/`
3. Update the Notion page content with the task checklist from `tasks.md`

### Backlog Review

When the user asks to review the backlog:
1. Fetch all items with `Backlog` status
2. Present them grouped by Category or sorted by Priority
3. Suggest which items to promote based on current project context

## Best Practices

- **Always set a Change ID** — enables linking between Notion and `openspec/changes/` later
- **Include technical details** — API endpoints, auth requirements, sample data
- **Reference discovery source** — GitHub repos, documentation URLs, research sessions
- **Keep priorities honest** — `High` = blocks current work or high user demand; `Medium` = valuable but not urgent; `Low` = nice-to-have
- **Use relevant emojis** for icons — helps visual scanning in the Notion board

## Additional Resources

### Reference Files

- **`references/notion-schema.md`** — Complete Notion database schema, SQL definition, and property option IDs for programmatic access
