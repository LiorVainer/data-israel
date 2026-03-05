# Active Context

## Current Work
- **Feature**: Agent Evals — Mastra scorer system for agent quality monitoring
- **Branch**: `feat/add-agent-evals`
- **Status**: COMPLETE — all 8 tasks implemented and verified

## Code Review: app/admin/page.tsx (2026-03-04)

### Critical Issues (≥80 confidence)
- None found

### Important Issues (≥80 confidence)
- [85] **Linting violation: Promise chain missing return** at app/admin/page.tsx:150
  - Problem: `.then()` callback lacks explicit return type
  - Code: `.then(() => { toast.success(...); })`
  - Fix: Add `: void` return type: `.then((): void => { ... })`
  - Blocks merge due to ESLint error (promise/always-return)

### High-Priority Refactoring Recommendations (optional, non-blocking)

| Issue | File to Create | Benefit | Confidence |
|-------|----------------|---------|------------|
| [90] Duplicate price display (4x identical) | `components/admin/ModelPriceDisplay.tsx` | Eliminates redundancy: agent card (line 226-237) + dialog current (293-304) + dialog new (319-330) + picker (106-116) | 95 |
| [88] IIFE not idiomatic React | `components/admin/ConfirmModelChangeDialog.tsx` | Remove IIFE (263-336), shrink admin/page to ~120 lines, improve testability | 85 |
| [85] Config scattered in component | `constants/admin.ts` | Centralize AGENT_CONFIGS, AgentId, CLIENT_DEFAULT_MODEL, getModelDisplay() - reusable for tests/other pages | 80 |

### Verification Evidence
| Check | Result |
|-------|--------|
| **tsc** | exit 0 (zero errors) |
| **npm run build** | exit 0 (all routes compiled) |
| **ESLint** | 1 new warning on line 150 (promise/always-return) |
| **vibecheck** | Pass (no new issues beyond pre-existing) |
| **Type safety** | No `any`, only `as const` on AGENT_CONFIGS (correct) |

### Security & Functionality Review
- ✅ Auth: Admin check on line 173 enforces access control
- ✅ Error handling: Optimistic revert + toast on upsertModel failure
- ✅ State management: Local state synced with Convex via useEffect
- ✅ No secrets exposed, no XSS/injection vectors
- ✅ Responsive UI: Dialog/Drawer via useIsMobile hook
- ✅ Memoization: useMemo on filteredModels (ModelPickerDialog)

### Key Patterns Observed
- Price display pattern (blue input | orange output) repeated 4 times - DRY violation
- IIFE on lines 263-336 is functional but not idiomatic React
- Component extraction opportunities: ModelsLoadingState + ModelsErrorState already extracted (good example)

## Previous Work
- Task 14: Integration Verification - COMPLETE (7/7 scenarios pass)
- Task 13: Silent Failure Hunt - COMPLETE
- Per-Agent Model Config + Admin Panel - COMPLETE
- PWA Push Notifications - COMPLETE

## Last Updated
2026-03-04
