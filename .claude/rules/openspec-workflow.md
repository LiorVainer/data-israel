---
paths:
  - "openspec/changes/**/tasks.md"
  - "openspec/changes/**/proposal.md"
  - "openspec/changes/**/design.md"
  - "openspec/specs/**"
---

# OpenSpec Workflow Rules

Process rules for implementing OpenSpec changes, managing tasks, and syncing with the Notion "OpenSpec Changes" database. These apply whenever Claude is reading or editing files inside `openspec/changes/**` or `openspec/specs/**`.

> The `OPENSPEC:START/END` managed block in the root `CLAUDE.md` tells Claude *when* to open `openspec/AGENTS.md` based on prompt intent. This rule covers *how* to work once inside an OpenSpec change.

## Implementation rules

1. **Check for existing specs first** — read `openspec/AGENTS.md` before creating a new proposal.
2. **Create proposals via the OpenSpec workflow** for any new capability, breaking change, or architecture shift.
3. **`openspec/specs/` is authoritative** for agent design — reference it, don't invent.
4. **Validate before implementation** — run `openspec validate --strict`.
5. **Major tasks → separate subagents** — when implementing, give each major task (e.g. 1.0 – 2.0) to a separate subagent.
6. **Follow tasks.md** — when implementing, always follow the tasks in the relevant `tasks.md` file.
7. **Mark tasks as done** — always mark tasks as done in the relevant `tasks.md` file as you finish them.
8. **Use the `typescript-pro` subagent** for TypeScript-heavy implementation work.

## Notion Sync — Task Updates

When completing tasks in any `**/tasks.md`, update the corresponding page in the **Notion "OpenSpec Changes" database** using the Notion MCP server:

- Tool: `mcp__claude_ai_Notion__notion-update-page`
- Data source: `collection://61973df7-c1a4-49d0-8baf-7fbf2d714968`
- Match pages by the `Change ID` property (equals the openspec change folder name).
- Update the page content's checklists to match the current `tasks.md` state.
- Set the `Status` property: `To Do` → `In Progress` → `Done`.
- When fully complete, also set `Completed Date` to the current date.

## Notion Sync — New Plans

When creating a new openspec proposal/plan, create a corresponding page in the same Notion database:

- Tool: `mcp__claude_ai_Notion__notion-create-pages`
- Data source: `collection://61973df7-c1a4-49d0-8baf-7fbf2d714968`
- Parent page: "Data Israel" (`31d6dd80-0603-81c9-8114-c4444cd24106`)
- Properties to set:
  - `Name`: descriptive title
  - `Change ID`: openspec folder name (must match exactly for later updates)
  - `Category`: one of `Backend`, `Frontend`, `Full Stack`, `Infrastructure`, `DevOps`, `UI/UX`, `Bug Fix`, `Refactor`
  - `Priority`: `High` / `Medium` / `Low`
  - `Status`: `To Do`
  - `Completed Date`: leave empty
- Add the `tasks.md` checklist items as page content.

See `openspec/AGENTS.md` for detailed instructions on creating proposals and managing specifications.
