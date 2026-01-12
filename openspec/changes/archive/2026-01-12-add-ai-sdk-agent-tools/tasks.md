# Implementation Tasks

## 1. Setup and Dependencies
- [x] 1.1 Install `ai` package: `npm install ai`
- [x] 1.2 Install `zod` package: `npm install zod`
- [x] 1.3 Install `axios` package: `npm install axios`
- [x] 1.4 Run `npm run build && npm run lint && npm run vibecheck` to verify setup

## 2. Data.gov.il API Client Infrastructure
- [x] 2.1 Create `lib/api/data-gov/types.ts` with TypeScript interfaces:
  ```typescript
  export interface DataGovResponse<T> {
    success: boolean;
    result: T;
    error?: { message: string };
  }

  export interface Dataset {
    id: string;
    name: string;
    title: string;
    organization: { name: string; title: string };
    tags: Array<{ name: string }>;
    notes: string;
    resources: Array<{
      id: string;
      url: string;
      format: string;
      description: string;
    }>;
  }

  export interface Group {
    id: string;
    name: string;
    display_name: string;
    description: string;
    package_count?: number;
  }

  export interface Tag {
    id: string;
    name: string;
  }
  ```
- [x] 2.2 Create `lib/api/data-gov/client.ts` with axios-based API client:
  ```typescript
  import axios from 'axios';
  import type { DataGovResponse, Dataset, Group, Tag } from './types';

  const BASE_URL = 'https://data.gov.il/api/3';

  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * Generic GET request that unwraps DataGovResponse
   */
  async function dataGovGet<T>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const response = await axiosInstance.get<DataGovResponse<T>>(endpoint, { params });
    return response.data.result;
  }

  export const dataGovApi = {
    dataset: {
      search: async (params: {
        q?: string;
        sort?: string;
        rows?: number;
        start?: number;
      }) => {
        return dataGovGet<{ count: number; results: Dataset[] }>(
          '/action/package_search',
          params
        );
      },

      show: async (id: string) => {
        return dataGovGet<Dataset>('/action/package_show', { id });
      },
    },

    group: {
      list: async (params?: {
        order_by?: string;
        limit?: number;
        offset?: number;
        all_fields?: boolean;
      }) => {
        return dataGovGet<Group[]>('/action/group_list', params);
      },
    },

    tag: {
      list: async (params?: {
        query?: string;
        all_fields?: boolean;
      }) => {
        return dataGovGet<Tag[]>('/action/tag_list', params);
      },
    },
  };
  ```
- [x] 2.3 Run `npm run build && npm run lint && npm run vibecheck`

## 3. Dataset Search Tool (AI SDK v6 Pattern)
- [x] 3.1 Create `lib/tools/search-datasets.ts`:
  ```typescript
  import { tool } from 'ai';
  import { z } from 'zod';
  import { dataGovApi } from '@/lib/api/data-gov/client';

  export const searchDatasets = tool({
    description: 'Search for datasets on data.gov.il. Use this when user asks about datasets related to a topic.',
    inputSchema: z.object({
      query: z.string().optional().describe('Search query keyword'),
      sort: z.string().optional().describe('Sort order (e.g., "score desc, metadata_modified desc")'),
      rows: z.number().int().min(1).max(100).optional().describe('Number of results (default 10)'),
      start: z.number().int().min(0).optional().describe('Starting offset for pagination'),
    }),
    execute: async ({ query, sort, rows = 10, start = 0 }) => {
      try {
        const result = await dataGovApi.dataset.search({ q: query, sort, rows, start });
        return {
          success: true,
          count: result.count,
          datasets: result.results.map(d => ({
            id: d.id,
            title: d.title,
            organization: d.organization?.title,
            tags: d.tags.map(t => t.name),
            summary: d.notes?.slice(0, 200),
          })),
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
  });
  ```
- [x] 3.2 Run `npm run build && npm run lint && npm run vibecheck`

## 4. Dataset Details Tool
- [x] 4.1 Create `lib/tools/get-dataset-details.ts`:
  ```typescript
  import { tool } from 'ai';
  import { z } from 'zod';
  import { dataGovApi } from '@/lib/api/data-gov/client';

  export const getDatasetDetails = tool({
    description: 'Get full details for a specific dataset by ID. Use when user wants detailed information about a dataset.',
    inputSchema: z.object({
      id: z.string().describe('Dataset ID'),
    }),
    execute: async ({ id }) => {
      try {
        const dataset = await dataGovApi.dataset.show(id);
        return {
          success: true,
          dataset: {
            id: dataset.id,
            title: dataset.title,
            name: dataset.name,
            organization: dataset.organization,
            tags: dataset.tags,
            notes: dataset.notes,
            resources: dataset.resources.map(r => ({
              id: r.id,
              url: r.url,
              format: r.format,
              description: r.description,
            })),
          },
        };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
  });
  ```
- [x] 4.2 Run `npm run build && npm run lint && npm run vibecheck`

## 5. Group Listing Tool
- [x] 5.1 Create `lib/tools/list-groups.ts`:
  ```typescript
  import { tool } from 'ai';
  import { z } from 'zod';
  import { dataGovApi } from '@/lib/api/data-gov/client';

  export const listGroups = tool({
    description: 'List dataset publishers and categories (groups). Use when user asks which organizations publish data.',
    inputSchema: z.object({
      orderBy: z.string().optional().describe('Field to order by'),
      limit: z.number().int().min(1).max(100).optional().describe('Maximum results'),
      offset: z.number().int().min(0).optional().describe('Pagination offset'),
      allFields: z.boolean().optional().describe('Include full details'),
    }),
    execute: async ({ orderBy, limit, offset, allFields }) => {
      try {
        const groups = await dataGovApi.group.list({
          order_by: orderBy,
          limit,
          offset,
          all_fields: allFields,
        });
        return { success: true, groups };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
  });
  ```
- [x] 5.2 Run `npm run build && npm run lint && npm run vibecheck`

## 6. Tag Listing Tool
- [x] 6.1 Create `lib/tools/list-tags.ts`:
  ```typescript
  import { tool } from 'ai';
  import { z } from 'zod';
  import { dataGovApi } from '@/lib/api/data-gov/client';

  export const listTags = tool({
    description: 'List all tags (keywords) used in datasets. Use when user wants to explore available topics.',
    inputSchema: z.object({
      query: z.string().optional().describe('Search query for tags'),
      allFields: z.boolean().optional().describe('Include full metadata'),
    }),
    execute: async ({ query, allFields }) => {
      try {
        const tags = await dataGovApi.tag.list({ query, all_fields: allFields });
        return { success: true, tags };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    },
  });
  ```
- [x] 6.2 Run `npm run build && npm run lint && npm run vibecheck`

## 7. Tool Exports
- [x] 7.1 Create `lib/tools/index.ts`:
  ```typescript
  export { searchDatasets } from './search-datasets';
  export { getDatasetDetails } from './get-dataset-details';
  export { listGroups } from './list-groups';
  export { listTags } from './list-tags';
  ```
- [x] 7.2 Run `npm run build && npm run lint && npm run vibecheck`

## 8. Create ToolLoopAgent
- [x] 8.1 Create `agents/data-agent.ts`:
  ```typescript
  import { ToolLoopAgent, InferAgentUIMessage } from 'ai';
  import { searchDatasets, getDatasetDetails, listGroups, listTags } from '@/lib/tools';

  export const dataAgent = new ToolLoopAgent({
    model: 'anthropic/claude-sonnet-4.5',
    instructions: `You are an AI agent designed to explore Israeli open datasets from data.gov.il.

You have tools for:
- Searching datasets by keyword
- Inspecting dataset metadata
- Listing groups (publishers/categories)
- Listing tags (taxonomy)

Always use tools for factual answers. Do not guess dataset contents. When user asks about datasets, search first.`,
    tools: {
      searchDatasets,
      getDatasetDetails,
      listGroups,
      listTags,
    },
  });

  export type DataAgentUIMessage = InferAgentUIMessage<typeof dataAgent>;
  ```
- [x] 8.2 Run `npm run build && npm run lint && npm run vibecheck`

## 9. Create API Route for Streaming
- [x] 9.1 Create `app/api/chat/route.ts`:
  ```typescript
  import { createAgentUIStreamResponse } from 'ai';
  import { dataAgent } from '@/agents/data-agent';

  export async function POST(request: Request) {
    const { messages } = await request.json();

    return createAgentUIStreamResponse({
      agent: dataAgent,
      uiMessages: messages,
    });
  }
  ```
- [x] 9.2 Run `npm run build && npm run lint && npm run vibecheck`

## 10. Final Verification
- [x] 10.1 Verify all imports use `@/` path alias
- [x] 10.2 Check no `any` types exist (except for error handling)
- [x] 10.3 Verify minimal `as` type assertions
- [x] 10.4 Ensure all tool descriptions are clear and helpful
- [x] 10.5 Run full build: `npm run build`
- [x] 10.6 Run linting: `npm run lint`
- [x] 10.7 Run vibecheck: `npm run vibecheck`
- [x] 10.8 Verify TypeScript strict mode passes
