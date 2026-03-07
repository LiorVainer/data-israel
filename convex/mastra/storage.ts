/**
 * Mastra Convex Storage Handler
 *
 * Re-exports the upstream @mastra/convex storage handler directly.
 * As of @mastra/convex@1.0.5, the upstream handler uses `findBestIndex`
 * to automatically select indexed queries instead of full table scans.
 */

export { mastraStorage as handle } from '@mastra/convex/server';
