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
import { getResumableStreamContext, getActiveStreamId } from '@/lib/redis/resumable-stream';

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

    const stream = await streamContext.resumeExistingStream(activeStreamId);
    if (!stream) {
        return new Response(null, { status: 204 });
    }

    return new Response(stream, { headers: UI_MESSAGE_STREAM_HEADERS });
}
