import { describe, it, expect } from "vitest";
import { cn, getFileIcon, formatFileSize, formatDate } from "../utils";
import { FileText, ImageIcon, File } from "lucide-react";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    expect(cn("foo", true && "bar", "baz")).toBe("foo bar baz");
  });

  it("merges Tailwind classes correctly", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles arrays of classes", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles objects", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
    expect(cn(null, undefined, "foo")).toBe("foo");
  });

  it("handles complex Tailwind merge scenarios", () => {
    const result = cn("px-2 py-1 bg-red-500 hover:bg-red-700", "py-2 bg-blue-500");
    // Verify key merges happened (py-1 replaced by py-2, bg-red-500 replaced by bg-blue-500)
    expect(result).toContain("px-2");
    expect(result).toContain("py-2");
    expect(result).not.toContain("py-1");
    expect(result).toContain("bg-blue-500");
    expect(result).not.toContain("bg-red-500");
    expect(result).toContain("hover:bg-red-700");
  });
});

describe("getFileIcon", () => {
  it("returns ImageIcon for image MIME types", () => {
    expect(getFileIcon("image/jpeg")).toBe(ImageIcon);
    expect(getFileIcon("image/png")).toBe(ImageIcon);
    expect(getFileIcon("image/gif")).toBe(ImageIcon);
    expect(getFileIcon("image/webp")).toBe(ImageIcon);
    expect(getFileIcon("image/svg+xml")).toBe(ImageIcon);
  });

  it("returns FileText for PDF", () => {
    expect(getFileIcon("application/pdf")).toBe(FileText);
  });

  it("returns File for other types", () => {
    expect(getFileIcon("application/zip")).toBe(File);
    expect(getFileIcon("text/plain")).toBe(File);
    expect(getFileIcon("application/msword")).toBe(File);
  });

  it("returns File for null MIME type", () => {
    expect(getFileIcon(null)).toBe(File);
  });

  it("returns File for unknown MIME type", () => {
    expect(getFileIcon("application/unknown")).toBe(File);
  });
});

describe("formatFileSize", () => {
  it("returns dash for null", () => {
    expect(formatFileSize(null)).toBe("—");
  });

  it("returns dash for zero", () => {
    expect(formatFileSize(0)).toBe("—");
  });

  it("formats bytes", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(1023)).toBe("1023 B");
  });

  it("formats kilobytes", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(10240)).toBe("10.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatFileSize(1048576)).toBe("1.0 MB");
    expect(formatFileSize(1572864)).toBe("1.5 MB");
    expect(formatFileSize(52428800)).toBe("50.0 MB");
  });
});

describe("formatDate", () => {
  it("formats date in French Belgian locale", () => {
    const result = formatDate("2026-01-15T14:30:00Z");
    // Result will depend on timezone, but should contain day and month
    expect(result).toContain("15");
    expect(result).toContain("janv");
  });

  it("includes time by default", () => {
    const result = formatDate("2026-01-15T14:30:00Z");
    // Should contain hour:minute format
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it("accepts custom options", () => {
    const result = formatDate("2026-01-15T14:30:00Z", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: undefined,
      minute: undefined,
    });
    expect(result).toContain("2026");
    expect(result).toContain("janvier");
  });

  it("handles different dates", () => {
    expect(formatDate("2026-06-20T10:00:00Z")).toContain("20");
    expect(formatDate("2026-12-25T08:00:00Z")).toContain("25");
  });
});
