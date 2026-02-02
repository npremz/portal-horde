import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";
import { ErrorCode } from "@/lib/errors";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const mockCreateClient = vi.mocked(createClient);
const mockCreateAdminClient = vi.mocked(createAdminClient);

// Helper to create mock request
function createMockRequest(body: Record<string, unknown>): Request {
  return {
    json: () => Promise.resolve(body),
  } as Request;
}

describe("POST /api/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from: vi.fn(),
    } as never);

    const request = createMockRequest({
      email: "test@example.com",
      full_name: "Test User",
      role: "client",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error.code).toBe(ErrorCode.UNAUTHORIZED);
  });

  it("returns 403 if user is not admin", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: "editor" },
        error: null,
      }),
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-id" } },
          error: null,
        }),
      },
      from: mockFrom,
    } as never);

    const request = createMockRequest({
      email: "test@example.com",
      full_name: "Test User",
      role: "client",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error.code).toBe(ErrorCode.FORBIDDEN);
  });

  it("returns 400 if required fields are missing", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: "admin" },
        error: null,
      }),
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-id" } },
          error: null,
        }),
      },
      from: mockFrom,
    } as never);

    // Missing email
    const request1 = createMockRequest({
      full_name: "Test User",
      role: "client",
    });

    const response1 = await POST(request1);
    const data1 = await response1.json();

    expect(response1.status).toBe(400);
    expect(data1.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(data1.error.message).toBe("Email, nom et rôle requis");

    // Missing full_name
    const request2 = createMockRequest({
      email: "test@example.com",
      role: "client",
    });

    const response2 = await POST(request2);
    const data2 = await response2.json();

    expect(response2.status).toBe(400);
    expect(data2.error.code).toBe(ErrorCode.VALIDATION_ERROR);
  });

  it("returns 400 for invalid role", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: "admin" },
        error: null,
      }),
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-id" } },
          error: null,
        }),
      },
      from: mockFrom,
    } as never);

    const request = createMockRequest({
      email: "test@example.com",
      full_name: "Test User",
      role: "superadmin",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(data.error.message).toBe("Rôle invalide");
  });

  it("returns 409 if user with email already exists", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: "admin" },
        error: null,
      }),
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-id" } },
          error: null,
        }),
      },
      from: mockFrom,
    } as never);

    mockCreateAdminClient.mockReturnValue({
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: {
              users: [{ id: "existing-id", email: "test@example.com" }],
            },
            error: null,
          }),
        },
      },
      from: vi.fn(),
    } as never);

    const request = createMockRequest({
      email: "test@example.com",
      full_name: "Test User",
      role: "client",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error.code).toBe(ErrorCode.DUPLICATE_ENTRY);
    expect(data.error.message).toBe("Un utilisateur avec cet email existe déjà");
  });

  it("creates user successfully", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: "admin" },
        error: null,
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "admin-id" } },
          error: null,
        }),
      },
      from: mockFrom,
    } as never);

    mockCreateAdminClient.mockReturnValue({
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: { users: [] },
            error: null,
          }),
          inviteUserByEmail: vi.fn().mockResolvedValue({
            data: { user: { id: "new-user-id" } },
            error: null,
          }),
        },
      },
      from: vi.fn().mockReturnValue({
        upsert: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as never);

    const request = createMockRequest({
      email: "new@example.com",
      full_name: "New User",
      role: "client",
      company: "Test Company",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data).toEqual({
      id: "new-user-id",
      email: "new@example.com",
      full_name: "New User",
      role: "client",
      company: "Test Company",
    });
  });

  it("creates user with all valid roles", async () => {
    const validRoles = ["client", "editor", "admin"];

    for (const role of validRoles) {
      vi.clearAllMocks();

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { role: "admin" },
          error: null,
        }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
      });

      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: "admin-id" } },
            error: null,
          }),
        },
        from: mockFrom,
      } as never);

      mockCreateAdminClient.mockReturnValue({
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({
              data: { users: [] },
              error: null,
            }),
            inviteUserByEmail: vi.fn().mockResolvedValue({
              data: { user: { id: `user-${role}` } },
              error: null,
            }),
          },
        },
        from: vi.fn().mockReturnValue({
          upsert: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);

      const request = createMockRequest({
        email: `${role}@example.com`,
        full_name: `${role} User`,
        role,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.data.role).toBe(role);
    }
  });

  it("includes requestId in error responses", async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
      from: vi.fn(),
    } as never);

    const request = createMockRequest({
      email: "test@example.com",
      full_name: "Test User",
      role: "client",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.error.requestId).toBeDefined();
    expect(data.error.requestId).toMatch(/^req_/);
  });
});
