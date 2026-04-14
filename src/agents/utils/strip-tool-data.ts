import { pick } from 'es-toolkit';
import type { CommonSuccessOutput, CommonToolInput } from '@/data-sources/types';
import { commonErrorOutput } from '@/data-sources/types';
import { z } from 'zod';

type SuccessOutputField = keyof CommonSuccessOutput;
type ErrorOutputField = keyof z.infer<typeof commonErrorOutput>;
type InputField = keyof CommonToolInput;

export const TOOL_RESULT_KEEP_FIELDS = [
    'success',
    'error',
    'apiUrl',
    'portalUrl',
    'total',
] as const satisfies readonly (SuccessOutputField | ErrorOutputField | 'total')[];

export const TOOL_RESULT_KEEP_NESTED = {
    dataset: ['title', 'name'] as const,
    organization: ['title', 'name'] as const,
    resource: ['name'] as const,
} satisfies Record<string, readonly string[]>;

export const TOOL_ARGS_KEEP_FIELDS = ['searchedResourceName', 'q'] as const satisfies readonly (InputField | 'q')[];

export function stripToolResult(result: Record<string, unknown>): Record<string, unknown> {
    const stripped: Record<string, unknown> = pick(result, [...TOOL_RESULT_KEEP_FIELDS]);

    for (const [key, allowedKeys] of Object.entries(TOOL_RESULT_KEEP_NESTED)) {
        const nested = result[key];
        if (typeof nested === 'object' && nested !== null) {
            stripped[key] = pick(nested as Record<string, unknown>, [...allowedKeys]);
        }
    }

    return stripped;
}
