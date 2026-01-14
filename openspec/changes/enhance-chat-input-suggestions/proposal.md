# Change: Enhanced Chat Input with Animated Suggestions

## Why

The current chat input uses the basic AI Elements PromptInput component, which lacks visual polish and interactivity. The empty state shows static example prompts that users cannot click. To improve user experience and encourage exploration, we need:
1. An animated, auto-resizing input with visual feedback
2. Interactive suggestion buttons that users can click to try example prompts

## What Changes

- Replace AI Elements `PromptInput` with a custom animated input component inspired by `WebsiteSuggestionInput`
- Convert static example prompts to interactive suggestion buttons similar to `WebsiteSuggestionsExamples`
- Add framer-motion package for smooth animations
- Add "gradient" variant to Button component for visual emphasis
- Create constants file for example prompts
- Implement auto-resizing textarea with smooth height transitions
- Add loading states and submit animations to the input

## Impact

- **Affected specs**: chat-ui (new specification)
- **Affected code**:
  - `app/page.tsx` - Replace PromptInput with new component
  - `components/ui/button.tsx` - Add gradient variant
  - `components/chat/` (new) - Enhanced input and suggestions components
  - `constants/` (new) - Example prompts constants
- **Dependencies**: Add `framer-motion` package (note: project currently uses `motion` which is Motion One, not Framer Motion)
- **Breaking changes**: None - purely visual enhancement
