## 1. Theme Infrastructure (next-themes)
- [x] 1.1 Create `context/ThemeProvider.tsx` - client wrapper around next-themes ThemeProvider (attribute="class", defaultTheme="light", storageKey="theme", enableSystem=false)
- [x] 1.2 Modify `app/layout.tsx` - add `suppressHydrationWarning` to `<html>`, add ThemeProvider wrapping children + Toaster
- [x] 1.3 Refactor `components/navigation/NavUser.tsx` - remove manual useState/useEffect/classList theme logic, use `useTheme()` from next-themes
- [x] 1.4 Verify: `tsc` + `npm run build`

## 2. Convex Users Table + Clerk Webhook
- [x] 2.1 Modify `convex/schema.ts` - add `users` table with clerkId, email, firstName, lastName, imageUrl, themePreference, createdAt, updatedAt
- [x] 2.2 Create `convex/users.ts` - upsertFromClerk mutation, deleteByClerkId mutation, getCurrentUser query, updateThemePreference mutation
- [x] 2.3 Install `svix` dependency for webhook signature verification
- [x] 2.4 Create `convex/http.ts` - Convex httpRouter with httpAction handling user.created, user.updated, user.deleted events using svix Webhook verification
- [x] 2.5 Verify: `tsc` + `npm run build`

## 3. Authenticated Theme Sync
- [x] 3.1 Create `hooks/use-theme-sync.ts` - bridge next-themes with Convex user themePreference (Convex overrides localStorage for auth users)
- [x] 3.2 Update `components/navigation/NavUser.tsx` - replace `useTheme` with `useThemeSync`
- [x] 3.3 Verify: `tsc` + `npm run build` + `npm run lint`
