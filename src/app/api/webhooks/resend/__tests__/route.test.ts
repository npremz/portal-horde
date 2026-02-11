import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockVerify = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    webhooks = { verify: mockVerify };
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import { POST } from "../route";
import { createAdminClient } from "@/lib/supabase/admin";

const mockCreateAdminClient = vi.mocked(createAdminClient);

function createWebhookRequest(
  body: string,
  headers: Record<string, string> = {}
): Request {
  const defaultHeaders: Record<string, string> = {
    "svix-id": "msg_123",
    "svix-timestamp": "1234567890",
    "svix-signature": "v1,sig123",
    ...headers,
  };

  return new Request("http://localhost/api/webhooks/resend", {
    method: "POST",
    body,
    headers: defaultHeaders,
  });
}

describe("POST /api/webhooks/resend", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, RESEND_WEBHOOK_SECRET: "whsec_test123" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns 500 if RESEND_WEBHOOK_SECRET is not configured", async () => {
    delete process.env.RESEND_WEBHOOK_SECRET;

    const request = createWebhookRequest('{"type":"email.delivered"}');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Not configured");
  });

  it("returns 400 if svix headers are missing", async () => {
    const request = new Request("http://localhost/api/webhooks/resend", {
      method: "POST",
      body: '{"type":"email.delivered"}',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing headers");
  });

  it("returns 401 if signature verification fails", async () => {
    mockVerify.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const request = createWebhookRequest('{"type":"email.delivered"}');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Invalid signature");
  });

  it("processes email.clicked event and updates DB", async () => {
    mockVerify.mockReturnValue({
      type: "email.clicked",
      data: {
        email_id: "email-123",
        click: { link: "https://example.com/page" },
      },
    });

    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockCreateAdminClient.mockReturnValue({
      from: vi.fn().mockReturnValue({
        update: mockUpdate,
      }),
    } as never);

    const request = createWebhookRequest(
      JSON.stringify({
        type: "email.clicked",
        data: { email_id: "email-123", click: { link: "https://example.com/page" } },
      })
    );
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        clicked_link: "https://example.com/page",
      })
    );
  });

  it("returns 200 for non-click events without DB update", async () => {
    mockVerify.mockReturnValue({
      type: "email.delivered",
      data: { email_id: "email-456" },
    });

    mockCreateAdminClient.mockReturnValue({
      from: vi.fn(),
    } as never);

    const request = createWebhookRequest(
      JSON.stringify({ type: "email.delivered", data: { email_id: "email-456" } })
    );
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.received).toBe(true);
  });
});
