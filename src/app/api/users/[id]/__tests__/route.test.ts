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

describe("PATCH /api/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    mockUnauthenticated();

    const request = createMockRequest({ role: "client" });
    const response = await PATCH(request, paramsFor("target-id"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 403 if user is not admin", async () => {
    mockAuthenticatedWithRole("editor");

    const request = createMockRequest({ role: "client" });
    const response = await PATCH(request, paramsFor("target-id"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 400 when trying to modify own role", async () => {
    mockAuthenticatedWithRole("admin", "self-id");

    const request = createMockRequest({ role: "editor" });
    const response = await PATCH(request, paramsFor("self-id"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Impossible de modifier votre propre rôle");
  });

  it("returns 400 for invalid role", async () => {
    mockAuthenticatedWithRole("admin");

    const request = createMockRequest({ role: "superadmin" });
    const response = await PATCH(request, paramsFor("target-id"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Role invalide");
  });

  it("returns 400 when role is missing", async () => {
    mockAuthenticatedWithRole("admin");

    const request = createMockRequest({});
    const response = await PATCH(request, paramsFor("target-id"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Role invalide");
  });

  it("returns 404 when target user not found", async () => {
    mockAuthenticatedWithRole("admin");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "not found" },
        }),
        update: vi.fn().mockReturnThis(),
      }),
    } as never);

    const request = createMockRequest({ role: "client" });
    const response = await PATCH(request, paramsFor("nonexistent-id"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Utilisateur introuvable");
  });

  it("updates role successfully", async () => {
    mockAuthenticatedWithRole("admin");

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "target-id", email: "target@test.com", full_name: "Target" },
        error: null,
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });

    mockCreateAdminClient.mockReturnValue({
      from: mockFrom,
    } as never);

    const request = createMockRequest({ role: "editor" });
    const response = await PATCH(request, paramsFor("target-id"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user).toEqual({ id: "target-id", role: "editor" });
  });
});

describe("DELETE /api/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    mockUnauthenticated();

    const request = createMockRequest({});
    const response = await DELETE(request, paramsFor("target-id"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 403 if user is not admin", async () => {
    mockAuthenticatedWithRole("editor");

    const request = createMockRequest({});
    const response = await DELETE(request, paramsFor("target-id"));
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 400 when trying to delete self", async () => {
    mockAuthenticatedWithRole("admin", "self-id");

    const request = createMockRequest({});
    const response = await DELETE(request, paramsFor("self-id"));
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Impossible de supprimer votre propre compte");
  });

  it("returns 404 when target user not found", async () => {
    mockAuthenticatedWithRole("admin");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116", message: "not found" },
        }),
      }),
      auth: { admin: { deleteUser: vi.fn() } },
    } as never);

    const request = createMockRequest({});
    const response = await DELETE(request, paramsFor("nonexistent-id"));
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Utilisateur introuvable");
  });

  it("deletes user successfully", async () => {
    mockAuthenticatedWithRole("admin");

    const mockDeleteEq = vi.fn().mockResolvedValue({ error: null });

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "target-id", email: "target@test.com", full_name: "Target" },
          error: null,
        }),
        delete: vi.fn().mockReturnValue({
          eq: mockDeleteEq,
        }),
      }),
      auth: {
        admin: {
          deleteUser: vi.fn().mockResolvedValue({ error: null }),
        },
      },
    } as never);

    const request = createMockRequest({});
    const response = await DELETE(request, paramsFor("target-id"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
