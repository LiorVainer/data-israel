/**
 * RAG Configuration
 *
 * Configures the Convex RAG component for semantic search
 * Uses OpenRouter for embeddings (same provider as chat model)
 */

import { components } from "./_generated/api";
import { RAG } from "@convex-dev/rag";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Create OpenRouter provider (reuses OPENROUTER_API_KEY)
const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

/**
 * Filter types for dataset search
 */
type DatasetFilterTypes = {
  organization: string;
  tag: string;
};

/**
 * Filter types for resource search
 */
type ResourceFilterTypes = {
  datasetId: string;
  format: string;
};

/**
 * Metadata stored with RAG entries
 */
type DatasetMetadata = {
  ckanId: string;
  title: string;
  organizationTitle?: string;
};

type ResourceMetadata = {
  ckanId: string;
  name?: string;
  datasetCkanId: string;
};

/**
 * RAG instance for dataset semantic search
 */
export const datasetRag = new RAG<DatasetFilterTypes, DatasetMetadata>(
  components.rag,
  {
    textEmbeddingModel: openrouter.textEmbeddingModel(
      "openai/text-embedding-3-small"
    ),
    embeddingDimension: 1536,
    filterNames: ["organization", "tag"],
  }
);

/**
 * RAG instance for resource semantic search
 */
export const resourceRag = new RAG<ResourceFilterTypes, ResourceMetadata>(
  components.rag,
  {
    textEmbeddingModel: openrouter.textEmbeddingModel(
      "openai/text-embedding-3-small"
    ),
    embeddingDimension: 1536,
    filterNames: ["datasetId", "format"],
  }
);
