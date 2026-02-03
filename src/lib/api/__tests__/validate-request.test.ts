import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  validateBody,
  validateQuery,
  validateId,
  errorResponse,
  successResponse,
} from "../validate-request";

describe("validate-request", () => {
  describe("validateBody", () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().optional(),
    });

    it("returns success with valid data", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "John", age: 30 }),
      });

      const result = await validateBody(request, testSchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("John");
        expect(result.data.age).toBe(30);
      }
    });

    it("returns error for invalid JSON", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: "not json",
      });

      const result = await validateBody(request, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        const body = await result.error.json();
        expect(body.error).toBe("Invalid JSON body");
      }
    });

    it("returns error for validation failure", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ name: "" }),
      });

      const result = await validateBody(request, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
        const body = await result.error.json();
        expect(body.error).toBe("Validation failed");
        expect(body.details).toBeDefined();
      }
    });

    it("returns formatted error details", async () => {
      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const result = await validateBody(request, testSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        const body = await result.error.json();
        expect(body.details.name).toBeDefined();
      }
    });
  });

  describe("validateQuery", () => {
    const querySchema = z.object({
      page: z.coerce.number().default(1),
      search: z.string().optional(),
    });

    it("returns success with valid query params", () => {
      const params = new URLSearchParams("page=5&search=test");

      const result = validateQuery(params, querySchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(5);
        expect(result.data.search).toBe("test");
      }
    });

    it("applies default values", () => {
      const params = new URLSearchParams("");

      const result = validateQuery(params, querySchema);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
      }
    });

    it("returns error for invalid query params", () => {
      const strictSchema = z.object({
        count: z.coerce.number().min(1),
      });
      const params = new URLSearchParams("count=0");

      const result = validateQuery(params, strictSchema);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });
  });

  describe("validateId", () => {
    it("returns success for valid UUID", () => {
      const result = validateId("550e8400-e29b-41d4-a716-446655440000");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("550e8400-e29b-41d4-a716-446655440000");
      }
    });

    it("returns error for undefined", () => {
      const result = validateId(undefined);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });

    it("returns error for invalid UUID format", () => {
      const result = validateId("not-a-uuid");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.status).toBe(400);
      }
    });

    it("returns error for empty string", () => {
      const result = validateId("");

      expect(result.success).toBe(false);
    });
  });

  describe("errorResponse", () => {
    it("creates error response with default status", async () => {
      const response = errorResponse("Something went wrong");

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Something went wrong");
    });

    it("creates error response with custom status", async () => {
      const response = errorResponse("Not found", 404);

      expect(response.status).toBe(404);
    });

    it("includes details when provided", async () => {
      const response = errorResponse("Validation error", 400, { field: "name" });

      const body = await response.json();
      expect(body.error).toBe("Validation error");
      expect(body.details.field).toBe("name");
    });
  });

  describe("successResponse", () => {
    it("creates success response with data", async () => {
      const response = successResponse({ id: 1, name: "Test" });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data).toEqual({ id: 1, name: "Test" });
    });

    it("creates success response with custom status", async () => {
      const response = successResponse({ id: 1 }, 201);

      expect(response.status).toBe(201);
    });

    it("includes meta when provided", async () => {
      const response = successResponse(
        [{ id: 1 }],
        200,
        { total: 100, page: 1 }
      );

      const body = await response.json();
      expect(body.data).toEqual([{ id: 1 }]);
      expect(body.meta).toEqual({ total: 100, page: 1 });
    });
  });
});
