# Capability: Navigation

Sidebar navigation and thread management UI components.

## ADDED Requirements

### Requirement: Application Sidebar

The system SHALL provide a collapsible sidebar (`AppSidebar`) that serves as the primary navigation for authenticated sections.

#### Scenario: Sidebar displays on main routes
- **WHEN** user navigates to chat or main application routes
- **THEN** sidebar is visible on the left side (or right in RTL)
- **AND** sidebar contains header, content, and footer sections
- **AND** main content area is adjacent to sidebar

#### Scenario: Sidebar can be collapsed
- **WHEN** user clicks the sidebar trigger button
- **THEN** sidebar collapses to icon-only view
- **AND** a rail is displayed for quick access
- **AND** sidebar can be expanded again

#### Scenario: Sidebar responsive on mobile
- **WHEN** viewport is mobile-sized
- **THEN** sidebar becomes a drawer overlay
- **AND** sidebar trigger shows menu icon
- **AND** clicking outside closes sidebar

### Requirement: Sidebar Header

The system SHALL display application branding and workspace context in the sidebar header.

#### Scenario: Header shows app logo and name
- **WHEN** sidebar is displayed
- **THEN** header shows application logo
- **AND** header shows workspace/team name
- **AND** header shows plan type (e.g., "Pro")

#### Scenario: Team switcher dropdown
- **WHEN** user clicks the team switcher
- **THEN** a dropdown menu appears with available teams
- **AND** user can switch between teams
- **AND** "Add team" option is available (future feature)

### Requirement: Threads Sidebar Group

The system SHALL display the user's conversation threads in a sidebar group with real-time updates.

#### Scenario: Threads list displays
- **WHEN** sidebar loads
- **THEN** user's threads are fetched via `listThreads` query
- **AND** threads are displayed in a scrollable list
- **AND** each thread shows title and creation date

#### Scenario: Real-time thread updates
- **WHEN** a new thread is created
- **OR** thread title is updated
- **THEN** sidebar list updates automatically
- **AND** no manual refresh is required

#### Scenario: Create new thread button
- **WHEN** user clicks "New Chat" button
- **THEN** a new thread is created
- **AND** user is navigated to the new thread
- **AND** thread appears in sidebar list

#### Scenario: Thread context menu
- **WHEN** user right-clicks or opens thread menu
- **THEN** options for "Rename" and "Delete" are shown
- **AND** user can perform actions on the thread

#### Scenario: Navigate to thread
- **WHEN** user clicks a thread in the sidebar
- **THEN** user is navigated to `/chat/[threadId]`
- **AND** thread content loads in main area

### Requirement: Thread Item Actions

The system SHALL provide rename and delete actions for thread items.

#### Scenario: Rename thread inline
- **WHEN** user selects "Rename" from thread menu
- **THEN** an input field appears for new title
- **AND** user can type new title and confirm
- **AND** thread title updates on confirmation

#### Scenario: Delete thread with confirmation
- **WHEN** user selects "Delete" from thread menu
- **THEN** confirmation dialog appears
- **AND** upon confirmation, thread is deleted
- **AND** if current thread, user is redirected

### Requirement: Nav User Component

The system SHALL display user profile information in the sidebar footer using Clerk's UserButton.

#### Scenario: Authenticated user profile
- **WHEN** user is signed in
- **THEN** sidebar footer shows user avatar
- **AND** clicking avatar opens Clerk UserButton menu
- **AND** user can access profile, settings, and sign out

#### Scenario: Guest user footer
- **WHEN** user is a guest (not signed in)
- **THEN** sidebar footer shows "Guest" indicator
- **AND** sign-in button is available
- **AND** clicking sign-in navigates to `/sign-in`

### Requirement: Sidebar Toolbar

The system SHALL provide quick action buttons in the sidebar toolbar area.

#### Scenario: New chat quick action
- **WHEN** toolbar is displayed
- **THEN** a "New Chat" button is visible
- **AND** clicking creates a new thread and navigates to it

### Requirement: Breadcrumb Navigation

The system SHALL display breadcrumb navigation in the main content header.

#### Scenario: Breadcrumb shows current location
- **WHEN** user is on a chat page
- **THEN** breadcrumb shows "Home > Thread Title"
- **AND** "Home" is clickable and returns to home
- **AND** current page is displayed as non-link

#### Scenario: Breadcrumb with sidebar trigger
- **WHEN** header is displayed
- **THEN** sidebar trigger button is present
- **AND** separator divides trigger from breadcrumb
- **AND** layout is consistent across pages

### Requirement: RTL Layout Support

The system SHALL support RTL (right-to-left) layout for Hebrew users.

#### Scenario: Sidebar on RTL layout
- **WHEN** document direction is RTL
- **THEN** sidebar appears on the right side
- **AND** content flows correctly
- **AND** icons and text align properly

#### Scenario: Hebrew text in sidebar
- **WHEN** thread titles are in Hebrew
- **THEN** text displays correctly in RTL
- **AND** truncation ellipsis appears on left side
- **AND** date formatting respects locale

### Requirement: Layout Route Groups

The system SHALL use Next.js route groups to apply sidebar layout selectively.

#### Scenario: Main routes have sidebar
- **WHEN** user navigates to routes under `(main)` group
- **THEN** AppSidebar layout is applied
- **AND** chat pages render within sidebar content area

#### Scenario: Auth routes without sidebar
- **WHEN** user navigates to `/sign-in` or `/sign-up`
- **THEN** no sidebar is displayed
- **AND** full-page auth UI is shown
- **AND** auth pages have their own layout
