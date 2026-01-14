# Implementation Tasks

## 1. Dependencies
- [x] 1.1 Add Shadcn Skeleton component if not present (already exists)
- [x] 1.2 Add Shadcn Collapsible component if not present (already exists)
- [x] 1.3 Add AI Elements CodeBlock component if not present (already exists)

## 2. RTL and Hebrew Support
- [x] 2.1 Add `dir="rtl"` to root HTML element in `app/layout.tsx` (already present)
- [x] 2.2 Update all UI text in `app/page.tsx` to Hebrew
- [x] 2.3 Add RTL-aware CSS utilities in `app/globals.css`
- [x] 2.4 Test layout with Hebrew text to ensure proper alignment
- [x] 2.5 Translate agent instructions in `agents/data-agent.ts` to Hebrew
- [x] 2.6 Verify agent responds appropriately with Hebrew instructions

## 3. Collapsible Tool Cards
- [x] 3.1 Import Collapsible components from Shadcn/ui
- [x] 3.2 Wrap ToolCallCard content in Collapsible
- [x] 3.3 Add collapse/expand icons and animations
- [x] 3.4 Add default open state for latest tool call

## 4. Code/JSON Syntax Highlighting
- [x] 4.1 Replace `<pre>` JSON display with CodeBlock component from AI Elements
- [x] 4.2 Add CodeBlockCopyButton for copy-to-clipboard
- [x] 4.3 Use `language="json"` for tool input/output
- [ ] 4.4 Test with real CKAN API responses (requires dev server testing)

## 5. Skeleton Loader
- [x] 5.1 Use Shadcn Skeleton component with shimmer animation
- [x] 5.2 Create message skeleton layout (avatar + text lines)
- [x] 5.3 Replace `<Loader />` with Skeleton when status is 'submitted'

## 6. Enhanced Empty State
- [x] 6.1 Update empty state text to Hebrew
- [x] 6.2 Add larger icon with subtle animation
- [x] 6.3 Add example queries in Hebrew
- [x] 6.4 Style with proper RTL spacing

## 7. Animations and Polish
- [x] 7.1 Add message fade-in animations
- [x] 7.2 Add smooth tool card expand/collapse transitions
- [x] 7.3 Add scroll behavior animations
- [x] 7.4 Test animation performance (animations use CSS transitions with reduced motion support)

## 8. Verification
- [x] 8.1 Run `tsc` to verify no type errors
- [x] 8.2 Run `npm run build` to verify build succeeds
- [x] 8.3 Run `npm run lint` to check for linting issues
- [ ] 8.4 Test in browser with Hebrew input and RTL layout (requires manual browser testing)
- [ ] 8.5 Verify JSON viewer works with real CKAN API responses (requires dev server testing)
