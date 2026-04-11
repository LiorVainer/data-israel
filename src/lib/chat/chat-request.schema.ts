/**
 * Chat Request Schema
 *
 * Zod schema for validating the POST /api/chat request body.
 * The client sends this via DefaultChatTransport.prepareSendMessagesRequest().
 */

import { z } from 'zod';
import { ALL_DATA_SOURCE_IDS, type DataSource } from '@/data-sources/registry';

// ─── Sub-schemas ────────────────────────────────────────────────────────────

/** A single message part (text, file, etc.) */
const messagePartSchema = z
    .object({
        type: z.string(),
        text: z.string().optional(),
    })
    .passthrough();

/** A UIMessage as sent by the client (simplified — full shape is validated by AI SDK) */
const uiMessageSchema = z
    .object({
        id: z.string(),
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().optional(),
        parts: z.array(messagePartSchema).optional(),
    })
    .passthrough();

/** Memory config for Mastra thread persistence */
const memoryConfigSchema = z
    .object({
        thread: z.string(),
        resource: z.string().optional(),
    })
    .optional();

/** Data source filter (subset of ALL_DATA_SOURCE_IDS) */
const dataSourceSchema = z.enum(ALL_DATA_SOURCE_IDS as [DataSource, ...DataSource[]]);

// ─── Main schema ────────────────────────────────────────────────────────────

export const chatRequestSchema = z
    .object({
        /** Thread/conversation ID */
        id: z.string().optional(),
        /** Messages array — client sends only the last user message */
        messages: z.array(uiMessageSchema).min(1),
        /** Memory config for Mastra thread persistence */
        memory: memoryConfigSchema,
        /** Optional subset of data sources to query */
        enabledSources: z.array(dataSourceSchema).optional(),
        /** AI SDK: resume data for interrupted streams */
        resumeData: z.record(z.string(), z.unknown()).optional(),
        /** AI SDK: run ID for resuming agent execution */
        runId: z.string().optional(),
        /** AI SDK: trigger type from useChat hook */
        trigger: z.enum(['submit-message', 'regenerate-message']).optional(),
    })
    .passthrough();

export type ChatRequestParams = z.infer<typeof chatRequestSchema>;
