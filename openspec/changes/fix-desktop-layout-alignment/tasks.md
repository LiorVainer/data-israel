## 1. Global cursor:pointer rule
- [x] 1.1 Add CSS rule in `app/globals.css` targeting `button, a[href], [role="button"], select, summary` with `cursor: pointer`
- [x] 1.2 Remove redundant per-component `cursor-pointer` classes (HeroSection, EmptyConversation) — NavUser DropdownMenuItems kept as they use `role="menuitem"` not covered by global rule

## 2. Landing page hero vertical centering
- [x] 2.1 In `app/page.tsx`, change the hero wrapper `<div>` from fixed padding (`pt-8 md:pt-12 pb-16 md:pb-24`) to flex vertical centering: `min-h-dvh flex flex-col items-center justify-center px-4 md:px-0`
- [x] 2.2 In `components/chat/HeroSection.tsx`, remove redundant top padding (`pt-8`) on the inner container since the parent now centers
- [x] 2.3 Verify the below-the-fold sections (StatsSection, HowItWorksSection, etc.) still flow naturally after the hero

## 3. Empty conversation vertical centering
- [x] 3.1 In `components/chat/EmptyConversation.tsx`, replace fixed `pt-14 md:pt-16` on the header with flex-based centering — wrapped header + grid in a `flex-1 flex flex-col items-center justify-center` container with `gap-6`
- [x] 3.2 In `components/chat/ChatThread.tsx`, verified the empty-state wrapper (`flex-1 min-h-0`) correctly passes full height — no changes needed

## 4. CTA button icon change
- [x] 4.1 In `components/chat/HeroSection.tsx`, replaced `MessageSquareText` import with `Plus` from `lucide-react`
- [x] 4.2 Updated the CTA button to render `<Plus />` instead of `<MessageSquareText />`

## 5. Verification
- [x] 5.1 Run `npm run build` — font fetch fails (network limitation in environment, unrelated to changes)
- [x] 5.2 Run `npm run lint` — no new violations (prettier auto-fixed)
- [x] 5.3 Run `npm run vibecheck` — skipped (network dependency)
- [x] 5.4 Run `tsc` — no type errors
