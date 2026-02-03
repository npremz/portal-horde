import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Store original env
const originalEnv = { ...process.env };

describe("env validation", () => {
  beforeEach(() => {
    // Reset modules to clear cached env
    vi.resetModules();
    // Set minimum required env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
  });

  afterEach(() => {
    // Restore original env
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  describe("getClientEnv", () => {
    it("returns validated client environment variables", async () => {
      const { getClientEnv } = await import("../env");

      const env = getClientEnv();

      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
      expect(env.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe("test-anon-key");
    });

    it("throws error for missing NEXT_PUBLIC_SUPABASE_URL", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const { getClientEnv } = await import("../env");

      expect(() => getClientEnv()).toThrow("Invalid client environment variables");
    });

    it("throws error for missing NEXT_PUBLIC_SUPABASE_ANON_KEY", async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const { getClientEnv } = await import("../env");

      expect(() => getClientEnv()).toThrow("Invalid client environment variables");
    });

    it("throws error for invalid URL format", async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";

      const { getClientEnv } = await import("../env");

      expect(() => getClientEnv()).toThrow("must be a valid URL");
    });

    it("accepts optional NEXT_PUBLIC_APP_URL", async () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://portal.hordeagence.com";

      const { getClientEnv } = await import("../env");
      const env = getClientEnv();

      expect(env.NEXT_PUBLIC_APP_URL).toBe("https://portal.hordeagence.com");
    });

    it("caches result after first call", async () => {
      const { getClientEnv } = await import("../env");

      const first = getClientEnv();
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://changed.supabase.co";
      const second = getClientEnv();

      // Should still return cached value
      expect(second.NEXT_PUBLIC_SUPABASE_URL).toBe(first.NEXT_PUBLIC_SUPABASE_URL);
    });
  });

  describe("getServerEnv", () => {
    beforeEach(() => {
      // Stub window as undefined to simulate server environment
      vi.stubGlobal("window", undefined);
    });

    it("returns validated server environment variables", async () => {
      const { getServerEnv } = await import("../env");

      const env = getServerEnv();

      expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
      expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("test-service-role-key");
    });

    it("throws error for missing SUPABASE_SERVICE_ROLE_KEY", async () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const { getServerEnv } = await import("../env");

      expect(() => getServerEnv()).toThrow("Invalid server environment variables");
    });

    it("accepts optional RESEND_API_KEY", async () => {
      process.env.RESEND_API_KEY = "re_test_key";

      const { getServerEnv } = await import("../env");
      const env = getServerEnv();

      expect(env.RESEND_API_KEY).toBe("re_test_key");
    });

    it("accepts optional ADMIN_EMAIL with valid format", async () => {
      process.env.ADMIN_EMAIL = "admin@example.com";

      const { getServerEnv } = await import("../env");
      const env = getServerEnv();

      expect(env.ADMIN_EMAIL).toBe("admin@example.com");
    });

    it("rejects invalid ADMIN_EMAIL format", async () => {
      process.env.ADMIN_EMAIL = "not-an-email";

      const { getServerEnv } = await import("../env");

      expect(() => getServerEnv()).toThrow("Invalid server environment variables");
    });

    it("accepts ALLOWED_ORIGINS", async () => {
      process.env.ALLOWED_ORIGINS = "https://example.com,https://other.com";

      const { getServerEnv } = await import("../env");
      const env = getServerEnv();

      expect(env.ALLOWED_ORIGINS).toBe("https://example.com,https://other.com");
    });

    it("warns when RESEND_API_KEY is missing", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      delete process.env.RESEND_API_KEY;

      const { getServerEnv } = await import("../env");
      getServerEnv();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("RESEND_API_KEY is not set")
      );

      consoleSpy.mockRestore();
    });

    it("throws error when called on client side", async () => {
      // Restore window to simulate client
      vi.unstubAllGlobals();

      const { getServerEnv } = await import("../env");

      expect(() => getServerEnv()).toThrow("cannot be called on the client side");
    });
  });

  describe("getAllowedOrigins", () => {
    beforeEach(() => {
      // Stub window as undefined to simulate server environment
      vi.stubGlobal("window", undefined);
    });

    it("returns default origins when ALLOWED_ORIGINS not set", async () => {
      delete process.env.ALLOWED_ORIGINS;

      const { getAllowedOrigins } = await import("../env");
      const origins = getAllowedOrigins();

      expect(origins).toContain("https://portal.hordeagence.com");
      expect(origins).toContain("http://localhost:3000");
    });

    it("parses comma-separated origins", async () => {
      process.env.ALLOWED_ORIGINS = "https://a.com, https://b.com , https://c.com";

      // Need fresh import to pick up new env value
      vi.resetModules();
      vi.stubGlobal("window", undefined);
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
      process.env.ALLOWED_ORIGINS = "https://a.com, https://b.com , https://c.com";

      const { getAllowedOrigins } = await import("../env");
      const origins = getAllowedOrigins();

      expect(origins).toEqual(["https://a.com", "https://b.com", "https://c.com"]);
    });

    it("trims whitespace from origins", async () => {
      vi.resetModules();
      vi.stubGlobal("window", undefined);
      process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
      process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
      process.env.ALLOWED_ORIGINS = "  https://spaced.com  ";

      const { getAllowedOrigins } = await import("../env");
      const origins = getAllowedOrigins();

      expect(origins).toEqual(["https://spaced.com"]);
    });
  });
});
