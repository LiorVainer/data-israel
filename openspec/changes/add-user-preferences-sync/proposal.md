# Change: Add Theme Persistence and Clerk-Convex User Sync

## Why

Theme only persists to localStorage via raw DOM manipulation, with no `next-themes` integration despite it being installed. There is no Convex `users` table and no mechanism to sync Clerk users to Convex, meaning authenticated users lose their preferences across devices.

## What Changes

- Integrate `next-themes` ThemeProvider to replace manual DOM-based theme toggling with proper SSR-safe persistence (localStorage key `"theme"`, no FOUC)
- Add Convex `users` table with `themePreference` field for server-side preference storage
- Add Clerk webhook handler in `convex/http.ts` using Convex `httpRouter` + `httpAction` to sync `user.created`, `user.updated`, `user.deleted` events directly in Convex (requires `svix` for verification)
- Create `useThemeSync` hook to bridge `next-themes` with Convex for authenticated users (Convex preference takes priority on load)
- Refactor `NavUser.tsx` to use `next-themes` / `useThemeSync` instead of raw `useState` + `classList` manipulation

## Impact

- Affected specs: `user-preferences` (NEW), `authentication` (ADDED requirement)
- Affected code:
  - `app/layout.tsx` - Add `suppressHydrationWarning`, wrap with `ThemeProvider`
  - `components/navigation/NavUser.tsx` - Replace manual theme logic with `useThemeSync`
  - `convex/schema.ts` - Add `users` table
  - New: `context/ThemeProvider.tsx`, `convex/users.ts`, `convex/http.ts`, `hooks/use-theme-sync.ts`
  - New dependency: `svix` (for webhook signature verification in Convex runtime)
