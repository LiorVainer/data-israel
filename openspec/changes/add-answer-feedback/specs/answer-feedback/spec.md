## ADDED Requirements

### Requirement: Answer Rating Widget

The system SHALL display a feedback widget below each completed assistant message (after source URLs) with thumbs-up ("עזר לי") and thumbs-down ("לא עזר") buttons.

#### Scenario: Widget appears after streaming completes

- **WHEN** an assistant message finishes streaming
- **THEN** a feedback widget with labeled thumbs-up ("עזר לי") and thumbs-down ("לא עזר") buttons is rendered below the answer and source URLs

#### Scenario: Widget hidden during streaming

- **WHEN** an assistant message is actively streaming
- **THEN** no feedback widget is shown for that message

#### Scenario: Widget hidden for user messages

- **WHEN** a message has role "user"
- **THEN** no feedback widget is rendered

### Requirement: Answer Content Storage

The system SHALL store every question/answer text pair in a Convex `answers` table, created automatically when each assistant response finishes streaming — regardless of whether the user rates it.

#### Scenario: Answer record created on stream finish

- **WHEN** an assistant message finishes streaming (status transitions to ready)
- **THEN** an `answers` record is created with the `threadId`, `messageId`, `userId`, the preceding user prompt text, and the assistant response text

#### Scenario: Idempotent creation

- **WHEN** the same assistant message triggers the creation effect multiple times (e.g., re-render)
- **THEN** no duplicate record is created (messageId serves as idempotency key)

### Requirement: Rating Persistence

The system SHALL persist each rating in the Convex `answer_ratings` table with upsert semantics (one rating per user per answer). Both authenticated users and guests SHALL be able to rate answers. Ratings reference an `answerId` foreign key to the `answers` table.

#### Scenario: User rates an answer

- **WHEN** a user (authenticated or guest) clicks the thumbs-up or thumbs-down button
- **THEN** the rating is saved to Convex with the answerId, userId, and rating value

#### Scenario: User changes their rating

- **WHEN** a user clicks a different rating button on a previously rated message
- **THEN** the existing rating record is updated to reflect the new choice

#### Scenario: User toggles off their rating

- **WHEN** a user clicks the currently selected rating button
- **THEN** the rating record is removed

#### Scenario: Rating hydration on page load

- **WHEN** a user navigates to an existing thread
- **THEN** previously submitted ratings are loaded and reflected in the widget UI

### Requirement: Feedback Analytics in Admin Dashboard

The system SHALL display aggregate feedback statistics as a new section in the existing admin analytics dashboard, respecting the shared time-range filter.

#### Scenario: Aggregate stats display

- **WHEN** an admin views the analytics dashboard
- **THEN** a "דירוג תשובות" section shows total answers (all Q&A pairs), total rated, good count with percentage, and bad count with percentage

#### Scenario: Time-range filtering

- **WHEN** the admin selects a time range (e.g., "7 ימים")
- **THEN** the rating statistics update to reflect only ratings within that period

#### Scenario: No ratings yet

- **WHEN** no answers have been rated in the selected time range
- **THEN** the section shows zero counts
