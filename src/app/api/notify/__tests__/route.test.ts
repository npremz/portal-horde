import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/email/templates", () => ({
  deliverablePendingReviewEmail: vi.fn().mockReturnValue("<html>pending</html>"),
  deliverableValidatedEmail: vi.fn().mockReturnValue("<html>validated</html>"),
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";

const mockCreateAdminClient = vi.mocked(createAdminClient);
const mockSendEmail = vi.mocked(sendEmail);

function createMockRequest(body: Record<string, unknown>): Request {
  return {
    json: () => Promise.resolve(body),
  } as Request;
}

const mockDeliverable = {
  id: "del-1",
  title: "Maquette homepage",
  phase: {
    id: "phase-1",
    name: "Design",
    project: {
      id: "proj-1",
      name: "Projet Test",
      client: {
        id: "client-1",
        email: "client@test.com",
        full_name: "Jean Client",
        company: "ACME",
      },
    },
  },
};

function mockSupabaseForNotify(overrides: {
  deliverable?: typeof mockDeliverable | null;
  deliverableError?: { message: string } | null;
  admins?: Array<{ id: string; email: string; full_name: string }>;
}) {
  const deliverable = overrides.deliverable ?? mockDeliverable;
  const deliverableError = overrides.deliverableError ?? null;
  const admins = overrides.admins ?? [
    { id: "admin-1", email: "admin@test.com", full_name: "Admin" },
  ];

  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === "deliverables") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: deliverable,
          error: deliverableError,
        }),
      };
    }
    if (table === "profiles") {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: admins,
          error: null,
        }),
      };
    }
    // activity_logs / notifications
    return {
      insert: vi.fn().mockResolvedValue({ error: null }),
    };
  });

  mockCreateAdminClient.mockReturnValue({
    from: mockFrom,
  } as never);
}

describe("POST /api/notify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if type is missing", async () => {
    const request = createMockRequest({ deliverableId: "del-1" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing type or deliverableId");
  });

  it("returns 400 if deliverableId is missing", async () => {
    const request = createMockRequest({ type: "pending_review" });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing type or deliverableId");
  });

  it("returns 404 if deliverable not found", async () => {
    mockSupabaseForNotify({
      deliverable: null,
      deliverableError: { message: "not found" },
    });

    const request = createMockRequest({
      type: "pending_review",
      deliverableId: "nonexistent",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Deliverable not found");
  });

  it("sends pending_review notification successfully", async () => {
    mockSupabaseForNotify({});
    mockSendEmail.mockResolvedValue({ success: true, id: "email-1" } as never);

    const request = createMockRequest({
      type: "pending_review",
      deliverableId: "del-1",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "client@test.com",
      })
    );
  });

  it("sends approved notification to admins successfully", async () => {
    mockSupabaseForNotify({});
    mockSendEmail.mockResolvedValue({ success: true, id: "email-1" } as never);

    const request = createMockRequest({
      type: "approved",
      deliverableId: "del-1",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@test.com",
      })
    );
  });

  it("sends revision_requested notification to admins", async () => {
    mockSupabaseForNotify({});
    mockSendEmail.mockResolvedValue({ success: true, id: "email-1" } as never);

    const request = createMockRequest({
      type: "revision_requested",
      deliverableId: "del-1",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("returns 400 for unknown notification type", async () => {
    mockSupabaseForNotify({});

    const request = createMockRequest({
      type: "unknown_type",
      deliverableId: "del-1",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Unknown notification type");
  });

  it("returns 400 if client has no email for pending_review", async () => {
    mockSupabaseForNotify({
      deliverable: {
        ...mockDeliverable,
        phase: {
          ...mockDeliverable.phase,
          project: {
            ...mockDeliverable.phase.project,
            client: {
              id: "client-1",
              email: null as unknown as string,
              full_name: "Jean Client",
              company: "ACME",
            },
          },
        },
      },
    });

    const request = createMockRequest({
      type: "pending_review",
      deliverableId: "del-1",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Client has no email");
  });

  it("returns 400 if no admins to notify for approved", async () => {
    mockSupabaseForNotify({ admins: [] });

    const request = createMockRequest({
      type: "approved",
      deliverableId: "del-1",
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No admins to notify");
  });
});
