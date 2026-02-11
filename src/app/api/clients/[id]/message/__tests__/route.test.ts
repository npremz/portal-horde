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
  prospectingEmail: vi.fn().mockReturnValue("<html>Email</html>"),
  replaceTemplateVariables: vi.fn().mockImplementation((text: string) => text),
}));

vi.mock("@/lib/constants", () => ({
  FOLLOWUP_DELAY_DAYS: 10,
}));

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";

const mockCreateClient = vi.mocked(createClient);
const mockCreateAdminClient = vi.mocked(createAdminClient);
const mockSendEmail = vi.mocked(sendEmail);

const mockParams = { params: Promise.resolve({ id: "client-id" }) };

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

describe("POST /api/clients/:id/message", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSendEmail.mockResolvedValue({ success: true, id: "email-123" });
  });

  it("returns 401 if not authenticated", async () => {
    setupUnauthenticated();

    const res = await POST(
      createMockRequest({ subject: "Hello", content: "Body" }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 403 if not admin", async () => {
    setupNonAdmin();

    const res = await POST(
      createMockRequest({ subject: "Hello", content: "Body" }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe("Non autorise");
  });

  it("returns 400 if subject is missing", async () => {
    setupAdmin();

    const res = await POST(
      createMockRequest({ content: "Body" }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Champs requis manquants");
  });

  it("returns 400 if content is missing", async () => {
    setupAdmin();

    const res = await POST(
      createMockRequest({ subject: "Hello" }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Champs requis manquants");
  });

  it("returns 404 if client not found", async () => {
    setupAdmin();

    const adminFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
    });

    mockCreateAdminClient.mockReturnValue({ from: adminFrom } as never);

    const res = await POST(
      createMockRequest({
        subject: "Hello",
        content: "Body",
        recipient_email: "test@test.com",
      }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Client introuvable");
  });

  it("returns 400 if no recipient specified", async () => {
    setupAdmin();

    const mockClient = {
      id: "client-id",
      name: "Acme",
      email: "acme@test.com",
      website: null,
      status: "lead",
      first_contact_date: null,
    };

    const adminFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
    });

    mockCreateAdminClient.mockReturnValue({ from: adminFrom } as never);

    const res = await POST(
      createMockRequest({
        subject: "Hello",
        content: "Body",
        contact_id: null,
        recipient_email: null,
      }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Aucun destinataire specifie");
  });

  it("sends message successfully using recipient_email", async () => {
    setupAdmin();

    const mockClient = {
      id: "client-id",
      name: "Acme",
      email: "acme@test.com",
      website: "https://acme.com",
      status: "lead",
      first_contact_date: null,
    };

    const clientsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
      update: vi.fn().mockReturnThis(),
    };

    const messagesQuery = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    const adminFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "clients") return clientsQuery;
      if (table === "client_messages") return messagesQuery;
      return clientsQuery;
    });

    mockCreateAdminClient.mockReturnValue({ from: adminFrom } as never);

    const res = await POST(
      createMockRequest({
        subject: "Hello",
        content: "Body",
        recipient_email: "acme@test.com",
        recipient_name: "Acme Corp",
      }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.first_contact).toBe(true);
    expect(mockSendEmail).toHaveBeenCalled();
  });

  it("sends message to a contact by contact_id", async () => {
    setupAdmin();

    const mockClient = {
      id: "client-id",
      name: "Acme",
      email: "acme@test.com",
      website: null,
      status: "contacted",
      first_contact_date: "2024-01-01T00:00:00Z",
    };

    const mockContact = {
      id: "contact-id",
      name: "John Doe",
      email: "john@acme.com",
    };

    const clientsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
      update: vi.fn().mockReturnThis(),
    };

    const contactsQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockContact, error: null }),
        }),
      }),
    };

    const messagesQuery = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };

    const adminFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "clients") return clientsQuery;
      if (table === "client_contacts") return contactsQuery;
      if (table === "client_messages") return messagesQuery;
      return clientsQuery;
    });

    mockCreateAdminClient.mockReturnValue({ from: adminFrom } as never);

    const res = await POST(
      createMockRequest({
        subject: "Hello",
        content: "Body",
        contact_id: "contact-id",
      }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.first_contact).toBe(false);
  });

  it("returns 500 if email send fails", async () => {
    setupAdmin();

    mockSendEmail.mockResolvedValue({ success: false, error: "SMTP error" });

    const mockClient = {
      id: "client-id",
      name: "Acme",
      email: "acme@test.com",
      website: null,
      status: "lead",
      first_contact_date: null,
    };

    const adminFrom = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockClient, error: null }),
    });

    mockCreateAdminClient.mockReturnValue({ from: adminFrom } as never);

    const res = await POST(
      createMockRequest({
        subject: "Hello",
        content: "Body",
        recipient_email: "acme@test.com",
      }),
      mockParams
    );
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Erreur lors de l'envoi de l'email");
  });
});
