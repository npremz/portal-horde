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

function createMockRequest(body: Record<string, unknown>): Request {
  return {
    json: () => Promise.resolve(body),
  } as Request;
}

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
        data: { role: "client" },
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

describe("POST /api/invite-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue({ success: true, id: "email-123" });
  });

  it("returns 401 if not authenticated", async () => {
    setupUnauthenticated();

    const res = await POST(
      createMockRequest({ email: "test@test.com", full_name: "Test" })
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Non autorisé");
  });

  it("returns 403 if not admin", async () => {
    setupNonAdmin();

    const res = await POST(
      createMockRequest({ email: "test@test.com", full_name: "Test" })
    );
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Non autorisé");
  });

  it("returns 400 if email is missing", async () => {
    setupAdmin();

    const res = await POST(
      createMockRequest({ full_name: "Test" })
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Email requis");
  });

  it("returns success for existing user", async () => {
    setupAdmin();

    const adminFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { id: "existing-id" },
        error: null,
      }),
    });

    mockCreateAdminClient.mockReturnValue({ from: adminFrom } as never);

    const res = await POST(
      createMockRequest({
        email: "existing@test.com",
        full_name: "Existing User",
        projectName: "Project Y",
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.existing).toBe(true);
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it("creates new user and sends welcome email", async () => {
    setupAdmin();

    // profiles check returns null (no existing user)
    const profilesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    };

    const adminFrom = vi.fn().mockReturnValue(profilesQuery);

    mockCreateAdminClient.mockReturnValue({
      from: adminFrom,
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: { id: "new-user-id" } },
            error: null,
          }),
        },
      },
    } as never);

    const res = await POST(
      createMockRequest({
        email: "new@test.com",
        full_name: "New User",
        company: "Test Corp",
        projectName: "Project X",
      })
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.user.id).toBe("new-user-id");
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it("returns 500 if user creation fails", async () => {
    setupAdmin();

    const profilesQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    const adminFrom = vi.fn().mockReturnValue(profilesQuery);

    mockCreateAdminClient.mockReturnValue({
      from: adminFrom,
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: "Creation failed" },
          }),
        },
      },
    } as never);

    const res = await POST(
      createMockRequest({
        email: "fail@test.com",
        full_name: "Fail User",
      })
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Erreur lors de la création de l'utilisateur");
  });
});
