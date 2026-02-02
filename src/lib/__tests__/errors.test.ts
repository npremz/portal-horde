import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ErrorCode,
  ERROR_MESSAGES,
  HTTP_STATUS_MAP,
  AppError,
  mapDatabaseError,
  isNotFoundError,
  isDuplicateError,
  isAuthError,
  generateRequestId,
} from "../errors";

describe("ErrorCode", () => {
  it("has all expected codes", () => {
    expect(ErrorCode.UNKNOWN).toBe("UNKNOWN");
    expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCode.DUPLICATE_ENTRY).toBe("DUPLICATE_ENTRY");
  });
});

describe("ERROR_MESSAGES", () => {
  it("provides French messages for all codes", () => {
    expect(ERROR_MESSAGES[ErrorCode.UNKNOWN]).toBe("Une erreur inattendue s'est produite");
    expect(ERROR_MESSAGES[ErrorCode.NOT_FOUND]).toBe("Ressource introuvable");
    expect(ERROR_MESSAGES[ErrorCode.UNAUTHORIZED]).toBe("Non autorisé");
  });

  it("has a message for every error code", () => {
    const codes = Object.values(ErrorCode);
    for (const code of codes) {
      expect(ERROR_MESSAGES[code]).toBeDefined();
      expect(typeof ERROR_MESSAGES[code]).toBe("string");
    }
  });
});

describe("HTTP_STATUS_MAP", () => {
  it("maps codes to correct HTTP status", () => {
    expect(HTTP_STATUS_MAP[ErrorCode.UNAUTHORIZED]).toBe(401);
    expect(HTTP_STATUS_MAP[ErrorCode.FORBIDDEN]).toBe(403);
    expect(HTTP_STATUS_MAP[ErrorCode.NOT_FOUND]).toBe(404);
    expect(HTTP_STATUS_MAP[ErrorCode.DUPLICATE_ENTRY]).toBe(409);
    expect(HTTP_STATUS_MAP[ErrorCode.UNKNOWN]).toBe(500);
  });

  it("has a status for every error code", () => {
    const codes = Object.values(ErrorCode);
    for (const code of codes) {
      expect(HTTP_STATUS_MAP[code]).toBeDefined();
      expect(typeof HTTP_STATUS_MAP[code]).toBe("number");
    }
  });
});

describe("AppError", () => {
  it("creates error with default message", () => {
    const error = new AppError({ code: ErrorCode.NOT_FOUND });
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.message).toBe(ERROR_MESSAGES[ErrorCode.NOT_FOUND]);
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
  });

  it("creates error with custom message", () => {
    const error = new AppError({
      code: ErrorCode.NOT_FOUND,
      message: "Utilisateur introuvable",
    });
    expect(error.message).toBe("Utilisateur introuvable");
  });

  it("includes requestId when provided", () => {
    const error = new AppError({
      code: ErrorCode.UNKNOWN,
      requestId: "req_123",
    });
    expect(error.requestId).toBe("req_123");
  });

  it("includes timestamp", () => {
    const before = new Date().toISOString();
    const error = new AppError({ code: ErrorCode.UNKNOWN });
    const after = new Date().toISOString();
    expect(error.timestamp >= before).toBe(true);
    expect(error.timestamp <= after).toBe(true);
  });

  it("converts to JSON correctly", () => {
    const error = new AppError({
      code: ErrorCode.FORBIDDEN,
      message: "Test message",
      requestId: "req_abc",
    });
    const json = error.toJSON();
    expect(json.code).toBe(ErrorCode.FORBIDDEN);
    expect(json.message).toBe("Test message");
    expect(json.statusCode).toBe(403);
    expect(json.requestId).toBe("req_abc");
    expect(json.timestamp).toBeDefined();
  });

  it("toString includes relevant info", () => {
    const error = new AppError({
      code: ErrorCode.NOT_FOUND,
      requestId: "req_xyz",
    });
    const str = error.toString();
    expect(str).toContain("NOT_FOUND");
    expect(str).toContain("req_xyz");
  });

  describe("fromUnknown", () => {
    it("returns same AppError if already AppError", () => {
      const original = new AppError({ code: ErrorCode.FORBIDDEN });
      const result = AppError.fromUnknown(original);
      expect(result).toBe(original);
    });

    it("adds requestId to existing AppError if missing", () => {
      const original = new AppError({ code: ErrorCode.FORBIDDEN });
      const result = AppError.fromUnknown(original, "req_new");
      expect(result.requestId).toBe("req_new");
      expect(result.code).toBe(ErrorCode.FORBIDDEN);
    });

    it("converts Error to AppError", () => {
      const original = new Error("Something went wrong");
      const result = AppError.fromUnknown(original, "req_123");
      expect(result.code).toBe(ErrorCode.UNKNOWN);
      expect(result.message).toBe("Something went wrong");
      expect(result.requestId).toBe("req_123");
    });

    it("converts string to AppError", () => {
      const result = AppError.fromUnknown("String error");
      expect(result.code).toBe(ErrorCode.UNKNOWN);
      expect(result.message).toBe("String error");
    });

    it("handles unknown types", () => {
      const result = AppError.fromUnknown({ weird: "object" });
      expect(result.code).toBe(ErrorCode.UNKNOWN);
    });
  });
});

describe("mapDatabaseError", () => {
  it("returns null for null error", () => {
    expect(mapDatabaseError(null)).toBeNull();
  });

  it("maps unique violation to DUPLICATE_ENTRY", () => {
    const pgError = {
      code: "23505",
      message: 'duplicate key value violates unique constraint "profiles_email_key"',
      details: null,
      hint: null,
    };
    const result = mapDatabaseError(pgError);
    expect(result?.code).toBe(ErrorCode.DUPLICATE_ENTRY);
    expect(result?.message).toContain("email");
  });

  it("maps PGRST116 to NOT_FOUND", () => {
    const pgError = {
      code: "PGRST116",
      message: "No rows returned",
      details: null,
      hint: null,
    };
    const result = mapDatabaseError(pgError);
    expect(result?.code).toBe(ErrorCode.NOT_FOUND);
  });

  it("maps unknown codes to DATABASE_ERROR", () => {
    const pgError = {
      code: "99999",
      message: "Unknown error",
      details: null,
      hint: null,
    };
    const result = mapDatabaseError(pgError);
    expect(result?.code).toBe(ErrorCode.DATABASE_ERROR);
  });

  it("includes requestId when provided", () => {
    const pgError = {
      code: "23505",
      message: "duplicate",
      details: null,
      hint: null,
    };
    const result = mapDatabaseError(pgError, "req_test");
    expect(result?.requestId).toBe("req_test");
  });
});

describe("isNotFoundError", () => {
  it("returns true for PGRST116", () => {
    expect(isNotFoundError({ code: "PGRST116", message: "", details: null, hint: null })).toBe(
      true
    );
  });

  it("returns false for other codes", () => {
    expect(isNotFoundError({ code: "23505", message: "", details: null, hint: null })).toBe(false);
  });

  it("returns false for null", () => {
    expect(isNotFoundError(null)).toBe(false);
  });
});

describe("isDuplicateError", () => {
  it("returns true for 23505", () => {
    expect(isDuplicateError({ code: "23505", message: "", details: null, hint: null })).toBe(true);
  });

  it("returns false for other codes", () => {
    expect(isDuplicateError({ code: "PGRST116", message: "", details: null, hint: null })).toBe(
      false
    );
  });

  it("returns false for null", () => {
    expect(isDuplicateError(null)).toBe(false);
  });
});

describe("isAuthError", () => {
  it("returns true for PGRST301", () => {
    expect(isAuthError({ code: "PGRST301", message: "", details: null, hint: null })).toBe(true);
  });

  it("returns true for PGRST302", () => {
    expect(isAuthError({ code: "PGRST302", message: "", details: null, hint: null })).toBe(true);
  });

  it("returns false for other codes", () => {
    expect(isAuthError({ code: "23505", message: "", details: null, hint: null })).toBe(false);
  });
});

describe("generateRequestId", () => {
  it("generates unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateRequestId());
    }
    expect(ids.size).toBe(100);
  });

  it("starts with req_", () => {
    const id = generateRequestId();
    expect(id.startsWith("req_")).toBe(true);
  });

  it("has reasonable length", () => {
    const id = generateRequestId();
    expect(id.length).toBeGreaterThan(10);
    expect(id.length).toBeLessThan(30);
  });
});
