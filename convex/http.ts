import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { Webhook } from 'svix';

const http = httpRouter();

const handleClerkWebhook = httpAction(async (ctx, request) => {
    const webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!webhookSecret) {
        console.error('Missing CLERK_WEBHOOK_SIGNING_SECRET environment variable');
        return new Response('Server configuration error', { status: 500 });
    }

    // Get headers for verification
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
        return new Response('Missing svix headers', { status: 400 });
    }

    const body = await request.text();

    const wh = new Webhook(webhookSecret);
    let event: { type: string; data: Record<string, unknown> };

    try {
        event = wh.verify(body, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
        }) as typeof event;
    } catch {
        console.error('Webhook verification failed');
        return new Response('Invalid signature', { status: 400 });
    }

    switch (event.type) {
        case 'user.created':
        case 'user.updated': {
            const data = event.data;
            // Extract primary email from Clerk's email_addresses array
            const emailAddresses = data.email_addresses as
                | Array<{ email_address: string; id: string }>
                | undefined;
            const primaryEmailId = data.primary_email_address_id as string | undefined;
            const primaryEmail =
                emailAddresses?.find((e) => e.id === primaryEmailId)?.email_address ?? '';

            await ctx.runMutation(internal.users.upsertFromClerk, {
                clerkId: data.id as string,
                email: primaryEmail,
                firstName: (data.first_name as string) ?? undefined,
                lastName: (data.last_name as string) ?? undefined,
                imageUrl: (data.image_url as string) ?? undefined,
            });
            break;
        }
        case 'user.deleted': {
            const clerkId = event.data.id as string;
            if (clerkId) {
                await ctx.runMutation(internal.users.deleteByClerkId, { clerkId });
            }
            break;
        }
        default:
            console.log('Ignored Clerk webhook event:', event.type);
    }

    return new Response(null, { status: 200 });
});

http.route({
    path: '/clerk-users-webhook',
    method: 'POST',
    handler: handleClerkWebhook,
});

export default http;
