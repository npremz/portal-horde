import type { PostgrestError } from "@supabase/supabase-js";
import { AppError } from "./app-error";
import { ErrorCode } from "./error-codes";

/**
 * PostgreSQL error code to ErrorCode mapping.
 * See: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
const PG_ERROR_MAP: Record<string, ErrorCode> = {
  // Integrity constraint violations
  "23505": ErrorCode.DUPLICATE_ENTRY, // unique_violation
  "23503": ErrorCode.VALIDATION_ERROR, // foreign_key_violation
  "23502": ErrorCode.VALIDATION_ERROR, // not_null_violation
  "23514": ErrorCode.VALIDATION_ERROR, // check_violation

  // PostgREST specific errors
  PGRST116: ErrorCode.NOT_FOUND, // No rows returned (single row expected)
  PGRST301: ErrorCode.FORBIDDEN, // JWT expired
  PGRST302: ErrorCode.UNAUTHORIZED, // No authorization header
};

/**
 * Maps a PostgreSQL/PostgREST error to an AppError.
 * Returns null if the error is null (successful operation).
 */
export function mapDatabaseError(
  error: PostgrestError | null,
  requestId?: string
): AppError | null {
  if (!error) return null;

  const code = error.code;
  const mappedCode = PG_ERROR_MAP[code] || ErrorCode.DATABASE_ERROR;

  // Use the detailed message for specific errors, default message otherwise
  let message: string | undefined;
  if (mappedCode === ErrorCode.DUPLICATE_ENTRY) {
    message = extractDuplicateField(error.message);
  } else if (mappedCode === ErrorCode.NOT_FOUND) {
    message = "Ressource introuvable";
  }

  return new AppError({
    code: mappedCode,
    message,
    cause: error,
    requestId,
  });
}

/**
 * Checks if a PostgrestError represents a "not found" condition.
 */
export function isNotFoundError(error: PostgrestError | null): boolean {
  if (!error) return false;
  return error.code === "PGRST116";
}

/**
 * Checks if a PostgrestError represents a duplicate entry.
 */
export function isDuplicateError(error: PostgrestError | null): boolean {
  if (!error) return false;
  return error.code === "23505";
}

/**
 * Checks if a PostgrestError represents an authentication error.
 */
export function isAuthError(error: PostgrestError | null): boolean {
  if (!error) return false;
  return error.code === "PGRST301" || error.code === "PGRST302";
}

/**
 * Extracts a user-friendly message from a unique constraint violation.
 * Example: 'duplicate key value violates unique constraint "profiles_email_key"'
 */
function extractDuplicateField(message: string): string {
  const match = message.match(/unique constraint "(\w+)_(\w+)_key"/);
  if (match) {
    const field = match[2];
    const fieldNames: Record<string, string> = {
      email: "email",
      name: "nom",
      slug: "identifiant",
    };
    const fieldName = fieldNames[field] || field;
    return `Un enregistrement avec ce ${fieldName} existe déjà`;
  }
  return "Cette entrée existe déjà";
}
