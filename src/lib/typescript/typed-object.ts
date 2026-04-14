/**
 * Type-Safe Object Utilities
 *
 * Wrappers around Object.keys/values/entries that preserve
 * key and value types instead of widening to string[].
 */

/** Type-safe Object.keys — returns the key union instead of string[] */
export function typedKeys<T extends Record<string, unknown>>(obj: T): Array<keyof T & string> {
    return Object.keys(obj) as Array<keyof T & string>;
}

/** Type-safe Object.values — preserves the value type */
export function typedValues<T extends Record<string, unknown>>(obj: T): Array<T[keyof T]> {
    return Object.values(obj) as Array<T[keyof T]>;
}

/** Type-safe Object.entries — preserves both key and value types */
export function typedEntries<T extends Record<string, unknown>>(obj: T): Array<[keyof T & string, T[keyof T]]> {
    return Object.entries(obj) as Array<[keyof T & string, T[keyof T]]>;
}
