# Implementation Tasks: Add Clerk Authentication with Guest Sessions and Thread Management

## 1. Setup & Configuration

### 1.1 Install Dependencies
- [ ] 1.1.1 Install `@clerk/nextjs` for Clerk authentication
- [ ] 1.1.2 Install `convex-helpers` for Convex utilities (optional)

### 1.2 Clerk Dashboard Configuration (COMPLETED)
- [x] 1.2.1 Create JWT Template in Clerk Dashboard:
  - Navigate to **JWT Templates** in Clerk Dashboard
  - Select the **Convex** template
  - Copy the **Issuer URL** (your Frontend API URL)
- [x] 1.2.2 Configure Google OAuth with custom credentials:
  - Create OAuth credentials in Google Cloud Console
  - Go to **User & Authentication > Social Connections > Google**
  - Toggle **"Use custom credentials"** ON
  - Enter Client ID and Client Secret
  - Copy Clerk's Redirect URI to Google Cloud Console

### 1.3 Environment Variables (COMPLETED)
- [x] 1.3.1 Create `.env.example` with required variables template
- [x] 1.3.2 Add to `.env.local`:
  ```env
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
  CLERK_SECRET_KEY=sk_...
  CLERK_FRONTEND_API_URL=https://verb-noun-00.clerk.accounts.dev
  NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
  ```

### 1.4 Convex Auth Configuration
- [ ] 1.4.1 Create `convex/auth.config.ts`:
  ```ts
  export default {
    providers: [
      {
        domain: process.env.CLERK_FRONTEND_API_URL,
        applicationID: 'convex',
      },
    ],
  };
  ```
- [ ] 1.4.2 Run `npx convex dev` to sync auth config to backend

## 2. Authentication Infrastructure (Clerk + Convex Integration)

### 2.1 ConvexClientProvider with Clerk
- [ ] 2.1.1 Create `context/ConvexClientProvider.tsx`:
  ```tsx
  'use client'
  import { ConvexReactClient } from 'convex/react'
  import { ConvexProviderWithClerk } from 'convex/react-clerk'
  import { useAuth } from '@clerk/nextjs'

  const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

  export default function ConvexClientProvider({ children }: { children: React.ReactNode }) {
    return (
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    )
  }
  ```

### 2.2 Root Layout Provider Hierarchy
- [ ] 2.2.1 Update `app/layout.tsx` with correct provider order:
  ```tsx
  <ClerkProvider>           {/* Outer - provides auth context */}
    <ConvexClientProvider>  {/* Inner - uses Clerk's useAuth */}
      {children}
    </ConvexClientProvider>
  </ClerkProvider>
  ```

### 2.3 Middleware for Route Protection (Optional)
- [ ] 2.3.1 Create `middleware.ts` if protecting specific routes:
  ```ts
  import { clerkMiddleware } from '@clerk/nextjs/server'
  export default clerkMiddleware()
  export const config = { matcher: [...] }
  ```

### 2.4 Auth State Hooks
- [ ] 2.4.1 Use `useConvexAuth()` from `convex/react` (NOT Clerk's `useAuth()`) to check if user is authenticated and token is validated by Convex
- [ ] 2.4.2 Use `<Authenticated>` and `<Unauthenticated>` from `convex/react` for conditional rendering (NOT Clerk's `<SignedIn>`/`<SignedOut>`)

## 3. Sign-In / Sign-Up Pages

- [x] 3.1 Create `app/sign-in/[[...sign-in]]/page.tsx` with `<GoogleOneTap />` component
- [x] 3.2 Create `app/sign-up/[[...sign-up]]/page.tsx` with `<GoogleOneTap />` component
- [x] 3.3 Configure Google One Tap redirect URLs (`signInForceRedirectUrl`, `signUpForceRedirectUrl`)
- [x] 3.4 Style pages with existing UI components (Card for fallback UI)
- [x] 3.5 Add Hebrew translations for auth pages
- [x] 3.6 Add fallback sign-in UI for browsers that don't support One Tap (using Clerk's SignIn/SignUp components)

## 4. Guest Session Management & User Context (Sitewave Pattern)

- [ ] 4.1 Create `hooks/use-local-storage.ts` hook for persistent storage
  - [ ] 4.1.1 Support generic type parameter for stored value
  - [ ] 4.1.2 Handle SSR (check `typeof window`)
  - [ ] 4.1.3 Parse/stringify JSON for complex values
- [ ] 4.2 Create `hooks/use-guest-session.ts` hook for guest ID management
  - [ ] 4.2.1 Store `guest-session-id` in localStorage
  - [ ] 4.2.2 Store `guest-id` (Convex ID) in localStorage
  - [ ] 4.2.3 Auto-generate UUID session ID on first visit
  - [ ] 4.2.4 Auto-create Convex guest record when unauthenticated
  - [ ] 4.2.5 Implement `ensureGuestExists()` for lazy creation
- [ ] 4.3 Add `guests` table to `convex/schema.ts`
  - [ ] 4.3.1 Fields: `sessionId` (string), `createdAt` (number)
  - [ ] 4.3.2 Index: `by_session_id` for lookup
- [ ] 4.4 Create `convex/guests.ts` with `createNewGuest` mutation
- [ ] 4.5 Create `context/UserContext.tsx` with `UserProvider` and `useUser` hook
  - [ ] 4.5.1 Define `UserContextType` interface
  - [ ] 4.5.2 Combine `useConvexAuth` and `useGuestSession` state
  - [ ] 4.5.3 Compute unified `userId` (Clerk subject or guestId)
  - [ ] 4.5.4 Export `useUser` hook with context validation
- [ ] 4.6 Update `app/layout.tsx` to include `UserProvider` in provider hierarchy

## 5. Thread Management (Using Mastra Memory APIs)

Mastra already provides thread management via `@mastra/memory` and `@mastra/client-js`. We only need thin Convex wrappers for **real-time reactivity** (useQuery) and **authorization**.

### 5.1 API Routes for Thread Operations
- [ ] 5.1.1 Create `app/api/threads/route.ts` - GET (list) and POST (create) using Mastra Memory
- [ ] 5.1.2 Create `app/api/threads/[id]/route.ts` - GET, PATCH (rename), DELETE using Mastra Memory
- [ ] 5.1.3 Use `mastra.getAgentById('routingAgent').getMemory()` for server-side operations

### 5.2 Convex Queries for Real-Time UI (thin wrappers over mastra_threads table)
- [ ] 5.2.1 Create `convex/threads.ts` with `listUserThreads` query (reads from `mastra_threads` table directly)
- [ ] 5.2.2 Add `getThreadMetadata` query for sidebar display
- [ ] 5.2.3 These queries provide real-time reactivity via Convex's `useQuery`

### 5.3 Authorization Helper
- [ ] 5.3.1 Add `authorizeThreadAccess` helper that validates `resourceId` matches userId/guestId

### 5.4 Update Existing Code
- [ ] 5.4.1 Update `app/api/chat/route.ts` to pass userId in memory context
- [ ] 5.4.2 Update `app/chat/[id]/page.tsx` to use user context for memory recall

### 5.5 Auto-Generate Thread Title (Optional Enhancement)
- [ ] 5.5.1 Create internal action to generate title via agent's `generateObject`
- [ ] 5.5.2 Schedule after first response using Convex scheduler

## 6. Navigation Components

- [ ] 6.1 Create `components/navigation/AppSidebar.tsx`:
  - [ ] 6.1.1 Sidebar header with app logo and team switcher
  - [ ] 6.1.2 Sidebar content with toolbar and scrollable thread list
  - [ ] 6.1.3 Sidebar footer with `NavUser` component
  - [ ] 6.1.4 Sidebar rail for collapsed state
  - [ ] 6.1.5 Breadcrumb header in main content area
- [ ] 6.2 Create `components/navigation/NavUser.tsx` with Clerk `UserButton`
- [ ] 6.3 Create `components/navigation/SidebarToolbar.tsx` for quick actions
- [ ] 6.4 Create `components/threads/ThreadsSidebarGroup.tsx`:
  - [ ] 6.4.1 Real-time thread list using `useQuery`
  - [ ] 6.4.2 Thread item with title, date, and actions
  - [ ] 6.4.3 Create new thread button
  - [ ] 6.4.4 Thread rename and delete actions
- [ ] 6.5 Add sidebar UI primitives to `components/ui/sidebar.tsx` (or use animate-ui)

## 7. Layout & Routing Updates

- [ ] 7.1 Create `app/(main)/layout.tsx` with `AppSidebar` wrapper
- [ ] 7.2 Move chat route to `app/(main)/chat/[id]/page.tsx`
- [ ] 7.3 Update home page to redirect to latest thread or create new
- [ ] 7.4 Add `SignedIn` / `SignedOut` conditional rendering
- [ ] 7.5 Ensure RTL support in all new components

## 8. Testing & Verification

- [ ] 8.1 Test sign-in flow with email and OAuth providers
- [ ] 8.2 Test sign-up flow with email verification
- [ ] 8.3 Test guest session creation and persistence
- [ ] 8.4 Test thread CRUD operations (create, list, rename, delete)
- [ ] 8.5 Test thread history persistence across page reloads
- [ ] 8.6 Test sidebar responsiveness and collapse behavior
- [ ] 8.7 Run `npm run build && npm run lint && npm run vibecheck`

## 9. Documentation

- [ ] 9.1 Update `CLAUDE.md` with new architecture details
- [ ] 9.2 Update environment variables documentation
- [ ] 9.3 Add auth flow diagram to openspec design.md
