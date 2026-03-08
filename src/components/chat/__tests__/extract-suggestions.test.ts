import { describe, it, expect } from 'vitest';
import { extractSuggestions } from '../extract-suggestions';
import type { UIMessage } from 'ai';

function makeMessage(...parts: UIMessage['parts']): UIMessage {
    return { id: 'test', role: 'assistant', parts } as UIMessage;
}

describe('extractSuggestions', () => {
    it('returns no suggestions for undefined message', () => {
        expect(extractSuggestions(undefined)).toEqual({
            suggestions: undefined,
            loading: false,
        });
    });

    it('returns no suggestions when message has no suggestFollowUps part', () => {
        const message = makeMessage({ type: 'text', text: 'hello' });
        expect(extractSuggestions(message)).toEqual({
            suggestions: undefined,
            loading: false,
        });
    });

    it('returns loading when state is input-streaming', () => {
        const message = makeMessage({
            type: 'tool-suggestFollowUps',
            state: 'input-streaming',
            toolCallId: 'tc1',
            toolName: 'suggestFollowUps',
        } as unknown as UIMessage['parts'][number]);

        expect(extractSuggestions(message)).toEqual({
            suggestions: undefined,
            loading: true,
        });
    });

    it('extracts suggestions from input-available state', () => {
        const message = makeMessage({
            type: 'tool-suggestFollowUps',
            state: 'input-available',
            toolCallId: 'tc1',
            toolName: 'suggestFollowUps',
            input: { suggestions: ['a', 'b'] },
        } as unknown as UIMessage['parts'][number]);

        expect(extractSuggestions(message)).toEqual({
            suggestions: ['a', 'b'],
            loading: false,
        });
    });

    it('extracts suggestions from output-available state', () => {
        const message = makeMessage({
            type: 'tool-suggestFollowUps',
            state: 'output-available',
            toolCallId: 'tc1',
            toolName: 'suggestFollowUps',
            input: { suggestions: ['a', 'b'] },
            output: { suggestions: ['a', 'b'] },
        } as unknown as UIMessage['parts'][number]);

        expect(extractSuggestions(message)).toEqual({
            suggestions: ['a', 'b'],
            loading: false,
        });
    });

    it('handles input-available with empty suggestions array', () => {
        const message = makeMessage({
            type: 'tool-suggestFollowUps',
            state: 'input-available',
            toolCallId: 'tc1',
            toolName: 'suggestFollowUps',
            input: { suggestions: [] },
        } as unknown as UIMessage['parts'][number]);

        expect(extractSuggestions(message)).toEqual({
            suggestions: [],
            loading: false,
        });
    });
});
