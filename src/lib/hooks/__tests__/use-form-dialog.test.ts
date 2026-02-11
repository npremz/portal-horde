import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFormDialog } from "../use-form-dialog";

interface TestData {
  name: string;
  email: string;
}

const defaultInitialData: TestData = { name: "", email: "" };

function setup(options?: {
  initialData?: TestData;
  onOpenChange?: (open: boolean) => void;
  isDirty?: (current: TestData, initial: TestData) => boolean;
}) {
  return renderHook(() =>
    useFormDialog<TestData>({
      initialData: options?.initialData ?? defaultInitialData,
      onOpenChange: options?.onOpenChange,
      isDirty: options?.isDirty,
    })
  );
}

describe("useFormDialog", () => {
  describe("initial state", () => {
    it("has empty errors", () => {
      const { result } = setup();
      expect(result.current.errors).toEqual({});
    });

    it("has loading false", () => {
      const { result } = setup();
      expect(result.current.loading).toBe(false);
    });

    it("has showCloseConfirm false", () => {
      const { result } = setup();
      expect(result.current.showCloseConfirm).toBe(false);
    });
  });

  describe("clearError", () => {
    it("removes a specific error", () => {
      const { result } = setup();

      act(() => {
        result.current.setErrors({ name: "Requis", email: "Invalide" });
      });

      expect(result.current.errors).toEqual({ name: "Requis", email: "Invalide" });

      act(() => {
        result.current.clearError("name");
      });

      expect(result.current.errors).toEqual({ email: "Invalide" });
    });

    it("does nothing when clearing non-existent error", () => {
      const { result } = setup();

      act(() => {
        result.current.setErrors({ name: "Requis" });
      });

      const errorsBefore = result.current.errors;

      act(() => {
        result.current.clearError("nonexistent");
      });

      // Same reference (no re-render) since there was no change
      expect(result.current.errors).toBe(errorsBefore);
    });
  });

  describe("setErrors", () => {
    it("updates errors state", () => {
      const { result } = setup();

      act(() => {
        result.current.setErrors({ name: "Le nom est requis" });
      });

      expect(result.current.errors).toEqual({ name: "Le nom est requis" });
    });
  });

  describe("isDirty", () => {
    it("returns false when data matches initial data", () => {
      const { result } = setup({ initialData: { name: "Jean", email: "jean@test.com" } });

      expect(result.current.isDirty({ name: "Jean", email: "jean@test.com" })).toBe(false);
    });

    it("returns true when data differs from initial data", () => {
      const { result } = setup({ initialData: { name: "Jean", email: "jean@test.com" } });

      expect(result.current.isDirty({ name: "Pierre", email: "jean@test.com" })).toBe(true);
    });

    it("uses custom isDirty function when provided", () => {
      const customIsDirty = vi.fn().mockReturnValue(true);
      const { result } = setup({ isDirty: customIsDirty });

      const currentData = { name: "", email: "" };
      const dirty = result.current.isDirty(currentData);

      expect(dirty).toBe(true);
      expect(customIsDirty).toHaveBeenCalledWith(currentData, defaultInitialData);
    });
  });

  describe("handleOpenChange", () => {
    it("shows close confirmation when dirty and closing", () => {
      const onOpenChange = vi.fn();
      const { result } = setup({ onOpenChange });

      // Data is different from initial -> dirty
      act(() => {
        result.current.handleOpenChange(false, { name: "Modified", email: "" });
      });

      expect(result.current.showCloseConfirm).toBe(true);
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it("closes directly when not dirty", () => {
      const onOpenChange = vi.fn();
      const { result } = setup({ onOpenChange });

      act(() => {
        result.current.handleOpenChange(false, defaultInitialData);
      });

      expect(result.current.showCloseConfirm).toBe(false);
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it("opens dialog without checking dirty state", () => {
      const onOpenChange = vi.fn();
      const { result } = setup({ onOpenChange });

      act(() => {
        result.current.handleOpenChange(true, { name: "Modified", email: "" });
      });

      expect(result.current.showCloseConfirm).toBe(false);
      expect(onOpenChange).toHaveBeenCalledWith(true);
    });
  });

  describe("confirmClose", () => {
    it("calls onOpenChange(false) and resets form", () => {
      const onOpenChange = vi.fn();
      const { result } = setup({ onOpenChange });

      // Set some state
      act(() => {
        result.current.setErrors({ name: "Error" });
        result.current.setLoading(true);
        result.current.setShowCloseConfirm(true);
      });

      act(() => {
        result.current.confirmClose();
      });

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(result.current.errors).toEqual({});
      expect(result.current.loading).toBe(false);
      expect(result.current.showCloseConfirm).toBe(false);
    });
  });

  describe("cancelClose", () => {
    it("hides close confirmation but keeps dialog open", () => {
      const onOpenChange = vi.fn();
      const { result } = setup({ onOpenChange });

      act(() => {
        result.current.setShowCloseConfirm(true);
      });

      act(() => {
        result.current.cancelClose();
      });

      expect(result.current.showCloseConfirm).toBe(false);
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe("resetForm", () => {
    it("resets errors, loading, and showCloseConfirm", () => {
      const { result } = setup();

      act(() => {
        result.current.setErrors({ name: "Error" });
        result.current.setLoading(true);
        result.current.setShowCloseConfirm(true);
      });

      act(() => {
        result.current.resetForm();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.loading).toBe(false);
      expect(result.current.showCloseConfirm).toBe(false);
    });
  });

  describe("setInitialData", () => {
    it("updates the reference data for isDirty comparison", () => {
      const { result } = setup();

      // Initially dirty compared to default
      expect(result.current.isDirty({ name: "Jean", email: "" })).toBe(true);

      // Update initial data
      act(() => {
        result.current.setInitialData({ name: "Jean", email: "" });
      });

      // Now it matches the new initial data
      expect(result.current.isDirty({ name: "Jean", email: "" })).toBe(false);

      // But different data is still dirty
      expect(result.current.isDirty({ name: "Pierre", email: "" })).toBe(true);
    });
  });
});
