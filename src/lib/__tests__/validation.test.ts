import { describe, it, expect } from "vitest";
import {
  sanitizeString,
  stripHtml,
  validateComment,
  validateName,
  validateDescription,
  validateUrl,
  validateFile,
  validateEmail,
  validatePhone,
  validateWebsite,
  validateSocials,
  validateNotes,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
} from "../validation";

describe("sanitizeString", () => {
  it("returns empty string for falsy input", () => {
    expect(sanitizeString("")).toBe("");
    expect(sanitizeString(null as unknown as string)).toBe("");
    expect(sanitizeString(undefined as unknown as string)).toBe("");
  });

  it("removes null bytes", () => {
    expect(sanitizeString("hello\0world")).toBe("helloworld");
    expect(sanitizeString("\0test\0")).toBe("test");
  });

  it("trims whitespace", () => {
    expect(sanitizeString("  hello  ")).toBe("hello");
    expect(sanitizeString("\thello\n")).toBe("hello");
  });

  it("handles normal strings", () => {
    expect(sanitizeString("hello world")).toBe("hello world");
  });
});

describe("stripHtml", () => {
  it("returns empty string for falsy input", () => {
    expect(stripHtml("")).toBe("");
    expect(stripHtml(null as unknown as string)).toBe("");
  });

  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello</p>")).toBe("Hello");
    expect(stripHtml("<script>alert('xss')</script>")).toBe("alert('xss')");
    expect(stripHtml("<div><span>Nested</span></div>")).toBe("Nested");
  });

  it("removes null bytes", () => {
    expect(stripHtml("<p>Hello\0</p>")).toBe("Hello");
  });

  it("trims result", () => {
    expect(stripHtml("  <p>Hello</p>  ")).toBe("Hello");
  });
});

describe("validateComment", () => {
  it("rejects empty comments", () => {
    const result = validateComment("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Le commentaire ne peut pas etre vide");
  });

  it("rejects whitespace-only comments", () => {
    const result = validateComment("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Le commentaire ne peut pas etre vide");
  });

  it("rejects comments over 5000 characters", () => {
    const longComment = "a".repeat(5001);
    const result = validateComment(longComment);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Le commentaire est trop long (max 5000 caracteres)");
  });

  it("accepts valid comments", () => {
    const result = validateComment("This is a valid comment");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("This is a valid comment");
  });

  it("sanitizes and accepts comments at max length", () => {
    const exactLengthComment = "a".repeat(5000);
    const result = validateComment(exactLengthComment);
    expect(result.valid).toBe(true);
    expect(result.sanitized.length).toBe(5000);
  });
});

describe("validateName", () => {
  it("rejects empty names", () => {
    const result = validateName("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Le nom est requis");
  });

  it("rejects names over default max length (200)", () => {
    const longName = "a".repeat(201);
    const result = validateName(longName);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Le nom est trop long (max 200 caracteres)");
  });

  it("respects custom max length", () => {
    const name = "a".repeat(51);
    const result = validateName(name, 50);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Le nom est trop long (max 50 caracteres)");
  });

  it("accepts valid names", () => {
    const result = validateName("Projet Web");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("Projet Web");
  });
});

describe("validateDescription", () => {
  it("accepts null description", () => {
    const result = validateDescription(null);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it("accepts empty string as valid (returns sanitized null)", () => {
    const result = validateDescription("");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it("rejects descriptions over 10000 characters", () => {
    const longDesc = "a".repeat(10001);
    const result = validateDescription(longDesc);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("La description est trop longue (max 10000 caracteres)");
  });

  it("accepts valid descriptions", () => {
    const result = validateDescription("Une description valide");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("Une description valide");
  });
});

describe("validateUrl", () => {
  it("accepts null URL", () => {
    const result = validateUrl(null);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it("accepts empty string (returns null)", () => {
    const result = validateUrl("");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it("rejects invalid URLs", () => {
    const result = validateUrl("not-a-url");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("URL invalide");
  });

  it("rejects non-http(s) protocols", () => {
    const result = validateUrl("ftp://example.com");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("L'URL doit commencer par http:// ou https://");
  });

  it("rejects javascript: protocol", () => {
    const result = validateUrl("javascript:alert('xss')");
    expect(result.valid).toBe(false);
  });

  it("accepts valid http URLs", () => {
    const result = validateUrl("http://example.com");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("http://example.com");
  });

  it("accepts valid https URLs", () => {
    const result = validateUrl("https://example.com/path?query=1");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("https://example.com/path?query=1");
  });
});

describe("validateEmail", () => {
  it("rejects empty email", () => {
    const result = validateEmail("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("L'email est requis");
  });

  it("rejects invalid email formats", () => {
    expect(validateEmail("notanemail").valid).toBe(false);
    expect(validateEmail("@domain.com").valid).toBe(false);
    expect(validateEmail("user@").valid).toBe(false);
    expect(validateEmail("user@domain").valid).toBe(false);
  });

  it("rejects emails over 320 characters", () => {
    // 310 + @example.com (12 chars) = 322 chars, over the 320 limit
    const longEmail = "a".repeat(310) + "@example.com";
    const result = validateEmail(longEmail);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Email trop long");
  });

  it("accepts valid emails", () => {
    const result = validateEmail("user@example.com");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("user@example.com");
  });

  it("lowercases email", () => {
    const result = validateEmail("User@EXAMPLE.com");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("user@example.com");
  });

  it("trims whitespace", () => {
    const result = validateEmail("  user@example.com  ");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("user@example.com");
  });
});

describe("validatePhone", () => {
  it("accepts null phone", () => {
    const result = validatePhone(null);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it("accepts empty string (returns null)", () => {
    const result = validatePhone("");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it("rejects too short phone numbers", () => {
    const result = validatePhone("123456");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Numéro de téléphone invalide");
  });

  it("rejects too long phone numbers", () => {
    const result = validatePhone("1234567890123456");
    expect(result.valid).toBe(false);
  });

  it("rejects phone with letters", () => {
    const result = validatePhone("123-456-abcd");
    expect(result.valid).toBe(false);
  });

  it("accepts valid Belgian phone numbers", () => {
    const result = validatePhone("+32 471 123 456");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("+32 471 123 456");
  });

  it("accepts international format with +", () => {
    const result = validatePhone("+33 1 23 45 67 89");
    expect(result.valid).toBe(true);
  });

  it("accepts numbers with dashes and parentheses", () => {
    const result = validatePhone("(02) 123-45-67");
    expect(result.valid).toBe(true);
  });
});

describe("validateWebsite", () => {
  it("accepts null", () => {
    const result = validateWebsite(null);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it("adds https:// when missing protocol", () => {
    const result = validateWebsite("example.com");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("https://example.com");
  });

  it("preserves http:// when provided", () => {
    const result = validateWebsite("http://example.com");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("http://example.com");
  });

  it("preserves https:// when provided", () => {
    const result = validateWebsite("https://example.com");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("https://example.com");
  });

  it("rejects invalid URLs even with protocol added", () => {
    const result = validateWebsite("not a valid url");
    expect(result.valid).toBe(false);
  });
});

describe("validateSocials", () => {
  it("accepts null", () => {
    const result = validateSocials(null);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it("accepts valid social URLs", () => {
    const result = validateSocials({
      linkedin: "https://linkedin.com/company/test",
      instagram: "https://instagram.com/test",
    });
    expect(result.valid).toBe(true);
    expect(result.sanitized).toEqual({
      linkedin: "https://linkedin.com/company/test",
      instagram: "https://instagram.com/test",
    });
  });

  it("adds https:// to social URLs without protocol", () => {
    const result = validateSocials({
      facebook: "facebook.com/page",
    });
    expect(result.valid).toBe(true);
    expect(result.sanitized?.facebook).toBe("https://facebook.com/page");
  });

  it("ignores invalid keys", () => {
    const result = validateSocials({
      linkedin: "https://linkedin.com/test",
      invalid: "https://invalid.com",
    } as Record<string, string>);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toEqual({
      linkedin: "https://linkedin.com/test",
    });
  });

  it("ignores empty values", () => {
    const result = validateSocials({
      linkedin: "https://linkedin.com/test",
      instagram: "",
      facebook: undefined,
    });
    expect(result.valid).toBe(true);
    expect(result.sanitized).toEqual({
      linkedin: "https://linkedin.com/test",
    });
  });

  it("rejects invalid social URLs", () => {
    const result = validateSocials({
      twitter: "not a valid url at all",
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("twitter");
  });

  it("returns null if all values are empty", () => {
    const result = validateSocials({
      linkedin: "",
      instagram: undefined,
    });
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });
});

describe("validateNotes", () => {
  it("accepts null", () => {
    const result = validateNotes(null);
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it("accepts empty string (returns null)", () => {
    const result = validateNotes("");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe(null);
  });

  it("rejects notes over 10000 characters", () => {
    const longNotes = "a".repeat(10001);
    const result = validateNotes(longNotes);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Les notes sont trop longues (max 10000 caractères)");
  });

  it("accepts valid notes", () => {
    const result = validateNotes("Some notes here");
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe("Some notes here");
  });
});

describe("validateFile", () => {
  const createMockFile = (name: string, type: string, size: number): File => {
    const file = new File([""], name, { type });
    Object.defineProperty(file, "size", { value: size });
    return file;
  };

  it("accepts allowed file types", () => {
    const imageFile = createMockFile("test.jpg", "image/jpeg", 1000);
    expect(validateFile(imageFile).valid).toBe(true);

    const pdfFile = createMockFile("doc.pdf", "application/pdf", 1000);
    expect(validateFile(pdfFile).valid).toBe(true);

    const zipFile = createMockFile("archive.zip", "application/zip", 1000);
    expect(validateFile(zipFile).valid).toBe(true);
  });

  it("rejects non-allowed file types", () => {
    const exeFile = createMockFile("malware.exe", "application/x-executable", 1000);
    const result = validateFile(exeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Type de fichier non autorise");
  });

  it("rejects files over max size", () => {
    const largeFile = createMockFile("large.jpg", "image/jpeg", MAX_FILE_SIZE + 1);
    const result = validateFile(largeFile);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Fichier trop volumineux");
  });

  it("rejects suspicious file extensions", () => {
    // File claims to be image but has .exe extension
    const sneakyExe = createMockFile("image.exe", "image/jpeg", 1000);
    expect(validateFile(sneakyExe).valid).toBe(false);

    const batFile = createMockFile("script.bat", "text/plain", 1000);
    expect(validateFile(batFile).valid).toBe(false);

    const phpFile = createMockFile("shell.php", "text/plain", 1000);
    expect(validateFile(phpFile).valid).toBe(false);

    const jsFile = createMockFile("code.js", "text/plain", 1000);
    expect(validateFile(jsFile).valid).toBe(false);

    const htmlFile = createMockFile("page.html", "text/plain", 1000);
    expect(validateFile(htmlFile).valid).toBe(false);
  });

  it("accepts files at exactly max size", () => {
    const maxSizeFile = createMockFile("max.jpg", "image/jpeg", MAX_FILE_SIZE);
    expect(validateFile(maxSizeFile).valid).toBe(true);
  });
});

describe("ALLOWED_FILE_TYPES constant", () => {
  it("includes common image types", () => {
    expect(ALLOWED_FILE_TYPES).toContain("image/jpeg");
    expect(ALLOWED_FILE_TYPES).toContain("image/png");
    expect(ALLOWED_FILE_TYPES).toContain("image/gif");
    expect(ALLOWED_FILE_TYPES).toContain("image/webp");
    expect(ALLOWED_FILE_TYPES).toContain("image/svg+xml");
  });

  it("includes document types", () => {
    expect(ALLOWED_FILE_TYPES).toContain("application/pdf");
    expect(ALLOWED_FILE_TYPES).toContain("application/msword");
    expect(ALLOWED_FILE_TYPES).toContain("text/plain");
    expect(ALLOWED_FILE_TYPES).toContain("text/csv");
  });

  it("includes archive types", () => {
    expect(ALLOWED_FILE_TYPES).toContain("application/zip");
    expect(ALLOWED_FILE_TYPES).toContain("application/x-rar-compressed");
  });
});

describe("MAX_FILE_SIZE constant", () => {
  it("is 50MB", () => {
    expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
  });
});
