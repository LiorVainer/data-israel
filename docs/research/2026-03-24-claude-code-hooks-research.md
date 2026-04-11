# Claude Code Hooks Research

**Date:** 2026-03-24
**Sources:**
- [Claude Code Hooks Official Docs](https://code.claude.com/docs/en/hooks-guide)
- [DEV.to: 5 Automations That Replaced My Manual Workflow](https://dev.to/klement_gunndu/claude-code-hooks-5-automations-that-replaced-my-manual-workflow-47f4)
- [GitHub: timoconnellaus/define-claude-code-hooks](https://github.com/timoconnellaus/define-claude-code-hooks)
- [eesel.ai: Claude Code hooks practical guide](https://www.eesel.ai/blog/hooks-in-claude-code)

---

## Hook Event Types (Complete List)

| Event | When it fires | Matcher field |
|-------|---------------|---------------|
| `SessionStart` | Session begins/resumes | startup, resume, clear, compact |
| `UserPromptSubmit` | Prompt submitted, before processing | no matcher |
| `PreToolUse` | Before tool execution (can block) | tool name |
| `PermissionRequest` | Permission dialog appears | tool name |
| `PostToolUse` | After tool succeeds | tool name |
| `PostToolUseFailure` | After tool fails | tool name |
| `Notification` | Claude sends notification | notification type |
| `SubagentStart` | Subagent spawned | agent type |
| `SubagentStop` | Subagent finishes | agent type |
| `Stop` | Claude finishes responding | no matcher |
| `StopFailure` | Turn ends due to API error | error type |
| `TeammateIdle` | Agent team teammate going idle | no matcher |
| `TaskCompleted` | Task marked completed | no matcher |
| `InstructionsLoaded` | CLAUDE.md loaded into context | load reason |
| `ConfigChange` | Config file changes | config source |
| `WorktreeCreate` | Worktree created | no matcher |
| `WorktreeRemove` | Worktree removed | no matcher |
| `PreCompact` | Before compaction | manual, auto |
| `PostCompact` | After compaction | manual, auto |
| `Elicitation` | MCP server requests user input | MCP server name |
| `ElicitationResult` | User responds to MCP elicitation | MCP server name |
| `SessionEnd` | Session terminates | exit reason |

## Hook Types

1. **`command`** — Shell command (most common)
2. **`http`** — POST to HTTP endpoint
3. **`prompt`** — Single-turn LLM evaluation (Haiku default)
4. **`agent`** — Multi-turn subagent with tool access

## Exit Codes

- **0** = allow/proceed
- **2** = block the action
- **Other** = proceed, stderr logged

## define-claude-code-hooks Library

**What:** TypeScript library for type-safe hook definitions with automatic settings.json generation.

### API

```typescript
import { defineHooks } from "@timoaus/define-claude-code-hooks";

export default defineHooks({
  PreToolUse: [
    {
      matcher: "Write | Edit | MultiEdit",
      handler: async (input) => { /* logic */ },
    }
  ],
  Stop: [
    async (input) => { /* logic */ }
  ]
});
```

### Predefined Hooks

- `logPreToolUseEvents`, `logPostToolUseEvents`, `logStopEvents`, `logSubagentStopEvents`, `logNotificationEvents`
- `blockEnvFiles` — security: prevent .env access
- `announceStop`, `announceSubagentStop`, `announcePreToolUse`, `announcePostToolUse`, `announceNotification`

### How It Works

1. Hooks defined in `.claude/hooks/hooks.ts` (TypeScript, NOT compiled)
2. CLI generates entries in `.claude/settings.json`
3. Hooks executed via `ts-node --transpile-only`
4. Matcher is regex pattern for tool names

---

## Key Patterns from Articles

### 1. Block Destructive Commands (PreToolUse)
Prevent `rm -rf`, `DROP TABLE`, etc.

### 2. Auto-Format After Edits (PostToolUse)
Run Prettier/ESLint on every file Claude edits.

### 3. Protect Sensitive Files (PreToolUse)
Block edits to `.env`, lock files, `.git/`, credentials.

### 4. Re-inject Context After Compaction (SessionStart, matcher: "compact")
Restore project conventions, recent git log, active branch.

### 5. Audit Command Log (PostToolUse)
Log every Bash command with timestamp.

### 6. Desktop/System Notifications (Notification)
OS-native alerts when Claude needs input.

### 7. Auto-Approve Specific Prompts (PermissionRequest)
Skip approval for safe operations like ExitPlanMode.

### 8. Prompt-Based Stop Verification (Stop, type: "prompt")
LLM checks if all tasks are complete before stopping.

### 9. Agent-Based Test Verification (Stop, type: "agent")
Subagent runs tests before allowing Claude to stop.

### 10. Config Change Auditing (ConfigChange)
Log settings/skills file changes for compliance.
