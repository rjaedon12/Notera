import { z } from "zod"

/**
 * Server-side environment variable validation.
 * Import this module early (e.g., in instrumentation.ts or lib/prisma.ts)
 * to fail fast on missing environment variables.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
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
