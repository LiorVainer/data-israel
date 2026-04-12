/**
 * Client-side Display Tools
 *
 * Re-exports chart display tools for client-side rendering
 * and the suggest follow-ups tool
 */

export { displayBarChart, displayLineChart, displayPieChart } from './display-chart.tool';
export { displayGovmap } from './display-govmap.tool';
export { suggestFollowUps } from './suggest-follow-ups.tool';
import { displayBarChart, displayLineChart, displayPieChart } from './display-chart.tool';
import { displayGovmap } from './display-govmap.tool';
import { suggestFollowUps } from './suggest-follow-ups.tool';

/** Union of all client-side tool names, derived from the ClientTools object */
export type ClientToolName = keyof typeof ClientTools;

export const ClientTools = {
    displayBarChart,
    displayLineChart,
    displayPieChart,
    displayGovmap,
    suggestFollowUps,
};
