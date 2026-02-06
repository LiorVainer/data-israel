# Change: Add Thread Management UI with Rename/Delete Functionality

## Why

The sidebar currently lists threads but lacks any CRUD operations. Users cannot rename or delete conversations, and there's no confirmation flow, toast feedback, or mobile-friendly interaction pattern. This change adds a complete thread management experience with inline rename, delete with confirmation dialog, and responsive gestures.

## What Changes

### Thread CRUD via Direct Convex Mutations
- **Add `deleteThread` mutation** to `convex/threads.ts` — deletes thread and all associated messages from `mastra_messages`, with authorization check
- **Add `renameThread` mutation** to `convex/threads.ts` — patches thread title with authorization check
- **Replaces MastraClient approach** — direct Convex mutations are simpler, already reactive, and avoid an extra HTTP hop through API routes

### Thread Management Hook
- **Create `useThreadsData` hook** — centralizes thread pagination, navigation, delete/rename state, and CRUD operations extracted from `ThreadsSidebarGroup`

### Thread UI Components
- **Create `ThreadItem`** — thread row with inline rename, hover "..." dropdown (desktop), long-press dropdown (mobile)
- **Create `ThreadDeleteModal`** — Hebrew confirmation dialog with sonner toast feedback
- **Create `EmptyThreadsState`** — empty state for sidebar when no threads exist
- **Refactor `ThreadsSidebarGroup`** — uses new hook and sub-components

### Supporting Utilities
- **Create `useLongPress` hook** — zero-dependency mobile long-press gesture
- **Create `formatCreationTime` utility** — Hebrew relative time formatting via `date-fns`
- **Install `sonner`** via shadcn CLI — toast notifications with `<Toaster />` in root layout

## Impact

- Affected specs: `threads` (MODIFIED — direct Convex mutations instead of MastraClient), `navigation` (MODIFIED — detailed thread item and delete modal requirements)
- Affected code:
  - `convex/threads.ts` — add `deleteThread`, `renameThread` mutations
  - `hooks/use-threads-data.ts` — new hook
  - `hooks/use-long-press.ts` — new hook
  - `components/threads/ThreadItem.tsx` — new component
  - `components/threads/ThreadDeleteModal.tsx` — new component
  - `components/threads/EmptyThreadsState.tsx` — new component
  - `components/threads/ThreadsSidebarGroup.tsx` — refactor to use hook + sub-components
  - `lib/date.ts` — new utility
  - `app/layout.tsx` — add `<Toaster />`
  - `components/ui/sonner.tsx` — auto-created by shadcn CLI
