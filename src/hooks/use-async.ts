"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ErrorCode, ERROR_MESSAGES } from "@/lib/errors";

/**
 * Structured error type for async operations
 */
export interface AsyncError {
  code: ErrorCode;
  message: string;
  requestId?: string;
}

interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: AsyncError) => void;
  showErrorToast?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

interface AsyncState<T> {
  data: T | null;
  error: AsyncError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

/**
 * Hook for executing async functions with loading, error states, and optional retry.
 *
 * @example
 * const { execute, isLoading, error, data } = useAsync<User>({
 *   onSuccess: (user) => console.log('Created:', user),
 *   showErrorToast: true,
 *   retryCount: 2,
 * });
 *
 * const handleSubmit = () => execute(async () => {
 *   const res = await fetch('/api/users', { method: 'POST', body: ... });
 *   if (!res.ok) throw await res.json();
 *   return res.json();
 * });
 */
export function useAsync<T>(options: UseAsyncOptions<T> = {}) {
  const {
    onSuccess,
    onError,
    showErrorToast = true,
    retryCount = 0,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
  });

  const attemptRef = useRef(0);

  const parseError = (error: unknown): AsyncError => {
    // Handle API error response format
    if (
      error &&
      typeof error === "object" &&
      "error" in error &&
      typeof (error as { error: unknown }).error === "object"
    ) {
      const apiError = (error as { error: { code?: string; message?: string; requestId?: string } })
        .error;
      return {
        code: (apiError.code as ErrorCode) || ErrorCode.UNKNOWN,
        message: apiError.message || ERROR_MESSAGES[ErrorCode.UNKNOWN],
        requestId: apiError.requestId,
      };
    }

    // Handle Error objects
    if (error instanceof Error) {
      // Check for network errors
      if (error.message.includes("fetch") || error.message.includes("network")) {
        return {
          code: ErrorCode.NETWORK_ERROR,
          message: ERROR_MESSAGES[ErrorCode.NETWORK_ERROR],
        };
      }
      return {
        code: ErrorCode.UNKNOWN,
        message: error.message,
      };
    }

    // Handle string errors
    if (typeof error === "string") {
      return {
        code: ErrorCode.UNKNOWN,
        message: error,
      };
    }

    return {
      code: ErrorCode.UNKNOWN,
      message: ERROR_MESSAGES[ErrorCode.UNKNOWN],
    };
  };

  const execute = useCallback(
    async (fn: () => Promise<T>): Promise<T> => {
      setState({
        data: null,
        error: null,
        isLoading: true,
        isError: false,
        isSuccess: false,
      });

      attemptRef.current = 0;

      const attempt = async (): Promise<T> => {
        try {
          const result = await fn();

          setState({
            data: result,
            error: null,
            isLoading: false,
            isError: false,
            isSuccess: true,
          });

          onSuccess?.(result);
          return result;
        } catch (error) {
          attemptRef.current++;

          // Retry logic with exponential backoff
          if (attemptRef.current <= retryCount) {
            const delay = retryDelay * Math.pow(2, attemptRef.current - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return attempt();
          }

          const asyncError = parseError(error);

          setState({
            data: null,
            error: asyncError,
            isLoading: false,
            isError: true,
            isSuccess: false,
          });

          if (showErrorToast) {
            toast.error(asyncError.message);
          }

          onError?.(asyncError);
          throw asyncError;
        }
      };

      return attempt();
    },
    [onSuccess, onError, showErrorToast, retryCount, retryDelay]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
    });
    attemptRef.current = 0;
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

interface UseFetchOptions<T> extends UseAsyncOptions<T> {
  parseResponse?: (response: Response) => Promise<T>;
}

/**
 * Specialized hook for fetch operations with automatic JSON parsing.
 *
 * @example
 * const { fetch: fetchUsers, isLoading, data } = useFetch<User[]>();
 *
 * useEffect(() => {
 *   fetchUsers('/api/users');
 * }, []);
 */
export function useFetch<T>(options: UseFetchOptions<T> = {}) {
  const { parseResponse, ...asyncOptions } = options;

  const { execute, ...state } = useAsync<T>(asyncOptions);

  const fetchData = useCallback(
    async (url: string, init?: RequestInit): Promise<T> => {
      return execute(async () => {
        const response = await fetch(url, {
          ...init,
          headers: {
            "Content-Type": "application/json",
            ...init?.headers,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw errorData;
        }

        if (parseResponse) {
          return parseResponse(response);
        }

        const json = await response.json();
        // Handle both { data: T } and direct T response formats
        return json.data !== undefined ? json.data : json;
      });
    },
    [execute, parseResponse]
  );

  return {
    ...state,
    fetch: fetchData,
  };
}
