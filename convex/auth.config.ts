/**
 * Convex Auth Configuration
 *
 * Configures Clerk as the authentication provider for Convex.
 * The JWT template must be created in Clerk Dashboard > JWT Templates > Convex.
 */

export default {
    providers: [
        {
            // Clerk Frontend API URL from JWT Template
            // Development: https://verb-noun-00.clerk.accounts.dev
            // Production: https://clerk.<your-domain>.com
            domain: process.env.CLERK_FRONTEND_API_URL,
            applicationID: 'convex',
        },
    ],
};
