import { NextResponse } from "next/server";
import { AppError } from "./app-error";
import { ErrorCode } from "./error-codes";
import { logger } from "./logger";

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    requestId?: string;
  };
}

/**
 * Standard API success response format
 */
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Generates a unique request ID for tracking.
 * Format: req_<timestamp>_<random>
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * Creates a standardized error response from any error type.
 * Logs the error and returns a NextResponse with proper status code.
 */
export function apiError(
  error: unknown,
  requestId?: string,
  logContext?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const appError = AppError.fromUnknown(error, requestId);

  // Log the error with context
  const context = {
    requestId: appError.requestId,
    code: appError.code,
    statusCode: appError.statusCode,
    ...(appError.cause instanceof Error ? { originalError: appError.cause.message } : {}),
    ...logContext,
  };

  // Use critical for 5xx errors, error for others
  if (appError.statusCode >= 500) {
    logger.critical(`API Error: ${appError.message}`, {
      ...context,
      stack: appError.stack,
    });
  } else {
    logger.error(`API Error: ${appError.message}`, context);
  }

  return NextResponse.json<ApiErrorResponse>(
    {
      error: {
        code: appError.code,
        message: appError.message,
        requestId: appError.requestId,
      },
    },
    { status: appError.statusCode }
  );
}

/**
 * Creates a standardized success response.
 */
export function apiSuccess<T>(
  data: T,
  meta?: Record<string, unknown>,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json<ApiSuccessResponse<T>>({ data, meta }, { status });
}

/**
 * Shortcut helpers for common error responses.
 * Each returns a properly formatted error response with appropriate HTTP status.
 */
export const apiErrors = {
  /**
   * 401 Unauthorized - User is not authenticated
   */
  unauthorized: (requestId?: string, message?: string) =>
    apiError(
      new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message,
        requestId,
      }),
      requestId
    ),

  /**
   * 403 Forbidden - User is authenticated but lacks permission
   */
  forbidden: (requestId?: string, message?: string) =>
    apiError(
      new AppError({
        code: ErrorCode.FORBIDDEN,
        message,
        requestId,
      }),
      requestId
    ),

  /**
   * 404 Not Found - Resource does not exist
   */
  notFound: (requestId?: string, message?: string) =>
    apiError(
      new AppError({
        code: ErrorCode.NOT_FOUND,
        message,
        requestId,
      }),
      requestId
    ),

  /**
   * 400 Bad Request - Validation or input error
   */
  badRequest: (requestId?: string, message?: string) =>
    apiError(
      new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message,
        requestId,
      }),
      requestId
    ),

  /**
   * 409 Conflict - Resource already exists
   */
  duplicate: (requestId?: string, message?: string) =>
    apiError(
      new AppError({
        code: ErrorCode.DUPLICATE_ENTRY,
        message,
        requestId,
      }),
      requestId
    ),

  /**
   * 429 Too Many Requests - Rate limit exceeded
   */
  rateLimited: (requestId?: string, message?: string) =>
    apiError(
      new AppError({
        code: ErrorCode.RATE_LIMITED,
        message,
        requestId,
      }),
      requestId
    ),

  /**
   * 500 Database Error - Database operation failed
   */
  database: (requestId?: string, message?: string) =>
    apiError(
      new AppError({
        code: ErrorCode.DATABASE_ERROR,
        message,
        requestId,
      }),
      requestId
    ),
};
