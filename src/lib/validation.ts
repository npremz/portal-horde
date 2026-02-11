// Input validation and sanitization utilities

/**
 * Sanitize a string by removing potentially dangerous characters
 * while preserving normal text content
 */
export function sanitizeString(input: string): string {
  if (!input) return "";

  return input
    // Remove null bytes
    .replace(/\0/g, "")
    // Trim whitespace
    .trim();
}

/**
 * Sanitize HTML-like content (strip tags but keep text)
 */
export function stripHtml(input: string): string {
  if (!input) return "";

  return input
    .replace(/<[^>]*>/g, "")
    .replace(/\0/g, "")
    .trim();
}

/**
 * Validate and sanitize a comment
 */
export function validateComment(content: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeString(content);

  if (!sanitized) {
    return { valid: false, sanitized: "", error: "Le commentaire ne peut pas être vide" };
  }

  if (sanitized.length > 5000) {
    return { valid: false, sanitized: "", error: "Le commentaire est trop long (max 5000 caractères)" };
  }

  return { valid: true, sanitized };
}

/**
 * Validate project/deliverable name
 */
export function validateName(name: string, maxLength = 200): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeString(name);

  if (!sanitized) {
    return { valid: false, sanitized: "", error: "Le nom est requis" };
  }

  if (sanitized.length > maxLength) {
    return { valid: false, sanitized: "", error: `Le nom est trop long (max ${maxLength} caractères)` };
  }

  return { valid: true, sanitized };
}

/**
 * Validate description text
 */
export function validateDescription(description: string | null): { valid: boolean; sanitized: string | null; error?: string } {
  if (!description) {
    return { valid: true, sanitized: null };
  }

  const sanitized = sanitizeString(description);

  if (sanitized.length > 10000) {
    return { valid: false, sanitized: null, error: "La description est trop longue (max 10000 caractères)" };
  }

  return { valid: true, sanitized };
}

/**
 * Validate URL
 */
export function validateUrl(url: string | null): { valid: boolean; sanitized: string | null; error?: string } {
  if (!url) {
    return { valid: true, sanitized: null };
  }

  const sanitized = sanitizeString(url);

  // Basic URL validation
  try {
    const parsed = new URL(sanitized);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, sanitized: null, error: "L'URL doit commencer par http:// ou https://" };
    }
    return { valid: true, sanitized };
  } catch {
    return { valid: false, sanitized: null, error: "URL invalide" };
  }
}

/**
 * Allowed file types for uploads
 */
export const ALLOWED_FILE_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  // Text
  "text/plain",
  "text/csv",
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Validate file upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { valid: false, error: `Type de fichier non autorisé : ${file.type}` };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024}MB)` };
  }

  // Check for suspicious file names
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.sh$/i,
    /\.php$/i,
    /\.js$/i,
    /\.html?$/i,
  ];

  if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
    return { valid: false, error: "Type de fichier non autorisé" };
  }

  return { valid: true };
}

/**
 * Validate email address
 */
export function validateEmail(email: string): { valid: boolean; sanitized: string; error?: string } {
  const sanitized = sanitizeString(email).toLowerCase();

  if (!sanitized) {
    return { valid: false, sanitized: "", error: "L'email est requis" };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    return { valid: false, sanitized: "", error: "Email invalide" };
  }

  if (sanitized.length > 320) {
    return { valid: false, sanitized: "", error: "Email trop long" };
  }

  return { valid: true, sanitized };
}

/**
 * Validate phone number (flexible format)
 */
export function validatePhone(phone: string | null): { valid: boolean; sanitized: string | null; error?: string } {
  if (!phone) {
    return { valid: true, sanitized: null };
  }

  // Remove all spaces, dashes, parentheses, and dots for normalization
  const cleaned = phone.replace(/[\s\-().]/g, "");

  // Allow + at start for international
  const phoneRegex = /^\+?[0-9]{7,15}$/;
  if (!phoneRegex.test(cleaned)) {
    return { valid: false, sanitized: null, error: "Numéro de téléphone invalide" };
  }

  // Keep original formatting but sanitized
  const sanitized = sanitizeString(phone);
  return { valid: true, sanitized };
}

/**
 * Validate website URL
 */
export function validateWebsite(url: string | null): { valid: boolean; sanitized: string | null; error?: string } {
  if (!url) {
    return { valid: true, sanitized: null };
  }

  let sanitized = sanitizeString(url);

  // Add https:// if no protocol
  if (sanitized && !sanitized.match(/^https?:\/\//)) {
    sanitized = `https://${sanitized}`;
  }

  try {
    const parsed = new URL(sanitized);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { valid: false, sanitized: null, error: "L'URL doit commencer par http:// ou https://" };
    }
    return { valid: true, sanitized };
  } catch {
    return { valid: false, sanitized: null, error: "URL invalide" };
  }
}

/**
 * Validate social media URLs
 */
export function validateSocials(socials: Record<string, string | undefined> | null): {
  valid: boolean;
  sanitized: Record<string, string> | null;
  error?: string;
} {
  if (!socials) {
    return { valid: true, sanitized: null };
  }

  const validKeys = ["linkedin", "instagram", "facebook", "twitter"];
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(socials)) {
    if (!validKeys.includes(key)) {
      continue; // Ignore invalid keys
    }

    if (!value) {
      continue;
    }

    const urlResult = validateWebsite(value);
    if (!urlResult.valid) {
      return { valid: false, sanitized: null, error: `URL ${key} invalide: ${urlResult.error}` };
    }

    if (urlResult.sanitized) {
      sanitized[key] = urlResult.sanitized;
    }
  }

  return { valid: true, sanitized: Object.keys(sanitized).length > 0 ? sanitized : null };
}

/**
 * Validate notes/text area content
 */
export function validateNotes(notes: string | null): { valid: boolean; sanitized: string | null; error?: string } {
  if (!notes) {
    return { valid: true, sanitized: null };
  }

  const sanitized = sanitizeString(notes);

  if (sanitized.length > 10000) {
    return { valid: false, sanitized: null, error: "Les notes sont trop longues (max 10000 caractères)" };
  }

  return { valid: true, sanitized };
}
