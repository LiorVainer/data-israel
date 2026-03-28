# Capability: Shareable Output

## Purpose
Generate shareable visual summary cards from investigation results, enabling users to share their findings on social media with proper source attribution.

## ADDED Requirements

### Requirement: Server-Side Card Rendering
The system SHALL render investigation summary cards as images on the server.

#### Scenario: Generate card from investigation results
- **Given** a user completed an investigation and formulated a conclusion
- **When** the agent calls `generateShareableCard` with claim, key data, conclusion, and sources
- **Then** the system generates a 1200x630 PNG image with the investigation summary

#### Scenario: Card includes all required elements
- **Given** a shareable card is generated
- **When** the card image is rendered
- **Then** it contains: original claim, key data point(s), user's conclusion, source names, and verification badge

#### Scenario: Card is Hebrew RTL
- **Given** a card is generated for Hebrew content
- **When** the card is rendered
- **Then** all text is right-to-left, using Geist Sans font, with proper Hebrew typography

### Requirement: Card Download and Sharing
Users SHALL be able to download and share the generated card.

#### Scenario: Download as PNG
- **Given** a shareable card is displayed in the chat
- **When** the user clicks "הורד תמונה"
- **Then** the card is downloaded as a PNG file

#### Scenario: Card preview in chat
- **Given** the `generateShareableCard` tool is called
- **When** the result renders in the chat UI
- **Then** a preview of the card is shown inline with download action

### Requirement: Source Verification Badge
Every shareable card SHALL indicate that data comes from official sources.

#### Scenario: All-official-sources badge
- **Given** all data in the card comes from official government sources
- **When** the card is rendered
- **Then** a "✅ מאומת ממקורות רשמיים" badge is displayed

#### Scenario: Mixed sources disclaimer
- **Given** some data comes from non-official sources (e.g., Budget Key is an NGO)
- **When** the card is rendered
- **Then** sources are listed individually with their operator type

## Related Capabilities
- `claim-investigation-flow` — Shareable output is the final step of investigation
