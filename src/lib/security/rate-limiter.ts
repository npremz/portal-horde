/**
 * In-memory sliding window rate limiter.
 * Suitable for single-instance deployments (Vercel serverless).
 *
 * For multi-instance deployments, use Redis-based rate limiting instead.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store - resets on cold start
const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

/**
 * Rate limit configurations for different route types.
 */
export const RATE_LIMITS = {
  // Public API endpoints (/api/v1/*)
  apiPublic: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 req/min
  },
  // Authenticated API endpoints (/api/*)
  apiAuth: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 req/min
  },
  // Contact form submission
  contactForm: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 req/min
  },
  // Login attempts
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 5 attempts/15min
  },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Check if a request should be rate limited.
 *
 * @param identifier - Unique identifier (typically IP address)
 * @param type - Type of rate limit to apply
 * @returns RateLimitResult with status and headers info
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType
): RateLimitResult {
  cleanup();

  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const now = Date.now();

  const entry = store.get(key);

  // No existing entry or expired - allow and start new window
  if (!entry || entry.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
      limit: config.maxRequests,
    };
  }

  // Within window - check if under limit
  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
      limit: config.maxRequests,
    };
  }

  // Over limit
  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.resetAt,
    limit: config.maxRequests,
  };
}

/**
 * Get rate limit headers to include in response.
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(result.resetAt / 1000).toString(),
  };
}

/**
 * Determine which rate limit type to use based on the request path.
 */
export function getRateLimitType(pathname: string): RateLimitType | null {
  // Login endpoint
  if (pathname === "/login" || pathname === "/auth/callback") {
    return "login";
  }

  // Contact form
  if (pathname === "/api/contact") {
    return "contactForm";
  }

  // Public API (v1)
  if (pathname.startsWith("/api/v1/")) {
    return "apiPublic";
  }

  // Other API routes
  if (pathname.startsWith("/api/")) {
    return "apiAuth";
  }

  // No rate limiting for other routes
  return null;
}

/**
 * Extract IP address from request headers.
 * Handles common proxy headers.
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;

  // Vercel/Cloudflare
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // Take the first IP (original client)
    return xForwardedFor.split(",")[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Vercel
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  // Fallback
  return "unknown";
}
