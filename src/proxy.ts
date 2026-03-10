import { clerkMiddleware } from '@clerk/nextjs/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { geolocation, ipAddress } from '@vercel/functions';
import { NextResponse, type NextRequest } from 'next/server';

const BLOCKED_PAGE = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>הגישה חסומה</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #888; font-size: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>הגישה מוגבלת</h1>
    <p>שירות זה זמין רק מישראל.</p>
    <p>This service is only available from Israel.</p>
  </div>
</body>
</html>`;

const RATE_LIMITED_PAGE = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>יותר מדי בקשות</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0a0a0a; color: #fafafa; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #888; font-size: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>יותר מדי בקשות</h1>
    <p>נסו שוב בעוד מספר דקות.</p>
    <p>Too many requests. Please try again later.</p>
  </div>
</body>
</html>`;

const clerk = clerkMiddleware();

// Lazy-init ratelimit to avoid crashing when env vars are missing (dev)
let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
    if (ratelimit) return ratelimit;

    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return null;

    ratelimit = new Ratelimit({
        redis: new Redis({ url, token }),
        limiter: Ratelimit.slidingWindow(60, '60 s'), // 60 requests per minute per IP
        prefix: 'ratelimit:proxy',
    });
    return ratelimit;
}

export default async function proxy(request: NextRequest) {
    // 1. Geo-block: only allow Israeli IPs
    const { country } = geolocation(request);
    if (country && country !== 'IL') {
        return new NextResponse(BLOCKED_PAGE, {
            status: 403,
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }

    // 2. Rate limit by IP
    const limiter = getRatelimit();
    if (limiter) {
        const ip = ipAddress(request) ?? '127.0.0.1';
        const { success, reset } = await limiter.limit(ip);

        if (!success) {
            return new NextResponse(RATE_LIMITED_PAGE, {
                status: 429,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
                },
            });
        }
    }

    // 3. Continue with Clerk auth
    return clerk(request, {} as never);
}

export const config = {
    matcher: [
        // Skip Next.js internals and static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
