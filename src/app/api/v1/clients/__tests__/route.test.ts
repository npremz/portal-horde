import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";

// Mock dependencies
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  extractApiKey: vi.fn(),
  validateApiKey: vi.fn(),
  hasApiPermission: vi.fn(),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { extractApiKey, validateApiKey, hasApiPermission } from "@/lib/api-auth";

const mockCreateAdminClient = vi.mocked(createAdminClient);
const mockExtractApiKey = vi.mocked(extractApiKey);
const mockValidateApiKey = vi.mocked(validateApiKey);
const mockHasApiPermission = vi.mocked(hasApiPermission);

function createMockRequest(
  url: string = "http://localhost/api/v1/clients",
  options: { method?: string; body?: Record<string, unknown>; headers?: Record<string, string> } = {}
): Request {
  return {
    url,
    method: options.method || "GET",
    headers: {
      get: (name: string) => options.headers?.[name] || null,
    },
    json: () => Promise.resolve(options.body || {}),
  } as unknown as Request;
}

describe("GET /api/v1/clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no API key provided", async () => {
    mockExtractApiKey.mockReturnValue(null);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Missing API key");
  });

  it("returns 401 if API key is invalid", async () => {
    mockExtractApiKey.mockReturnValue("horde_invalid");
    mockValidateApiKey.mockResolvedValue({
      valid: false,
      error: "Invalid API key",
    });

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
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

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Permission denied");
  });

  it("returns paginated clients list", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["clients:read"],
    });
    mockHasApiPermission.mockReturnValue(true);

    const mockClients = [
      { id: "1", name: "Client 1", email: "c1@test.com", phone: null, status: "lead", project_type: null, sector: null },
      { id: "2", name: "Client 2", email: "c2@test.com", phone: "+32123", status: "contacted", project_type: "site-web", sector: "tech" },
    ];

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockClients,
          error: null,
          count: 2,
        }),
      }),
    } as never);

    const request = createMockRequest("http://localhost/api/v1/clients?page=1&per_page=20");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.meta.total).toBe(2);
    expect(data.meta.page).toBe(1);
    expect(data.meta.per_page).toBe(20);
  });

  it("filters by status", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["clients:read"],
    });
    mockHasApiPermission.mockReturnValue(true);

    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [{ id: "1", name: "Lead", email: "lead@test.com", phone: null, status: "lead", project_type: null, sector: null }],
        error: null,
        count: 1,
      }),
    });

    mockCreateAdminClient.mockReturnValue({
      from: mockFrom,
    } as never);

    const request = createMockRequest("http://localhost/api/v1/clients?status=lead");
    await GET(request);

    expect(mockFrom().eq).toHaveBeenCalledWith("status", "lead");
  });

  it("omits null fields in response", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["clients:read"],
    });
    mockHasApiPermission.mockReturnValue(true);

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [{ id: "1", name: "Test", email: "test@test.com", phone: null, status: "lead", project_type: null, sector: null }],
          error: null,
          count: 1,
        }),
      }),
    } as never);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(data.data[0]).not.toHaveProperty("phone");
    expect(data.data[0]).not.toHaveProperty("project_type");
    expect(data.data[0]).not.toHaveProperty("sector");
  });
});

describe("POST /api/v1/clients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no API key provided", async () => {
    mockExtractApiKey.mockReturnValue(null);

    const request = createMockRequest("http://localhost/api/v1/clients", {
      method: "POST",
      body: { name: "Test", email: "test@test.com" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Missing API key");
  });

  it("returns 403 if missing clients:write permission", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["clients:read"],
    });
    mockHasApiPermission.mockReturnValue(false);

    const request = createMockRequest("http://localhost/api/v1/clients", {
      method: "POST",
      body: { name: "Test", email: "test@test.com" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Permission denied");
  });

  it("returns 400 if name is missing", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["clients:write"],
    });
    mockHasApiPermission.mockReturnValue(true);

    const request = createMockRequest("http://localhost/api/v1/clients", {
      method: "POST",
      body: { email: "test@test.com" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/name/i);
  });

  it("returns 400 if email is missing", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["clients:write"],
    });
    mockHasApiPermission.mockReturnValue(true);

    const request = createMockRequest("http://localhost/api/v1/clients", {
      method: "POST",
      body: { name: "Test" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toMatch(/email/i);
  });

  it("creates client successfully", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["clients:write"],
    });
    mockHasApiPermission.mockReturnValue(true);

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "new-id", name: "New Client", email: "new@test.com", status: "lead" },
          error: null,
        }),
      }),
    } as never);

    const request = createMockRequest("http://localhost/api/v1/clients", {
      method: "POST",
      body: { name: "New Client", email: "new@test.com" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.id).toBe("new-id");
    expect(data.data.name).toBe("New Client");
  });

  it("returns 409 if email already exists", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["clients:write"],
    });
    mockHasApiPermission.mockReturnValue(true);

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "23505" },
        }),
      }),
    } as never);

    const request = createMockRequest("http://localhost/api/v1/clients", {
      method: "POST",
      body: { name: "Duplicate", email: "existing@test.com" },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("Client with this email already exists");
  });
});
