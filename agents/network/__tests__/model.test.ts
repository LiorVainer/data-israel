/**
 * Tests for agents/network/model.ts
 *
 * Verifies getMastraModelId and getAiSdkModelId return correctly
 * prefixed/unprefixed model IDs for each agent type.
 */

import { describe, it, expect, vi } from 'vitest';

// Mock AgentConfig before importing the module under test
vi.mock('../../agent.config', () => ({
    AgentConfig: {
        MODEL: {
            DEFAULT_ID: 'test/default-model',
            DATAGOV_ID: 'test/datagov-model',
            CBS_ID: 'test/cbs-model',
        },
    },
}));

import { getMastraModelId, getAiSdkModelId } from '../model';

describe('getMastraModelId', () => {
    it('returns openrouter/{DEFAULT_ID} when no agent ID is provided', () => {
        expect(getMastraModelId()).toBe('openrouter/test/default-model');
    });

    it('returns openrouter/{DATAGOV_ID} for datagov agent', () => {
        expect(getMastraModelId('datagov')).toBe('openrouter/test/datagov-model');
    });

    it('returns openrouter/{CBS_ID} for cbs agent', () => {
        expect(getMastraModelId('cbs')).toBe('openrouter/test/cbs-model');
    });
});

describe('getAiSdkModelId', () => {
    it('returns DEFAULT_ID when no agent ID is provided', () => {
        expect(getAiSdkModelId()).toBe('test/default-model');
    });

    it('returns DATAGOV_ID for datagov agent', () => {
        expect(getAiSdkModelId('datagov')).toBe('test/datagov-model');
    });

    it('returns CBS_ID for cbs agent', () => {
        expect(getAiSdkModelId('cbs')).toBe('test/cbs-model');
    });
});
