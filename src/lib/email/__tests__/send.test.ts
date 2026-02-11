import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: class MockResend {
    emails = { send: mockSend };
  },
}));

describe("sendEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns error when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;

    const { sendEmail } = await import("../send");
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe("No API key");
    expect(mockSend).not.toHaveBeenCalled();
  });

  it("sends email with correct parameters", async () => {
    process.env.RESEND_API_KEY = "re_test_key";

    mockSend.mockResolvedValue({
      data: { id: "email-123" },
      error: null,
    });

    const { sendEmail } = await import("../send");
    const result = await sendEmail({
      to: "client@example.com",
      subject: "Bienvenue",
      html: "<p>Bonjour</p>",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBe("email-123");
    expect(mockSend).toHaveBeenCalledWith({
      from: "Nicolas Premont <nico@hordeagence.com>",
      to: "client@example.com",
      subject: "Bienvenue",
      html: "<p>Bonjour</p>",
    });
  });

  it("returns error when Resend API returns an error", async () => {
    process.env.RESEND_API_KEY = "re_test_key";

    const apiError = { statusCode: 422, message: "Invalid email" };
    mockSend.mockResolvedValue({
      data: null,
      error: apiError,
    });

    const { sendEmail } = await import("../send");
    const result = await sendEmail({
      to: "bad@email",
      subject: "Test",
      html: "<p>Test</p>",
    });

    expect(result.success).toBe(false);
    expect(result.error).toEqual(apiError);
  });

  it("returns error when Resend throws an exception", async () => {
    process.env.RESEND_API_KEY = "re_test_key";

    const exception = new Error("Network failure");
    mockSend.mockRejectedValue(exception);

    const { sendEmail } = await import("../send");
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe(exception);
  });
});
