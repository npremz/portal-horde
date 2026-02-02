import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

// Mock email sending
vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/email/templates", () => ({
  contactFormEmail: vi.fn().mockReturnValue("<html>Email content</html>"),
}));

import { sendEmail } from "@/lib/email/send";
import { contactFormEmail } from "@/lib/email/templates";

const mockSendEmail = vi.mocked(sendEmail);
const mockContactFormEmail = vi.mocked(contactFormEmail);

// Helper to create mock request
function createMockRequest(body: Record<string, unknown>): Request {
  return {
    json: () => Promise.resolve(body),
  } as Request;
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if name is missing", async () => {
    const request = createMockRequest({
      email: "test@example.com",
      category: "general",
      subject: "Test Subject",
      message: "Test message",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing required fields");
  });

  it("returns 400 if email is missing", async () => {
    const request = createMockRequest({
      name: "Test User",
      category: "general",
      subject: "Test Subject",
      message: "Test message",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing required fields");
  });

  it("returns 400 if category is missing", async () => {
    const request = createMockRequest({
      name: "Test User",
      email: "test@example.com",
      subject: "Test Subject",
      message: "Test message",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing required fields");
  });

  it("returns 400 if subject is missing", async () => {
    const request = createMockRequest({
      name: "Test User",
      email: "test@example.com",
      category: "general",
      message: "Test message",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing required fields");
  });

  it("returns 400 if message is missing", async () => {
    const request = createMockRequest({
      name: "Test User",
      email: "test@example.com",
      category: "general",
      subject: "Test Subject",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing required fields");
  });

  it("sends email successfully with all required fields", async () => {
    mockSendEmail.mockResolvedValue({ success: true, id: "email-123" });

    const request = createMockRequest({
      name: "Test User",
      email: "test@example.com",
      category: "general",
      subject: "Test Subject",
      message: "Test message content",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockContactFormEmail).toHaveBeenCalledWith({
      name: "Test User",
      email: "test@example.com",
      company: null,
      category: "general",
      subject: "Test Subject",
      message: "Test message content",
    });
    expect(mockSendEmail).toHaveBeenCalledWith({
      to: "hello@hordeagence.com",
      subject: "[Contact Portal] Test Subject",
      html: "<html>Email content</html>",
    });
  });

  it("sends email with optional company field", async () => {
    mockSendEmail.mockResolvedValue({ success: true, id: "email-123" });

    const request = createMockRequest({
      name: "Test User",
      email: "test@example.com",
      company: "Test Company Inc",
      category: "business",
      subject: "Partnership Inquiry",
      message: "We would like to discuss...",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockContactFormEmail).toHaveBeenCalledWith({
      name: "Test User",
      email: "test@example.com",
      company: "Test Company Inc",
      category: "business",
      subject: "Partnership Inquiry",
      message: "We would like to discuss...",
    });
  });

  it("returns 500 if email sending fails", async () => {
    mockSendEmail.mockResolvedValue({
      success: false,
      error: "SMTP connection failed",
    });

    const request = createMockRequest({
      name: "Test User",
      email: "test@example.com",
      category: "general",
      subject: "Test Subject",
      message: "Test message",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to send email");
  });

  it("handles exception gracefully", async () => {
    mockSendEmail.mockRejectedValue(new Error("Network error"));

    const request = createMockRequest({
      name: "Test User",
      email: "test@example.com",
      category: "general",
      subject: "Test Subject",
      message: "Test message",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal server error");
  });
});
