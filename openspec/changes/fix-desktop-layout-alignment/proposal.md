# Change: Fix Desktop Layout Alignment & Interactive Element Polish

## Why
On desktop, the landing-page hero section and the empty-conversation view sit too high on the screen — especially noticeable in browsers without a tab bar (e.g. Arc, Safari full-screen). The content uses fixed padding-top values instead of flex-based vertical centering, so the perceived position shifts depending on the browser chrome height. Additionally, several interactive elements are missing `cursor: pointer` feedback, and the landing-page CTA button ("התחל שיחה חדשה") uses a `MessageSquareText` icon instead of a plus icon that better communicates "new conversation".

## What Changes
1. **Landing page hero vertical centering** — Replace fixed `pt-8 md:pt-12` padding with flex-based vertical centering (`min-h-[dvh]` + `items-center justify-center`) so the hero section is always centered relative to the visible viewport, regardless of browser chrome height.
2. **Empty conversation vertical centering** — Center the header + suggestion cards vertically within the available space using flex `justify-center` instead of fixed `pt-14 md:pt-16` padding, so the empty state sits in the visual center of the chat area.
3. **Global cursor:pointer for interactive elements** — Add a global CSS rule that sets `cursor: pointer` on all `button`, `a[href]`, `[role="button"]`, and `select` elements so no interactive element is missed.
4. **CTA button icon** — Change the landing-page CTA icon from `MessageSquareText` to `Plus` (from lucide-react) to better convey "start new conversation".

## Impact
- Affected specs: `chat-ui` (new capability spec)
- Affected code:
  - `app/page.tsx` — Hero wrapper layout classes
  - `components/chat/HeroSection.tsx` — CTA button icon
  - `components/chat/EmptyConversation.tsx` — Vertical centering of header + cards
  - `components/chat/ChatThread.tsx` — Empty-state wrapper alignment
  - `app/globals.css` — Global cursor:pointer rule
