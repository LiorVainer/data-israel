## 1. Global cursor:pointer rule
- [ ] 1.1 Add CSS rule in `app/globals.css` targeting `button, a[href], [role="button"], select, summary` with `cursor: pointer`
- [ ] 1.2 Remove redundant per-component `cursor-pointer` classes (HeroSection, EmptyConversation, NavUser, etc.) — optional cleanup, not blocking

## 2. Landing page hero vertical centering
- [ ] 2.1 In `app/page.tsx`, change the hero wrapper `<div>` from fixed padding (`pt-8 md:pt-12 pb-16 md:pb-24`) to flex vertical centering: `min-h-dvh flex flex-col items-center justify-center px-4 md:px-0`
- [ ] 2.2 In `components/chat/HeroSection.tsx`, remove or reduce redundant top padding (`pt-8`) on the inner container since the parent now centers
- [ ] 2.3 Verify the below-the-fold sections (StatsSection, HowItWorksSection, etc.) still flow naturally after the hero

## 3. Empty conversation vertical centering
- [ ] 3.1 In `components/chat/EmptyConversation.tsx`, replace fixed `pt-14 md:pt-16` on the header with flex-based centering — wrap header + grid in a `flex-1 flex flex-col items-center justify-center` container so they sit in the vertical center of the available space
- [ ] 3.2 In `components/chat/ChatThread.tsx`, ensure the empty-state wrapper (`flex-1 min-h-0`) correctly passes full height to `EmptyConversation`

## 4. CTA button icon change
- [ ] 4.1 In `components/chat/HeroSection.tsx`, replace `MessageSquareText` import with `Plus` from `lucide-react`
- [ ] 4.2 Update the CTA button to render `<Plus />` instead of `<MessageSquareText />`

## 5. Verification
- [ ] 5.1 Run `npm run build` — must succeed
- [ ] 5.2 Run `npm run lint` — no new violations
- [ ] 5.3 Run `npm run vibecheck` — quality score maintained
- [ ] 5.4 Run `tsc` — no type errors
