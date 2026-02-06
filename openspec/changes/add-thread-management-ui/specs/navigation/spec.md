## MODIFIED Requirements

### Requirement: Threads Sidebar Group

The system SHALL display the user's conversation threads in a sidebar group using a `useThreadsData` hook and composable sub-components (`ThreadItem`, `ThreadDeleteModal`, `EmptyThreadsState`).

#### Scenario: Threads list displays
- **WHEN** sidebar loads
- **THEN** `useThreadsData` hook fetches threads via `usePaginatedQuery`
- **AND** threads are displayed using `ThreadItem` components
- **AND** each thread shows title and relative creation time in Hebrew

#### Scenario: Empty state
- **WHEN** user has no threads
- **THEN** `EmptyThreadsState` component renders "אין שיחות עדיין"

#### Scenario: Load more threads
- **WHEN** user clicks "טען עוד שיחות" button
- **THEN** `loadMoreThreads` from `useThreadsData` fetches next page
- **AND** additional threads append to the list

### Requirement: Thread Item Actions

The system SHALL provide rename and delete actions for thread items via hover dropdown (desktop) and long-press (mobile).

#### Scenario: Desktop hover dropdown
- **WHEN** user hovers over a thread item on desktop
- **THEN** a "..." button (MoreHorizontal icon) fades in via animation
- **AND** clicking opens a DropdownMenu with "שנה שם שיחה" (rename) and "מחק שיחה" (delete)

#### Scenario: Mobile long-press dropdown
- **WHEN** user long-presses a thread item on mobile (500ms threshold)
- **THEN** the same DropdownMenu opens in controlled mode
- **AND** the long-press prevents the default click/navigation

#### Scenario: Rename thread inline
- **WHEN** user selects "שנה שם שיחה" from dropdown
- **THEN** thread title becomes an editable Input field
- **AND** confirm (Check icon) and cancel (X icon) buttons appear
- **AND** confirming calls `renameThread` Convex mutation
- **AND** title updates in real-time on success

#### Scenario: Delete thread with confirmation
- **WHEN** user selects "מחק שיחה" from dropdown
- **THEN** `ThreadDeleteModal` dialog appears with Hebrew text
- **AND** dialog shows "מחיקת שיחה" title and "האם למחוק שיחה זו? כל ההודעות יימחקו לצמיתות." body
- **AND** confirming calls `deleteThread` Convex mutation
- **AND** sonner toast shows loading → success/error feedback
- **AND** if deleting the currently active thread, user is navigated to `/`

## ADDED Requirements

### Requirement: Toast Notifications

The system SHALL provide toast notifications for thread CRUD feedback using sonner.

#### Scenario: Delete thread toast flow
- **WHEN** user confirms thread deletion
- **THEN** a loading toast "מוחק שיחה..." appears
- **AND** on success, toast updates to "השיחה נמחקה בהצלחה"
- **AND** on error, toast updates to "שגיאה במחיקת השיחה"

### Requirement: Hebrew Relative Time Display

The system SHALL display thread creation times as Hebrew relative timestamps (e.g., "לפני 3 דקות").

#### Scenario: Thread shows relative time
- **WHEN** a thread is displayed in the sidebar
- **THEN** creation time is formatted using `formatDistanceToNow` with Hebrew locale
- **AND** includes "לפני" suffix for past times

### Requirement: Long-Press Mobile Gesture

The system SHALL support long-press gesture on mobile for opening thread action menus.

#### Scenario: Long-press triggers after threshold
- **WHEN** user touches and holds a thread item for 500ms
- **THEN** the action menu opens
- **AND** the touch-hold prevents navigation on release

#### Scenario: Short touch navigates
- **WHEN** user taps a thread item briefly (under 500ms)
- **THEN** normal navigation to the thread occurs
- **AND** no action menu opens
