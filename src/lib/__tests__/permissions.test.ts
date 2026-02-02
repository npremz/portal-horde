import { describe, it, expect } from "vitest";
import { hasPermission, canAccessAdmin, type Permission } from "../permissions";
import type { UserRole } from "@/types/database";

describe("hasPermission", () => {
  describe("client role", () => {
    it("has no permissions", () => {
      const permissions: Permission[] = [
        "clients.view",
        "clients.edit",
        "clients.delete",
        "contacts.manage",
        "messages.view",
        "messages.send",
        "clients.invite",
        "projects.manage",
        "users.manage",
      ];

      permissions.forEach((permission) => {
        expect(hasPermission("client", permission)).toBe(false);
      });
    });
  });

  describe("editor role", () => {
    it("can view clients", () => {
      expect(hasPermission("editor", "clients.view")).toBe(true);
    });

    it("can edit clients", () => {
      expect(hasPermission("editor", "clients.edit")).toBe(true);
    });

    it("cannot delete clients", () => {
      expect(hasPermission("editor", "clients.delete")).toBe(false);
    });

    it("can manage contacts", () => {
      expect(hasPermission("editor", "contacts.manage")).toBe(true);
    });

    it("can view messages", () => {
      expect(hasPermission("editor", "messages.view")).toBe(true);
    });

    it("cannot send messages", () => {
      expect(hasPermission("editor", "messages.send")).toBe(false);
    });

    it("cannot invite clients", () => {
      expect(hasPermission("editor", "clients.invite")).toBe(false);
    });

    it("cannot manage projects", () => {
      expect(hasPermission("editor", "projects.manage")).toBe(false);
    });

    it("cannot manage users", () => {
      expect(hasPermission("editor", "users.manage")).toBe(false);
    });
  });

  describe("admin role", () => {
    it("has all permissions", () => {
      const permissions: Permission[] = [
        "clients.view",
        "clients.edit",
        "clients.delete",
        "contacts.manage",
        "messages.view",
        "messages.send",
        "clients.invite",
        "projects.manage",
        "users.manage",
      ];

      permissions.forEach((permission) => {
        expect(hasPermission("admin", permission)).toBe(true);
      });
    });
  });

  describe("edge cases", () => {
    it("returns false for undefined role", () => {
      expect(hasPermission(undefined, "clients.view")).toBe(false);
    });

    it("returns false for null role (typed as undefined)", () => {
      expect(hasPermission(null as unknown as UserRole, "clients.view")).toBe(false);
    });

    it("returns false for invalid role", () => {
      expect(hasPermission("invalid" as UserRole, "clients.view")).toBe(false);
    });
  });
});

describe("canAccessAdmin", () => {
  it("returns false for client role", () => {
    expect(canAccessAdmin("client")).toBe(false);
  });

  it("returns true for editor role", () => {
    expect(canAccessAdmin("editor")).toBe(true);
  });

  it("returns true for admin role", () => {
    expect(canAccessAdmin("admin")).toBe(true);
  });

  it("returns false for undefined role", () => {
    expect(canAccessAdmin(undefined)).toBe(false);
  });

  it("returns false for null role (typed as undefined)", () => {
    expect(canAccessAdmin(null as unknown as UserRole)).toBe(false);
  });

  it("returns false for invalid role", () => {
    expect(canAccessAdmin("invalid" as UserRole)).toBe(false);
  });
});
