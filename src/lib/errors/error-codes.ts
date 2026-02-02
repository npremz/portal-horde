/**
 * Centralized error codes and French messages for the Horde Portal
 */

export enum ErrorCode {
  // Génériques
  UNKNOWN = "UNKNOWN",
  NETWORK_ERROR = "NETWORK_ERROR",

  // Auth
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  SESSION_EXPIRED = "SESSION_EXPIRED",

  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  INVALID_INPUT = "INVALID_INPUT",

  // Database
  NOT_FOUND = "NOT_FOUND",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY",
  DATABASE_ERROR = "DATABASE_ERROR",

  // Business
  OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED",
  RATE_LIMITED = "RATE_LIMITED",

  // External
  EMAIL_SEND_FAILED = "EMAIL_SEND_FAILED",
}

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.UNKNOWN]: "Une erreur inattendue s'est produite",
  [ErrorCode.NETWORK_ERROR]: "Erreur de connexion au serveur",
  [ErrorCode.UNAUTHORIZED]: "Non autorisé",
  [ErrorCode.FORBIDDEN]: "Accès refusé",
  [ErrorCode.SESSION_EXPIRED]: "Session expirée",
  [ErrorCode.VALIDATION_ERROR]: "Données invalides",
  [ErrorCode.INVALID_INPUT]: "Saisie invalide",
  [ErrorCode.NOT_FOUND]: "Ressource introuvable",
  [ErrorCode.DUPLICATE_ENTRY]: "Cette entrée existe déjà",
  [ErrorCode.DATABASE_ERROR]: "Erreur de base de données",
  [ErrorCode.OPERATION_NOT_ALLOWED]: "Opération non autorisée",
  [ErrorCode.RATE_LIMITED]: "Trop de requêtes, veuillez réessayer plus tard",
  [ErrorCode.EMAIL_SEND_FAILED]: "Erreur lors de l'envoi de l'email",
};

export const HTTP_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.UNKNOWN]: 500,
  [ErrorCode.NETWORK_ERROR]: 503,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.SESSION_EXPIRED]: 401,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.DUPLICATE_ENTRY]: 409,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.OPERATION_NOT_ALLOWED]: 403,
  [ErrorCode.RATE_LIMITED]: 429,
  [ErrorCode.EMAIL_SEND_FAILED]: 500,
};
