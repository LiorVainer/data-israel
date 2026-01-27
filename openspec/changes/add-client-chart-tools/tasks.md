# Tasks: Add Client-Side Chart Tools

## 1. Dependencies Setup

- [x] 1.1 Install Nivo packages: `@nivo/core`, `@nivo/bar`, `@nivo/line`, `@nivo/pie`
- [x] 1.2 Verify packages compile correctly with `npm run build`

## 2. Chart Types and Schemas

- [x] 2.1 Create `lib/tools/display-chart.ts` with Zod schemas for chart configuration
- [x] 2.2 Define three separate tools: `displayBarChart`, `displayLineChart`, `displayPieChart`
- [x] 2.3 Define chart-specific config schemas (bar config, line config, pie config)
- [x] 2.4 Add `execute` function to each tool (required by ToolLoopAgent)

## 3. Tool Definition

- [x] 3.1 Create `lib/tools/display-chart.ts` with three separate tool definitions
- [x] 3.2 Export tools from `lib/tools/index.ts`
- [x] 3.3 Add tools to agent tools object in `agents/data-agent.ts`
- [x] 3.4 Update `lib/tools/types.ts` with types for three tools
- [x] 3.5 Run `tsc` to verify type safety

## 4. Chart Renderer Component

- [x] 4.1 Create `components/chat/ChartRenderer.tsx` component
- [x] 4.2 Implement `BarChartRenderer` using `ResponsiveBar` from `@nivo/bar`
- [x] 4.3 Implement `LineChartRenderer` using `ResponsiveLine` from `@nivo/line`
- [x] 4.4 Implement `PieChartRenderer` using `ResponsivePie` from `@nivo/pie`
- [x] 4.5 Add chart type switch logic based on `chartType` prop
- [x] 4.6 Add responsive container styling (min-height: 400px)
- [x] 4.7 Add RTL support for Hebrew labels via CSS `direction: rtl`
- [x] 4.8 Create `ChartLoadingState` component for `input-streaming` state

## 5. Integration with MessageItem Architecture

- [x] 5.1 Update `MessageItem.tsx` to filter out chart tools from `toolParts` sent to `MessageToolCalls`
- [x] 5.2 Handle cases for `'tool-displayBarChart'`, `'tool-displayLineChart'`, `'tool-displayPieChart'`
- [x] 5.3 Handle part states: `input-streaming` (show loading), `input-available` (render chart), `output-available` (rendered), `output-error` (show error)
- [x] 5.4 Pass `part.input` with `chartType` to `ChartRenderer` component when state allows
- [x] 5.5 Add TypeScript types for the tool part (extends message part types)

## 6. useChat Configuration

- [x] 6.1 Update `app/page.tsx` with `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls`
- [x] 6.2 Remove unused `addToolOutput` (tools now have server-side execute)

## 7. Tool Icon and Translation

- [x] 7.1 Add icons to `MessageToolCalls.tsx` - `BarChart2Icon`, `LineChartIcon`, `PieChartIcon`
- [x] 7.2 Add entries to `toolTranslations` for three tools with Hebrew names and formatters

## 8. Agent Instructions Update

- [x] 8.1 Update `agents/data-agent.ts` instructions (simplified - tools have their own descriptions)

## 9. Verification

- [x] 9.1 Run `npm run build` to verify production build
- [x] 9.2 Run `npm run lint` to check linting
- [ ] 9.3 Run `npm run vibecheck` for code quality
- [x] 9.4 Run `tsc` to verify no TypeScript errors
- [ ] 9.5 Manual test: Ask agent "הצג השוואת מחירים כתרשים עמודות"
- [ ] 9.6 Manual test: Ask agent to show trend data as line chart
- [ ] 9.7 Manual test: Ask agent to show distribution/breakdown as pie chart
- [ ] 9.8 Verify chart loading state appears during `input-streaming`
- [ ] 9.9 Verify error handling when invalid chart data is provided
- [ ] 9.10 Verify chart tools do NOT appear in `MessageToolCalls` timeline
