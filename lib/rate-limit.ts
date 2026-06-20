/**
 * Simple rate limiting utility
 * Uses in-memory store (suitable for single-server deployments)
 * For distributed deployments, use Redis-based solution like Upstash
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 60000)

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  message?: string
}

export function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, message = 'Too many requests' } = config

  return function rateLimitMiddleware(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const entry = store.get(identifier)

    if (entry && entry.resetAt > now) {
      // Entry still valid
      if (entry.count >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: entry.resetAt,
        }
      }
      // Increment count
      entry.count++
      return {
        allowed: true,
        remaining: maxRequests - entry.count,
        resetAt: entry.resetAt,
      }
    }

    // New entry
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + windowMs,
    }
    store.set(identifier, newEntry)

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: newEntry.resetAt,
    }
  }
}

// Pre-configured limiters
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts
  message: 'Too many login attempts, try again later',
})

export const signupLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 signups per hour
  message: 'Too many signup attempts, try again later',
})

export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  message: 'Rate limit exceeded',
})
