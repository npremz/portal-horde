import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PATCH, DELETE } from "../route";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  extractApiKey: vi.fn(),
  validateApiKey: vi.fn(),
  hasApiPermission: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import {
  extractApiKey,
  validateApiKey,
  hasApiPermission,
} from "@/lib/api-auth";

const mockCreateAdminClient = vi.mocked(createAdminClient);
const mockExtractApiKey = vi.mocked(extractApiKey);
const mockValidateApiKey = vi.mocked(validateApiKey);
const mockHasApiPermission = vi.mocked(hasApiPermission);

function createMockRequest(
  options: {
    method?: string;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
  } = {}
): Request {
  return {
    url: "http://localhost/api/v1/clients/test-id",
    method: options.method || "GET",
    headers: {
      get: (name: string) => options.headers?.[name] || null,
    },
    json: () => Promise.resolve(options.body || {}),
  } as unknown as Request;
}

const mockParams = { params: Promise.resolve({ id: "test-id" }) };

function setupAuth(permission: string) {
  mockExtractApiKey.mockReturnValue("horde_valid");
  mockValidateApiKey.mockResolvedValue({
    valid: true,
    profileId: "profile-id",
    permissions: [permission],
  });
  mockHasApiPermission.mockReturnValue(true);
}

describe("GET /api/v1/clients/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no API key", async () => {
    mockExtractApiKey.mockReturnValue(null);

    const res = await GET(createMockRequest(), mockParams);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Missing API key");
  });

  it("returns 401 if API key is invalid", async () => {
    mockExtractApiKey.mockReturnValue("horde_bad");
    mockValidateApiKey.mockResolvedValue({
      valid: false,
      error: "Invalid API key",
    });

    const res = await GET(createMockRequest(), mockParams);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Invalid API key");
  });

  it("returns 403 if missing clients:read permission", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["stats:read"],
    });
    mockHasApiPermission.mockReturnValue(false);

    const res = await GET(createMockRequest(), mockParams);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Permission denied");
  });

  it("returns client with contacts", async () => {
    setupAuth("clients:read");

    const mockClient = {
      id: "test-id",
      name: "Acme",
      email: "acme@test.com",
      phone: "+32123",
      website: "https://acme.com",
      status: "lead",
      notes: null,
      project_type: null,
      sector: null,
      socials: {},
      client_contacts: [
        {
          id: "c1",
          name: "John",
          email: "john@acme.com",
          phone: null,
          role: "decision_maker",
          is_primary: true,
        },
      ],
    };

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockClient,
          error: null,
        }),
      }),
    } as never);

    const res = await GET(createMockRequest(), mockParams);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.id).toBe("test-id");
    expect(data.name).toBe("Acme");
    expect(data.phone).toBe("+32123");
    expect(data.website).toBe("https://acme.com");
    expect(data.contacts).toHaveLength(1);
    expect(data.contacts[0].is_primary).toBe(true);
  });

  it("returns 404 if client not found", async () => {
    setupAuth("clients:read");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116" },
        }),
      }),
    } as never);

    const res = await GET(createMockRequest(), mockParams);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Client not found");
  });

  it("omits null fields and empty socials", async () => {
    setupAuth("clients:read");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "test-id",
            name: "Acme",
            email: "acme@test.com",
            phone: null,
            website: null,
            status: "lead",
            notes: null,
            project_type: null,
            sector: null,
            socials: {},
            client_contacts: [],
          },
          error: null,
        }),
      }),
    } as never);

    const res = await GET(createMockRequest(), mockParams);
    const data = await res.json();

    expect(data).not.toHaveProperty("phone");
    expect(data).not.toHaveProperty("website");
    expect(data).not.toHaveProperty("notes");
    expect(data).not.toHaveProperty("socials");
    expect(data).not.toHaveProperty("contacts");
  });
});

describe("PATCH /api/v1/clients/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no API key", async () => {
    mockExtractApiKey.mockReturnValue(null);

    const res = await PATCH(
      createMockRequest({ method: "PATCH", body: { name: "New" } }),
      mockParams
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 if missing clients:write permission", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["clients:read"],
    });
    mockHasApiPermission.mockReturnValue(false);

    const res = await PATCH(
      createMockRequest({ method: "PATCH", body: { name: "New" } }),
      mockParams
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 for invalid body", async () => {
    setupAuth("clients:write");

    const res = await PATCH(
      createMockRequest({ method: "PATCH", body: { email: "not-an-email" } }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/email/i);
  });

  it("returns 400 if no valid fields to update", async () => {
    setupAuth("clients:write");

    const res = await PATCH(
      createMockRequest({ method: "PATCH", body: {} }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("No valid fields to update");
  });

  it("updates client successfully", async () => {
    setupAuth("clients:write");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "test-id", name: "Updated", email: "acme@test.com", status: "lead" },
          error: null,
        }),
      }),
    } as never);

    const res = await PATCH(
      createMockRequest({ method: "PATCH", body: { name: "Updated" } }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.name).toBe("Updated");
  });

  it("returns 404 if client not found", async () => {
    setupAuth("clients:write");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116" },
        }),
      }),
    } as never);

    const res = await PATCH(
      createMockRequest({ method: "PATCH", body: { name: "Updated" } }),
      mockParams
    );
    expect(res.status).toBe(404);
  });

  it("returns 409 for duplicate email", async () => {
    setupAuth("clients:write");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "23505" },
        }),
      }),
    } as never);

    const res = await PATCH(
      createMockRequest({ method: "PATCH", body: { email: "dup@test.com" } }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(409);
    expect(data.error).toBe("Client with this email already exists");
  });
});

describe("DELETE /api/v1/clients/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no API key", async () => {
    mockExtractApiKey.mockReturnValue(null);

    const res = await DELETE(createMockRequest({ method: "DELETE" }), mockParams);
    expect(res.status).toBe(401);
  });

  it("returns 403 if missing clients:delete permission", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["clients:read"],
    });
    mockHasApiPermission.mockReturnValue(false);

    const res = await DELETE(createMockRequest({ method: "DELETE" }), mockParams);
    expect(res.status).toBe(403);
  });

  it("deletes client successfully", async () => {
    setupAuth("clients:delete");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as never);

    const res = await DELETE(createMockRequest({ method: "DELETE" }), mockParams);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("returns 500 on database error", async () => {
    setupAuth("clients:delete");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: "db error" } }),
      }),
    } as never);

    const res = await DELETE(createMockRequest({ method: "DELETE" }), mockParams);
    expect(res.status).toBe(500);
  });
});
