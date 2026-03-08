import type { UIMessage } from 'ai';

export function extractSuggestions(lastAssistantMessage: UIMessage | undefined): {
    suggestions: string[] | undefined;
    loading: boolean;
} {
    if (!lastAssistantMessage) return { suggestions: undefined, loading: false };

    const suggestPart = lastAssistantMessage.parts.find(
        (p) => p.type === 'tool-suggestFollowUps' && 'state' in p,
    );

    if (!suggestPart || !('state' in suggestPart)) return { suggestions: undefined, loading: false };

    const state = suggestPart.state as string;

    if (state === 'input-streaming') {
        return { suggestions: undefined, loading: true };
    }

    if ((state === 'input-available' || state === 'output-available') && 'input' in suggestPart) {
        const input = suggestPart.input as { suggestions: string[] };
        return { suggestions: input.suggestions, loading: false };
    }

    return { suggestions: undefined, loading: false };
}
