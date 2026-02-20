## ADDED Requirements

### Requirement: Landing Page Hero Vertical Centering
The landing page hero section SHALL be vertically and horizontally centered within the viewport using flexbox layout (`min-h-dvh`, `items-center`, `justify-center`). The hero MUST NOT rely on fixed padding-top values for vertical positioning. Below-the-fold sections (stats, how-it-works, examples) SHALL flow naturally after the centered hero block.

#### Scenario: Hero centered in tab-less browser
- **WHEN** the landing page is viewed on a desktop browser without a visible tab bar (e.g. Arc, Safari full-screen)
- **THEN** the hero section (logo, title, subtitle, CTA) is visually centered in the viewport height

#### Scenario: Hero centered in standard browser
- **WHEN** the landing page is viewed on Chrome or Firefox with a standard tab bar
- **THEN** the hero section remains vertically centered, adapting to the available viewport height

### Requirement: Empty Conversation Vertical Centering
The empty conversation view (header + suggestion cards) SHALL be vertically centered within the available chat area using flexbox alignment. The layout MUST NOT use fixed padding-top values for vertical positioning. The input area and AI disclaimer SHALL remain at the bottom of the chat area.

#### Scenario: Empty conversation centered on desktop
- **WHEN** a user opens a new conversation with no messages
- **THEN** the "במה אוכל לעזור?" header and the 4 suggestion cards are vertically centered in the space between the top of the chat area and the input box

### Requirement: Global Interactive Cursor Feedback
All interactive elements (buttons, links, role="button", selects) SHALL display `cursor: pointer` on hover. This MUST be enforced via a global CSS rule rather than per-component utility classes.

#### Scenario: Button shows pointer cursor
- **WHEN** the user hovers over any button or clickable element in the application
- **THEN** the cursor changes to a pointer hand icon

### Requirement: Landing Page CTA Icon
The landing page "התחל שיחה חדשה" call-to-action button SHALL display a plus (`+`) icon from lucide-react instead of the chat bubble icon, to clearly communicate "new conversation".

#### Scenario: CTA button shows plus icon
- **WHEN** the landing page is rendered
- **THEN** the CTA button displays a `Plus` icon to the right of the text "התחל שיחה חדשה"
