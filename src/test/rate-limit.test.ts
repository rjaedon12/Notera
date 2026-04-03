import { describe, expect, it } from "vitest"
import { buildRateLimitKey, getClientIp, takeRateLimit } from "@/lib/rate-limit"

function createRequest(headers: Record<string, string> = {}) {
  return new Request("https://example.com/api/test", { headers })
}

describe("rate-limit utility", () => {
  it("prefers the explicit actor id when building a rate-limit key", () => {
    const request = createRequest({ "x-forwarded-for": "203.0.113.10" })

    expect(buildRateLimitKey("signup", request, "user-123")).toBe("signup:user-123")
  })

  it("falls back to the forwarded IP address", () => {
    const request = createRequest({ "x-forwarded-for": "203.0.113.10, 198.51.100.2" })

    expect(getClientIp(request)).toBe("203.0.113.10")
    expect(buildRateLimitKey("signup", request)).toBe("signup:203.0.113.10")
  })

  it("blocks requests that exceed the configured limit", () => {
    const key = `test-rate-limit-${Date.now()}`

    const first = takeRateLimit(key, { limit: 2, windowMs: 60_000 })
    const second = takeRateLimit(key, { limit: 2, windowMs: 60_000 })
    const third = takeRateLimit(key, { limit: 2, windowMs: 60_000 })

    expect(first.allowed).toBe(true)
    expect(second.allowed).toBe(true)
    expect(third.allowed).toBe(false)
    expect(third.retryAfterSeconds).toBeGreaterThan(0)
  })
})