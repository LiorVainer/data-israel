# Proposal: Add Source-Based Suggestions to Empty Conversation

## Change ID
`add-source-based-suggestions`

## Summary
Replace the flat prompt cards grid in `EmptyConversation` with a tabbed layout grouped by data source. Each data source defines its own example prompts (suggestions) as part of `DataSourceDefinition`, making the empty state config-driven and auto-populated when new sources are added.

## Motivation
The current `EmptyConversation` shows 8 hardcoded prompt cards from `constants/prompt-cards.ts`. These cards only cover data.gov.il and CBS topics. With 8 data sources now, users have no visual hint that they can ask about Knesset legislation, real estate prices, drug information, health dashboards, grocery prices, or government budgets. Grouping suggestions by source teaches users what the system can do.

## Scope

### In scope
- Add `suggestions` field to `DataSourceDefinition` (icon, label, prompt per suggestion, optional color)
- Add suggestions configs to all 8 data sources
- Refactor `EmptyConversation` to use Tabs by data source (reusing the same `LANDING_CATEGORIES` grouping or a flat source-tab layout)
- Remove `constants/prompt-cards.ts` (replaced by config-driven suggestions)

### Out of scope
- Changes to the SourcesSection landing page
- Changes to the routing agent
- Follow-up suggestions in chat (those are separate)

## Key Design Decisions

### 1. Suggestions on DataSourceDefinition
Add to the definition:
```typescript
suggestions?: {
    icon?: LucideIcon;           // Override display icon for suggestion tab
    color?: string;              // Optional accent color class (e.g., 'text-blue-500')
    prompts: {
        label: string;           // Hebrew short label
        prompt: string;          // Full Hebrew prompt text
        icon: LucideIcon;        // Card icon
    }[];
};
```

Each source provides 2-4 example prompts that showcase its capabilities.

### 2. EmptyConversation layout
Reuse `LANDING_CATEGORIES` (3 tabs: ממשל ותקציב, כלכלה ונדל"ן, בריאות). Each tab shows suggestion cards from all sources in that category. Cards are tagged with their source name/icon so the user knows which agent will handle the question. 3 tabs keeps it clean — matches the landing page and scales naturally as sources are added.

### 3. Registry integration
The registry already exposes `getDataSourcesWithLanding()`. Add a parallel:
```typescript
export function getDataSourcesWithSuggestions() {
    return DATA_SOURCE_METAS
        .filter(meta => meta.suggestions?.prompts.length && meta.landing)
        .map(meta => ({
            id: meta.id,
            label: meta.display.label,
            icon: meta.suggestions?.icon ?? meta.display.icon,
            color: meta.suggestions?.color,
            badge: meta.display.badge,
            category: meta.landing!.category,
            prompts: meta.suggestions!.prompts,
        }));
}
```

The `category` field from `landing` is used to group suggestions into the same 3 category tabs as the landing page.

### 4. Per-source suggestion examples

| Source | Example prompts |
|--------|----------------|
| data.gov.il | "אילו מאגרי מידע פתוחים יש על תחבורה?", "מה הארגונים שמפרסמים הכי הרבה מאגרים?" |
| CBS | "איך השתנה מדד המחירים לצרכן בשנה האחרונה?", "מה אחוז האבטלה לפי אזור?" |
| BudgetKey | "כמה תקציב הוקצה למשרד החינוך ב-2025?", "אילו התקשרויות רכש ביצע משרד הביטחון?" |
| Knesset | "אילו הצעות חוק עברו בכנסת ה-25?", "מי חברי ועדת הכספים?" |
| Nadlan | "מה מחירי הדירות בתל אביב בשנה האחרונה?", "השווה מחירי נדל"ן בין רמת גן לגבעתיים" |
| Drugs | "מהן החלופות הגנריות לאקמול?", "אילו תרופות מכוסות בסל הבריאות לסוכרת?" |
| Health | "מה איכות השירות בבתי החולים?", "מה שיעור החיסונים בקרב ילדים?" |
| Grocery | "כמה עולה חלב תנובה 3% בשופרסל לעומת רמי לוי?", "השווה מחירי סל קניות בסיסי" |
