# Change: Add Clerk Authentication with Guest Sessions and Thread Management

## Why

The data-gov application currently lacks user authentication and persistent thread management. Users cannot:
- Sign in to save their chat history across sessions
- Access their previous conversations from a sidebar
- Have guest sessions that can later be converted to authenticated accounts

This change introduces Clerk-based authentication (mirroring the sitewave project pattern), guest session support, and a sidebar-based thread management UI using Mastra's native thread APIs.

## What Changes

### Authentication Layer
- **Add Clerk authentication** using `@clerk/nextjs` and `@clerk/elements` for custom sign-in/sign-up UI
- **Configure Convex with Clerk JWT** via `ConvexProviderWithClerk` pattern
- **Add authentication middleware** to protect routes and validate sessions
- **Create sign-in and sign-up pages** at `/sign-in/[[...sign-in]]` and `/sign-up/[[...sign-up]]`

### Guest Session Management
- **Add `useGuestSession` hook** - manages guest IDs stored in localStorage
- **Add `guests` table** in Convex schema for tracking guest sessions
- **Create `UserContext`** - unified context for authenticated and guest users
- **Auto-create guest** when unauthenticated user visits the app

### Thread Management (Mastra Memory)
- **Leverage Mastra's native thread APIs** via `@mastra/memory`:
  - `memory.createThread()` - create new conversation threads
  - `memory.listThreads()` - list user's threads with pagination
  - `memory.getThreadById()` - fetch thread details
  - Thread metadata: title, summary, userId (Clerk subject or guestId)
- **Create Convex mutations/queries** that wrap Mastra thread operations
- **Add thread title generation** using agent's `generateObject` capability

### Navigation & UI
- **Add `AppSidebar` component** with:
  - Team/workspace switcher header
  - Threads list with real-time updates
  - User profile footer with Clerk's `UserButton`
  - Collapsible sidebar with rail support
- **Add `ThreadsSidebarGroup`** - displays user's conversation threads
- **Add breadcrumb navigation** for thread context
- **Support RTL layout** (Hebrew UI)

### API Routes
- **Update `/api/chat` route** to include userId (authenticated or guest) in memory context
- **Add thread management endpoints** for create, list, rename, delete operations

## Impact

### Affected Specs
- **NEW**: `authentication` - Clerk sign-in/sign-up, guest sessions
- **NEW**: `threads` - Mastra thread management
- **NEW**: `navigation` - Sidebar and thread UI components

### Affected Code
- `app/layout.tsx` - Add ClerkProvider and ConvexClientProvider
- `app/sign-in/`, `app/sign-up/` - New authentication pages
- `convex/schema.ts` - Add `guests` table
- `convex/threads.ts` - Thread management mutations/queries
- `hooks/` - Add `use-guest-session.ts`, `use-local-storage.ts`
- `context/` - Add `UserContext.tsx`, `ConvexClientProvider.tsx`
- `components/navigation/` - Add `AppSidebar.tsx`, `ThreadsSidebarGroup.tsx`, `NavUser.tsx`
- `app/chat/[id]/page.tsx` - Update to use user context for memory

### Dependencies to Add
```json
{
  "@clerk/nextjs": "^6.x",
  "@clerk/elements": "^0.x",
  "convex-helpers": "^0.x"
}
```

### Environment Variables
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_JWT_ISSUER_DOMAIN=https://...clerk.accounts.dev

# Google OAuth (Custom Credentials - configure in Clerk Dashboard)
# These are configured in Clerk Dashboard, not in .env
# See: https://clerk.com/docs/authentication/social-connections/google
# 1. Create OAuth credentials in Google Cloud Console
# 2. Add Client ID and Client Secret in Clerk Dashboard > User & Authentication > Social Connections > Google
# 3. Enable "Use custom credentials" toggle
# 4. Set Authorized Redirect URI from Clerk in Google Cloud Console
```

## Migration

### For Existing Users
- Existing anonymous threads will be associated with a new guest session on first visit
- Guest sessions can be merged with authenticated accounts (future enhancement)

### Breaking Changes
- None - this is additive functionality
