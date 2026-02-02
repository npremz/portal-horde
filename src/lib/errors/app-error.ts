import { ErrorCode, ERROR_MESSAGES, HTTP_STATUS_MAP } from "./error-codes";

export interface AppErrorOptions {
  code: ErrorCode;
  message?: string;
  cause?: unknown;
  requestId?: string;
}

/**
 * Custom error class for the Horde Portal application.
 * Provides structured error information with codes, HTTP status, and tracking.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly requestId?: string;
  readonly timestamp: string;
  readonly isOperational = true;

  constructor(options: AppErrorOptions) {
    super(options.message || ERROR_MESSAGES[options.code]);
    this.name = "AppError";
    this.code = options.code;
    this.statusCode = HTTP_STATUS_MAP[options.code];
    this.requestId = options.requestId;
    this.timestamp = new Date().toISOString();

    if (options.cause instanceof Error) {
      this.cause = options.cause;
      this.stack = `${this.stack}\nCaused by: ${options.cause.stack}`;
    }

    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * Creates an AppError from an unknown error type.
   * Useful in catch blocks where the error type is unknown.
   */
  static fromUnknown(error: unknown, requestId?: string): AppError {
    if (error instanceof AppError) {
      if (requestId && !error.requestId) {
        return new AppError({
          code: error.code,
          message: error.message,
          cause: error.cause,
          requestId,
        });
      }
      return error;
    }

    if (error instanceof Error) {
      return new AppError({
        code: ErrorCode.UNKNOWN,
        message: error.message,
        cause: error,
        requestId,
      });
    }

    return new AppError({
      code: ErrorCode.UNKNOWN,
      message: typeof error === "string" ? error : "Une erreur inconnue s'est produite",
      requestId,
    });
  }

  /**
   * Converts the error to a JSON-serializable object.
   * Used for API responses and logging.
   */
  toJSON(): {
    code: ErrorCode;
    message: string;
    statusCode: number;
    requestId?: string;
    timestamp: string;
  } {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      requestId: this.requestId,
      timestamp: this.timestamp,
    };
  }

  /**
   * Returns a user-friendly representation for logging.
   */
  toString(): string {
    const parts = [`[${this.code}] ${this.message}`];
    if (this.requestId) {
      parts.push(`(Request: ${this.requestId})`);
    }
    return parts.join(" ");
  }
}
