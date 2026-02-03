import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkRateLimit,
  getRateLimitHeaders,
  getRateLimitType,
  getClientIp,
  RATE_LIMITS,
} from "../rate-limiter";

describe("rate-limiter", () => {
  beforeEach(() => {
    // Reset the rate limiter store between tests by waiting for cleanup
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("allows first request", () => {
      const result = checkRateLimit("test-ip-1", "apiPublic");

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(RATE_LIMITS.apiPublic.maxRequests - 1);
      expect(result.limit).toBe(RATE_LIMITS.apiPublic.maxRequests);
    });

    it("decrements remaining count on each request", () => {
      const ip = "test-ip-2";

      const first = checkRateLimit(ip, "apiPublic");
      expect(first.remaining).toBe(99);

      const second = checkRateLimit(ip, "apiPublic");
      expect(second.remaining).toBe(98);

      const third = checkRateLimit(ip, "apiPublic");
      expect(third.remaining).toBe(97);
    });

    it("blocks requests after limit is reached", () => {
      const ip = "test-ip-3";

      // Use contactForm limit (5 requests) for faster test
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(ip, "contactForm");
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const blocked = checkRateLimit(ip, "contactForm");
      expect(blocked.allowed).toBe(false);
      expect(blocked.remaining).toBe(0);
    });

    it("resets after window expires", () => {
      const ip = "test-ip-4";

      // Exhaust the limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip, "contactForm");
      }

      const blocked = checkRateLimit(ip, "contactForm");
      expect(blocked.allowed).toBe(false);

      // Advance time past the window (1 minute)
      vi.advanceTimersByTime(61 * 1000);

      // Should be allowed again
      const afterReset = checkRateLimit(ip, "contactForm");
      expect(afterReset.allowed).toBe(true);
      expect(afterReset.remaining).toBe(4);
    });

    it("tracks different IPs separately", () => {
      // Exhaust limit for IP 1
      for (let i = 0; i < 5; i++) {
        checkRateLimit("ip-a", "contactForm");
      }

      const blockedA = checkRateLimit("ip-a", "contactForm");
      expect(blockedA.allowed).toBe(false);

      // IP 2 should still be allowed
      const allowedB = checkRateLimit("ip-b", "contactForm");
      expect(allowedB.allowed).toBe(true);
    });

    it("tracks different rate limit types separately", () => {
      const ip = "test-ip-5";

      // Exhaust contactForm limit
      for (let i = 0; i < 5; i++) {
        checkRateLimit(ip, "contactForm");
      }

      const blockedContact = checkRateLimit(ip, "contactForm");
      expect(blockedContact.allowed).toBe(false);

      // apiAuth should still be allowed (different limit type)
      const allowedApi = checkRateLimit(ip, "apiAuth");
      expect(allowedApi.allowed).toBe(true);
    });

    it("uses correct limits for each type", () => {
      expect(RATE_LIMITS.apiPublic.maxRequests).toBe(100);
      expect(RATE_LIMITS.apiAuth.maxRequests).toBe(30);
      expect(RATE_LIMITS.contactForm.maxRequests).toBe(5);
      expect(RATE_LIMITS.login.maxRequests).toBe(5);
      expect(RATE_LIMITS.login.windowMs).toBe(15 * 60 * 1000); // 15 minutes
    });
  });

  describe("getRateLimitHeaders", () => {
    it("returns correct headers", () => {
      const result = {
        allowed: true,
        remaining: 95,
        resetAt: Date.now() + 60000,
        limit: 100,
      };

      const headers = getRateLimitHeaders(result);

      expect(headers["X-RateLimit-Limit"]).toBe("100");
      expect(headers["X-RateLimit-Remaining"]).toBe("95");
      expect(headers["X-RateLimit-Reset"]).toBeDefined();
    });
  });

  describe("getRateLimitType", () => {
    it("returns login for /login", () => {
      expect(getRateLimitType("/login")).toBe("login");
    });

    it("returns login for /auth/callback", () => {
      expect(getRateLimitType("/auth/callback")).toBe("login");
    });

    it("returns contactForm for /api/contact", () => {
      expect(getRateLimitType("/api/contact")).toBe("contactForm");
    });

    it("returns apiPublic for /api/v1/* routes", () => {
      expect(getRateLimitType("/api/v1/clients")).toBe("apiPublic");
      expect(getRateLimitType("/api/v1/clients/123")).toBe("apiPublic");
      expect(getRateLimitType("/api/v1/stats")).toBe("apiPublic");
    });

    it("returns apiAuth for other /api/* routes", () => {
      expect(getRateLimitType("/api/users")).toBe("apiAuth");
      expect(getRateLimitType("/api/dashboard/stats")).toBe("apiAuth");
      expect(getRateLimitType("/api/api-keys")).toBe("apiAuth");
    });

    it("returns null for non-API routes", () => {
      expect(getRateLimitType("/")).toBeNull();
      expect(getRateLimitType("/dashboard")).toBeNull();
      expect(getRateLimitType("/admin/clients")).toBeNull();
    });
  });

  describe("getClientIp", () => {
    it("extracts IP from x-forwarded-for header", () => {
      const request = new Request("http://localhost", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });

      expect(getClientIp(request)).toBe("192.168.1.1");
    });

    it("extracts IP from cf-connecting-ip header", () => {
      const request = new Request("http://localhost", {
        headers: { "cf-connecting-ip": "203.0.113.1" },
      });

      expect(getClientIp(request)).toBe("203.0.113.1");
    });

    it("extracts IP from x-real-ip header", () => {
      const request = new Request("http://localhost", {
        headers: { "x-real-ip": "198.51.100.1" },
      });

      expect(getClientIp(request)).toBe("198.51.100.1");
    });

    it("prefers x-forwarded-for over other headers", () => {
      const request = new Request("http://localhost", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "cf-connecting-ip": "203.0.113.1",
          "x-real-ip": "198.51.100.1",
        },
      });

      expect(getClientIp(request)).toBe("192.168.1.1");
    });

    it("returns 'unknown' when no IP headers present", () => {
      const request = new Request("http://localhost");

      expect(getClientIp(request)).toBe("unknown");
    });

    it("trims whitespace from IP", () => {
      const request = new Request("http://localhost", {
        headers: { "x-forwarded-for": "  192.168.1.1  , 10.0.0.1" },
      });

      expect(getClientIp(request)).toBe("192.168.1.1");
    });
  });
});
