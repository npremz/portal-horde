import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import {
  checkRateLimit,
  getRateLimitHeaders,
  getRateLimitType,
  getClientIp,
} from "@/lib/security/rate-limiter";
import { getAllowedOrigins } from "@/lib/env";

// Generate unique request ID
function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Check if origin is allowed for CORS
function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (!origin) return true; // Same-origin requests don't have Origin header
  return allowedOrigins.some((allowed) => {
    if (allowed === "*") return true;
    return origin === allowed || origin.endsWith(allowed.replace(/^https?:\/\/\*\./, "."));
  });
}

// Add CORS headers to response
function addCorsHeaders(
  response: NextResponse,
  origin: string | null,
  allowedOrigins: string[]
): void {
  if (origin && isOriginAllowed(origin, allowedOrigins)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID");
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours
  response.headers.set("Access-Control-Allow-Credentials", "true");
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const requestId = generateRequestId();
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  const origin = request.headers.get("origin");
  const ip = getClientIp(request);

  // Get allowed origins (cached after first call)
  let allowedOrigins: string[];
  try {
    allowedOrigins = getAllowedOrigins();
  } catch {
    // Env validation failed - use default origins
    allowedOrigins = ["https://portal.hordeagence.com", "http://localhost:3000"];
  }

  // Handle CORS preflight requests
  if (method === "OPTIONS" && pathname.startsWith("/api/")) {
    const response = new NextResponse(null, { status: 204 });
    addCorsHeaders(response, origin, allowedOrigins);
    return response;
  }

  // Check rate limiting for applicable routes
  const rateLimitType = getRateLimitType(pathname);
  if (rateLimitType) {
    const result = checkRateLimit(ip, rateLimitType);

    if (!result.allowed) {
      const response = NextResponse.json(
        { error: "Too many requests", retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000) },
        { status: 429 }
      );

      // Add rate limit headers
      const rateLimitHeaders = getRateLimitHeaders(result);
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        response.headers.set(key, value);
      }
      response.headers.set("Retry-After", Math.ceil((result.resetAt - Date.now()) / 1000).toString());

      // Add CORS headers for API routes
      if (pathname.startsWith("/api/")) {
        addCorsHeaders(response, origin, allowedOrigins);
      }

      // Log rate limit hit
      console.log(
        JSON.stringify({
          level: "warn",
          message: "Rate limit exceeded",
          requestId,
          ip,
          pathname,
          rateLimitType,
          timestamp: new Date().toISOString(),
        })
      );

      return response;
    }
  }

  // Process the request through Supabase session handler
  const response = await updateSession(request);

  // Add request ID header
  response.headers.set("X-Request-ID", requestId);

  // Add rate limit headers if applicable
  if (rateLimitType) {
    const result = checkRateLimit(ip, rateLimitType);
    // Re-check to get current state (we already incremented above)
    const rateLimitHeaders = getRateLimitHeaders(result);
    for (const [key, value] of Object.entries(rateLimitHeaders)) {
      response.headers.set(key, value);
    }
  }

  // Add CORS headers for API routes
  if (pathname.startsWith("/api/")) {
    addCorsHeaders(response, origin, allowedOrigins);
  }

  // Structured logging
  const duration = Date.now() - startTime;
  const logData = {
    level: "info",
    message: "Request completed",
    requestId,
    method,
    pathname,
    status: response.status,
    duration,
    ip,
    timestamp: new Date().toISOString(),
  };

  // Only log API routes and slow requests to reduce noise
  if (pathname.startsWith("/api/") || duration > 1000) {
    console.log(JSON.stringify(logData));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
