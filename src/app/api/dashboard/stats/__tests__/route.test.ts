import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";

const mockCreateClient = vi.mocked(createClient);

describe("GET /api/dashboard/stats", () => {
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

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 403 if user is not admin or editor", async () => {
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

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Non autorise");
  });

  it("returns stats for admin user", async () => {
    const mockClients = [
      { id: "1", name: "Client A", status: "lead", next_followup_date: null, created_at: "2026-01-01" },
      { id: "2", name: "Client B", status: "in_project", next_followup_date: "2026-01-15", created_at: "2026-01-10" },
    ];

    const mockProjects = [
      { id: "p1", name: "Project 1", status: "active", client_id: "1", client: { name: "Client A" }, phases: [{ status: "completed" }] },
    ];

    const mockMessages: { sent_at: string }[] = [];
    const mockActions: { created_at: string }[] = [];
    const mockDeliverables: { id: string }[] = [];

    const mockFrom = vi.fn((table: string) => {
      const baseBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      if (table === "profiles") {
        return {
          ...baseBuilder,
          single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
        };
      }
      if (table === "clients") {
        return {
          ...baseBuilder,
          then: (resolve: (v: { data: typeof mockClients; error: null }) => void) => {
            resolve({ data: mockClients, error: null });
            return Promise.resolve({ data: mockClients, error: null });
          },
        };
      }
      if (table === "projects") {
        return {
          ...baseBuilder,
          then: (resolve: (v: { data: typeof mockProjects; error: null }) => void) => {
            resolve({ data: mockProjects, error: null });
            return Promise.resolve({ data: mockProjects, error: null });
          },
        };
      }
      if (table === "client_messages") {
        return {
          ...baseBuilder,
          then: (resolve: (v: { data: typeof mockMessages; error: null }) => void) => {
            resolve({ data: mockMessages, error: null });
            return Promise.resolve({ data: mockMessages, error: null });
          },
        };
      }
      if (table === "activity_logs") {
        return {
          ...baseBuilder,
          then: (resolve: (v: { data: typeof mockActions; error: null }) => void) => {
            resolve({ data: mockActions, error: null });
            return Promise.resolve({ data: mockActions, error: null });
          },
        };
      }
      if (table === "deliverables") {
        return {
          ...baseBuilder,
          then: (resolve: (v: { data: typeof mockDeliverables; error: null }) => void) => {
            resolve({ data: mockDeliverables, error: null });
            return Promise.resolve({ data: mockDeliverables, error: null });
          },
        };
      }
      return baseBuilder;
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

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty("totalClients");
    expect(data).toHaveProperty("activePipeline");
    expect(data).toHaveProperty("activeProjects");
    expect(data).toHaveProperty("clientsByStatus");
    expect(data).toHaveProperty("projectsByStatus");
    expect(data).toHaveProperty("conversionRate");
  });

  it("returns stats for editor user", async () => {
    const mockFrom = vi.fn((table: string) => {
      const baseBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      if (table === "profiles") {
        return {
          ...baseBuilder,
          single: vi.fn().mockResolvedValue({ data: { role: "editor" }, error: null }),
        };
      }
      return {
        ...baseBuilder,
        then: (resolve: (v: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [], error: null });
          return Promise.resolve({ data: [], error: null });
        },
      };
    });

    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "editor-id" } },
          error: null,
        }),
      },
      from: mockFrom,
    } as never);

    const response = await GET();

    expect(response.status).toBe(200);
  });

  it("calculates conversion rate correctly", async () => {
    // 4 clients: 1 lead, 1 contacted, 1 in_project, 1 completed
    // Conversion rate = (in_project + completed) / total = 2/4 = 50%
    const mockClients = [
      { id: "1", name: "A", status: "lead", next_followup_date: null, created_at: "2026-01-01" },
      { id: "2", name: "B", status: "contacted", next_followup_date: null, created_at: "2026-01-01" },
      { id: "3", name: "C", status: "in_project", next_followup_date: null, created_at: "2026-01-01" },
      { id: "4", name: "D", status: "completed", next_followup_date: null, created_at: "2026-01-01" },
    ];

    const mockFrom = vi.fn((table: string) => {
      const baseBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      if (table === "profiles") {
        return {
          ...baseBuilder,
          single: vi.fn().mockResolvedValue({ data: { role: "admin" }, error: null }),
        };
      }
      if (table === "clients") {
        return {
          ...baseBuilder,
          then: (resolve: (v: { data: typeof mockClients; error: null }) => void) => {
            resolve({ data: mockClients, error: null });
            return Promise.resolve({ data: mockClients, error: null });
          },
        };
      }
      return {
        ...baseBuilder,
        then: (resolve: (v: { data: unknown[]; error: null }) => void) => {
          resolve({ data: [], error: null });
          return Promise.resolve({ data: [], error: null });
        },
      };
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

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.conversionRate).toBe(50);
  });
});
