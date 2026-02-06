## Context

The data-gov sidebar (`ThreadsSidebarGroup`) currently lists threads from Convex via `usePaginatedQuery` but has no rename or delete capability. The existing `add-clerk-auth-threads` spec proposed using MastraClient for thread mutations, but direct Convex mutations are simpler and more reliable for this use case.

## Goals / Non-Goals

- Goals:
  - Thread rename (inline input) and delete (confirmation dialog) with authorization
  - Responsive interaction: hover dropdown on desktop, long-press on mobile
  - Hebrew UI text and toast notifications
  - Clean separation: hook for data, components for presentation
- Non-Goals:
  - Thread archiving (future enhancement)
  - Drag-to-reorder threads
  - Batch thread operations

## Decisions

### Decision: Direct Convex Mutations over MastraClient

**What**: Use `ctx.db.patch()` and `ctx.db.delete()` in Convex mutations for thread rename/delete, instead of MastraClient's `thread.update()` / `thread.delete()`.

**Why**:
- MastraClient adds an HTTP round-trip through API routes
- Convex mutations are already reactive — `usePaginatedQuery` updates instantly
- Authorization is simpler server-side via `ctx.auth.getUserIdentity()` + guestId
- Mastra stores threads in `mastra_threads` table which Convex can mutate directly
- Delete needs to also remove `mastra_messages` — easier in a single Convex mutation

**Trade-off**: Bypasses Mastra's abstraction layer. If Mastra changes its schema, mutations need updating. Acceptable because the schema is stable and we control the Convex deployment.

### Decision: DropdownMenu over Context Menu

**What**: Use existing `DropdownMenu` component from `components/ui/dropdown-menu.tsx` instead of adding a new context-menu component.

**Why**:
- DropdownMenu already exists in the project
- Works on both desktop (click trigger) and mobile (controlled open state)
- Consistent with existing UI patterns
- No new dependency needed

### Decision: No React Context for Thread State

**What**: Use a custom hook (`useThreadsData`) that returns state + callbacks, not a React Context provider.

**Why**:
- Convex's `usePaginatedQuery` natively deduplicates subscriptions across component tree
- Sidebar stays mounted when collapsed — no re-mount issues
- Hook is simpler than Context + Provider wrapper
- Only one consumer (`ThreadsSidebarGroup`) needs the full state

### Decision: Sonner for Toast Notifications

**What**: Install `sonner` via shadcn CLI for toast feedback on delete/rename operations.

**Why**:
- shadcn has first-class sonner integration
- Lightweight, no provider needed (just `<Toaster />` in layout)
- Promise-based toast API for loading → success/error flow

## Risks / Trade-offs

- **Risk**: Direct Convex mutation on `mastra_threads` bypasses Mastra — if Mastra changes schema, mutations break.
  → **Mitigation**: Schema is stable; pin Mastra version; add integration test.

- **Risk**: Long-press on mobile may conflict with scroll gestures.
  → **Mitigation**: Use timer-based approach with touchCancel cleanup; 500ms threshold avoids accidental triggers.
