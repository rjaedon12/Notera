import { z } from "zod"

/**
 * Server-side environment variable validation.
 * Validation is skipped during Next.js build phase because runtime secrets
 * (e.g. AUTH_SECRET) are not available in Vercel's build environment.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  // Admin password recovery encryption key (32 bytes as hex)
  ADMIN_PASSWORD_ENCRYPTION_KEY: z.string().length(64).optional(),
  // Optional OAuth providers
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  // Optional integrations
  GOOGLE_SHEETS_WEBHOOK_URL: z.string().url().optional(),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().optional(),
  GOOGLE_SHEETS_API_KEY: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  // Skip strict validation during the Next.js build phase — runtime-only secrets
  // (AUTH_SECRET, etc.) are not injected into the build environment on Vercel.
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build"
  if (isBuildPhase) {
    return process.env as unknown as Env
  }

  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `  ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")
    console.error(`❌ Missing or invalid environment variables:\n${errors}`)
    throw new Error(`Environment validation failed:\n${errors}`)
  }

  return parsed.data
}

export const env = validateEnv()
