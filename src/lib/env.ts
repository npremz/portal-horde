import { z } from "zod";

/**
 * Environment variable validation using Zod.
 * Fail-fast: App crashes at startup if required vars are missing.
 */

// Client-side environment variables (NEXT_PUBLIC_*)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL").optional(),
});

// Server-side environment variables
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  RESEND_API_KEY: z.string().optional(),
  ADMIN_EMAIL: z.string().email().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  DISABLE_ERROR_EMAILS: z.enum(["true", "false"]).optional(),
});

// Combined schema for server-side (includes client vars)
const envSchema = clientEnvSchema.merge(serverEnvSchema);

type ClientEnv = z.infer<typeof clientEnvSchema>;
type ServerEnv = z.infer<typeof serverEnvSchema>;
type Env = z.infer<typeof envSchema>;

// Validation results cached
let _clientEnv: ClientEnv | null = null;
let _serverEnv: Env | null = null;

/**
 * Get validated client environment variables.
 * Safe to use in browser and server components.
 */
export function getClientEnv(): ClientEnv {
  if (_clientEnv) return _clientEnv;

  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`❌ Invalid client environment variables:\n${errors}`);
  }

  _clientEnv = parsed.data;
  return _clientEnv;
}

/**
 * Get validated server environment variables.
 * Only safe to use in server-side code (API routes, Server Components, middleware).
 * Includes client vars for convenience.
 */
export function getServerEnv(): Env {
  if (_serverEnv) return _serverEnv;

  // Ensure we're on the server
  if (typeof window !== "undefined") {
    throw new Error("getServerEnv() cannot be called on the client side");
  }

  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    DISABLE_ERROR_EMAILS: process.env.DISABLE_ERROR_EMAILS,
  });

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`❌ Invalid server environment variables:\n${errors}`);
  }

  // Warn about optional but recommended vars
  if (!parsed.data.RESEND_API_KEY) {
    console.warn("[Horde] ⚠️ RESEND_API_KEY is not set - email features will be disabled");
  }

  _serverEnv = parsed.data;
  return _serverEnv;
}

/**
 * Parse comma-separated ALLOWED_ORIGINS into array.
 * Returns default origins if not set.
 */
export function getAllowedOrigins(): string[] {
  const env = getServerEnv();
  if (!env.ALLOWED_ORIGINS) {
    // Default allowed origins
    return [
      "https://portal.hordeagence.com",
      "http://localhost:3000",
    ];
  }
  return env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim());
}

// Type exports
export type { ClientEnv, ServerEnv, Env };
