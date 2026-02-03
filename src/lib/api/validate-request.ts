import { NextResponse } from "next/server";
import { z, ZodError, ZodSchema } from "zod";

/**
 * Validation result type
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: NextResponse };

/**
 * Format Zod validation errors into a readable structure.
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}

/**
 * Validate request body against a Zod schema.
 * Returns validated data on success, or NextResponse error on failure.
 *
 * @example
 * ```ts
 * const validation = await validateBody(request, createClientSchema);
 * if (!validation.success) {
 *   return validation.error;
 * }
 * const { name, email } = validation.data;
 * ```
 */
export async function validateBody<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<ValidationResult<T>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return {
      success: false,
      error: NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }

  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: NextResponse.json(
        {
          error: "Validation failed",
          details: formatZodErrors(result.error),
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validate query parameters against a Zod schema.
 * Returns validated data on success, or NextResponse error on failure.
 *
 * @example
 * ```ts
 * const url = new URL(request.url);
 * const validation = validateQuery(url.searchParams, clientsQuerySchema);
 * if (!validation.success) {
 *   return validation.error;
 * }
 * const { page, per_page, status } = validation.data;
 * ```
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): ValidationResult<T> {
  // Convert URLSearchParams to plain object
  const params: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    if (params[key]) {
      // Handle multiple values for same key
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  }

  const result = schema.safeParse(params);

  if (!result.success) {
    return {
      success: false,
      error: NextResponse.json(
        {
          error: "Invalid query parameters",
          details: formatZodErrors(result.error),
        },
        { status: 400 }
      ),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Validate path parameters (e.g., UUID IDs).
 *
 * @example
 * ```ts
 * const validation = validateId(params.id);
 * if (!validation.success) {
 *   return validation.error;
 * }
 * const id = validation.data;
 * ```
 */
export function validateId(id: string | undefined): ValidationResult<string> {
  if (!id) {
    return {
      success: false,
      error: NextResponse.json({ error: "Missing ID parameter" }, { status: 400 }),
    };
  }

  const uuidSchema = z.string().uuid("Invalid ID format");
  const result = uuidSchema.safeParse(id);

  if (!result.success) {
    return {
      success: false,
      error: NextResponse.json({ error: "Invalid ID format" }, { status: 400 }),
    };
  }

  return { success: true, data: result.data };
}

/**
 * Create a standard error response.
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { error: message, ...(details && { details }) },
    { status }
  );
}

/**
 * Create a standard success response.
 */
export function successResponse<T>(
  data: T,
  status: number = 200,
  meta?: Record<string, unknown>
): NextResponse {
  return NextResponse.json(
    { data, ...(meta && { meta }) },
    { status }
  );
}
