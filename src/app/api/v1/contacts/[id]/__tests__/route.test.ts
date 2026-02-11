import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, DELETE } from "../route";

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
    url: "http://localhost/api/v1/contacts/contact-id",
    method: options.method || "PATCH",
    headers: {
      get: () => null,
    },
    json: () => Promise.resolve(options.body || {}),
  } as unknown as Request;
}

const mockParams = { params: Promise.resolve({ id: "contact-id" }) };

function setupAuth(permission: string) {
  mockExtractApiKey.mockReturnValue("horde_valid");
  mockValidateApiKey.mockResolvedValue({
    valid: true,
    profileId: "profile-id",
    permissions: [permission],
  });
  mockHasApiPermission.mockReturnValue(true);
}

describe("PATCH /api/v1/contacts/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no API key", async () => {
    mockExtractApiKey.mockReturnValue(null);

    const res = await PATCH(
      createMockRequest({ body: { name: "Updated" } }),
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
      createMockRequest({ body: { name: "Updated" } }),
      mockParams
    );
    expect(res.status).toBe(403);
  });

  it("returns 400 if no valid fields to update", async () => {
    setupAuth("clients:write");

    const res = await PATCH(
      createMockRequest({ body: {} }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("No valid fields to update");
  });

  it("returns 400 for unknown fields only", async () => {
    setupAuth("clients:write");

    const res = await PATCH(
      createMockRequest({ body: { unknown_field: "value" } }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("No valid fields to update");
  });

  it("updates contact successfully", async () => {
    setupAuth("clients:write");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: "contact-id", name: "Updated", role: "technical" },
          error: null,
        }),
      }),
    } as never);

    const res = await PATCH(
      createMockRequest({ body: { name: "Updated", role: "technical" } }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.data.name).toBe("Updated");
    expect(data.data.role).toBe("technical");
  });

  it("returns 404 if contact not found", async () => {
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
      createMockRequest({ body: { name: "Updated" } }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Contact not found");
  });
});

describe("DELETE /api/v1/contacts/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if no API key", async () => {
    mockExtractApiKey.mockReturnValue(null);

    const res = await DELETE(
      createMockRequest({ method: "DELETE" }),
      mockParams
    );
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

    const res = await DELETE(
      createMockRequest({ method: "DELETE" }),
      mockParams
    );
    expect(res.status).toBe(403);
  });

  it("deletes contact successfully", async () => {
    setupAuth("clients:delete");

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    } as never);

    const res = await DELETE(
      createMockRequest({ method: "DELETE" }),
      mockParams
    );
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

    const res = await DELETE(
      createMockRequest({ method: "DELETE" }),
      mockParams
    );
    expect(res.status).toBe(500);
  });
});
