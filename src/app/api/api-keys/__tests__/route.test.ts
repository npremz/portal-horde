import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../route";

// Mock dependencies
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  generateApiKey: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApiKey } from "@/lib/api-auth";

const mockCreateClient = vi.mocked(createClient);
const mockCreateAdminClient = vi.mocked(createAdminClient);
const mockGenerateApiKey = vi.mocked(generateApiKey);

function createMockRequest(body?: Record<string, unknown>): Request {
  return {
    url: "http://localhost/api/api-keys",
    method: body ? "POST" : "GET",
    json: () => Promise.resolve(body || {}),
  } as unknown as Request;
}

describe("GET /api/api-keys", () => {
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

    const request = createMockRequest();
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Non autorise");
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

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Non autorise");
  });

  it("returns list of API keys for admin", async () => {
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

    const mockApiKeys = [
      {
        id: "key-1",
        name: "Bot CRM",
        key_prefix: "horde_ab",
        permissions: ["clients:read"],
        is_active: true,
        expires_at: null,
        last_used_at: null,
        created_at: new Date().toISOString(),
        profile: { id: "admin-id", full_name: "Admin", email: "admin@test.com" },
      },
    ];

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockApiKeys,
          error: null,
        }),
      }),
    } as never);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.data[0].name).toBe("Bot CRM");
  });
});

describe("POST /api/api-keys", () => {
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
      name: "Test Key",
      permissions: ["clients:read"],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 403 if user is not admin", async () => {
    const mockFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: "client" },
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
      name: "Test Key",
      permissions: ["clients:read"],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 400 if name is missing", async () => {
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
      permissions: ["clients:read"],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("name et permissions sont requis");
  });

  it("returns 400 if permissions are empty", async () => {
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
      name: "Test Key",
      permissions: [],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("name et permissions sont requis");
  });

  it("creates API key and returns full key only once", async () => {
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

    mockGenerateApiKey.mockReturnValue({
      key: "horde_fullkeyvalue123456789012345678",
      hash: "abc123hash",
      prefix: "horde_full",
    });

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "new-key-id",
            name: "Bot CRM",
            key_prefix: "horde_full",
            permissions: ["clients:read", "clients:write"],
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    } as never);

    const request = createMockRequest({
      name: "Bot CRM",
      permissions: ["clients:read", "clients:write"],
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.data.name).toBe("Bot CRM");
    expect(data.data.key).toBe("horde_fullkeyvalue123456789012345678");
    expect(data.data.permissions).toEqual(["clients:read", "clients:write"]);
  });

  it("creates API key with expiration date", async () => {
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

    mockGenerateApiKey.mockReturnValue({
      key: "horde_withexpiry1234567890123456789",
      hash: "xyz789hash",
      prefix: "horde_with",
    });

    const insertMock = vi.fn().mockReturnThis();
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        insert: insertMock,
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: "new-key-id",
            name: "Temp Key",
            key_prefix: "horde_with",
            permissions: ["stats:read"],
            created_at: new Date().toISOString(),
          },
          error: null,
        }),
      }),
    } as never);

    const expiryDate = "2025-12-31";
    const request = createMockRequest({
      name: "Temp Key",
      permissions: ["stats:read"],
      expires_at: expiryDate,
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        expires_at: expiryDate,
      })
    );
  });
});
