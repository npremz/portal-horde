import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

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

function createMockRequest(headers?: Record<string, string>): Request {
  return {
    url: "http://localhost/api/v1/stats",
    method: "GET",
    headers: {
      get: (name: string) => headers?.[name] || null,
    },
  } as unknown as Request;
}

describe("GET /api/v1/stats", () => {
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

  it("returns 403 if missing stats:read permission", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["clients:read"],
    });
    mockHasApiPermission.mockReturnValue(false);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Permission denied");
  });

  it("returns dashboard statistics", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["stats:read"],
    });
    mockHasApiPermission.mockReturnValue(true);

    const mockClients = [
      { id: "1", status: "lead", next_followup_date: null, created_at: new Date().toISOString() },
      { id: "2", status: "contacted", next_followup_date: null, created_at: new Date().toISOString() },
      { id: "3", status: "in_project", next_followup_date: null, created_at: new Date().toISOString() },
    ];

    const mockProjects = [
      { id: "1", status: "active" },
      { id: "2", status: "active" },
      { id: "3", status: "completed" },
    ];

    const mockMessages = [
      { id: "1" },
      { id: "2" },
    ];

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "clients") {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockClients,
              error: null,
            }),
          };
        }
        if (table === "projects") {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockProjects,
              error: null,
            }),
          };
        }
        if (table === "client_messages") {
          return {
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({
              data: mockMessages,
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    } as never);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.counts).toBeDefined();
    expect(data.counts.clients).toBe(3);
    expect(data.counts.pipeline).toBe(2); // lead + contacted
    expect(data.counts.projects).toBe(2); // active projects
    expect(data.clients_by_status).toBeDefined();
    expect(data.projects_by_status).toBeDefined();
    expect(data.metrics).toBeDefined();
    expect(data.metrics.messages_30d).toBe(2);
  });

  it("calculates conversion rate correctly", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["stats:read"],
    });
    mockHasApiPermission.mockReturnValue(true);

    // 2 leads, 2 contacted, 4 in_project, 2 completed = 10 total
    // converted = 4 + 2 = 6
    // rate = 60%
    const mockClients = [
      { id: "1", status: "lead", next_followup_date: null, created_at: new Date().toISOString() },
      { id: "2", status: "lead", next_followup_date: null, created_at: new Date().toISOString() },
      { id: "3", status: "contacted", next_followup_date: null, created_at: new Date().toISOString() },
      { id: "4", status: "contacted", next_followup_date: null, created_at: new Date().toISOString() },
      { id: "5", status: "in_project", next_followup_date: null, created_at: new Date().toISOString() },
      { id: "6", status: "in_project", next_followup_date: null, created_at: new Date().toISOString() },
      { id: "7", status: "in_project", next_followup_date: null, created_at: new Date().toISOString() },
      { id: "8", status: "in_project", next_followup_date: null, created_at: new Date().toISOString() },
      { id: "9", status: "completed", next_followup_date: null, created_at: new Date().toISOString() },
      { id: "10", status: "completed", next_followup_date: null, created_at: new Date().toISOString() },
    ];

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "clients") {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockClients,
              error: null,
            }),
          };
        }
        if (table === "projects") {
          return {
            select: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        if (table === "client_messages") {
          return {
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    } as never);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(data.metrics.conversion_rate).toBe(60);
  });

  it("counts pending followups correctly", async () => {
    mockExtractApiKey.mockReturnValue("horde_valid");
    mockValidateApiKey.mockResolvedValue({
      valid: true,
      profileId: "profile-id",
      permissions: ["stats:read"],
    });
    mockHasApiPermission.mockReturnValue(true);

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    const mockClients = [
      { id: "1", status: "lead", next_followup_date: yesterday, created_at: new Date().toISOString() }, // pending
      { id: "2", status: "lead", next_followup_date: today, created_at: new Date().toISOString() }, // pending
      { id: "3", status: "lead", next_followup_date: tomorrow, created_at: new Date().toISOString() }, // not yet
      { id: "4", status: "lead", next_followup_date: null, created_at: new Date().toISOString() }, // no followup
    ];

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "clients") {
          return {
            select: vi.fn().mockResolvedValue({
              data: mockClients,
              error: null,
            }),
          };
        }
        if (table === "projects") {
          return {
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === "client_messages") {
          return {
            select: vi.fn().mockReturnThis(),
            gte: vi.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    } as never);

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(data.counts.followups).toBe(2);
  });
});
