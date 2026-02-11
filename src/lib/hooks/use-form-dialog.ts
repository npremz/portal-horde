import { useState, useCallback, useRef } from "react";

interface UseFormDialogOptions<T> {
  initialData: T;
  onOpenChange?: (open: boolean) => void;
  /** Custom dirty check. Falls back to JSON.stringify comparison if not provided. */
  isDirty?: (currentData: T, initialData: T) => boolean;
}

interface UseFormDialogReturn<T> {
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  clearError: (field: string) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  showCloseConfirm: boolean;
  setShowCloseConfirm: (show: boolean) => void;
  handleOpenChange: (open: boolean, currentData: T) => void;
  confirmClose: () => void;
  cancelClose: () => void;
  isDirty: (currentData: T) => boolean;
  resetForm: () => void;
  /** Update the initial data reference (useful for edit mode). */
  setInitialData: (data: T) => void;
}

export function useFormDialog<T>({
  initialData,
  onOpenChange,
  isDirty: customIsDirty,
}: UseFormDialogOptions<T>): UseFormDialogReturn<T> {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const initialDataRef = useRef<T>(initialData);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const isDirty = useCallback(
    (currentData: T) => {
      if (customIsDirty) {
        return customIsDirty(currentData, initialDataRef.current);
      }
      return JSON.stringify(currentData) !== JSON.stringify(initialDataRef.current);
    },
    [customIsDirty]
  );

  const resetForm = useCallback(() => {
    setErrors({});
    setLoading(false);
    setShowCloseConfirm(false);
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean, currentData: T) => {
      if (!newOpen && isDirty(currentData)) {
        setShowCloseConfirm(true);
        return;
      }
      if (!newOpen) {
        resetForm();
      }
      onOpenChange?.(newOpen);
    },
    [isDirty, onOpenChange, resetForm]
  );

  const confirmClose = useCallback(() => {
    setShowCloseConfirm(false);
    resetForm();
    onOpenChange?.(false);
  }, [onOpenChange, resetForm]);

  const cancelClose = useCallback(() => {
    setShowCloseConfirm(false);
  }, []);

  const setInitialData = useCallback((data: T) => {
    initialDataRef.current = data;
  }, []);

  return {
    errors,
    setErrors,
    clearError,
    loading,
    setLoading,
    showCloseConfirm,
    setShowCloseConfirm,
    handleOpenChange,
    confirmClose,
    cancelClose,
    isDirty,
    resetForm,
    setInitialData,
  };
}
