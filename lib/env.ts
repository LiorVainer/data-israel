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
    AI_MAX_STEPS: z.coerce.number().int().min(1).default(10),
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

const { data: parsedEnv, error } = EnvSchema.safeParse(process.env);

if (error) {
    console.error('Environment validation failed:', error.issues);
    console.log('Received environment variables:', process.env);
    throw new Error(error.issues[0].message);
}

export const ENV = parsedEnv;
