import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/email/templates", () => ({
  welcomeEmail: vi.fn().mockReturnValue("<html>Welcome</html>"),
}));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";

const mockCreateClient = vi.mocked(createClient);
const mockCreateAdminClient = vi.mocked(createAdminClient);
const mockSendEmail = vi.mocked(sendEmail);

const mockParams = { params: Promise.resolve({ id: "client-id" }) };

function setupUnauthenticated() {
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

function setupNonAdmin() {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-id" } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: "editor" },
        error: null,
      }),
    }),
  } as never);
}

function setupAdmin() {
  mockCreateClient.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "admin-id" } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { role: "admin" },
        error: null,
      }),
    }),
  } as never);
}

describe("POST /api/clients/:id/invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue({ success: true, id: "email-123" });
  });

  it("returns 401 if not authenticated", async () => {
    setupUnauthenticated();

    const res = await POST({} as Request, mockParams);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 403 if not admin", async () => {
    setupNonAdmin();

    const res = await POST({} as Request, mockParams);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 404 if client not found", async () => {
    setupAdmin();

    const adminFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
    });

    mockCreateAdminClient.mockReturnValue({
      from: adminFrom,
    } as never);

    const res = await POST({} as Request, mockParams);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Client introuvable");
  });

  it("returns 400 if client already invited", async () => {
    setupAdmin();

    const mockClient = {
      id: "client-id",
      name: "Acme",
      email: "acme@test.com",
      profile_id: "already-linked",
      status: "lead",
    };

    const adminFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
    });

    mockCreateAdminClient.mockReturnValue({
      from: adminFrom,
    } as never);

    const res = await POST({} as Request, mockParams);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Ce client a déjà été invité");
  });

  it("invites client successfully (new user)", async () => {
    setupAdmin();

    const mockClient = {
      id: "client-id",
      name: "Acme",
      email: "acme@test.com",
      profile_id: null,
      status: "lead",
    };

    // clients select (first call)
    const clientsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [{ name: "Project X" }], error: null }),
      update: vi.fn().mockReturnThis(),
    };

    // profiles upsert
    const profilesQuery = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };

    const adminFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "clients") return clientsQuery;
      if (table === "profiles") return profilesQuery;
      if (table === "projects") return clientsQuery;
      return clientsQuery;
    });

    mockCreateAdminClient.mockReturnValue({
      from: adminFrom,
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: { users: [] },
            error: null,
          }),
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "new-profile-id" } },
            error: null,
          }),
        },
      },
    } as never);

    const res = await POST({} as Request, mockParams);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.profile_id).toBe("new-profile-id");
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it("links existing user when email already exists", async () => {
    setupAdmin();

    const mockClient = {
      id: "client-id",
      name: "Acme",
      email: "existing@test.com",
      profile_id: null,
      status: "contacted",
    };

    const clientsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockReturnThis(),
    };

    const profilesQuery = {
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };

    const adminFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "clients") return clientsQuery;
      if (table === "profiles") return profilesQuery;
      if (table === "projects") return clientsQuery;
      return clientsQuery;
    });

    mockCreateAdminClient.mockReturnValue({
      from: adminFrom,
      auth: {
        admin: {
          listUsers: vi.fn().mockResolvedValue({
            data: {
              users: [{ id: "existing-user-id", email: "existing@test.com" }],
            },
            error: null,
          }),
        },
      },
    } as never);

    const res = await POST({} as Request, mockParams);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.profile_id).toBe("existing-user-id");
  });
});
