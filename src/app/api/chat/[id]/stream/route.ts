/**
 * Stream Resume Route
 *
 * GET /api/chat/[id]/stream
 *
 * Resumes an in-progress SSE stream for a given thread ID using the
 * resumable-stream infrastructure. Returns 204 if no active stream exists
 * (e.g., the stream has already finished or Redis is unavailable).
 */

import { UI_MESSAGE_STREAM_HEADERS } from 'ai';
import { after } from 'next/server';
import { getResumableStreamContext, getActiveStreamId, clearActiveStreamId } from '@/lib/redis/resumable-stream';

/** Max time to wait for stream resume before returning 204 (15 seconds). */
const RESUME_TIMEOUT_MS = 15_000;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const activeStreamId = await getActiveStreamId(id);

    if (!activeStreamId) {
        return new Response(null, { status: 204 });
    }

    const streamContext = await getResumableStreamContext(after);
    if (!streamContext) {
        return new Response(null, { status: 204 });
    }

    // Wrap resumeExistingStream with a timeout to prevent hanging when
    // the stream data has expired in Redis but the active stream ID still exists.
    const stream = await Promise.race([
        streamContext.resumeExistingStream(activeStreamId),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), RESUME_TIMEOUT_MS)),
    ]);

    if (!stream) {
        // Clean up stale active stream ID so subsequent requests don't retry
        void clearActiveStreamId(id);
        return new Response(null, { status: 204 });
    }

    return new Response(stream, { headers: UI_MESSAGE_STREAM_HEADERS });
}
