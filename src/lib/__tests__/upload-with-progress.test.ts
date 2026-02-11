import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadWithProgress } from "../upload-with-progress";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock XMLHttpRequest
class MockXHR {
  static instances: MockXHR[] = [];

  method = "";
  url = "";
  headers: Record<string, string> = {};
  readyState = 0;
  status = 0;
  upload = {
    onprogress: null as ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor() {
    MockXHR.instances.push(this);
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(key: string, value: string) {
    this.headers[key] = value;
  }

  send(_body?: unknown) {
    // Will be triggered manually in tests
  }
}

beforeEach(() => {
  MockXHR.instances = [];
  vi.stubGlobal("XMLHttpRequest", MockXHR);
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
});

function createMockSupabase(token: string | null): SupabaseClient {
  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: token ? { access_token: token } : null,
        },
      }),
    },
  } as unknown as SupabaseClient;
}

function createMockFile(name: string, type: string): File {
  return new File(["content"], name, { type });
}

describe("uploadWithProgress", () => {
  it("resolves with error when not authenticated", async () => {
    const supabase = createMockSupabase(null);
    const onProgress = vi.fn();
    const file = createMockFile("test.jpg", "image/jpeg");

    const result = await uploadWithProgress(supabase, "bucket", "path/file.jpg", file, onProgress);

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error!.message).toBe("Non authentifié");
    expect(onProgress).not.toHaveBeenCalled();
  });

  it("sends request with correct URL and headers", async () => {
    const supabase = createMockSupabase("test-token");
    const onProgress = vi.fn();
    const file = createMockFile("test.jpg", "image/jpeg");

    const promise = uploadWithProgress(supabase, "avatars", "users/photo.jpg", file, onProgress);

    // Wait for the async getSession to resolve so XHR gets created
    await vi.waitFor(() => {
      expect(MockXHR.instances).toHaveLength(1);
    });

    const xhr = MockXHR.instances[0];

    expect(xhr.method).toBe("POST");
    expect(xhr.url).toBe("https://test.supabase.co/storage/v1/object/avatars/users/photo.jpg");
    expect(xhr.headers["Authorization"]).toBe("Bearer test-token");
    expect(xhr.headers["Content-Type"]).toBe("image/jpeg");

    // Simulate successful upload
    xhr.status = 200;
    xhr.onload!();

    const result = await promise;
    expect(result.error).toBeNull();
  });

  it("calls onProgress callback during upload", async () => {
    const supabase = createMockSupabase("test-token");
    const onProgress = vi.fn();
    const file = createMockFile("test.pdf", "application/pdf");

    const promise = uploadWithProgress(supabase, "docs", "file.pdf", file, onProgress);

    await vi.waitFor(() => {
      expect(MockXHR.instances).toHaveLength(1);
    });

    const xhr = MockXHR.instances[0];

    // Simulate progress events
    xhr.upload.onprogress!({ lengthComputable: true, loaded: 500, total: 1000 });
    expect(onProgress).toHaveBeenCalledWith({ loaded: 500, total: 1000, percent: 50 });

    xhr.upload.onprogress!({ lengthComputable: true, loaded: 1000, total: 1000 });
    expect(onProgress).toHaveBeenCalledWith({ loaded: 1000, total: 1000, percent: 100 });

    // Does not call onProgress when not length computable
    onProgress.mockClear();
    xhr.upload.onprogress!({ lengthComputable: false, loaded: 0, total: 0 });
    expect(onProgress).not.toHaveBeenCalled();

    // Complete the upload
    xhr.status = 200;
    xhr.onload!();
    await promise;
  });

  it("resolves with error on HTTP error status", async () => {
    const supabase = createMockSupabase("test-token");
    const onProgress = vi.fn();
    const file = createMockFile("test.jpg", "image/jpeg");

    const promise = uploadWithProgress(supabase, "bucket", "path.jpg", file, onProgress);

    await vi.waitFor(() => {
      expect(MockXHR.instances).toHaveLength(1);
    });

    const xhr = MockXHR.instances[0];

    xhr.status = 413;
    xhr.onload!();

    const result = await promise;
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error!.message).toBe("Upload échoué (413)");
  });

  it("resolves with error on network error", async () => {
    const supabase = createMockSupabase("test-token");
    const onProgress = vi.fn();
    const file = createMockFile("test.jpg", "image/jpeg");

    const promise = uploadWithProgress(supabase, "bucket", "path.jpg", file, onProgress);

    await vi.waitFor(() => {
      expect(MockXHR.instances).toHaveLength(1);
    });

    const xhr = MockXHR.instances[0];
    xhr.onerror!();

    const result = await promise;
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error!.message).toBe("Erreur réseau lors de l'upload");
  });

  it("uses application/octet-stream when file type is empty", async () => {
    const supabase = createMockSupabase("test-token");
    const onProgress = vi.fn();
    const file = createMockFile("test.bin", "");

    const promise = uploadWithProgress(supabase, "bucket", "path.bin", file, onProgress);

    await vi.waitFor(() => {
      expect(MockXHR.instances).toHaveLength(1);
    });

    const xhr = MockXHR.instances[0];
    expect(xhr.headers["Content-Type"]).toBe("application/octet-stream");

    xhr.status = 200;
    xhr.onload!();
    await promise;
  });
});
