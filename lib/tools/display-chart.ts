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
    title: z.string().optional().describe('Chart title in Hebrew'),
    data: z
        .array(z.record(z.string(), z.union([z.string(), z.number()])))
        .describe('Array of objects with category field and numeric value fields'),
    config: z.object({
        indexBy: z.string().describe('Field name to use for category axis (x-axis)'),
        keys: z.array(z.string()).describe('Field names to use for value bars'),
        layout: z.enum(['horizontal', 'vertical']).default('vertical').describe('Bar orientation'),
        groupMode: z.enum(['grouped', 'stacked']).default('grouped').describe('How to display multiple keys'),
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
- Limit data to 20 items max for readability
- Use meaningful Hebrew labels
- indexBy should be the category field name
- keys should be the numeric value field names`,
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
    title: z.string().optional().describe('Chart title in Hebrew'),
    data: z
        .array(
            z.object({
                id: z.string().describe('Series identifier/name'),
                data: z
                    .array(
                        z.object({
                            x: z.union([z.string(), z.number()]).describe('X-axis value (time/sequence)'),
                            y: z.number().describe('Y-axis value'),
                        })
                    )
                    .describe('Data points for this series'),
            })
        )
        .describe('Array of line series with data points'),
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

Data format:
- Each series has an id (name) and array of {x, y} points
- x can be string (month name) or number (year)
- y must be numeric

Guidelines:
- Limit to 5 series max for readability
- Use meaningful Hebrew series names`,
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
    title: z.string().optional().describe('Chart title in Hebrew'),
    data: z
        .array(
            z.object({
                id: z.string().describe('Slice identifier'),
                label: z.string().describe('Display label for slice'),
                value: z.number().describe('Numeric value for slice'),
            })
        )
        .describe('Array of pie slices with id, label, and value'),
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
- Limit to 8 slices max for readability
- Use meaningful Hebrew labels
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
