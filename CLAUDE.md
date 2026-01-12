# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Always mark your tasks as done in '**/tasks.md' when you finish them.

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Project Overview

This is an **Israeli Open Data AI Agent** built with Next.js 16 and designed to chat with users about Israeli open data from data.gov.il. The project uses:
- **Next.js 16.1.1** with App Router architecture
- **React 19.2.3** with Server Components
- **TypeScript 5** with strict type checking
- **Tailwind CSS 4** for styling
- **AI SDK v6** for agent tools (planned - see spec/project.spec.md)

The agent architecture is **tool-first**: rather than hallucinating dataset information, it queries the data.gov.il CKAN API through explicit, Zod-validated tools.

## Development Commands

### Running the Application
```bash
npm run dev      # Start development server at localhost:3000
npm run build    # Build production bundle
npm start        # Start production server
```

### Code Quality & Verification
```bash
npm run lint       # Run ESLint
npm run vibecheck  # Run vibecheck code quality analyzer
tsc                # Type-check without emitting
```

## ⚠️ CRITICAL: Post-Tool Call Verification

**After EVERY tool call that modifies code, you MUST run the following commands in sequence:**

```bash
npm run build     # Verify the build succeeds
npm run lint      # Check for linting issues
npm run vibecheck # Run code quality checks
```

**Do not skip this step.** These commands ensure:
- ✅ The build compiles successfully
- ✅ No ESLint violations were introduced
- ✅ Code quality standards are maintained
- ✅ No TypeScript errors exist

If any command fails, fix the issues before proceeding.

## Architecture

### Project Structure
```
app/                    # Next.js App Router
├── layout.tsx          # Root layout with Geist fonts
├── page.tsx            # Home page
└── globals.css         # Tailwind global styles

spec/
└── project.spec.md     # Authoritative specification for the AI agent

openspec/               # OpenSpec workflow (see AGENTS.md)
├── AGENTS.md           # Instructions for proposal-driven development
└── specs/              # Capability specifications (to be created)
```

### Path Aliases
The project uses `@/*` to reference files from the root:
```typescript
import { Component } from "@/app/component"
```

### Font System
The project uses Geist font family (Geist Sans + Geist Mono) loaded via `next/font/google` with CSS variables:
- `--font-geist-sans`
- `--font-geist-mono`

## TypeScript Guidelines

### Type Safety Rules
1. **Minimize `as` type assertions** - Use proper type guards and inference instead
2. **Avoid `any` type** - Use `unknown` or proper types
3. **Always run `tsc` after changes** - Verify no new errors were introduced
4. **Strict mode enabled** - All strict TypeScript checks are active

### Common Patterns
- Use type inference where possible
- Prefer interfaces for object shapes
- Use `Readonly<>` for immutable props
- Leverage TypeScript's utility types (e.g., `Pick`, `Omit`, `Partial`)

## AI Agent Implementation (Planned)

Per `spec/project.spec.md`, the agent will:
1. Use **AI SDK v6** with Zod-validated tools
2. Query **data.gov.il CKAN API** (not MCP runtime)
3. Implement tools for:
   - Dataset search (`package_search`)
   - Dataset details (`package_show`)
   - Group listing (`group_list`)
   - Tag listing (`tag_list`)
   - Resource fetching (optional, with safeguards)

The MCP reference files (`mcp-ref/mcp.ts`, `mcp-ref/mcp.py`) are **conceptual references only** and not executed.

## Code Review Checklist

Before committing changes:
- [ ] Run `npm run build` to verify build succeeds
- [ ] Run `npm run lint` to check for linting issues
- [ ] Run `npm run vibecheck` for code quality validation
- [ ] Test in browser at `localhost:3000`
- [ ] Verify type assertions (`as`) are necessary
- [ ] Ensure no `any` types were added
- [ ] Check that Server Components don't use client-only hooks

## OpenSpec Workflow

This project uses OpenSpec for specification-driven development. When working on new features or architectural changes:

1. **Check for existing specs**: Read `openspec/AGENTS.md` first
2. **Create proposals**: Use OpenSpec workflow for new capabilities
3. **Reference the spec**: `spec/project.spec.md` is the authoritative source for agent design
4. **Validate changes**: Run `openspec validate --strict` before implementation

See `openspec/AGENTS.md` for detailed instructions on creating proposals and managing specifications.
