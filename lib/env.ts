import { z } from "zod";

/**
 * Server env validation: criticals throw with a clear list the first time
 * anything touches them; optionals warn once so a cloner sees exactly which
 * feature will not work (billing, email, Google sign-in) instead of hitting
 * an opaque runtime error later.
 *
 * Parsing is lazy (on first access) rather than at module import, so
 * `next build` prerendering never trips over a missing env it does not need.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "Postgres connection string from Neon is required."),
  BETTER_AUTH_SECRET: z
    .string()
    .min(1, "Run `openssl rand -base64 32` to generate one."),
  BETTER_AUTH_URL: z
    .string()
    .min(1, "e.g. http://localhost:3000 or your production URL."),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

const OPTIONAL_GROUPS: { feature: string; vars: string[] }[] = [
  {
    feature: "Email delivery (verification, invitations, receipts)",
    vars: ["RESEND_API_KEY", "EMAIL_FROM"],
  },
  {
    feature: "Billing with Billplz",
    vars: [
      "BILLPLZ_SECRET_KEY",
      "BILLPLZ_X_SIGNATURE_KEY",
      "BILLPLZ_COLLECTION_ID",
    ],
  },
  {
    feature: "Sign in with Google",
    vars: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  },
];

let cached: ServerEnv | null = null;
let warned = false;

function warnOnce() {
  if (warned) return;
  warned = true;
  for (const group of OPTIONAL_GROUPS) {
    const missing = group.vars.filter((v) => !process.env[v]);
    if (missing.length === group.vars.length && missing.length > 0) {
      console.warn(
        `[env] ${group.feature} is not configured (missing ${missing.join(", ")}) — that feature will error until set in .env.local.`
      );
    } else if (missing.length > 0) {
      console.warn(
        `[env] ${group.feature} is partially configured (missing ${missing.join(", ")}).`
      );
    }
  }
  if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET) {
    console.warn(
      "[env] CRON_SECRET is not set — the billing reminder cron endpoint is unguarded in production."
    );
  }
}

/** Validated critical server env; throws a readable error on first use. */
export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  });
  if (!parsed.success) {
    const lines = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Missing required environment variables — set them in .env.local (see .env.example):\n${lines}`
    );
  }
  warnOnce();
  cached = parsed.data;
  return cached;
}
