'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing session storage with a useState-like API.
 * Supports SSR by returning null during server rendering.
 *
 * @param key - The session storage key
 * @param initialValue - Optional initial value if key doesn't exist
 * @returns [value, setValue, removeValue] tuple
 */
export function useSessionStorage<T>(
    key: string,
    initialValue?: T
): [T | null, (value: T | ((prev: T | null) => T)) => void, () => void] {
    const [storedValue, setStoredValue] = useState<T | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    // Initialize value from session storage on mount
    useEffect(() => {
        try {
            const item = sessionStorage.getItem(key);
            console.log(`[useSessionStorage] Reading key "${key}":`, item);
            if (item !== null) {
                const parsed = JSON.parse(item) as T;
                console.log(`[useSessionStorage] Parsed value:`, parsed);
                setStoredValue(parsed);
            } else if (initialValue !== undefined) {
                setStoredValue(initialValue);
                sessionStorage.setItem(key, JSON.stringify(initialValue));
            }
        } catch (error) {
            console.error(`Error reading session storage key "${key}":`, error);
            if (initialValue !== undefined) {
                setStoredValue(initialValue);
            }
        }
        setIsHydrated(true);
    }, [key, initialValue]);

    // Update session storage when value changes (after hydration)
    const setValue = useCallback(
        (value: T | ((prev: T | null) => T)) => {
            try {
                const valueToStore = value instanceof Function ? value(storedValue) : value;
                setStoredValue(valueToStore);
                sessionStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (error) {
                console.error(`Error setting session storage key "${key}":`, error);
            }
        },
        [key, storedValue]
    );

    // Remove value from session storage
    const removeValue = useCallback(() => {
        try {
            sessionStorage.removeItem(key);
            setStoredValue(null);
        } catch (error) {
            console.error(`Error removing session storage key "${key}":`, error);
        }
    }, [key]);

    // Return null before hydration to avoid SSR mismatch
    return [isHydrated ? storedValue : null, setValue, removeValue];
}

/**
 * Utility functions for direct session storage access (non-reactive).
 * Useful for one-time read/write operations.
 */
export const sessionStorageUtils = {
    get<T>(key: string): T | null {
        if (typeof window === 'undefined') return null;
        try {
            const item = sessionStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : null;
        } catch {
            return null;
        }
    },

    set<T>(key: string, value: T): void {
        if (typeof window === 'undefined') return;
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error setting session storage key "${key}":`, error);
        }
    },

    remove(key: string): void {
        if (typeof window === 'undefined') return;
        try {
            sessionStorage.removeItem(key);
        } catch (error) {
            console.error(`Error removing session storage key "${key}":`, error);
        }
    },
};
