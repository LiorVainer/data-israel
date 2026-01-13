# Implementation Tasks

## 1. Package Dependencies
- [x] 1.1 Install framer-motion package

## 2. Constants Setup
- [x] 2.1 Create `constants/prompts.ts` with Hebrew example prompts
- [x] 2.2 Define prompt examples object with subject keys

## 3. Button Component Enhancement
- [x] 3.1 Add "gradient" variant to button component
- [x] 3.2 Test gradient variant styling

## 4. Chat Components
- [x] 4.1 Create `components/chat/` directory
- [x] 4.2 Create `EnhancedChatInput.tsx` component
  - Auto-resizing textarea with smooth animations
  - Clear button with fade animation
  - Submit button with loading/send state transitions
  - Hidden sizer div for height measurement
- [x] 4.3 Create `PromptSuggestions.tsx` component
  - Grid layout for suggestion buttons
  - Click handlers to populate input
  - Responsive design

## 5. Integration
- [x] 5.1 Update `app/page.tsx` to use new components
- [x] 5.2 Replace PromptInput with EnhancedChatInput
- [x] 5.3 Add PromptSuggestions to empty state
- [x] 5.4 Wire up suggestion button click handlers

## 6. Verification
- [x] 6.1 Run `npm run build` to verify no build errors
- [x] 6.2 Run `npm run lint` to check for linting issues
- [x] 6.3 Run `npm run vibecheck` for code quality validation
- [x] 6.4 Run `tsc` to verify TypeScript types
- [x] 6.5 Manual testing: test input animations and suggestion clicks

## 7. Additional Enhancements
- [x] 7.1 Fix ToolCallCard to use LTR direction for JSON display
- [x] 7.2 Update theme colors to dark blue for government/modern look
- [x] 7.3 Update gradient button to medium-to-dark blue fade
- [x] 7.4 Exclude components-ref from TypeScript and ESLint
