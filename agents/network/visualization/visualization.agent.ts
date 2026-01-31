/**
 * Visualization Agent
 *
 * Creates data visualizations — bar charts, line charts, and pie/donut charts.
 */

import { Agent } from '@mastra/core/agent';
import { displayBarChart, displayLineChart, displayPieChart } from '@/lib/tools';
import { getModelId } from '../model';
import { VISUALIZATION_AGENT_CONFIG } from './config';

export const visualizationAgent = new Agent({
    id: 'visualizationAgent',
    name: VISUALIZATION_AGENT_CONFIG.name,
    description: 'Creates data visualizations — bar charts, line charts, and pie/donut charts from provided data.',
    instructions: VISUALIZATION_AGENT_CONFIG.instructions,
    model: getModelId(),
    tools: { displayBarChart, displayLineChart, displayPieChart },
});
