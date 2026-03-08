import type { Processor, ProcessorMessageResult, ProcessOutputResultArgs } from '@mastra/core/processors';

export class TextOutputProcessor implements Processor {
    id = 'text-output';

    processOutputResult({ messages, abort }: ProcessOutputResultArgs): ProcessorMessageResult {
        const lastMessage = messages[messages.length - 1];

        // If last message has no text, force a summary from tool results
        if (lastMessage?.role === 'assistant') {
            const hasText = lastMessage.content.parts?.some((p) => p.type === 'text' && p.text?.trim().length > 0);

            if (!hasText) {
                // Create a summary message from tool calls/results
                const toolResults = messages
                    .filter((m) => m.role === 'assistant')
                    .flatMap((m) => m.content.toolInvocations || [])
                    .filter(
                        (invocation): invocation is Extract<typeof invocation, { state: 'result' }> =>
                            invocation.state === 'result',
                    );

                const resultsText = toolResults
                    .map((invocation) => {
                        return `Tool: ${invocation.toolName}\nResult: ${JSON.stringify(invocation.result, null, 2)}`;
                    })
                    .join('\n\n');

                // Instead of abort, modify the last message to include resultsText
                if (lastMessage.content.parts) {
                    lastMessage.content.parts.push({
                        type: 'text',
                        text: resultsText,
                    });
                } else {
                    lastMessage.content.parts = [
                        {
                            type: 'text',
                            text: resultsText,
                        },
                    ];
                }
            }
        }

        return messages;
    }
}
