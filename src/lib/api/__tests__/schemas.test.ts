import { describe, it, expect } from "vitest";
import {
  createClientSchema,
  updateClientSchema,
  createContactSchema,
  updateContactSchema,
  createApiKeySchema,
  updateApiKeySchema,
  createMessageSchema,
  contactFormSchema,
  paginationSchema,
  clientsQuerySchema,
} from "../schemas";

describe("API Schemas", () => {
  describe("createClientSchema", () => {
    it("validates valid client data", () => {
      const result = createClientSchema.safeParse({
        name: "Test Client",
        email: "test@example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Test Client");
        expect(result.data.email).toBe("test@example.com");
        expect(result.data.status).toBe("lead"); // default
      }
    });

    it("rejects missing name", () => {
      const result = createClientSchema.safeParse({
        email: "test@example.com",
      });

      expect(result.success).toBe(false);
    });

    it("rejects missing email", () => {
      const result = createClientSchema.safeParse({
        name: "Test Client",
      });

      expect(result.success).toBe(false);
    });

    it("rejects invalid email", () => {
      const result = createClientSchema.safeParse({
        name: "Test Client",
        email: "not-an-email",
      });

      expect(result.success).toBe(false);
    });

    it("validates all optional fields", () => {
      const result = createClientSchema.safeParse({
        name: "Test Client",
        email: "test@example.com",
        phone: "+33612345678",
        website: "https://example.com",
        status: "contacted",
        notes: "Some notes",
        project_type: "Website",
        sector: "Tech",
        socials: {
          linkedin: "https://linkedin.com/company/test",
        },
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = createClientSchema.safeParse({
        name: "Test Client",
        email: "test@example.com",
        status: "invalid_status",
      });

      expect(result.success).toBe(false);
    });

    it("rejects invalid website URL", () => {
      const result = createClientSchema.safeParse({
        name: "Test Client",
        email: "test@example.com",
        website: "not-a-url",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateClientSchema", () => {
    it("allows partial updates", () => {
      const result = updateClientSchema.safeParse({
        name: "Updated Name",
      });

      expect(result.success).toBe(true);
    });

    it("allows empty object", () => {
      const result = updateClientSchema.safeParse({});

      expect(result.success).toBe(true);
    });

    it("validates datetime fields", () => {
      const result = updateClientSchema.safeParse({
        first_contact_date: "2024-01-15T10:30:00.000Z",
        next_followup_date: "2024-01-25T10:30:00.000Z",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("createContactSchema", () => {
    it("validates valid contact data", () => {
      const result = createContactSchema.safeParse({
        name: "John Doe",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.role).toBe("other"); // default
        expect(result.data.is_primary).toBe(false); // default
      }
    });

    it("rejects missing name", () => {
      const result = createContactSchema.safeParse({
        email: "john@example.com",
      });

      expect(result.success).toBe(false);
    });

    it("validates all contact roles", () => {
      const roles = ["decision_maker", "technical", "billing", "marketing", "other"];

      for (const role of roles) {
        const result = createContactSchema.safeParse({
          name: "Test Contact",
          role,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("createApiKeySchema", () => {
    it("validates valid API key data", () => {
      const result = createApiKeySchema.safeParse({
        name: "My API Key",
        permissions: ["clients:read"],
      });

      expect(result.success).toBe(true);
    });

    it("rejects empty permissions array", () => {
      const result = createApiKeySchema.safeParse({
        name: "My API Key",
        permissions: [],
      });

      expect(result.success).toBe(false);
    });

    it("rejects invalid permission", () => {
      const result = createApiKeySchema.safeParse({
        name: "My API Key",
        permissions: ["invalid:permission"],
      });

      expect(result.success).toBe(false);
    });

    it("validates all valid permissions", () => {
      const result = createApiKeySchema.safeParse({
        name: "Full Access Key",
        permissions: [
          "clients:read",
          "clients:write",
          "clients:delete",
          "messages:send",
          "stats:read",
        ],
      });

      expect(result.success).toBe(true);
    });

    it("validates optional expiry date", () => {
      const result = createApiKeySchema.safeParse({
        name: "Expiring Key",
        permissions: ["clients:read"],
        expires_at: "2025-12-31T23:59:59.000Z",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("createMessageSchema", () => {
    it("validates valid message data", () => {
      const result = createMessageSchema.safeParse({
        subject: "Hello",
        content: "This is a test message",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message_type).toBe("custom"); // default
      }
    });

    it("rejects empty subject", () => {
      const result = createMessageSchema.safeParse({
        subject: "",
        content: "Content",
      });

      expect(result.success).toBe(false);
    });

    it("rejects empty content", () => {
      const result = createMessageSchema.safeParse({
        subject: "Subject",
        content: "",
      });

      expect(result.success).toBe(false);
    });

    it("validates all message types", () => {
      const types = ["prospecting", "followup", "custom"];

      for (const message_type of types) {
        const result = createMessageSchema.safeParse({
          subject: "Test",
          content: "Content",
          message_type,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("contactFormSchema", () => {
    it("validates valid contact form data", () => {
      const result = contactFormSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        category: "general",
        subject: "Question",
        message: "This is my message with at least 10 characters",
      });

      expect(result.success).toBe(true);
    });

    it("rejects message shorter than 10 characters", () => {
      const result = contactFormSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        category: "general",
        subject: "Question",
        message: "Short",
      });

      expect(result.success).toBe(false);
    });

    it("allows optional company field", () => {
      const result = contactFormSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        company: "ACME Corp",
        category: "general",
        subject: "Question",
        message: "This is my message with at least 10 characters",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.company).toBe("ACME Corp");
      }
    });
  });

  describe("paginationSchema", () => {
    it("provides default values", () => {
      const result = paginationSchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.per_page).toBe(20);
      }
    });

    it("coerces string values to numbers", () => {
      const result = paginationSchema.safeParse({
        page: "5",
        per_page: "50",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.per_page).toBe(50);
      }
    });

    it("rejects page less than 1", () => {
      const result = paginationSchema.safeParse({
        page: 0,
      });

      expect(result.success).toBe(false);
    });

    it("rejects per_page greater than 100", () => {
      const result = paginationSchema.safeParse({
        per_page: 101,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("clientsQuerySchema", () => {
    it("validates status filter", () => {
      const result = clientsQuerySchema.safeParse({
        status: "lead",
      });

      expect(result.success).toBe(true);
    });

    it("rejects invalid status", () => {
      const result = clientsQuerySchema.safeParse({
        status: "invalid",
      });

      expect(result.success).toBe(false);
    });

    it("validates search parameter", () => {
      const result = clientsQuerySchema.safeParse({
        search: "test query",
      });

      expect(result.success).toBe(true);
    });

    it("includes pagination defaults", () => {
      const result = clientsQuerySchema.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.per_page).toBe(20);
      }
    });
  });
});
