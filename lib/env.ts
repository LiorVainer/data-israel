import { z } from 'zod';

export const EnvSchema = z.object({
    // =======================
    // Server Configuration
    // =======================
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // =======================
    // AI Configuration
    // =======================
    OPENROUTER_API_KEY: z.string(),
    AI_DEFAULT_MODEL_ID: z.string().default('google/gemini-3-flash-preview'),
    AI_MAX_STEPS: z.coerce.number().int().min(1).default(25),
    AI_TOOL_CALL_CONCURRENCY: z.coerce.number().int().min(1).default(10),

    // =======================
    // Convex Configuration
    // =======================
    NEXT_PUBLIC_CONVEX_URL: z.string().optional(),
    CONVEX_ADMIN_KEY: z.string().optional(),

    // =======================
    // Deployment / Metadata
    // =======================
    VERCEL_GIT_COMMIT_SHA: z.string().optional(),
    NEXT_PUBLIC_SITE_URL: z.string().default('https://data-israel.org'),
});

export type Env = z.infer<typeof EnvSchema>;

function parseEnv(): Env {
    // Skip validation on the client — server-only secrets like
    // OPENROUTER_API_KEY are not available in the browser bundle.
    if (typeof window !== 'undefined') {
        return process.env as unknown as Env;
    }

    const { data, error } = EnvSchema.safeParse(process.env);

    if (error) {
        console.error('Environment validation failed:', error.issues);
        throw new Error(error.issues[0].message);
    }

    return data;
}

export const ENV = parseEnv();
