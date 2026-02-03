import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

// Mock Supabase admin client
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns healthy status when all checks pass", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
        }),
      }),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
    };
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("healthy");
    expect(body.checks.database.status).toBe("ok");
    expect(body.checks.auth.status).toBe("ok");
    expect(body.version).toBeDefined();
    expect(body.timestamp).toBeDefined();
  });

  it("returns degraded status when database check fails", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: { message: "Connection failed" } }),
        }),
      }),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
    };
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200); // degraded still returns 200
    expect(body.status).toBe("degraded");
    expect(body.checks.database.status).toBe("error");
    expect(body.checks.database.message).toBe("Connection failed");
    expect(body.checks.auth.status).toBe("ok");
  });

  it("returns degraded status when auth check fails", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
        }),
      }),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: null, error: { message: "Auth service unavailable" } }),
      },
    };
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

    const response = await GET();
    const body = await response.json();

    expect(body.status).toBe("degraded");
    expect(body.checks.database.status).toBe("ok");
    expect(body.checks.auth.status).toBe("error");
    expect(body.checks.auth.message).toBe("Auth service unavailable");
  });

  it("returns unhealthy status when all checks fail", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
        }),
      }),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: null, error: { message: "Auth error" } }),
      },
    };
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("unhealthy");
    expect(body.checks.database.status).toBe("error");
    expect(body.checks.auth.status).toBe("error");
  });

  it("handles database exception gracefully", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error("Network timeout")),
        }),
      }),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
    };
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

    const response = await GET();
    const body = await response.json();

    expect(body.checks.database.status).toBe("error");
    expect(body.checks.database.message).toBe("Network timeout");
  });

  it("handles auth exception gracefully", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
        }),
      }),
      auth: {
        getSession: vi.fn().mockRejectedValue(new Error("Auth service crashed")),
      },
    };
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

    const response = await GET();
    const body = await response.json();

    expect(body.checks.auth.status).toBe("error");
    expect(body.checks.auth.message).toBe("Auth service crashed");
  });

  it("includes timestamp in ISO format", async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
        }),
      }),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
    };
    vi.mocked(createAdminClient).mockReturnValue(mockSupabase as any);

    const response = await GET();
    const body = await response.json();

    // Verify timestamp is valid ISO string
    expect(() => new Date(body.timestamp)).not.toThrow();
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
