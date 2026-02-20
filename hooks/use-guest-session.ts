'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { useConvexAuth } from 'convex/react';
import { useQuery, useMutation, skipToken } from '@tanstack/react-query';
import { useCRPC } from '@/lib/convex/crpc';
import { Id } from '@/convex/_generated/dataModel';
import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * Hook for managing guest sessions for unauthenticated users.
 *
 * Automatically creates a guest record in Convex when:
 * - User is not authenticated
 * - No existing guest ID is stored
 * - A valid session ID exists
 *
 * The session ID persists in localStorage to maintain guest identity
 * across browser sessions.
 */
export const useGuestSession = () => {
    const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
    const [sessionId, setSessionId] = useLocalStorage('guest-session-id', '');
    const [guestId, setGuestId] = useLocalStorage<Id<'guests'> | null>('guest-id', null);
    const [isCreatingGuest, setIsCreatingGuest] = useState(false);

    // Track if we're currently creating to avoid race conditions
    const isCreatingRef = useRef(false);

    const crpc = useCRPC();

    const createGuestMutation = useMutation(crpc.guests.createNewGuest.mutationOptions());

    // Validate that stored guestId still exists in Convex DB.
    // Prevents stale localStorage IDs from causing query errors.
    const shouldCheckGuestExists = !isAuthenticated && !!guestId;

    const { data: guestExistsData, isPending: isGuestExistsPending } = useQuery(
        crpc.guests.guestExists.queryOptions(
            shouldCheckGuestExists ? { guestId: String(guestId) } : skipToken,
        ),
    );

    // Convex useQuery returned undefined while loading, now isPending handles that.
    // guestExistsResult was the direct value; now it's guestExistsData.
    const guestExistsResult = shouldCheckGuestExists
        ? (isGuestExistsPending ? undefined : guestExistsData)
        : undefined;

    const isValidatingGuest = !isAuthenticated && guestId !== null && guestExistsResult === undefined;

    // Clear stale guestId if it no longer exists in Convex
    useEffect(() => {
        if (guestExistsResult === false) {
            setGuestId(null);
        }
    }, [guestExistsResult, setGuestId]);

    // Generate session ID if none exists
    useEffect(() => {
        if (!sessionId) {
            const newSessionId = crypto.randomUUID();
            setSessionId(`guest-${newSessionId}`);
        }
    }, [sessionId, setSessionId]);

    /**
     * Create a new guest record in Convex.
     * Uses ref to prevent multiple simultaneous creation attempts.
     */
    const createGuest = useCallback(async () => {
        if (isCreatingRef.current || !sessionId) return;

        isCreatingRef.current = true;
        setIsCreatingGuest(true);

        try {
            const newGuestId = await createGuestMutation.mutateAsync({ sessionId });
            setGuestId(newGuestId);
        } catch (error) {
            console.error('Error creating guest:', error);
        } finally {
            setIsCreatingGuest(false);
            isCreatingRef.current = false;
        }
    }, [sessionId, createGuestMutation, setGuestId]);

    // Auto-create guest when unauthenticated and no guest exists
    // Skip during auth loading to prevent race conditions on signout
    useEffect(() => {
        if (
            !isAuthLoading &&
            !isAuthenticated &&
            !guestId &&
            sessionId &&
            !isCreatingGuest &&
            !isCreatingRef.current
        ) {
            createGuest();
        }
    }, [isAuthLoading, isAuthenticated, guestId, sessionId, isCreatingGuest, createGuest]);

    /**
     * Ensure a guest exists before performing an operation.
     * Returns the existing guest ID or creates one if needed.
     * Useful for operations that require a guest ID synchronously.
     */
    const ensureGuestExists = useCallback(async (): Promise<Id<'guests'>> => {
        // Return existing guest if available
        if (guestId) return guestId;

        // Wait for ongoing creation to complete
        if (isCreatingRef.current) {
            // Poll until guest is created
            return new Promise((resolve, reject) => {
                const maxAttempts = 50; // 5 seconds max
                let attempts = 0;

                const checkGuest = () => {
                    attempts++;
                    // Re-read from localStorage in case it was updated
                    const storedGuestId = localStorage.getItem('guest-id');
                    if (storedGuestId) {
                        try {
                            const parsed = JSON.parse(storedGuestId) as Id<'guests'>;
                            resolve(parsed);
                            return;
                        } catch {
                            // Continue polling
                        }
                    }

                    if (attempts >= maxAttempts) {
                        reject(new Error('Timeout waiting for guest creation'));
                        return;
                    }

                    setTimeout(checkGuest, 100);
                };

                checkGuest();
            });
        }

        // Create new guest
        isCreatingRef.current = true;
        setIsCreatingGuest(true);

        try {
            const newGuestId = await createGuestMutation.mutateAsync({ sessionId });
            setGuestId(newGuestId);
            return newGuestId;
        } catch (error) {
            console.error('Error creating guest:', error);
            throw error;
        } finally {
            setIsCreatingGuest(false);
            isCreatingRef.current = false;
        }
    }, [guestId, sessionId, createGuestMutation, setGuestId]);

    return {
        guestId,
        sessionId,
        ensureGuestExists,
        isCreatingGuest,
        isValidatingGuest,
        isAuthenticated,
    };
};
