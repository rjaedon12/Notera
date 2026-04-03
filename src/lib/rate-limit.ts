import { NextResponse } from "next/server"

type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitConfig = {
  limit: number
  windowMs: number
}

type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
  resetAt: number
}

const globalRateLimitStore = globalThis as typeof globalThis & {
  __noteraRateLimitStore?: Map<string, RateLimitEntry>
}

const rateLimitStore = globalRateLimitStore.__noteraRateLimitStore ?? new Map<string, RateLimitEntry>()

if (!globalRateLimitStore.__noteraRateLimitStore) {
  globalRateLimitStore.__noteraRateLimitStore = rateLimitStore
}

function pruneExpiredEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key)
    }
  }
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  )
}

export function buildRateLimitKey(bucket: string, request: Request, actorId?: string | null): string {
  return `${bucket}:${actorId?.trim() || getClientIp(request)}`
}

export function takeRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  pruneExpiredEntries(now)

  const current = rateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    const resetAt = now + config.windowMs
    rateLimitStore.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: Math.max(0, config.limit - 1),
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
      resetAt,
    }
  }

  if (current.count >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
      resetAt: current.resetAt,
    }
  }

  current.count += 1
  rateLimitStore.set(key, current)

  return {
    allowed: true,
    remaining: Math.max(0, config.limit - current.count),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    resetAt: current.resetAt,
  }
}

export function createRateLimitResponse(result: RateLimitResult, message: string) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  )
}