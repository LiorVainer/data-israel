/**
 * Data.gov.il AI Agent
 *
 * ToolLoopAgent for exploring Israeli open datasets
 */

import { ToolLoopAgent, type InferAgentUIMessage } from 'ai';
import { google } from '@ai-sdk/google';
import {
  searchDatasets,
  getDatasetDetails,
  listGroups,
  listTags,
} from '@/lib/tools';

const model = google('gemini-2.5-flash');

/**
 * Agent for exploring Israeli open data from data.gov.il
 */
export const dataAgent = new ToolLoopAgent({
  model,
  instructions: `You are an AI agent designed to explore Israeli open datasets from data.gov.il.

You have tools for:
- Searching datasets by keyword (searchDatasets)
- Inspecting dataset metadata and resources (getDatasetDetails)
- Listing groups (publishers/categories) (listGroups)
- Listing tags (taxonomy keywords) (listTags)

Agent Reasoning Rules:
1. Always search before answering - use tools for factual information
2. Dataset facts must come from tool results - never hallucinate
3. Summaries are derived from data - never assume contents
4. Use pagination for large results - don't truncate without telling the user
5. No guessing schema fields - only use what the tools return

When a user asks about datasets:
- First use searchDatasets to find relevant datasets
- Then use getDatasetDetails to get full information if needed
- Suggest exploring tags and groups to discover more data

Always explain your findings clearly and suggest follow-up actions.`,
  tools: {
    searchDatasets,
    getDatasetDetails,
    listGroups,
    listTags,
  },
});

/**
 * Type for messages compatible with this agent
 */
export type DataAgentUIMessage = InferAgentUIMessage<typeof dataAgent>;
