/**
 * Client-side Display Tools
 *
 * Re-exports chart display tools for client-side rendering
 * and the suggest follow-ups tool
 */

export { displayBarChart, displayLineChart, displayPieChart } from './display-chart';
export { suggestFollowUps } from './suggest-follow-ups';
import { displayBarChart, displayLineChart, displayPieChart } from './display-chart';
import { suggestFollowUps } from './suggest-follow-ups';

/** Union of all client-side tool names, derived from the ClientTools object */
export type ClientToolName = keyof typeof ClientTools;

export const ClientTools = {
    displayBarChart,
    displayLineChart,
    displayPieChart,
    suggestFollowUps,
};
