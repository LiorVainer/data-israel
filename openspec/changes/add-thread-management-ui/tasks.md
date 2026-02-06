# Implementation Tasks: Thread Management UI with Rename/Delete

## Implementation Notes

> **Context7 MCP**: Before implementing each task, use the `resolve-library-id` and `query-docs` Context7 MCP tools to fetch the latest documentation for the relevant libraries. This ensures you use up-to-date APIs instead of relying on stale knowledge.
>
> Key libraries to query:
> - `convex` — for `mutation`, `useMutation`, `usePaginatedQuery`, `ctx.db.patch`, `ctx.db.delete`, `v.string()`, `v.optional()`, `v.id()`
> - `sonner` — for `toast`, `toast.promise`, `<Toaster />` setup
> - `date-fns` — for `formatDistanceToNow` with locale support
> - `framer-motion` — for `motion.div` hover animations (opacity transitions)
> - `@clerk/nextjs` — for auth identity access in Convex via `ctx.auth.getUserIdentity()`
>
> Example Context7 workflow:
> ```
> 1. resolve-library-id({ libraryName: "convex", query: "Convex mutations with ctx.db.patch and ctx.db.delete" })
> 2. query-docs({ libraryId: "<resolved-id>", query: "How to write mutations that delete documents" })
> ```

## 1. Dependencies & Layout

- [ ] 1.1 Install sonner via shadcn CLI:
  ```bash
  pnpm dlx shadcn@latest add sonner
  ```
  This creates `components/ui/sonner.tsx` automatically.

- [ ] 1.2 Add `<Toaster />` to root layout `app/layout.tsx`:

  > **Context7**: Query `sonner` docs for latest `<Toaster />` props and setup.

  ```tsx
  // app/layout.tsx — add import at top:
  import { Toaster } from '@/components/ui/sonner';

  // Inside the <body> tag, after <UserProvider>{children}</UserProvider>:
  <ClerkProvider>
      <ConvexClientProvider>
          <UserProvider>{children}</UserProvider>
      </ConvexClientProvider>
  </ClerkProvider>
  <Toaster />   {/* ← add here, outside providers, inside <body> */}
  ```

## 2. Convex Mutations for Thread CRUD

> **Context7**: Query `convex` docs for "mutations with ctx.db.delete and ctx.db.patch" and "querying with indexes" before implementing.

**File: `convex/threads.ts`** — add these mutations alongside the existing queries. Import `mutation` from `./_generated/server`.

- [ ] 2.1 Add authorization helper (internal, reused by both mutations):
  ```typescript
  import { mutation, query } from './_generated/server';
  // ... (keep existing imports)

  /**
   * Resolves the resourceId for the current caller.
   * Authenticated users use identity.subject, guests use guestId.
   * Throws if neither is available.
   */
  async function resolveResourceId(
      ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } },
      guestId?: string
  ) {
      const identity = await ctx.auth.getUserIdentity();
      const resourceId = identity?.subject ?? guestId;
      if (!resourceId) {
          throw new Error('Not authenticated and no guest ID provided');
      }
      return resourceId;
  }
  ```

- [ ] 2.2 Add `deleteThread` mutation:
  ```typescript
  /**
   * Deletes a thread and all its associated messages.
   * Authenticates via Clerk JWT or guestId, verifies ownership.
   */
  export const deleteThread = mutation({
      args: {
          threadId: v.string(),
          guestId: v.optional(v.id('guests')),
      },
      handler: async (ctx, { threadId, guestId }) => {
          const resourceId = await resolveResourceId(ctx, guestId);

          // Find thread by its record ID (Mastra's UUID, not Convex _id)
          const thread = await ctx.db
              .query('mastra_threads')
              .withIndex('by_record_id', (q) => q.eq('id', threadId))
              .unique();

          if (!thread) {
              throw new Error('Thread not found');
          }

          // Authorization: verify caller owns this thread
          if (thread.resourceId !== resourceId) {
              throw new Error('Not authorized to delete this thread');
          }

          // Delete all messages belonging to this thread
          const messages = await ctx.db
              .query('mastra_messages')
              .withIndex('by_thread', (q) => q.eq('thread_id', threadId))
              .collect();

          for (const message of messages) {
              await ctx.db.delete(message._id);
          }

          // Delete the thread itself
          await ctx.db.delete(thread._id);
      },
  });
  ```

- [ ] 2.3 Add `renameThread` mutation:
  ```typescript
  /**
   * Renames a thread's title.
   * Authenticates via Clerk JWT or guestId, verifies ownership.
   */
  export const renameThread = mutation({
      args: {
          threadId: v.string(),
          newTitle: v.string(),
          guestId: v.optional(v.id('guests')),
      },
      handler: async (ctx, { threadId, newTitle, guestId }) => {
          const resourceId = await resolveResourceId(ctx, guestId);

          const thread = await ctx.db
              .query('mastra_threads')
              .withIndex('by_record_id', (q) => q.eq('id', threadId))
              .unique();

          if (!thread) {
              throw new Error('Thread not found');
          }

          if (thread.resourceId !== resourceId) {
              throw new Error('Not authorized to rename this thread');
          }

          await ctx.db.patch(thread._id, {
              title: newTitle,
              updatedAt: new Date().toISOString(),
          });
      },
  });
  ```

### Key indexes used:
- `mastra_threads` → `by_record_id` index on `["id"]` field (Mastra's UUID)
- `mastra_threads` → `by_resource` index on `["resourceId"]` field (used by existing queries)
- `mastra_messages` → `by_thread` index on `["thread_id"]` field

## 3. Date Formatting Utility

> **Context7**: Query `date-fns` docs for `formatDistanceToNow` with locale parameter.

- [ ] 3.1 Create `lib/date.ts`:
  ```typescript
  import { formatDistanceToNow } from 'date-fns';
  import { he } from 'date-fns/locale';

  /**
   * Formats a Convex _creationTime timestamp to a Hebrew relative time string.
   * Example: "לפני 3 דקות", "לפני שעה", "לפני 2 ימים"
   *
   * @param timestamp - Convex _creationTime (milliseconds since epoch)
   */
  export function formatCreationTime(timestamp: number): string {
      return formatDistanceToNow(new Date(timestamp), {
          addSuffix: true,
          locale: he,
      });
  }
  ```

## 4. Custom Hooks

### 4.1 `useLongPress` Hook

- [x] 4.1 Create `hooks/use-long-press.ts`:
  ```typescript
  import { useCallback, useRef } from 'react';

  /**
   * Custom hook for mobile long-press gesture detection.
   * Returns touch event handlers and a ref to check if a long press occurred.
   *
   * @param callback - Function to call when long-press is detected
   * @param threshold - Duration in ms before triggering (default: 500)
   */
  export function useLongPress(callback: () => void, threshold = 500) {
      const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
      const isLongPressRef = useRef(false);

      const start = useCallback(() => {
          isLongPressRef.current = false;
          timerRef.current = setTimeout(() => {
              isLongPressRef.current = true;
              callback();
          }, threshold);
      }, [callback, threshold]);

      const cancel = useCallback(() => {
          if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
          }
      }, []);

      return {
          onTouchStart: start,
          onTouchEnd: cancel,
          onTouchCancel: cancel,
          isLongPressRef,
      };
  }
  ```

### 4.2 `useThreadsData` Hook

> **Context7**: Query `convex` docs for `usePaginatedQuery` return type and `useMutation` usage patterns.

- [x] 4.2 Create `hooks/use-threads-data.ts`:
  ```typescript
  'use client';

  import { useState, useCallback } from 'react';
  import { usePathname, useRouter } from 'next/navigation';
  import { usePaginatedQuery, useMutation } from 'convex/react';
  import { api } from '@/convex/_generated/api';
  import { Id } from '@/convex/_generated/dataModel';
  import { useUser } from '@/context/UserContext';
  import { useSidebar } from '@/components/ui/sidebar';

  export const THREADS_PAGE_SIZE = 10;

  export function useThreadsData() {
      const { guestId, isAuthenticated, isCreatingGuest } = useUser();
      const { isMobile, setOpenMobile } = useSidebar();
      const router = useRouter();
      const pathname = usePathname();

      // Thread pending deletion (for confirmation modal)
      const [threadToDelete, setThreadToDelete] = useState<{
          _id: string;
          id: string;
          title: string;
          _creationTime: number;
      } | null>(null);

      // Convex mutations
      const deleteThreadMutation = useMutation(api.threads.deleteThread);

      // Skip query while guest session is being created
      const shouldSkipQuery = !isAuthenticated && isCreatingGuest;

      const {
          results: threads,
          status,
          loadMore,
      } = usePaginatedQuery(
          api.threads.listUserThreadsPaginated,
          shouldSkipQuery
              ? 'skip'
              : { guestId: (guestId as Id<'guests'>) || undefined },
          { initialNumItems: THREADS_PAGE_SIZE },
      );

      // Derive current thread ID from pathname (/chat/[id])
      const currentThreadId = pathname?.startsWith('/chat/')
          ? pathname.split('/chat/')[1]
          : null;

      const handleThreadSelect = useCallback(
          (threadId: string) => {
              if (currentThreadId === threadId) return;
              router.push(`/chat/${threadId}`);
              if (isMobile) {
                  setOpenMobile(false);
              }
          },
          [currentThreadId, router, isMobile, setOpenMobile],
      );

      // Stage a thread for deletion (opens confirmation modal)
      const handleDelete = useCallback(
          (thread: { _id: string; id: string; title: string; _creationTime: number }) => {
              setThreadToDelete(thread);
          },
          [],
      );

      // Execute the deletion after user confirms
      const confirmDelete = useCallback(async () => {
          if (!threadToDelete) return;

          await deleteThreadMutation({
              threadId: threadToDelete.id,
              guestId: (guestId as Id<'guests'>) || undefined,
          });

          // If we deleted the active thread, navigate home
          if (currentThreadId === threadToDelete.id) {
              router.push('/');
          }

          setThreadToDelete(null);
      }, [threadToDelete, deleteThreadMutation, guestId, currentThreadId, router]);

      // Cancel deletion
      const cancelDelete = useCallback(() => {
          setThreadToDelete(null);
      }, []);

      // Load next page
      const loadMoreThreads = useCallback(() => {
          loadMore(THREADS_PAGE_SIZE);
      }, [loadMore]);

      return {
          threads,
          status,
          currentThreadId,
          threadToDelete,
          handleThreadSelect,
          handleDelete,
          confirmDelete,
          cancelDelete,
          loadMoreThreads,
      };
  }
  ```

## 5. Thread UI Components

### 5.1 `EmptyThreadsState`

- [x] 5.1 Create `components/threads/EmptyThreadsState.tsx`:
  ```tsx
  import {
      SidebarGroup,
      SidebarGroupLabel,
      SidebarMenu,
      SidebarMenuItem,
      SidebarMenuButton,
  } from '@/components/ui/sidebar';
  import { Plus } from 'lucide-react';

  interface EmptyThreadsStateProps {
      hideContent?: boolean;
  }

  export function EmptyThreadsState({ hideContent }: EmptyThreadsStateProps) {
      return (
          <SidebarGroup>
              <SidebarGroupLabel>שיחות</SidebarGroupLabel>
              <SidebarMenu>
                  <SidebarMenuItem>
                      <SidebarMenuButton className="justify-center border border-dashed border-sidebar-border">
                          <Plus className="size-4" />
                          {!hideContent && <span>אין שיחות עדיין</span>}
                      </SidebarMenuButton>
                  </SidebarMenuItem>
              </SidebarMenu>
          </SidebarGroup>
      );
  }
  ```

### 5.2 `ThreadDeleteModal`

> **Context7**: Query `sonner` docs for `toast.promise` API (loading/success/error states).

- [x] 5.2 Create `components/threads/ThreadDeleteModal.tsx`:
  ```tsx
  'use client';

  import { useState } from 'react';
  import {
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
      DialogClose,
  } from '@/components/ui/dialog';
  import { Button } from '@/components/ui/button';
  import { toast } from 'sonner';

  interface ThreadDeleteModalProps {
      thread: {
          _id: string;
          id: string;
          title: string;
          _creationTime: number;
      };
      onConfirm: () => Promise<void>;
  }

  export function ThreadDeleteModal({ thread, onConfirm }: ThreadDeleteModalProps) {
      const [isDeleting, setIsDeleting] = useState(false);

      const handleConfirm = async () => {
          setIsDeleting(true);
          toast.promise(onConfirm(), {
              loading: 'מוחק שיחה...',
              success: 'השיחה נמחקה בהצלחה',
              error: 'שגיאה במחיקת השיחה',
          });
      };

      return (
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>מחיקת שיחה</DialogTitle>
                  <DialogDescription>פעולה זו אינה ניתנת לביטול</DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                  האם למחוק שיחה זו? כל ההודעות יימחקו לצמיתות.
              </p>
              {thread.title && (
                  <p className="text-sm font-medium truncate">&ldquo;{thread.title}&rdquo;</p>
              )}
              <DialogFooter>
                  <DialogClose asChild>
                      <Button variant="outline" disabled={isDeleting}>
                          ביטול
                      </Button>
                  </DialogClose>
                  <Button
                      variant="destructive"
                      onClick={handleConfirm}
                      disabled={isDeleting}
                  >
                      מחק שיחה
                  </Button>
              </DialogFooter>
          </DialogContent>
      );
  }
  ```

### 5.3 `ThreadItem`

> **Context7**: Query `framer-motion` docs for `motion.div` with hover-triggered opacity animation.
> Also query `convex` docs for `useMutation` to call `renameThread`.

- [x] 5.3 Create `components/threads/ThreadItem.tsx`:
  ```tsx
  'use client';

  import { useState, useRef, useCallback } from 'react';
  import { useMutation } from 'convex/react';
  import { api } from '@/convex/_generated/api';
  import { Id } from '@/convex/_generated/dataModel';
  import { useUser } from '@/context/UserContext';
  import { useIsMobile } from '@/hooks/use-mobile';
  import { useLongPress } from '@/hooks/use-long-press';
  import { formatCreationTime } from '@/lib/date';
  import { SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import {
      DropdownMenu,
      DropdownMenuContent,
      DropdownMenuItem,
      DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
  import { motion } from 'framer-motion';
  import { MoreHorizontal, Edit3, Trash2, Check, X } from 'lucide-react';
  import { toast } from 'sonner';

  interface ThreadItemProps {
      thread: {
          _id: string;
          id: string;
          title: string;
          metadata: Record<string, unknown> | null;
          _creationTime: number;
      };
      isActive: boolean;
      onSelect: (threadId: string) => void;
      onDelete: (thread: ThreadItemProps['thread']) => void;
  }

  export function ThreadItem({ thread, isActive, onSelect, onDelete }: ThreadItemProps) {
      const { guestId } = useUser();
      const isMobile = useIsMobile();
      const renameMutation = useMutation(api.threads.renameThread);

      // Rename state
      const [isRenaming, setIsRenaming] = useState(false);
      const [renameValue, setRenameValue] = useState(thread.title || '');
      const inputRef = useRef<HTMLInputElement>(null);

      // Dropdown state (controlled for mobile long-press)
      const [dropdownOpen, setDropdownOpen] = useState(false);
      const [isHovered, setIsHovered] = useState(false);

      // Long-press for mobile
      const longPress = useLongPress(
          useCallback(() => setDropdownOpen(true), []),
          500,
      );

      const handleRenameConfirm = async () => {
          const trimmed = renameValue.trim();
          if (!trimmed || trimmed === thread.title) {
              setIsRenaming(false);
              return;
          }
          try {
              await renameMutation({
                  threadId: thread.id,
                  newTitle: trimmed,
                  guestId: (guestId as Id<'guests'>) || undefined,
              });
              toast.success('שם השיחה עודכן');
          } catch {
              toast.error('שגיאה בשינוי שם השיחה');
              setRenameValue(thread.title || '');
          }
          setIsRenaming(false);
      };

      const handleRenameCancel = () => {
          setRenameValue(thread.title || '');
          setIsRenaming(false);
      };

      const startRename = () => {
          setRenameValue(thread.title || '');
          setIsRenaming(true);
          setDropdownOpen(false);
          // Focus input after render
          setTimeout(() => inputRef.current?.focus(), 50);
      };

      const startDelete = () => {
          setDropdownOpen(false);
          onDelete(thread);
      };

      const handleClick = () => {
          // Don't navigate if long-press just fired
          if (longPress.isLongPressRef.current) return;
          if (isRenaming) return;
          onSelect(thread.id);
      };

      const timeAgo = formatCreationTime(thread._creationTime);

      // Inline rename mode
      if (isRenaming) {
          return (
              <SidebarMenuItem>
                  <div className="flex items-center gap-1 px-2 py-1.5">
                      <Input
                          ref={inputRef}
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameConfirm();
                              if (e.key === 'Escape') handleRenameCancel();
                          }}
                          className="h-7 text-sm"
                      />
                      <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 shrink-0"
                          onClick={handleRenameConfirm}
                      >
                          <Check className="size-3.5" />
                      </Button>
                      <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 shrink-0"
                          onClick={handleRenameCancel}
                      >
                          <X className="size-3.5" />
                      </Button>
                  </div>
              </SidebarMenuItem>
          );
      }

      // Normal display mode
      return (
          <SidebarMenuItem
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
          >
              <SidebarMenuButton
                  onClick={handleClick}
                  isActive={isActive}
                  tooltip={thread.title || 'שיחה ללא כותרת'}
                  className="h-auto py-2 group"
                  {...(isMobile ? longPress : {})}
              >
                  <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                      <span className="truncate text-sm">
                          {thread.title || 'שיחה ללא כותרת'}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                          {timeAgo}
                      </span>
                  </div>
              </SidebarMenuButton>

              {/* Desktop hover "..." button + dropdown */}
              {!isMobile && (
                  <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                          <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: isHovered || dropdownOpen ? 1 : 0 }}
                              className="absolute left-2 top-1/2 -translate-y-1/2"
                          >
                              <Button size="icon" variant="ghost" className="size-7">
                                  <MoreHorizontal className="size-4" />
                              </Button>
                          </motion.div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" side="bottom">
                          <DropdownMenuItem onClick={startRename}>
                              <Edit3 className="size-4" />
                              <span>שנה שם שיחה</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                              onClick={startDelete}
                              className="text-destructive focus:text-destructive"
                          >
                              <Trash2 className="size-4" />
                              <span>מחק שיחה</span>
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              )}

              {/* Mobile long-press dropdown (hidden trigger, controlled open) */}
              {isMobile && (
                  <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                      <DropdownMenuTrigger className="sr-only" />
                      <DropdownMenuContent align="start" side="bottom">
                          <DropdownMenuItem onClick={startRename}>
                              <Edit3 className="size-4" />
                              <span>שנה שם שיחה</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                              onClick={startDelete}
                              className="text-destructive focus:text-destructive"
                          >
                              <Trash2 className="size-4" />
                              <span>מחק שיחה</span>
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                  </DropdownMenu>
              )}
          </SidebarMenuItem>
      );
  }
  ```

  **Positioning note**: The `motion.div` for the "..." button uses `absolute left-2` (RTL: appears on the left side). The `SidebarMenuItem` needs `relative` positioning — check if the sidebar primitive already provides it; if not, add `className="relative"` to the `<SidebarMenuItem>`.

## 6. Refactor ThreadsSidebarGroup

- [x] 6.1 Refactor `components/threads/ThreadsSidebarGroup.tsx` to use the new hook and sub-components:
  ```tsx
  'use client';

  import { useThreadsData } from '@/hooks/use-threads-data';
  import { ThreadItem } from '@/components/threads/ThreadItem';
  import { ThreadDeleteModal } from '@/components/threads/ThreadDeleteModal';
  import { EmptyThreadsState } from '@/components/threads/EmptyThreadsState';
  import { Dialog } from '@/components/ui/dialog';
  import {
      SidebarGroup,
      SidebarGroupLabel,
      SidebarMenu,
      SidebarMenuButton,
      SidebarMenuItem,
      SidebarMenuSkeleton,
      useSidebar,
  } from '@/components/ui/sidebar';

  export function ThreadsSidebarGroup() {
      const { state } = useSidebar();
      const hideContent = state === 'collapsed';

      const {
          threads,
          status,
          currentThreadId,
          threadToDelete,
          handleThreadSelect,
          handleDelete,
          confirmDelete,
          cancelDelete,
          loadMoreThreads,
      } = useThreadsData();

      // Loading state
      if (status === 'LoadingFirstPage') {
          return (
              <SidebarGroup>
                  <SidebarGroupLabel>שיחות</SidebarGroupLabel>
                  <SidebarMenu>
                      {Array.from({ length: 5 }).map((_, i) => (
                          <SidebarMenuItem key={i}>
                              <SidebarMenuSkeleton showIcon />
                          </SidebarMenuItem>
                      ))}
                  </SidebarMenu>
              </SidebarGroup>
          );
      }

      // Empty state
      if (!threads || threads.length === 0) {
          return <EmptyThreadsState hideContent={hideContent} />;
      }

      if (hideContent) return null;

      return (
          <>
              <SidebarGroup>
                  <SidebarGroupLabel>שיחות</SidebarGroupLabel>
                  <SidebarMenu>
                      {threads.map((thread) => (
                          <ThreadItem
                              key={thread._id}
                              thread={thread}
                              isActive={currentThreadId === thread.id}
                              onSelect={handleThreadSelect}
                              onDelete={handleDelete}
                          />
                      ))}

                      {status === 'CanLoadMore' && (
                          <SidebarMenuItem>
                              <SidebarMenuButton
                                  onClick={loadMoreThreads}
                                  className="justify-center text-muted-foreground"
                              >
                                  <span className="text-xs">טען עוד שיחות</span>
                              </SidebarMenuButton>
                          </SidebarMenuItem>
                      )}

                      {status === 'LoadingMore' && (
                          <SidebarMenuItem>
                              <SidebarMenuSkeleton showIcon />
                          </SidebarMenuItem>
                      )}
                  </SidebarMenu>
              </SidebarGroup>

              {/* Delete confirmation dialog */}
              <Dialog
                  open={threadToDelete !== null}
                  onOpenChange={(open) => { if (!open) cancelDelete(); }}
              >
                  {threadToDelete && (
                      <ThreadDeleteModal
                          thread={threadToDelete}
                          onConfirm={confirmDelete}
                      />
                  )}
              </Dialog>
          </>
      );
  }
  ```

## 7. Verification

- [ ] 7.1 Run `tsc` — verify no TypeScript errors
- [ ] 7.2 Run `pnpm run build` — verify production build succeeds
- [ ] 7.3 Run `pnpm run lint` — verify no ESLint violations
- [ ] 7.4 Run `npx convex dev` — verify Convex schema/functions deploy without errors

## Existing Code References

| Symbol | Location | Notes |
|--------|----------|-------|
| `useUser()` | `context/UserContext.tsx` | Returns `guestId`, `isAuthenticated`, `isCreatingGuest` |
| `usePaginatedQuery` | `convex/react` | Returns `{ results, status, loadMore }` |
| `useMutation` | `convex/react` | Returns async callable function |
| `api.threads.listUserThreadsPaginated` | `convex/threads.ts:89` | Existing paginated query |
| `useSidebar()` | `components/ui/sidebar.tsx` | Returns `state`, `isMobile`, `setOpenMobile` |
| `useIsMobile()` | `hooks/use-mobile.ts` | SSR-safe mobile detection hook |
| `SidebarMenu*` components | `components/ui/sidebar.tsx` | `SidebarGroup`, `SidebarGroupLabel`, `SidebarMenu`, `SidebarMenuButton`, `SidebarMenuItem`, `SidebarMenuSkeleton` |
| `DropdownMenu*` components | `components/ui/dropdown-menu.tsx` | `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger` |
| `Dialog*` components | `components/ui/dialog.tsx` | `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` |
| `Button` | `components/ui/button.tsx` | Supports `variant`, `size` props |
| `Input` | `components/ui/input.tsx` | Standard input component |
| `cn()` | `lib/utils.ts` | Tailwind class merging utility |
| `date-fns` | `package.json` | v4.1.0+ already installed |
| `framer-motion` | `package.json` | v12.29.0+ already installed |

### Mastra Table Indexes (from `@mastra/convex/schema`)

| Table | Index Name | Fields |
|-------|-----------|--------|
| `mastra_threads` | `by_record_id` | `["id"]` |
| `mastra_threads` | `by_resource` | `["resourceId"]` |
| `mastra_threads` | `by_created` | `["createdAt"]` |
| `mastra_threads` | `by_updated` | `["updatedAt"]` |
| `mastra_messages` | `by_record_id` | `["id"]` |
| `mastra_messages` | `by_thread` | `["thread_id"]` |
| `mastra_messages` | `by_thread_created` | `["thread_id", "createdAt"]` |
| `mastra_messages` | `by_resource` | `["resourceId"]` |
