'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Custom hook for managing localStorage with SSR support.
 * Provides a useState-like API for persistent storage.
 *
 * @param key - The localStorage key
 * @param initialValue - Initial value if key doesn't exist
 * @returns [storedValue, setValue] tuple
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
    /**
     * Read value from localStorage with SSR safety check.
     * Returns initialValue during SSR or if read fails.
     */
    const readValue = useCallback((): T => {
        // SSR check - window is undefined on server
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    }, [key, initialValue]);

    const [storedValue, setStoredValue] = useState<T>(readValue);

    /**
     * Set value in both state and localStorage.
     * Supports functional updates like useState.
     */
    const setValue = useCallback(
        (value: T | ((prev: T) => T)) => {
            try {
                setStoredValue((prev) => {
                    const valueToStore = value instanceof Function ? value(prev) : value;

                    // Only persist to localStorage in browser environment
                    if (typeof window !== 'undefined') {
                        localStorage.setItem(key, JSON.stringify(valueToStore));
                    }

                    return valueToStore;
                });
            } catch (error) {
                console.warn(`Error setting localStorage key "${key}":`, error);
            }
        },
        [key],
    );

    // Listen for storage changes from other tabs/windows
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === key && event.newValue !== null) {
                try {
                    setStoredValue(JSON.parse(event.newValue) as T);
                } catch {
                    // Ignore parse errors from external changes
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return [storedValue, setValue];
}
