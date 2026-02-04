# Design: Clerk Authentication with Guest Sessions and Thread Management

## Context

The data-gov project is a Next.js 16 application with Mastra agents and Convex backend. It currently:
- Uses UUID-based thread IDs generated client-side
- Has no user authentication or session management
- Uses Mastra's ConvexStore for thread/message persistence
- Has a simple chat interface without sidebar navigation

The sitewave project provides a proven pattern with:
- Clerk Elements for customizable sign-in/sign-up
- Guest sessions stored in localStorage with Convex backing
- Convex-agent threads (but we'll use Mastra's native thread APIs instead)
- AppSidebar with real-time thread list

## Goals / Non-Goals

### Goals
- Enable user authentication via Clerk (Google One Tap only)
- Support anonymous guest sessions that persist across browser sessions
- Manage conversation threads using Mastra's native memory APIs
- Provide sidebar navigation for thread management
- Maintain Hebrew RTL support throughout

### Non-Goals
- User profile editing (use Clerk's hosted pages)
- Guest-to-user session migration (future enhancement)
- Team/workspace collaboration features
- Offline support or PWA capabilities

## Decisions

### Decision 0: Clerk + Convex Integration Pattern

**What**: Use official Clerk + Convex integration with `ConvexProviderWithClerk` and JWT validation.

**Why**:
- Official integration ensures secure token validation
- Convex validates Clerk JWTs server-side via `ctx.auth.getUserIdentity()`
- Single source of truth for auth state

**Setup**:
1. Create **Convex JWT Template** in Clerk Dashboard
2. Copy **Issuer URL** (Frontend API URL) to environment
3. Configure `convex/auth.config.ts` with provider

**convex/auth.config.ts**:
```typescript
export default {
  providers: [
    {
      domain: process.env.CLERK_FRONTEND_API_URL,
      applicationID: 'convex',
    },
  ],
};
```

**Provider Hierarchy** (order matters!):
```tsx
// app/layout.tsx
<ClerkProvider>              {/* Outer - provides Clerk context */}
  <ConvexClientProvider>     {/* Inner - uses Clerk's useAuth */}
    <UserProvider>           {/* Innermost - unified user context */}
      {children}
    </UserProvider>
  </ConvexClientProvider>
</ClerkProvider>
```

**ConvexClientProvider**:
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

**Important: Use Convex Auth Components**:
```tsx
// Use these (from convex/react):
import { Authenticated, Unauthenticated } from 'convex/react'
import { useConvexAuth } from 'convex/react'

// NOT these (from @clerk/nextjs):
// import { SignedIn, SignedOut } from '@clerk/nextjs'  // ❌
// import { useAuth } from '@clerk/nextjs'              // ❌ for auth state
```

The reason: Convex's `<Authenticated>` waits for the JWT to be validated by Convex backend, while Clerk's `<SignedIn>` only checks client-side state.

**Accessing User Identity in Convex**:
```typescript
// In any Convex query/mutation/action
export const myFunction = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      // User is not authenticated
      return null;
    }
    // identity.subject = Clerk user ID
    // identity.email, identity.name, etc.
  },
});
```

### Decision 1: Use Mastra Memory APIs Directly (No Custom Convex CRUD)

**What**: Use Mastra's built-in Memory APIs for all thread operations, with thin Convex queries only for real-time UI reactivity.

**Why**:
- data-gov already has Mastra with `ConvexStore` - thread data is in `mastra_threads` table
- Mastra provides complete thread CRUD: `createThread`, `listThreads`, `getThreadById`, `thread.update()`, `thread.delete()`
- No need to duplicate CRUD logic in Convex mutations
- Convex queries can read directly from `mastra_threads` for real-time `useQuery` reactivity

**Architecture**:
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
├─────────────────────────────────────────────────────────────┤
│  Thread List UI                    Chat UI                   │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │ useQuery(       │              │ useChat()       │       │
│  │  api.threads.   │              │ POST /api/chat  │       │
│  │  listUserThreads│              └────────┬────────┘       │
│  │ )               │                       │                 │
│  │ (real-time)     │                       ▼                 │
│  └────────┬────────┘              ┌─────────────────┐       │
│           │                       │ Mastra Memory   │       │
│           ▼                       │ (handles CRUD)  │       │
│  ┌─────────────────┐              └────────┬────────┘       │
│  │ Convex Query    │                       │                 │
│  │ (reads mastra_  │◀──────────────────────┘                │
│  │  threads table) │      (same underlying data)            │
│  └─────────────────┘                                        │
└─────────────────────────────────────────────────────────────┘
```

**Server-Side (API Routes)**:
```typescript
// app/api/threads/route.ts
import { mastra } from '@/agents/mastra';

export async function GET(req: Request) {
  const memory = await mastra.getAgentById('routingAgent').getMemory();
  const { threads } = await memory.listThreads({
    filter: { resourceId: userId },
    page: 0,
    perPage: 50,
  });
  return NextResponse.json(threads);
}

export async function POST(req: Request) {
  const { title } = await req.json();
  const memory = await mastra.getAgentById('routingAgent').getMemory();
  const thread = await memory.createThread({
    resourceId: userId,
    metadata: { title: title || 'New Conversation' },
  });
  return NextResponse.json(thread);
}
```

**Client-Side (Real-Time via Convex)**:
```typescript
// convex/threads.ts - thin query for real-time reactivity
export const listUserThreads = query({
  args: { resourceId: v.string() },
  handler: async (ctx, { resourceId }) => {
    // Read directly from mastra_threads table (populated by Mastra)
    const threads = await ctx.db
      .query('mastra_threads')
      .withIndex('by_resourceId', q => q.eq('resourceId', resourceId))
      .order('desc')
      .take(50);
    return threads;
  },
});
```

**Client-Side (MastraClient for mutations)**:
```typescript
// For delete/rename, use MastraClient directly
import { MastraClient } from '@mastra/client-js';

const client = new MastraClient({ baseUrl: '/api' });
const thread = await client.getMemoryThread({ threadId, agentId: 'routingAgent' });
await thread.update({ title: 'New Title' });
await thread.delete();
```

### Decision 2: Google One Tap for Authentication

**What**: Use Clerk's `<GoogleOneTap />` component for sign-in/sign-up pages with custom Google OAuth credentials.

**Why**:
- One-click authentication improves conversion rates
- Uses Google's native UI for familiar user experience
- Automatically handles both sign-in and sign-up flows
- Supports FedCM API for enhanced privacy
- Works with custom Google OAuth credentials for production

**Configuration**:
```typescript
import { GoogleOneTap } from '@clerk/nextjs'

// In sign-in or sign-up page
<GoogleOneTap
  signInForceRedirectUrl="/chat"
  signUpForceRedirectUrl="/chat"
  cancelOnTapOutside={true}
/>
```

**Custom Google OAuth Setup**:
1. Create OAuth 2.0 credentials in Google Cloud Console
2. In Clerk Dashboard > User & Authentication > Social Connections > Google
3. Enable "Use custom credentials" toggle
4. Enter Client ID and Client Secret from Google
5. Copy Clerk's Authorized Redirect URI to Google Cloud Console

**Alternatives Considered**:
- Clerk Elements with manual OAuth buttons: More code, less native feel
- Pre-built `<SignIn />` component: Less control over UX
- Multiple OAuth providers: Unnecessary complexity for single-provider auth

### Decision 3: Guest Sessions via localStorage + Convex (Sitewave Pattern)

**What**: Store guest session ID in localStorage, create guest record in Convex `guests` table, using the `useGuestSession` hook pattern from sitewave.

**Why**:
- Enables conversation history for unauthenticated users
- Guest ID persists across browser sessions
- Can be associated with user account later
- Convex provides server-side guest record validation

**Schema**:
```typescript
guests: defineTable({
  sessionId: v.string(),  // localStorage key value
  createdAt: v.number(),
})
  .index('by_session_id', ['sessionId'])
```

**useGuestSession Hook** (from sitewave):
```typescript
// hooks/use-guest-session.ts
export const useGuestSession = () => {
  const { isAuthenticated } = useConvexAuth();
  const [sessionId, setSessionId] = useLocalStorage('guest-session-id', '');
  const [guestId, setGuestId] = useLocalStorage<Id<'guests'> | null>('guest-id', null);
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);

  const createNewGuest = useMutation(api.guests.createNewGuest);

  // Generate session ID if none exists
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = crypto.randomUUID();
      setSessionId(`guest-${newSessionId}`);
    }
  }, [sessionId, setSessionId]);

  // Auto-create guest when unauthenticated
  useEffect(() => {
    if (!isAuthenticated && !guestId && sessionId && !isCreatingGuest) {
      createGuest();
    }
  }, [isAuthenticated, guestId, sessionId, isCreatingGuest]);

  const ensureGuestExists = async (): Promise<Id<'guests'>> => {
    if (guestId) return guestId;
    // ... create guest if needed
  };

  return {
    guestId,
    sessionId,
    ensureGuestExists,
    isCreatingGuest,
    isAuthenticated,
  };
};
```

**useLocalStorage Hook**:
```typescript
// hooks/use-local-storage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    const valueToStore = value instanceof Function ? value(storedValue) : value;
    setStoredValue(valueToStore);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    }
  };

  return [storedValue, setValue] as const;
}
```

### Decision 4: Unified UserContext for Auth State (Sitewave Pattern)

**What**: Create `UserContext` and `useUser` hook that provides unified interface for both authenticated users and guests, following the sitewave project pattern.

**Why**:
- Components don't need to handle auth vs guest logic
- Single source of truth for user identity
- Simplifies thread ownership queries
- Proven pattern from sitewave project

**Interface**:
```typescript
// context/UserContext.tsx
interface UserContextType {
  // Authentication state
  isAuthenticated: boolean;
  isLoading: boolean;

  // Guest session management
  guestId: Id<'guests'> | null;
  sessionId: string;
  isCreatingGuest: boolean;
  ensureGuestExists: () => Promise<Id<'guests'>>;

  // Computed user identifier for queries
  userId: string | null; // Clerk identity.subject or guestId
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
```

**Implementation**:
```typescript
// context/UserContext.tsx
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const { guestId, sessionId, isCreatingGuest, ensureGuestExists } = useGuestSession();

  // For authenticated users, Convex uses identity.subject internally
  // For guests, we use the guestId
  const userId = isAuthenticated ? null : guestId;

  const contextValue: UserContextType = {
    isAuthenticated,
    isLoading: isAuthLoading || isCreatingGuest,
    guestId,
    sessionId,
    isCreatingGuest,
    ensureGuestExists,
    userId,
  };

  return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};
```

**Usage in Components**:
```typescript
// In any component that needs user identity
const { userId, guestId, isAuthenticated, isLoading } = useUser();

// For Convex queries that need user identification
const threads = useQuery(api.threads.listThreads, { guestId: userId });

// For operations that need to ensure guest exists
const handleCreateThread = async () => {
  const id = isAuthenticated ? undefined : await ensureGuestExists();
  await createThread({ guestId: id });
};
```

### Decision 5: Sidebar Layout with Route Groups

**What**: Use Next.js route groups `(main)` for authenticated/sidebar layout, keep auth pages at root.

**Why**:
- Clean separation of layout concerns
- Auth pages don't need sidebar
- Matches sitewave pattern
- Enables different layouts per route group

**Structure**:
```
app/
├── layout.tsx              # Root: ClerkProvider + ConvexClientProvider
├── sign-in/[[...sign-in]]/ # No sidebar
├── sign-up/[[...sign-up]]/ # No sidebar
└── (main)/
    ├── layout.tsx          # AppSidebar wrapper
    ├── page.tsx            # Redirect to latest thread
    └── chat/[id]/page.tsx  # Chat with sidebar
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐    ┌──────────────────────────────────┐  │
│  │   ClerkProvider   │    │        ConvexClientProvider      │  │
│  │  (Auth Context)   │───▶│   (ConvexProviderWithClerk)      │  │
│  └──────────────────┘    └──────────────────────────────────┘  │
│           │                              │                       │
│           ▼                              ▼                       │
│  ┌──────────────────┐    ┌──────────────────────────────────┐  │
│  │   UserProvider    │    │         UserContext              │  │
│  │ (Guest Session)   │───▶│  isAuth, guestId, userId         │  │
│  └──────────────────┘    └──────────────────────────────────┘  │
│                                          │                       │
│                                          ▼                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                      AppSidebar                           │  │
│  │  ┌────────────┐  ┌────────────────┐  ┌───────────────┐   │  │
│  │  │   Header   │  │ ThreadsList    │  │   NavUser     │   │  │
│  │  │  (Logo)    │  │ (useQuery)     │  │ (UserButton)  │   │  │
│  │  └────────────┘  └────────────────┘  └───────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    ChatThread                             │  │
│  │         useChat() → POST /api/chat                        │  │
│  │         memory: { thread: id, resource: userId }          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Convex Backend                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   guests    │  │ mastra_     │  │    Mastra ConvexStore   │ │
│  │   table     │  │ threads     │  │    (Memory Storage)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   threads.ts                              │  │
│  │  createNewThread, listThreads, deleteThread, rename...   │  │
│  │  Uses: mastra.getAgentById().getMemory()                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Thread Management Flow

```
User opens app
    │
    ├─ Authenticated? ──▶ userId = clerk.subject
    │
    └─ Not authenticated? ──▶ Check localStorage for guestId
                                    │
                                    ├─ Has guestId? ──▶ userId = guestId
                                    │
                                    └─ No guestId? ──▶ Create guest via Convex
                                                       └─▶ userId = newGuestId
    │
    ▼
List threads for userId
    │
    ├─ Has threads? ──▶ Show in sidebar, navigate to latest
    │
    └─ No threads? ──▶ Create new thread, navigate to it
    │
    ▼
User sends message
    │
    ▼
POST /api/chat
    body: { messages, memory: { thread: threadId, resource: userId } }
    │
    ▼
Mastra agent.generate()
    ├─ Saves messages to Convex via ConvexStore
    └─ Returns streamed response
    │
    ▼
After first response, schedule title generation
    │
    ▼
Agent generates title/summary via generateObject()
    └─ Updates thread metadata
```

## Risks / Trade-offs

### Risk 1: Mastra Memory API Limitations
**Risk**: Mastra memory API may not support all thread operations needed.
**Mitigation**: Review Mastra docs thoroughly; fallback to direct Convex queries if needed.

### Risk 2: Guest Session Cleanup
**Risk**: Guest records may accumulate without cleanup.
**Mitigation**: Add scheduled function to delete old guest sessions (>30 days inactive).

### Risk 3: Thread Ownership Validation
**Risk**: Users could access threads they don't own by guessing thread IDs.
**Mitigation**: Always validate userId matches thread's resourceId in queries.

## Open Questions

1. **Guest-to-User Migration**: Should we implement merging guest threads when user signs up?
   - Defer to future change; keep as separate enhancement.

2. **Thread Archiving**: Should users be able to archive instead of delete threads?
   - Start with delete only; add archive if users request it.

3. **Shared Threads**: Should threads be shareable with other users?
   - Out of scope for this change; requires additional access control design.
