'use client';

import { api } from '@/convex/_generated/api';
import { meta } from '@/convex/shared/meta';
import { createCRPCContext } from 'better-convex/react';

export const { CRPCProvider, useCRPC, useCRPCClient } = createCRPCContext<
    typeof api
>({
    api,
    meta,
    convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
});
