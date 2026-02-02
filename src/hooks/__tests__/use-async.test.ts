import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAsync, useFetch } from "../use-async";
import { ErrorCode } from "@/lib/errors";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe("useAsync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with correct state", () => {
    const { result } = renderHook(() => useAsync());

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it("handles successful execution", async () => {
    const { result } = renderHook(() => useAsync<string>());
    const mockFn = vi.fn().mockResolvedValue("success data");

    await act(async () => {
      await result.current.execute(mockFn);
    });

    expect(result.current.data).toBe("success data");
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isError).toBe(false);
  });

  it("handles error execution", async () => {
    const { toast } = await import("sonner");
    const { result } = renderHook(() => useAsync<string>());
    const mockFn = vi.fn().mockRejectedValue(new Error("Test error"));

    await act(async () => {
      try {
        await result.current.execute(mockFn);
      } catch {
        // Expected
      }
    });

    expect(result.current.error).toBeDefined();
    expect(result.current.error?.code).toBe(ErrorCode.UNKNOWN);
    expect(result.current.isError).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(toast.error).toHaveBeenCalled();
  });

  it("parses API error response format", async () => {
    const { result } = renderHook(() => useAsync<string>({ showErrorToast: false }));
    const apiError = {
      error: {
        code: ErrorCode.NOT_FOUND,
        message: "Ressource introuvable",
        requestId: "req_123",
      },
    };
    const mockFn = vi.fn().mockRejectedValue(apiError);

    await act(async () => {
      try {
        await result.current.execute(mockFn);
      } catch {
        // Expected
      }
    });

    expect(result.current.error?.code).toBe(ErrorCode.NOT_FOUND);
    expect(result.current.error?.message).toBe("Ressource introuvable");
    expect(result.current.error?.requestId).toBe("req_123");
  });

  it("calls onSuccess callback", async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useAsync<string>({ onSuccess }));
    const mockFn = vi.fn().mockResolvedValue("data");

    await act(async () => {
      await result.current.execute(mockFn);
    });

    expect(onSuccess).toHaveBeenCalledWith("data");
  });

  it("calls onError callback", async () => {
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useAsync<string>({ onError, showErrorToast: false })
    );
    const mockFn = vi.fn().mockRejectedValue(new Error("fail"));

    await act(async () => {
      try {
        await result.current.execute(mockFn);
      } catch {
        // Expected
      }
    });

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0].code).toBe(ErrorCode.UNKNOWN);
  });

  it("retries on failure with exponential backoff", async () => {
    vi.useFakeTimers();
    const mockFn = vi.fn().mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() =>
      useAsync<string>({ retryCount: 2, retryDelay: 100, showErrorToast: false })
    );

    const executePromise = act(async () => {
      try {
        await result.current.execute(mockFn);
      } catch {
        // Expected
      }
    });

    // Advance timers for retries
    await vi.advanceTimersByTimeAsync(100); // First retry
    await vi.advanceTimersByTimeAsync(200); // Second retry (exponential)
    await executePromise;

    expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    vi.useRealTimers();
  });

  it("succeeds on retry", async () => {
    vi.useFakeTimers();
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValueOnce("success");

    const { result } = renderHook(() =>
      useAsync<string>({ retryCount: 1, retryDelay: 100, showErrorToast: false })
    );

    const executePromise = act(async () => {
      await result.current.execute(mockFn);
    });

    await vi.advanceTimersByTimeAsync(100);
    await executePromise;

    expect(result.current.data).toBe("success");
    expect(result.current.isSuccess).toBe(true);
    vi.useRealTimers();
  });

  it("resets state correctly", async () => {
    const { result } = renderHook(() => useAsync<string>());
    const mockFn = vi.fn().mockResolvedValue("data");

    await act(async () => {
      await result.current.execute(mockFn);
    });

    expect(result.current.data).toBe("data");

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isSuccess).toBe(false);
  });

  it("shows loading state during execution", async () => {
    const { result } = renderHook(() => useAsync<string>());
    let resolvePromise: (value: string) => void;
    const mockFn = vi.fn().mockImplementation(
      () =>
        new Promise<string>((resolve) => {
          resolvePromise = resolve;
        })
    );

    act(() => {
      result.current.execute(mockFn);
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise!("done");
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("does not show toast when showErrorToast is false", async () => {
    const { toast } = await import("sonner");
    const { result } = renderHook(() =>
      useAsync<string>({ showErrorToast: false })
    );
    const mockFn = vi.fn().mockRejectedValue(new Error("fail"));

    await act(async () => {
      try {
        await result.current.execute(mockFn);
      } catch {
        // Expected
      }
    });

    expect(toast.error).not.toHaveBeenCalled();
  });
});

describe("useFetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("fetches data successfully", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ data: { id: 1, name: "Test" } }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const { result } = renderHook(() => useFetch<{ id: number; name: string }>());

    await act(async () => {
      await result.current.fetch("/api/test");
    });

    expect(result.current.data).toEqual({ id: 1, name: "Test" });
    expect(result.current.isSuccess).toBe(true);
  });

  it("handles fetch error response", async () => {
    const mockResponse = {
      ok: false,
      json: vi.fn().mockResolvedValue({
        error: { code: "NOT_FOUND", message: "Not found" },
      }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const { result } = renderHook(() =>
      useFetch<unknown>({ showErrorToast: false })
    );

    await act(async () => {
      try {
        await result.current.fetch("/api/test");
      } catch {
        // Expected
      }
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error?.code).toBe("NOT_FOUND");
  });

  it("sets Content-Type header", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ data: {} }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const { result } = renderHook(() => useFetch());

    await act(async () => {
      await result.current.fetch("/api/test");
    });

    expect(fetch).toHaveBeenCalledWith("/api/test", {
      headers: { "Content-Type": "application/json" },
    });
  });

  it("handles direct response format without data wrapper", async () => {
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({ id: 1, name: "Direct" }),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const { result } = renderHook(() => useFetch<{ id: number; name: string }>());

    await act(async () => {
      await result.current.fetch("/api/test");
    });

    expect(result.current.data).toEqual({ id: 1, name: "Direct" });
  });

  it("uses custom parseResponse when provided", async () => {
    const mockResponse = {
      ok: true,
      text: vi.fn().mockResolvedValue("custom"),
    };
    vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);

    const parseResponse = vi.fn().mockResolvedValue("parsed");
    const { result } = renderHook(() => useFetch<string>({ parseResponse }));

    await act(async () => {
      await result.current.fetch("/api/test");
    });

    expect(parseResponse).toHaveBeenCalled();
    expect(result.current.data).toBe("parsed");
  });
});
