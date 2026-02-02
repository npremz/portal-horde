import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateApiKey,
  hashApiKey,
  hasApiPermission,
  extractApiKey,
  API_PERMISSIONS,
} from "../api-auth";
import type { ApiPermission } from "@/types/database";

// Mock the admin client for validateApiKey tests
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

describe("generateApiKey", () => {
  it("generates a key with correct prefix", () => {
    const result = generateApiKey();
    expect(result.key).toMatch(/^horde_/);
  });

  it("generates a key with sufficient length", () => {
    const result = generateApiKey();
    // horde_ (6) + 32 chars base64url = ~38+ chars
    expect(result.key.length).toBeGreaterThan(30);
  });

  it("generates a hash that is 64 characters (SHA-256 hex)", () => {
    const result = generateApiKey();
    expect(result.hash).toHaveLength(64);
    expect(result.hash).toMatch(/^[a-f0-9]+$/);
  });

  it("generates a prefix for display", () => {
    const result = generateApiKey();
    expect(result.prefix).toMatch(/^horde_/);
    expect(result.prefix.length).toBeLessThan(result.key.length);
  });

  it("generates unique keys each time", () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1.key).not.toBe(key2.key);
    expect(key1.hash).not.toBe(key2.hash);
  });
});

describe("hashApiKey", () => {
  it("returns consistent hash for same input", () => {
    const key = "horde_test123456789";
    const hash1 = hashApiKey(key);
    const hash2 = hashApiKey(key);
    expect(hash1).toBe(hash2);
  });

  it("returns different hash for different input", () => {
    const hash1 = hashApiKey("horde_key1");
    const hash2 = hashApiKey("horde_key2");
    expect(hash1).not.toBe(hash2);
  });

  it("returns 64 character hex string (SHA-256)", () => {
    const hash = hashApiKey("horde_anykey");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });
});

describe("hasApiPermission", () => {
  it("returns true when permission exists", () => {
    const permissions: ApiPermission[] = ["clients:read", "clients:write"];
    expect(hasApiPermission(permissions, "clients:read")).toBe(true);
    expect(hasApiPermission(permissions, "clients:write")).toBe(true);
  });

  it("returns false when permission does not exist", () => {
    const permissions: ApiPermission[] = ["clients:read"];
    expect(hasApiPermission(permissions, "clients:write")).toBe(false);
    expect(hasApiPermission(permissions, "stats:read")).toBe(false);
  });

  it("returns false for undefined permissions", () => {
    expect(hasApiPermission(undefined, "clients:read")).toBe(false);
  });

  it("returns false for empty permissions array", () => {
    expect(hasApiPermission([], "clients:read")).toBe(false);
  });
});

describe("extractApiKey", () => {
  it("extracts key from valid Bearer header", () => {
    const header = "Bearer horde_abc123xyz";
    expect(extractApiKey(header)).toBe("horde_abc123xyz");
  });

  it("returns null for null header", () => {
    expect(extractApiKey(null)).toBeNull();
  });

  it("returns null for empty header", () => {
    expect(extractApiKey("")).toBeNull();
  });

  it("returns null for header without Bearer prefix", () => {
    expect(extractApiKey("horde_abc123xyz")).toBeNull();
    expect(extractApiKey("Basic horde_abc123xyz")).toBeNull();
  });

  it("returns null for header with wrong key prefix", () => {
    expect(extractApiKey("Bearer sk_abc123xyz")).toBeNull();
    expect(extractApiKey("Bearer api_abc123xyz")).toBeNull();
  });

  it("returns null for malformed Bearer header", () => {
    expect(extractApiKey("Bearer")).toBeNull();
    expect(extractApiKey("Bearer ")).toBeNull();
    expect(extractApiKey("Bearer a b c")).toBeNull();
  });
});

describe("API_PERMISSIONS", () => {
  it("contains all expected permissions", () => {
    const permissionValues = API_PERMISSIONS.map((p) => p.value);
    expect(permissionValues).toContain("clients:read");
    expect(permissionValues).toContain("clients:write");
    expect(permissionValues).toContain("clients:delete");
    expect(permissionValues).toContain("messages:send");
    expect(permissionValues).toContain("stats:read");
  });

  it("has label and description for each permission", () => {
    for (const perm of API_PERMISSIONS) {
      expect(perm.label).toBeTruthy();
      expect(perm.description).toBeTruthy();
      expect(typeof perm.label).toBe("string");
      expect(typeof perm.description).toBe("string");
    }
  });
});

describe("validateApiKey", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns invalid for empty key", async () => {
    const { validateApiKey } = await import("../api-auth");
    const result = await validateApiKey("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid API key format");
  });

  it("returns invalid for key without horde_ prefix", async () => {
    const { validateApiKey } = await import("../api-auth");
    const result = await validateApiKey("sk_abc123");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid API key format");
  });

  it("returns invalid when key not found in database", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const mockCreateAdminClient = vi.mocked(createAdminClient);

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116" },
        }),
      }),
      rpc: vi.fn().mockReturnValue({ then: vi.fn() }),
    } as never);

    const { validateApiKey } = await import("../api-auth");
    const result = await validateApiKey("horde_notfound123456789012345678901");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid API key");
  });

  it("returns invalid when key is disabled", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const mockCreateAdminClient = vi.mocked(createAdminClient);

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "key-id",
            profile_id: "profile-id",
            permissions: ["clients:read"],
            is_active: false,
            expires_at: null,
          },
          error: null,
        }),
      }),
      rpc: vi.fn().mockReturnValue({ then: vi.fn() }),
    } as never);

    const { validateApiKey } = await import("../api-auth");
    const result = await validateApiKey("horde_disabled1234567890123456789");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("API key is disabled");
  });

  it("returns invalid when key is expired", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const mockCreateAdminClient = vi.mocked(createAdminClient);

    const pastDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "key-id",
            profile_id: "profile-id",
            permissions: ["clients:read"],
            is_active: true,
            expires_at: pastDate,
          },
          error: null,
        }),
      }),
      rpc: vi.fn().mockReturnValue({ then: vi.fn() }),
    } as never);

    const { validateApiKey } = await import("../api-auth");
    const result = await validateApiKey("horde_expired12345678901234567890");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("API key has expired");
  });

  it("returns valid for active non-expired key", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const mockCreateAdminClient = vi.mocked(createAdminClient);

    const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "key-id",
            profile_id: "profile-id",
            permissions: ["clients:read", "clients:write"],
            is_active: true,
            expires_at: futureDate,
          },
          error: null,
        }),
      }),
      rpc: vi.fn().mockReturnValue({ then: vi.fn() }),
    } as never);

    const { validateApiKey } = await import("../api-auth");
    const result = await validateApiKey("horde_valid123456789012345678901234");
    expect(result.valid).toBe(true);
    expect(result.profileId).toBe("profile-id");
    expect(result.permissions).toEqual(["clients:read", "clients:write"]);
    expect(result.keyId).toBe("key-id");
  });

  it("returns valid for key without expiration", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const mockCreateAdminClient = vi.mocked(createAdminClient);

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "key-id",
            profile_id: "profile-id",
            permissions: ["stats:read"],
            is_active: true,
            expires_at: null,
          },
          error: null,
        }),
      }),
      rpc: vi.fn().mockReturnValue({ then: vi.fn() }),
    } as never);

    const { validateApiKey } = await import("../api-auth");
    const result = await validateApiKey("horde_noexpiry1234567890123456789");
    expect(result.valid).toBe(true);
    expect(result.permissions).toEqual(["stats:read"]);
  });
});
