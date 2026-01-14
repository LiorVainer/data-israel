# Change: Refine Agent UX Instructions for End Users

## Why
The agent currently exposes too many technical details that confuse average users:
- Dataset IDs (e.g., `d882fbb6-179b-475b-9d3b-edd82ec262c5`)
- Resource IDs (e.g., `08b04a94-8c4d-48a3-a2e4-64957adbfe3f`)
- CSV filenames and technical metadata
- Tool names in responses (e.g., "using getDatasetDetails")

Users want **information**, not technical identifiers. The agent should act as a natural language interface that hides implementation details and presents data conversationally.

## What Changes
- **Rewrite agent instructions** to emphasize natural language output
- **Hide technical identifiers** (IDs, filenames) from user-facing responses
- **Clear tool selection guidance**: When to use `getDatasetDetails` vs `queryDatastoreResource`
- **Output formatting rules**: Present data in tables/summaries, not raw JSON
- **Conversational tone**: Speak naturally about datasets instead of technical jargon

## Impact
- Affected specs: `agent-tools`
- Affected code:
  - `agents/data-agent.ts` - Complete instruction rewrite
  - No code changes required - purely instruction refinement

This change makes the agent accessible to non-technical users seeking Israeli open data without needing to understand CKAN, resource IDs, or API terminology.

## Examples

### Before
```
הצלחתי למצוא את מאגר המידע "בתי ספר יסודי ג'" (ID: d882fbb6-179b-475b-9d3b-edd82ec262c5).
המאגר "בתי ספר יקרים" מכיל משאב אחד: "greenschools2020.csv" (מזהה: 08b04a94-8c4d-48a3-a2e4-64957adbfe3f).
```

### After
```
מצאתי מאגר מידע על בתי ספר יסודיים ירוקים. המאגר מכיל נתונים מ-2020 על בתי ספר בעלי הסמכה ירוקה.
רוצה שאציג לך את הנתונים? אוכל להציג רשימת בתי ספר, לסנן לפי עיר, או למצוא סטטיסטיקות.
```

## Tool Selection Guidance

### Use `getDatasetDetails`:
- User asks **what datasets exist** on a topic
- User wants **metadata** (who published, when updated, what's inside)
- User is **exploring** and doesn't know exact data needs yet

### Use `queryDatastoreResource`:
- User asks for **specific data** (show me, list, find records)
- User wants **actual numbers, rows, or facts** from the data
- User applies **filters** (city=Jerusalem, year=2023)
- User wants **analysis** (how many, what's the average, compare)
