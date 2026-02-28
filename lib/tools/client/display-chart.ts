/**
 * Display Chart Tools (Client-Side Rendering)
 *
 * Three separate tools for rendering different chart types using Nivo.
 * Each tool has its own schema specific to that chart type.
 */

import { tool } from 'ai';
import { z } from 'zod';

// ============================================================================
// Bar Chart Tool
// ============================================================================

export const displayBarChartInputSchema = z.object({
    title: z
        .string()
        .optional()
        .describe(
            'Chart title in Hebrew. MUST include measurement units when applicable, e.g. "מחירי דלק (₪ לליטר)" or "אוכלוסייה לפי עיר (אלפים)"',
        ),
    data: z
        .array(z.record(z.string(), z.union([z.string(), z.number()])))
        .describe(
            'Array of objects with a category field and numeric value fields. Category VALUES (the labels shown on the axis) MUST be in Hebrew. Field NAMES (keys) MUST be simple English identifiers like "category", "value", "count" — NEVER Hebrew or special characters. NEVER include an "index" property (reserved by the chart library).',
        ),
    config: z.object({
        indexBy: z
            .string()
            .describe(
                'Field name for the category axis. MUST be a simple English key matching a property in data, e.g. "category", "sector", "city". NEVER use Hebrew for field names.',
            ),
        keys: z
            .array(z.string())
            .describe(
                'Field names for value bars. MUST be simple English keys matching numeric properties in data, e.g. ["value"], ["count", "total"]. NEVER use Hebrew for field names.',
            ),
        layout: z.enum(['horizontal', 'vertical']).default('vertical').describe('Bar orientation'),
        groupMode: z.enum(['grouped', 'stacked']).default('grouped').describe('How to display multiple keys'),
        uniqueColors: z
            .boolean()
            .default(true)
            .describe(
                'When true, each bar gets a unique color from the theme palette. When false, all bars share the same color. Default true for single-key charts.',
            ),
    }),
});

export const displayBarChartOutputSchema = z.object({
    rendered: z.boolean(),
    chartType: z.literal('bar'),
    title: z.string(),
});

export type DisplayBarChartInput = z.infer<typeof displayBarChartInputSchema>;
export type DisplayBarChartOutput = z.infer<typeof displayBarChartOutputSchema>;

export const displayBarChart = tool({
    description: `Display data as a bar chart for comparing values across categories.

Use bar charts for:
- Price comparisons (מחירים לפי מוצר)
- Quantities by category (כמויות לפי עיר)
- Any categorical comparison

Guidelines:
- Title MUST be in Hebrew and MUST include measurement units when applicable (e.g. "מחירי דלק (₪ לליטר)", "אוכלוסייה (אלפים)")
- Category VALUES (the labels on the axis) MUST be in Hebrew
- Field NAMES (indexBy, keys) MUST be simple English identifiers (e.g. "category", "value", "growth_rate") — NEVER Hebrew
- NEVER include an "index" property in data objects (reserved by chart library)
- Limit data to 20 items max for readability

Example data format:
  data: [{ category: "תל אביב", value: 120 }, { category: "חיפה", value: 85 }]
  config: { indexBy: "category", keys: ["value"] }`,
    inputSchema: displayBarChartInputSchema,
    execute: async (input) => {
        return {
            rendered: true,
            chartType: 'bar' as const,
            title: input.title || 'תרשים עמודות',
        };
    },
});

// ============================================================================
// Line Chart Tool
// ============================================================================

export const displayLineChartInputSchema = z.object({
    title: z
        .string()
        .optional()
        .describe(
            'Chart title in Hebrew. MUST include measurement units when applicable, e.g. "מגמת מחירי דלק (₪ לליטר)" or "שינוי מדד המחירים (%)"',
        ),
    data: z
        .array(
            z.object({
                id: z.string().describe('Series identifier/name in Hebrew, e.g. "בנזין 95" or "סולר"'),
                data: z
                    .array(
                        z.object({
                            x: z
                                .union([z.string(), z.number()])
                                .describe('X-axis value (time/sequence). String values MUST be in Hebrew'),
                            y: z.number().describe('Y-axis value'),
                        }),
                    )
                    .describe('Data points for this series'),
            }),
        )
        .describe('Array of line series with data points. All series ids and string x-values MUST be in Hebrew'),
    config: z.object({
        enableArea: z.boolean().default(false).describe('Fill area under line'),
        curve: z.enum(['linear', 'monotoneX', 'step']).default('monotoneX').describe('Line interpolation'),
    }),
});

export const displayLineChartOutputSchema = z.object({
    rendered: z.boolean(),
    chartType: z.literal('line'),
    title: z.string(),
});

export type DisplayLineChartInput = z.infer<typeof displayLineChartInputSchema>;
export type DisplayLineChartOutput = z.infer<typeof displayLineChartOutputSchema>;

export const displayLineChart = tool({
    description: `Display data as a line chart for showing trends over time or sequences.

Use line charts for:
- Trends over time (מגמות לאורך זמן)
- Price changes over months (שינויי מחירים חודשיים)
- Sequential data comparison

IMPORTANT — You MUST provide all three fields: title, data, and config.

Example call:
  title: "מגמת מחירי דלק (₪ לליטר)"
  data: [
    { id: "בנזין 95", data: [{ x: "ינואר", y: 6.5 }, { x: "פברואר", y: 6.8 }] },
    { id: "סולר", data: [{ x: "ינואר", y: 5.9 }, { x: "פברואר", y: 6.1 }] }
  ]
  config: { enableArea: false, curve: "monotoneX" }

Guidelines:
- Title MUST be in Hebrew with units (e.g. "שינוי מדד המחירים (%)")
- Series id MUST be a descriptive Hebrew name (e.g. "בנזין 95", not "benzin_95")
- String x-values MUST be in Hebrew
- Limit to 5 series max for readability`,
    inputSchema: displayLineChartInputSchema,
    execute: async (input) => {
        return {
            rendered: true,
            chartType: 'line' as const,
            title: input.title || 'תרשים קו',
        };
    },
});

// ============================================================================
// Pie Chart Tool
// ============================================================================

export const displayPieChartInputSchema = z.object({
    title: z
        .string()
        .optional()
        .describe(
            'Chart title in Hebrew. MUST include measurement units when applicable, e.g. "התפלגות הוצאות (₪)" or "נתח שוק (%)"',
        ),
    data: z
        .array(
            z.object({
                id: z.string().describe('Slice identifier in Hebrew'),
                label: z.string().describe('Display label for slice — MUST be in Hebrew'),
                value: z.number().describe('Numeric value for slice'),
            }),
        )
        .describe('Array of pie slices with id, label, and value. All ids and labels MUST be in Hebrew'),
    config: z.object({
        innerRadius: z.number().min(0).max(0.9).default(0).describe('Inner radius for donut chart (0 = full pie)'),
    }),
});

export const displayPieChartOutputSchema = z.object({
    rendered: z.boolean(),
    chartType: z.literal('pie'),
    title: z.string(),
});

export type DisplayPieChartInput = z.infer<typeof displayPieChartInputSchema>;
export type DisplayPieChartOutput = z.infer<typeof displayPieChartOutputSchema>;

export const displayPieChart = tool({
    description: `Display data as a pie chart for showing part-of-whole distributions.

Use pie charts for:
- Market share (נתח שוק)
- Category breakdown (התפלגות לפי קטגוריה)
- Percentage distributions

Data format:
- Each slice has id, label (Hebrew), and numeric value
- Values represent proportions (will be converted to percentages)

Guidelines:
- ALL slice ids and labels MUST be in Hebrew
- Title MUST be in Hebrew and MUST include measurement units when applicable (e.g. "התפלגות הוצאות (₪)", "נתח שוק (%)")
- Limit to 8 slices max for readability
- Set innerRadius > 0 for donut style`,
    inputSchema: displayPieChartInputSchema,
    execute: async (input) => {
        return {
            rendered: true,
            chartType: 'pie' as const,
            title: input.title || 'תרשים עוגה',
        };
    },
});

// ============================================================================
// Union type for all chart inputs (used by ChartRenderer)
// ============================================================================

export type ChartType = 'bar' | 'line' | 'pie';

export type DisplayChartInput =
    | ({ chartType: 'bar' } & DisplayBarChartInput)
    | ({ chartType: 'line' } & DisplayLineChartInput)
    | ({ chartType: 'pie' } & DisplayPieChartInput);
