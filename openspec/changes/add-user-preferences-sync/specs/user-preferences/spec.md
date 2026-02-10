## ADDED Requirements

### Requirement: Theme Persistence
The system SHALL persist theme choice via next-themes (localStorage key `"theme"`) and apply it on app load without FOUC (Flash of Unstyled Content).

#### Scenario: Guest user toggles theme
- **WHEN** an unauthenticated user toggles theme to dark mode
- **THEN** the `dark` class SHALL be applied to the `<html>` element
- **AND** the value `"dark"` SHALL be stored in localStorage under key `"theme"`
- **AND** on page reload the dark theme SHALL be applied immediately without flash

#### Scenario: Theme default
- **WHEN** no theme preference exists in localStorage
- **THEN** the system SHALL default to `"light"` theme

### Requirement: Authenticated Theme Sync
The system SHALL store theme preference in Convex `users.themePreference` for authenticated users, with Convex taking priority over localStorage on load.

#### Scenario: Authenticated user toggles theme
- **WHEN** an authenticated user toggles theme to dark mode
- **THEN** the system SHALL update next-themes (localStorage)
- **AND** the system SHALL update `users.themePreference` to `"dark"` in Convex

#### Scenario: Authenticated user loads app
- **WHEN** an authenticated user loads the application
- **AND** their Convex `themePreference` is `"dark"` but localStorage has `"light"`
- **THEN** the system SHALL apply `"dark"` theme (Convex overrides localStorage)

#### Scenario: No Convex preference
- **WHEN** an authenticated user has no `themePreference` stored in Convex
- **THEN** the system SHALL fall back to the next-themes localStorage value

### Requirement: Theme Toggle UI
The system SHALL provide a light/dark toggle in the NavUser sidebar component for both guest and authenticated users.

#### Scenario: Toggle display
- **WHEN** the user views the sidebar
- **THEN** a theme toggle button SHALL be visible showing Sun icon in dark mode and Moon icon in light mode
- **AND** the label SHALL read "light mode" or "dark mode" in Hebrew
