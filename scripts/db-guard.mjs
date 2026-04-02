#!/usr/bin/env node
/**
 * db-guard.mjs
 *
 * Hard stop: prevents `prisma migrate reset` and `prisma db push --force-reset`
 * from ever executing in a production environment.
 *
 * Detects production via:
 *   VERCEL=1            — set automatically by Vercel on all deployments
 *   VERCEL_ENV          — "production" | "preview" | "development"
 *   NODE_ENV=production — standard production signal
 *
 * Usage (in package.json scripts):
 *   "db:reset": "node scripts/db-guard.mjs && prisma migrate reset"
 */

const isVercel = process.env.VERCEL === "1"
const isVercelProd = process.env.VERCEL_ENV === "production"
const isNodeProd = process.env.NODE_ENV === "production"

const BORDER = "═".repeat(62)

if (isVercel || isVercelProd || isNodeProd) {
  console.error(`\n╔${BORDER}╗`)
  console.error(`║  🚨  PRODUCTION GUARD — DESTRUCTIVE DB COMMAND BLOCKED       ║`)
  console.error(`╠${BORDER}╣`)
  console.error(`║                                                              ║`)
  console.error(`║  Running "prisma migrate reset" or "db push --force-reset"  ║`)
  console.error(`║  in a production environment is FORBIDDEN.                  ║`)
  console.error(`║                                                              ║`)
  console.error(`║  These commands permanently WIPE ALL DATA in the database.  ║`)
  console.error(`║                                                              ║`)
  console.error(`║  If a schema reset is truly necessary, do it manually from  ║`)
  console.error(`║  your local machine targeting a Neon dev branch only.       ║`)
  console.error(`║                                                              ║`)
  console.error(`║  Detected env:                                               ║`)
  console.error(`║    VERCEL       = ${String(process.env.VERCEL ?? "unset").padEnd(40)}║`)
  console.error(`║    VERCEL_ENV   = ${String(process.env.VERCEL_ENV ?? "unset").padEnd(40)}║`)
  console.error(`║    NODE_ENV     = ${String(process.env.NODE_ENV ?? "unset").padEnd(40)}║`)
  console.error(`║                                                              ║`)
  console.error(`╚${BORDER}╝\n`)
  process.exit(1)
}

console.log("✓ db-guard: not a production environment — proceeding.")
