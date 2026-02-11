import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "../route";

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

function createMockRequest(body: Record<string, unknown>): Request {
  return {
    json: () => Promise.resolve(body),
  } as Request;
}

function mockUnauthenticated() {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
    from: vi.fn(),
  } as never);
}

function mockAuthenticatedWithRole(role: string, userId = "admin-id") {
  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { role },
      error: null,
    }),
  });

  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      }),
    },
    from: mockFrom,
  } as never);
}

const paramsFor = (id: string) => ({ params: Promise.resolve({ id }) });

describe("PATCH /api/api-keys/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    mockUnauthenticated();

    const request = createMockRequest({ is_active: false });
    const response = await PATCH(request, paramsFor("key-1"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 403 if user is not admin", async () => {
    mockAuthenticatedWithRole("editor");

    const request = createMockRequest({ is_active: false });
    const response = await PATCH(request, paramsFor("key-1"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 400 if no valid fields to update", async () => {
    mockAuthenticatedWithRole("admin");

    const request = createMockRequest({ unknown_field: "value" });
    const response = await PATCH(request, paramsFor("key-1"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No valid fields to update");
  });

  it("toggles is_active successfully", async () => {
    mockAuthenticatedWithRole("admin");

    const updatedKey = {
      id: "key-1",
      name: "Bot CRM",
      key_prefix: "horde_ab",
      permissions: ["clients:read"],
      is_active: false,
      expires_at: null,
    };

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedKey,
                error: null,
              }),
            }),
          }),
        }),
      }),
    } as never);

    const request = createMockRequest({ is_active: false });
    const response = await PATCH(request, paramsFor("key-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.is_active).toBe(false);
  });

  it("returns 404 when key not found", async () => {
    mockAuthenticatedWithRole("admin");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: "PGRST116", message: "not found" },
              }),
            }),
          }),
        }),
      }),
    } as never);

    const request = createMockRequest({ is_active: true });
    const response = await PATCH(request, paramsFor("nonexistent"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("API key not found");
  });
});

describe("DELETE /api/api-keys/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    mockUnauthenticated();

    const request = createMockRequest({});
    const response = await DELETE(request, paramsFor("key-1"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 403 if user is not admin", async () => {
    mockAuthenticatedWithRole("client");

    const request = createMockRequest({});
    const response = await DELETE(request, paramsFor("key-1"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Non autorise");
  });

  it("deletes key successfully", async () => {
    mockAuthenticatedWithRole("admin");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      }),
    } as never);

    const request = createMockRequest({});
    const response = await DELETE(request, paramsFor("key-1"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("returns 500 on database error", async () => {
    mockAuthenticatedWithRole("admin");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { message: "DB error" },
          }),
        }),
      }),
    } as never);

    const request = createMockRequest({});
    const response = await DELETE(request, paramsFor("key-1"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Database error");
  });
});
