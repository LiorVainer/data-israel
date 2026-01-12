# Project Context

## Purpose

Build a **Next.js application** that allows users to chat with an AI agent about **Israeli open data (data.gov.il)**. The agent uses explicit tools to query the data.gov.il CKAN API rather than hallucinating information, providing explainable and structured answers about datasets, publishers, and tags.

## Tech Stack

- **Next.js 16.1.1** with App Router architecture
- **React 19.2.3** with Server Components
- **TypeScript 5** with strict type checking
- **Tailwind CSS 4** for styling
- **AI SDK v6** (`ai` package) for agent orchestration
- **Zod** for schema validation
- **Axios** for HTTP requests to data.gov.il CKAN API
- **Anthropic Claude Sonnet 4.5** as the LLM model

## Project Conventions

### Code Style

- **TypeScript strict mode**: All strict checks enabled
- **Minimize type assertions**: Avoid `as` casts unless absolutely necessary
- **No `any` types**: Use `unknown` or proper types instead
- **Path aliases**: Use `@/*` to reference files from root
- **Naming conventions**:
  - camelCase for variables, functions, and methods
  - PascalCase for types, interfaces, and classes
  - kebab-case for file names

### Architecture Patterns

- **Tool-first agent architecture**: AI agent must use explicit tools, not hallucination
- **Zod-first validation**: All inputs/outputs validated with Zod schemas
- **Separation of concerns**:
  - `lib/tools/` - AI SDK tool definitions
  - `lib/api/data-gov/` - API client utilities
  - `agents/` - ToolLoopAgent instances
  - `app/api/` - API routes for streaming
- **AI SDK v6 patterns**:
  - Use `tool()` helper for tool definitions
  - Use `ToolLoopAgent` for multi-step orchestration
  - Use `createAgentUIStreamResponse()` for streaming
- **Nested API structure**: `dataGovApi.dataset.search()` instead of flat methods

### Testing Strategy

- Manual testing via browser at `localhost:3000`
- Type checking with `tsc` after every code change
- Tool testing before agent integration
- No formal test suite yet (to be added in future change)

### Git Workflow

- **Main branch**: `main` (renamed from `master`)
- **Commit format**: Descriptive messages with co-author attribution
  ```
  <type>: <description>

  Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
  ```
- **Verification before commit**: Must run `npm run build && npm run lint && npm run vibecheck`
- **OpenSpec workflow**: Create proposals for new features/architecture changes

## Domain Context

### Israeli Open Data (data.gov.il)

- **API**: CKAN-based API at `https://data.gov.il/api/3`
- **No authentication**: Public API, no API keys required
- **Key concepts**:
  - **Datasets (packages)**: Individual data collections
  - **Groups**: Publishers/categories (e.g., ministries)
  - **Tags**: Keywords for dataset taxonomy
  - **Resources**: Downloadable files within datasets
- **API endpoints**:
  - `/action/package_search` - Search datasets
  - `/action/package_show` - Get dataset details
  - `/action/group_list` - List publishers
  - `/action/tag_list` - List tags

### Agent Reasoning Rules

1. **Search before answering**: Always query tools for facts
2. **No hallucination**: Dataset facts must come from tool results
3. **Summaries are derived**: Never assume dataset contents
4. **Pagination over truncation**: Use pagination for large results
5. **Explicit tools only**: No guessing schema fields

## Important Constraints

### Technical Constraints

- **TypeScript strict mode**: No loosening of type checks
- **Windows development environment**: Paths use backslashes
- **Next.js 16 required**: MCP features need v16+
- **Node.js 18+**: Required for native fetch and modern features

### Code Quality Gates

All three must pass before committing:
1. `npm run build` - Production build must succeed
2. `npm run lint` - ESLint checks must pass
3. `npm run vibecheck` - Code quality analyzer (target: 93/100+)

### File Exclusions

- `mcp-ref/` - Reference files only, not executed
- `.idea/` - IDE files
- Temp files: `tmpclaude-*-cwd`

## External Dependencies

### Data.gov.il CKAN API

- **Base URL**: `https://data.gov.il/api/3`
- **Protocol**: CKAN API v3
- **Response format**: `{ success: boolean, result: T }`
- **Rate limits**: Unknown, assumed none
- **Availability**: Public API, no SLA

### AI SDK v6 (Vercel)

- **Package**: `ai` on npm
- **Documentation**: https://ai-sdk.dev
- **Key exports**: `tool`, `ToolLoopAgent`, `createAgentUIStreamResponse`
- **Model support**: Anthropic, OpenAI, Google, etc.

### Anthropic API

- **Model**: `anthropic/claude-sonnet-4.5`
- **Context window**: Large (supports long conversations)
- **Tool calling**: Native support for tool orchestration

## MCP Integration

While the project uses CKAN API concepts, it does **not** use MCP (Model Context Protocol) at runtime:
- `mcp-ref/` files are **conceptual references only**
- Tools are implemented as **AI SDK v6 native tools**
- No MCP server, no stdio, no protocol bridge
- MCP files serve as design inspiration for tool semantics

## Development Workflow

1. **Check OpenSpec**: Run `openspec list` and `openspec list --specs`
2. **Create proposal**: For new features/architecture changes
3. **Validate**: Run `openspec validate <change-id> --strict`
4. **Implement**: Follow tasks.md checklist
5. **Verify**: Run build/lint/vibecheck after each change
6. **Commit**: With descriptive message and co-author
7. **Archive**: Move to `changes/archive/` after deployment
