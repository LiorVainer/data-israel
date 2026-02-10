## Context

The application has `next-themes@0.4.6` installed but unused. The `sonner.tsx` Toaster already calls `useTheme()` from next-themes, silently falling back to system default. NavUser manually toggles dark mode via `document.documentElement.classList` and `localStorage`. There is no Convex `users` table or Clerk webhook integration.

## Goals / Non-Goals

- Goals:
  - FOUC-free theme persistence using next-themes (localStorage-backed)
  - Clerk user sync to Convex via webhook for future user features
  - Authenticated users' theme stored in Convex and synced on load
- Non-Goals:
  - System theme auto-detection (explicitly disabled)
  - Multi-preference storage beyond theme (future work)
  - Custom Clerk sign-in/sign-up UI changes

## Decisions

- **next-themes over manual localStorage**: next-themes handles the `<script>` injection for FOUC prevention, SSR compatibility, and class attribute management. It's already installed and imported by sonner.tsx.
- **Convex HTTP action for webhook (over Next.js API route)**: Using `httpAction` + `httpRouter` in `convex/http.ts` keeps the webhook handler co-located with mutations. Webhook signature verification uses `svix` (Clerk's underlying library). This avoids an extra network hop from Next.js API route to Convex and is the officially recommended Clerk+Convex pattern.
- **`useThemeSync` hook pattern**: A custom hook wraps `useTheme()` and conditionally syncs to Convex when authenticated. This keeps the theme toggle logic clean in NavUser.tsx and makes it reusable.
- **Convex preference overrides localStorage**: On load, if a Convex `themePreference` exists for the authenticated user and differs from the current next-themes value, we call `setTheme()`. This ensures cross-device consistency.

## Risks / Trade-offs

- **Webhook secret management**: Requires `CLERK_WEBHOOK_SIGNING_SECRET` Convex environment variable (set via Convex dashboard or `npx convex env set`). Missing secret will cause webhook verification to fail. Mitigation: clear error logging in the httpAction handler.
- **Race condition on first load**: Convex query may resolve after next-themes has already applied the localStorage theme. Mitigation: the sync effect will correct the theme once the query resolves; the flash is from light→dark or vice versa for at most one render cycle.

## Open Questions

- None at this time.
