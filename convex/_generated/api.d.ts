/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";
import type { GenericId as Id } from "convex/values";

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: {
  datasets: {
    count: FunctionReference<"query", "public", {}, any>;
    deleteByCkanId: FunctionReference<
      "mutation",
      "public",
      { ckanId: string },
      any
    >;
    get: FunctionReference<"query", "public", { id: string }, any>;
    getByCkanId: FunctionReference<"query", "public", { ckanId: string }, any>;
    list: FunctionReference<
      "query",
      "public",
      { cursor?: string; limit?: number },
      any
    >;
    upsert: FunctionReference<
      "mutation",
      "public",
      {
        author?: string;
        ckanId: string;
        licenseTitle?: string;
        maintainer?: string;
        metadataCreated?: string;
        metadataModified?: string;
        name: string;
        notes?: string;
        organizationId?: string;
        organizationTitle?: string;
        tags: Array<string>;
        title: string;
      },
      any
    >;
  };
  guests: {
    createNewGuest: FunctionReference<
      "mutation",
      "public",
      { sessionId: string },
      any
    >;
    getGuestBySessionId: FunctionReference<
      "query",
      "public",
      { sessionId: string },
      any
    >;
    guestExists: FunctionReference<"query", "public", { guestId: string }, any>;
  };
  mastra: {
    storage: {
      handle: FunctionReference<"mutation", "public", any, any>;
    };
  };
  resources: {
    count: FunctionReference<"query", "public", {}, any>;
    deleteByDataset: FunctionReference<
      "mutation",
      "public",
      { datasetId: string },
      any
    >;
    get: FunctionReference<"query", "public", { id: string }, any>;
    getByCkanId: FunctionReference<"query", "public", { ckanId: string }, any>;
    listByDataset: FunctionReference<
      "query",
      "public",
      { datasetId: string },
      any
    >;
    listByFormat: FunctionReference<
      "query",
      "public",
      { format: string; limit?: number },
      any
    >;
    upsert: FunctionReference<
      "mutation",
      "public",
      {
        ckanId: string;
        created?: string;
        datasetCkanId: string;
        datasetId: string;
        description?: string;
        format: string;
        lastModified?: string;
        name?: string;
        size?: number;
        url: string;
      },
      any
    >;
  };
  search: {
    batchIndexDatasets: FunctionReference<
      "action",
      "public",
      {
        datasets: Array<{
          ckanId: string;
          notes?: string;
          organizationId?: string;
          organizationTitle?: string;
          tags: Array<string>;
          title: string;
        }>;
      },
      any
    >;
    indexDataset: FunctionReference<
      "action",
      "public",
      {
        ckanId: string;
        notes?: string;
        organizationId?: string;
        organizationTitle?: string;
        tags: Array<string>;
        title: string;
      },
      any
    >;
    indexResource: FunctionReference<
      "action",
      "public",
      {
        ckanId: string;
        datasetCkanId: string;
        description?: string;
        format: string;
        name?: string;
      },
      any
    >;
    searchDatasets: FunctionReference<
      "action",
      "public",
      { limit?: number; organization?: string; query: string; tag?: string },
      any
    >;
    searchResources: FunctionReference<
      "action",
      "public",
      { datasetId?: string; format?: string; limit?: number; query: string },
      any
    >;
  };
  threads: {
    deleteThread: FunctionReference<
      "mutation",
      "public",
      { guestId?: string; threadId: string },
      any
    >;
    getAuthResourceId: FunctionReference<"query", "public", {}, any>;
    getThreadContextWindow: FunctionReference<
      "query",
      "public",
      { threadId: string },
      any
    >;
    listUserThreads: FunctionReference<
      "query",
      "public",
      { guestId?: string },
      any
    >;
    listUserThreadsPaginated: FunctionReference<
      "query",
      "public",
      {
        guestId?: string;
        paginationOpts: { cursor: string | null; numItems: number };
      },
      any
    >;
    renameThread: FunctionReference<
      "mutation",
      "public",
      { guestId?: string; newTitle: string; threadId: string },
      any
    >;
    upsertThreadBilling: FunctionReference<
      "mutation",
      "public",
      {
        agentName?: string;
        model: string;
        provider: string;
        threadId: string;
        usage: {
          cachedInputTokens?: number;
          completionTokens: number;
          promptTokens: number;
          reasoningTokens?: number;
          totalTokens: number;
        };
        userId: string;
      },
      any
    >;
    upsertThreadContext: FunctionReference<
      "mutation",
      "public",
      {
        agentName?: string;
        model: string;
        provider: string;
        threadId: string;
        usage: {
          cachedInputTokens?: number;
          completionTokens: number;
          promptTokens: number;
          reasoningTokens?: number;
          totalTokens: number;
        };
        userId: string;
      },
      any
    >;
  };
  users: {
    getCurrentUser: FunctionReference<"query", "public", {}, any>;
    updateThemePreference: FunctionReference<
      "mutation",
      "public",
      { themePreference: "light" | "dark" },
      any
    >;
  };
};

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: {
  datasets: {
    batchInsert: FunctionReference<
      "mutation",
      "internal",
      {
        datasets: Array<{
          author?: string;
          ckanId: string;
          licenseTitle?: string;
          maintainer?: string;
          metadataCreated?: string;
          metadataModified?: string;
          name: string;
          notes?: string;
          organizationId?: string;
          organizationTitle?: string;
          tags: Array<string>;
          title: string;
        }>;
      },
      any
    >;
  };
  resources: {
    batchInsert: FunctionReference<
      "mutation",
      "internal",
      {
        resources: Array<{
          ckanId: string;
          created?: string;
          datasetCkanId: string;
          datasetId: Id<"datasets">;
          description?: string;
          format: string;
          lastModified?: string;
          name?: string;
          size?: number;
          url: string;
        }>;
      },
      any
    >;
  };
  users: {
    deleteByClerkId: FunctionReference<
      "mutation",
      "internal",
      { clerkId: string },
      any
    >;
    upsertFromClerk: FunctionReference<
      "mutation",
      "internal",
      {
        clerkId: string;
        email: string;
        firstName?: string;
        imageUrl?: string;
        lastName?: string;
      },
      any
    >;
  };
};

export declare const components: {
  rag: {
    chunks: {
      insert: FunctionReference<
        "mutation",
        "internal",
        {
          chunks: Array<{
            content: { metadata?: Record<string, any>; text: string };
            embedding: Array<number>;
            searchableText?: string;
          }>;
          entryId: string;
          startOrder: number;
        },
        { status: "pending" | "ready" | "replaced" }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          entryId: string;
          order: "desc" | "asc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            metadata?: Record<string, any>;
            order: number;
            state: "pending" | "ready" | "replaced";
            text: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      replaceChunksPage: FunctionReference<
        "mutation",
        "internal",
        { entryId: string; startOrder: number },
        { nextStartOrder: number; status: "pending" | "ready" | "replaced" }
      >;
    };
    entries: {
      add: FunctionReference<
        "mutation",
        "internal",
        {
          allChunks?: Array<{
            content: { metadata?: Record<string, any>; text: string };
            embedding: Array<number>;
            searchableText?: string;
          }>;
          entry: {
            contentHash?: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            namespaceId: string;
            title?: string;
          };
          onComplete?: string;
        },
        {
          created: boolean;
          entryId: string;
          status: "pending" | "ready" | "replaced";
        }
      >;
      addAsync: FunctionReference<
        "mutation",
        "internal",
        {
          chunker: string;
          entry: {
            contentHash?: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            namespaceId: string;
            title?: string;
          };
          onComplete?: string;
        },
        { created: boolean; entryId: string; status: "pending" | "ready" }
      >;
      deleteAsync: FunctionReference<
        "mutation",
        "internal",
        { entryId: string; startOrder: number },
        null
      >;
      deleteByKeyAsync: FunctionReference<
        "mutation",
        "internal",
        { beforeVersion?: number; key: string; namespaceId: string },
        null
      >;
      deleteByKeySync: FunctionReference<
        "action",
        "internal",
        { key: string; namespaceId: string },
        null
      >;
      deleteSync: FunctionReference<
        "action",
        "internal",
        { entryId: string },
        null
      >;
      findByContentHash: FunctionReference<
        "query",
        "internal",
        {
          contentHash: string;
          dimension: number;
          filterNames: Array<string>;
          key: string;
          modelId: string;
          namespace: string;
        },
        {
          contentHash?: string;
          entryId: string;
          filterValues: Array<{ name: string; value: any }>;
          importance: number;
          key?: string;
          metadata?: Record<string, any>;
          replacedAt?: number;
          status: "pending" | "ready" | "replaced";
          title?: string;
        } | null
      >;
      get: FunctionReference<
        "query",
        "internal",
        { entryId: string },
        {
          contentHash?: string;
          entryId: string;
          filterValues: Array<{ name: string; value: any }>;
          importance: number;
          key?: string;
          metadata?: Record<string, any>;
          replacedAt?: number;
          status: "pending" | "ready" | "replaced";
          title?: string;
        } | null
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          namespaceId?: string;
          order?: "desc" | "asc";
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          status: "pending" | "ready" | "replaced";
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      promoteToReady: FunctionReference<
        "mutation",
        "internal",
        { entryId: string },
        {
          replacedEntry: {
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          } | null;
        }
      >;
    };
    namespaces: {
      deleteNamespace: FunctionReference<
        "mutation",
        "internal",
        { namespaceId: string },
        {
          deletedNamespace: null | {
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          };
        }
      >;
      deleteNamespaceSync: FunctionReference<
        "action",
        "internal",
        { namespaceId: string },
        null
      >;
      get: FunctionReference<
        "query",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
        },
        null | {
          createdAt: number;
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
          namespaceId: string;
          status: "pending" | "ready" | "replaced";
          version: number;
        }
      >;
      getOrCreate: FunctionReference<
        "mutation",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
          onComplete?: string;
          status: "pending" | "ready";
        },
        { namespaceId: string; status: "pending" | "ready" }
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          status: "pending" | "ready" | "replaced";
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      listNamespaceVersions: FunctionReference<
        "query",
        "internal",
        {
          namespace: string;
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          }>;
          pageStatus?: "SplitRecommended" | "SplitRequired" | null;
          splitCursor?: string | null;
        }
      >;
      lookup: FunctionReference<
        "query",
        "internal",
        {
          dimension: number;
          filterNames: Array<string>;
          modelId: string;
          namespace: string;
        },
        null | string
      >;
      promoteToReady: FunctionReference<
        "mutation",
        "internal",
        { namespaceId: string },
        {
          replacedNamespace: null | {
            createdAt: number;
            dimension: number;
            filterNames: Array<string>;
            modelId: string;
            namespace: string;
            namespaceId: string;
            status: "pending" | "ready" | "replaced";
            version: number;
          };
        }
      >;
    };
    search: {
      search: FunctionReference<
        "action",
        "internal",
        {
          chunkContext?: { after: number; before: number };
          embedding: Array<number>;
          filters: Array<{ name: string; value: any }>;
          limit: number;
          modelId: string;
          namespace: string;
          vectorScoreThreshold?: number;
        },
        {
          entries: Array<{
            contentHash?: string;
            entryId: string;
            filterValues: Array<{ name: string; value: any }>;
            importance: number;
            key?: string;
            metadata?: Record<string, any>;
            replacedAt?: number;
            status: "pending" | "ready" | "replaced";
            title?: string;
          }>;
          results: Array<{
            content: Array<{ metadata?: Record<string, any>; text: string }>;
            entryId: string;
            order: number;
            score: number;
            startOrder: number;
          }>;
        }
      >;
    };
  };
};
