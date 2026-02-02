// Error codes and messages
export { ErrorCode, ERROR_MESSAGES, HTTP_STATUS_MAP } from "./error-codes";

// Custom error class
export { AppError } from "./app-error";
export type { AppErrorOptions } from "./app-error";

// Database error mapping
export {
  mapDatabaseError,
  isNotFoundError,
  isDuplicateError,
  isAuthError,
} from "./db-error-mapper";

// API response helpers
export {
  generateRequestId,
  apiError,
  apiSuccess,
  apiErrors,
} from "./api-response";
export type { ApiErrorResponse, ApiSuccessResponse } from "./api-response";

// Logging
export { logger, createLogger, Logger } from "./logger";
export type { LogLevel } from "./logger";
