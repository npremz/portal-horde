import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";

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
  } = {}
): Request {
  return {
    url: "http://localhost/api/v1/clients/client-id/contacts",
    method: options.method || "GET",
    headers: {
      get: () => null,
    },
    json: () => Promise.resolve(options.body || {}),
  } as unknown as Request;
}

const mockParams = { params: Promise.resolve({ id: "client-id" }) };

function setupAuth(permission: string) {
  mockExtractApiKey.mockReturnValue("horde_valid");
  mockValidateApiKey.mockResolvedValue({
    valid: true,
    profileId: "profile-id",
    permissions: [permission],
  });
  mockHasApiPermission.mockReturnValue(true);
}

describe("GET /api/v1/clients/:id/contacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no API key", async () => {
    mockExtractApiKey.mockReturnValue(null);

    const res = await GET(createMockRequest(), mockParams);
    expect(res.status).toBe(401);
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
    expect(res.status).toBe(403);
  });

  it("returns 404 if client not found", async () => {
    setupAuth("clients:read");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
      }),
    } as never);

    const res = await GET(createMockRequest(), mockParams);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Client not found");
  });

  it("returns contacts list", async () => {
    setupAuth("clients:read");

    const mockContacts = [
      { id: "c1", name: "John", email: "john@test.com", phone: null, role: "decision_maker", is_primary: true, notes: null },
      { id: "c2", name: "Jane", email: null, phone: "+321", role: "other", is_primary: false, notes: "Note" },
    ];

    // First call: client check (select("id").eq().single())
    // Second call: contacts list (select(...).eq().order().order())
    const clientQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "client-id" }, error: null }),
    };

    const contactsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
    };
    // Last order() call resolves the data
    contactsQuery.order = vi.fn()
      .mockReturnValueOnce(contactsQuery)
      .mockResolvedValueOnce({ data: mockContacts, error: null });

    const mockFrom = vi.fn()
      .mockReturnValueOnce(clientQuery)
      .mockReturnValueOnce(contactsQuery);

    mockCreateAdminClient.mockReturnValue({ from: mockFrom } as never);

    const res = await GET(createMockRequest(), mockParams);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.data[0].email).toBe("john@test.com");
    expect(data.data[0].is_primary).toBe(true);
    expect(data.data[1]).not.toHaveProperty("email");
    expect(data.data[1].phone).toBe("+321");
    expect(data.data[1].notes).toBe("Note");
  });
});

describe("POST /api/v1/clients/:id/contacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no API key", async () => {
    mockExtractApiKey.mockReturnValue(null);

    const res = await POST(
      createMockRequest({ method: "POST", body: { name: "John" } }),
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

    const res = await POST(
      createMockRequest({ method: "POST", body: { name: "John" } }),
      mockParams
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 if name is missing", async () => {
    setupAuth("clients:write");

    const res = await POST(
      createMockRequest({ method: "POST", body: { email: "john@test.com" } }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("name is required");
  });

  it("returns 404 if client not found", async () => {
    setupAuth("clients:write");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    } as never);

    const res = await POST(
      createMockRequest({ method: "POST", body: { name: "John" } }),
      mockParams
    );
    expect(res.status).toBe(404);
  });

  it("creates contact successfully", async () => {
    setupAuth("clients:write");

    const clientQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "client-id" }, error: null }),
    };

    const insertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "new-contact", name: "John", role: "other" },
        error: null,
      }),
    };

    const mockFrom = vi.fn()
      .mockReturnValueOnce(clientQuery)
      .mockReturnValueOnce(insertQuery);

    mockCreateAdminClient.mockReturnValue({ from: mockFrom } as never);

    const res = await POST(
      createMockRequest({ method: "POST", body: { name: "John", email: "john@test.com" } }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.data.id).toBe("new-contact");
    expect(data.data.name).toBe("John");
  });

  it("returns 500 on database error during insert", async () => {
    setupAuth("clients:write");

    const clientQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { id: "client-id" }, error: null }),
    };

    const insertQuery = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "db error" },
      }),
    };

    const mockFrom = vi.fn()
      .mockReturnValueOnce(clientQuery)
      .mockReturnValueOnce(insertQuery);

    mockCreateAdminClient.mockReturnValue({ from: mockFrom } as never);

    const res = await POST(
      createMockRequest({ method: "POST", body: { name: "John" } }),
      mockParams
    );
    expect(res.status).toBe(500);
  });
});
