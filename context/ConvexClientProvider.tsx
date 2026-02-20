'use client';

import { ReactNode } from 'react';
import { ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { QueryClientProvider } from '@tanstack/react-query';
import {
    getQueryClientSingleton,
    getConvexQueryClientSingleton,
} from 'better-convex/react';
import { useAuth } from '@clerk/nextjs';
import { CRPCProvider } from '@/lib/convex/crpc';
import { createQueryClient } from '@/lib/convex/query-client';

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    throw new Error('Missing NEXT_PUBLIC_CONVEX_URL in your .env file');
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

/**
 * Unified provider combining Convex + Clerk + TanStack Query + cRPC.
 *
 * Merges the previous separate QueryClientProvider into a single component
 * that wires up:
 * - ConvexProviderWithClerk for Convex auth via Clerk
 * - QueryClientProvider for TanStack Query
 * - CRPCProvider for better-convex cRPC hooks
 */
export default function ConvexClientProvider({
    children,
}: {
    children: ReactNode;
}) {
    const queryClient = getQueryClientSingleton(createQueryClient);
    const convexQueryClient = getConvexQueryClientSingleton({
        convex,
        queryClient,
    });

    return (
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
            <QueryClientProvider client={queryClient}>
                <CRPCProvider
                    convexClient={convex}
                    convexQueryClient={convexQueryClient}
                >
                    {children}
                </CRPCProvider>
            </QueryClientProvider>
        </ConvexProviderWithClerk>
    );
}
