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
    AI_DEFAULT_MODEL_ID: z.string().default('x-ai/grok-4.1-fast'),
    AI_DATAGOV_MODEL_ID: z.string().optional(),
    AI_CBS_MODEL_ID: z.string().optional(),
    AI_BUDGET_MODEL_ID: z.string().optional(),
    AI_GOVMAP_MODEL_ID: z.string().optional(),
    AI_DRUGS_MODEL_ID: z.string().optional(),
    AI_HEALTH_MODEL_ID: z.string().optional(),
    AI_KNESSET_MODEL_ID: z.string().optional(),
    AI_SHUFERSAL_MODEL_ID: z.string().optional(),
    AI_RAMI_LEVY_MODEL_ID: z.string().optional(),
    AI_ENABLE_SCORERS: z.preprocess((val) => val === 'true' || val === '1', z.boolean()).default(false),
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
    NEXT_PUBLIC_BIT_DONATE_URL: z.string().optional(),

    // =======================
    // Bright Data Proxies (Israeli egress for Knesset/Shufersal/Rami Levy)
    // =======================
    // Full proxy URL from Bright Data dashboard. Shape:
    //   http://brd-customer-<id>-zone-<zone>-country-il:<password>@brd.superproxy.io:33335
    // Required in all environments (dev, preview, production). Missing = startup failure,
    // not silent "direct egress" fallback, so misconfiguration surfaces immediately.
    BRIGHT_DATA_PROXY_URL: z.string().min(1, 'BRIGHT_DATA_PROXY_URL is required (Bright Data residential zone)'),
    BRIGHT_DATA_UNLOCKER_URL: z
        .string()
        .min(1, 'BRIGHT_DATA_UNLOCKER_URL is required (Bright Data Web Unlocker zone)'),
    // Dev-only: non-Israeli country probe URL for `pnpm classify-source`. NEVER set
    // in Vercel production. Used to simulate non-IL egress from a dev machine that
    // is physically in Israel. Optional here so production starts cleanly without it.
    BRIGHT_DATA_PROBE_URL: z.string().optional(),
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
