const MAX_RESULT_CHARS = 6_000;
const MAX_ARRAY_ITEMS = 20;

export function truncateResult(result: unknown): unknown {
    if (Array.isArray(result)) {
        const sliced = result.slice(0, MAX_ARRAY_ITEMS);
        return result.length > MAX_ARRAY_ITEMS
            ? [...sliced, `… (${result.length - MAX_ARRAY_ITEMS} more items)`]
            : sliced;
    }
    if (result !== null && typeof result === 'object') {
        return Object.fromEntries(
            Object.entries(result as Record<string, unknown>).map(([k, v]) => [k, truncateResult(v)]),
        );
    }
    return result;
}

export function serializeResult(result: unknown): string {
    const truncated = truncateResult(result);
    const json = JSON.stringify(truncated, null, 2);
    if (json.length <= MAX_RESULT_CHARS) return json;
    return json.slice(0, MAX_RESULT_CHARS) + `\n… (truncated, total ${json.length} chars)`;
}
