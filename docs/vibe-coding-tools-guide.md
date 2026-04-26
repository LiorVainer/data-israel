# Deterministic Tools for Better AI Coding

Tools from [Syntax #998](https://syntax.fm/show/998/how-to-fix-vibe-coding) — making Claude Code output more reliable by replacing vibes with facts.

> **Core principle**: Don't tell AI "write good code" in rules files (it can ignore that). Instead, run deterministic tools that output pass/fail results, then feed those results back to the agent.

---

## 1. Code Quality Analysis

### Fallow — All-in-One Codebase Intelligence

> Dead code, duplication, complexity, architecture drift, feature flags — one tool.

| | |
|---|---|
| **Site** | https://docs.fallow.tools |
| **Install** | `npx fallow` (zero config) |
| **Written in** | Rust (fast) |

```bash
# Key commands
npx fallow                # Full analysis
npx fallow dead-code      # Unused code
npx fallow dupes          # Duplicated logic
npx fallow health         # Complexity metrics (cyclomatic, cognitive)
npx fallow fix --dry-run  # Preview cleanup
```

**Claude Code integration:**
- Has built-in **MCP server** + **VS Code extension**
- Add to Claude Code as MCP or run CLI and pipe output
- Add to `CLAUDE.md`:
  ```
  After completing any feature, run `npx fallow` and fix issues before reporting done.
  ```

**Why it matters for AI**: AI loves to solve problems locally — duplicating utils, stuffing if-statements into god functions, leaving dead exports. Fallow catches all of that deterministically.

---

### Knip — Unused Dependencies, Exports & Files

| | |
|---|---|
| **Site** | https://knip.dev |
| **Install** | `npm install -D knip` |
| **Plugins** | ~150 (Next.js, Vite, Vitest, etc.) |

```bash
npx knip          # Full analysis
npx knip --fix    # Auto-remove unused
```

**Claude Code integration:**
- Has MCP integration for config generation
- Used by Anthropic, Vercel, Google, Microsoft
- "Knip helped us delete ~300k lines of unused code at Vercel"

---

### jscpd — Copy/Paste Detector (150+ Languages)

| | |
|---|---|
| **Site** | https://jscpd.dev |
| **Install** | `npx jscpd ./src` |
| **Downloads** | 20M+ |

```bash
npx jscpd ./src --reporters json   # JSON output for agents
```

**Claude Code integration:**
- **MCP Server**: `claude mcp add jscpd` — AI checks for duplications via tool calls
- **Agent Skill**: `npx skills add kucherenko/jscpd`
- **AI Reporter**: compact output format, ~79% fewer tokens than standard

---

### Project Wallace — CSS Analysis

| | |
|---|---|
| **Site** | https://github.com/projectwallace/wallace-cli |
| **Install** | `npm install -g wallace-cli` |

```bash
wallace src/**/*.css    # Analyze CSS variables, specificity, colors, font sizes
```

**Why it matters**: AI loves setting explicit `font-size`, `line-height`, `letter-spacing`, and `background-color` on everything instead of using design tokens/variables. Wallace surfaces these violations.

---

## 2. Component Discovery

### Storybook AI + MCP

| | |
|---|---|
| **Site** | https://storybook.js.org/ai |
| **Install** | `npx storybook add @storybook/addon-mcp` (requires Storybook v10.3+) |

**What it gives AI agents:**
- **Component discovery** — list all components with props, variants, docs
- **Canonical examples** — stories show exactly how to use each component (not just type signatures)
- **Real browser testing** — tests run in background, failures auto-fed to agent
- **Story generation** — agents write/update stories for new components

**Claude Code integration:**
- Works as MCP server — agents call tools like `list_documentation`, `get_component`
- Prevents AI from reinventing components that already exist

---

## 3. Bug Finding

### Sentry CLI — Production Error Intelligence

| | |
|---|---|
| **Site** | https://cli.sentry.dev |
| **Install** | `curl https://cli.sentry.dev/install -fsS \| bash` or `npx @sentry/cli` |

```bash
sentry auth login              # Authenticate
sentry issue list              # All issues with severity + fixability scores
sentry issue explain <ID>      # AI root cause analysis
sentry issue plan              # Step-by-step fix recommendations
```

**Claude Code integration:**
- Structured JSON output — pipe directly to agent
- Auto-detects project from `.env` / codebase
- Agent workflow: `sentry issue list` → pick critical → `sentry issue explain` → fix

---

### Spotlight — Local Dev Debugging via MCP

| | |
|---|---|
| **Site** | https://spotlightjs.com |
| **Install** | Desktop app + SDK config |
| **MCP** | `claude mcp add sentry-spotlight` |

```javascript
// In your Sentry.init():
Sentry.init({
  spotlight: true,
  sampleRate: 1.0,
  tracesSampleRate: 1.0,
  enableLogs: true,
});
```

**What agents get via MCP:**
- Real-time local errors with stack traces
- Database query timing, API latency, component render times
- Console logs, network requests — all aggregated
- AI root cause analysis on local errors

**Why over console logs**: Agent doesn't need to scrape browser DevTools or terminal output. Organized, structured data via MCP.

---

## 4. Formatting & Linting

### ESLint — With Custom Rules for AI Patterns

Already in this project (`eslint.config.mjs`). The key insight from the episode:

> **Write custom ESLint plugins for patterns AI keeps repeating** instead of putting rules in `CLAUDE.md`.

Example: Kevin from Svelte team wrote a custom ESLint rule that **fails if AI uses `$effect`** (because it overuses it). Same idea applies to:
- Banning `as` type assertions (already in this project's CLAUDE.md — could be an ESLint rule)
- Preventing inline styles when CSS variables exist
- Flagging components that don't use design system tokens

**Making it enforceable in Claude Code:**
```
# In CLAUDE.md
After every file edit, run `npx eslint --fix <file>` and fix remaining errors.
```
This project already has a hook that auto-runs ESLint --fix per edit.

---

### StyleLint — CSS Linting

| | |
|---|---|
| **Site** | https://stylelint.io |
| **Install** | `npm install -D stylelint stylelint-config-standard` |

```bash
npx stylelint "src/**/*.css"
```

Catches: undeclared custom properties, hardcoded colors (should use variables), duplicate selectors, invalid values.

---

## 5. Headless Browsers

### agent-browser (Vercel) — Browser Automation for Agents

| | |
|---|---|
| **Repo** | https://github.com/vercel-labs/agent-browser |
| **Install** | `npm install -g agent-browser && agent-browser install` |
| **Skill** | `npx skills add vercel-labs/agent-browser` |

**Features:**
- Screenshots with annotation overlays
- Accessibility tree snapshots with semantic element refs
- Network interception, cookie management
- React introspection + Web Vitals
- Can connect to **any Electron app** (Slack, VS Code, etc.) via `--remote-debugging-port`
- Can use **LightPanda** as engine for 9x speed

**Claude Code integration:**
- Install as skill: `npx skills add vercel-labs/agent-browser`
- Or configure in `agent-browser.json` at project root
- Agent can: navigate to localhost, take screenshot, check console, verify UI

---

### chrome-devtools-mcp — Chrome DevTools via MCP

| | |
|---|---|
| **What** | MCP server exposing Chrome DevTools Protocol |
| **Install** | Available as npm package |

Opens visible Chrome window — you can watch what the agent does. Exposes: screenshots, console, network panel, DOM interaction.

This project already has `chrome-devtools-mcp` configured (visible in deferred tools list).

---

### LightPanda — 9x Faster Headless Browser

| | |
|---|---|
| **Site** | https://lightpanda.io |
| **Install** | `curl -fsSL https://pkg.lightpanda.io/install.sh \| bash` |
| **Written in** | Zig |

- 9x faster, 16x less memory than Chrome
- Puppeteer/Playwright compatible — drop-in replacement
- Can be used as engine for agent-browser

---

## 6. Task Management

### Dex — Persistent Tasks in JSON

| | |
|---|---|
| **Site** | https://dex.rip |
| **Install** | `npm install -g @zeeg/dex` |
| **Skill** | `npx skills add dcramer/dex` |

```bash
dex create "Implement rate limiting on /api/chat"
dex list
dex show <task-id>
dex plan                # Generate subtasks from plan file
```

**Why over AI's built-in todos**: Persists to JSON in repo. Tasks carry across sessions. Supports blocking dependencies (task A blocks task B). Agent picks next unblocked task deterministically.

---

## 7. Documentation

### Context7 — Live Docs via MCP

| | |
|---|---|
| **Site** | https://context7.com |
| **What** | Fetches current library documentation on demand |

Already configured in this project. Agent calls `resolve-library-id` → `query-docs` to get up-to-date API docs instead of relying on training data.

---

## Integration Strategy for This Project

### What's Already Set Up
- ESLint with auto-fix hook on every edit
- Quality gate hook (tsc + vibecheck + tests) on Stop
- Context7 MCP for docs
- chrome-devtools-mcp tools available

### Recommended Additions

**High impact, low effort:**

| Tool | How to Add | Why |
|------|-----------|-----|
| **Fallow** | `npx fallow` in quality gate | Catches dead code, duplication, complexity AI introduces |
| **Knip** | `npx knip` periodically | Find unused deps/exports AI leaves behind |
| **Sentry CLI** | `curl https://cli.sentry.dev/install -fsS \| bash` | Agent can find+fix prod bugs autonomously |
| **Spotlight** | `claude mcp add sentry-spotlight` + SDK config | Local error/perf data flows to agent via MCP |
| **agent-browser** | `npx skills add vercel-labs/agent-browser` | Agent verifies UI changes in real browser |
| **Dex** | `npx skills add dcramer/dex` | Persistent cross-session task tracking |

### Suggested CLAUDE.md Addition

```markdown
## Post-Feature Quality Checks
After completing any feature or bug fix, run this sequence:
1. `npx eslint --fix .` — fix lint issues
2. `tsc --noEmit` — type check
3. `npx fallow` — check for dead code, duplication, complexity
4. Fix any issues found before reporting done.
```

### Suggested Pre-Commit Hook

```bash
#!/bin/bash
npx eslint . --max-warnings 0
tsc --noEmit
npx fallow dead-code
npx fallow dupes
```

Agent can't commit if quality checks fail — deterministic enforcement, not vibes.
