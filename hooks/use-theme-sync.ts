'use client';

import { useTheme } from 'next-themes';
import { useQuery, useMutation, skipToken } from '@tanstack/react-query';
import { useCRPC } from '@/lib/convex/crpc';
import { useUser } from '@/context/UserContext';
import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that bridges next-themes with Convex for authenticated users.
 *
 * - On first load: syncs Convex themePreference to next-themes if they differ
 * - On theme change: updates both next-themes and Convex (when authenticated)
 * - For unauthenticated users: behaves identically to useTheme()
 *
 * @returns theme state and a sync-aware setTheme function
 */
export function useThemeSync() {
    const { theme, setTheme } = useTheme();
    const { isAuthenticated } = useUser();

    const crpc = useCRPC();

    const { data: convexUser } = useQuery(
        crpc.users.getCurrentUser.queryOptions(
            isAuthenticated ? {} : skipToken,
        ),
    );

    const updateThemeMutation = useMutation(crpc.users.updateThemePreference.mutationOptions());

    const hasSynced = useRef(false);

    // Sync Convex preference to next-themes on first load
    useEffect(() => {
        if (hasSynced.current || !convexUser?.themePreference) return;
        if (convexUser.themePreference !== theme) {
            setTheme(convexUser.themePreference);
        }
        hasSynced.current = true;
    }, [convexUser, theme, setTheme]);

    const setThemeWithSync = useCallback(
        (newTheme: string) => {
            setTheme(newTheme);
            if (isAuthenticated && (newTheme === 'light' || newTheme === 'dark')) {
                void updateThemeMutation.mutate({ themePreference: newTheme });
            }
        },
        [setTheme, isAuthenticated, updateThemeMutation],
    );

    const isDarkMode = theme === 'dark';

    return { theme, setTheme: setThemeWithSync, isDarkMode };
}
