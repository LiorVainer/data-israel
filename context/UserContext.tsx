'use client';

import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useConvexAuth } from 'convex/react';
import { useGuestSession } from '@/hooks/use-guest-session';
import { Id } from '@/convex/_generated/dataModel';

/**
 * User context type providing unified access to authentication state
 * and guest session management across the application.
 */
interface UserContextType {
    /** Whether the user is authenticated via Clerk */
    isAuthenticated: boolean;
    /** Whether auth state or guest creation is still loading */
    isLoading: boolean;

    /** Guest ID for unauthenticated users (null if authenticated) */
    guestId: Id<'guests'> | null;
    /** Persistent session ID for guest tracking */
    sessionId: string;
    /** Whether a guest record is currently being created */
    isCreatingGuest: boolean;
    /** Whether a stored guestId is being validated against Convex */
    isValidatingGuest: boolean;
    /** Ensure a guest exists and return its ID */
    ensureGuestExists: () => Promise<Id<'guests'>>;

    /**
     * Computed user identifier for Convex queries.
     * For authenticated users, Convex uses identity.subject internally.
     * For guests, this returns the guestId as a string.
     */
    userId: string | null;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/**
 * Hook to access user context.
 * Must be used within a UserProvider.
 *
 * @throws Error if used outside of UserProvider
 */
export const useUser = (): UserContextType => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

interface UserProviderProps {
    children: ReactNode;
}

/**
 * Provider component that combines Convex auth state with guest session management.
 * Wrap your app with this provider to access user context throughout.
 *
 * @example
 * ```tsx
 * <UserProvider>
 *   <App />
 * </UserProvider>
 * ```
 */
export const UserProvider = ({ children }: UserProviderProps) => {
    const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
    const { guestId, sessionId, isCreatingGuest, isValidatingGuest, ensureGuestExists } =
        useGuestSession();

    // Compute the user identifier for Convex queries
    // For authenticated users, Convex uses identity.subject internally
    // For guests, we use the guestId
    const userId = useMemo(() => {
        if (isAuthenticated) {
            return null; // Convex handles authenticated user identity
        }
        return guestId;
    }, [isAuthenticated, guestId]);

    const contextValue = useMemo<UserContextType>(
        () => ({
            isAuthenticated,
            isLoading: isAuthLoading || isCreatingGuest || isValidatingGuest,
            guestId,
            sessionId,
            isCreatingGuest,
            isValidatingGuest,
            ensureGuestExists,
            userId,
        }),
        [
            isAuthenticated,
            isAuthLoading,
            isCreatingGuest,
            isValidatingGuest,
            guestId,
            sessionId,
            ensureGuestExists,
            userId,
        ],
    );

    return <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>;
};
