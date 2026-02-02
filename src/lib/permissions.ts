import type { UserRole } from "@/types/database";

export type Permission =
  | "clients.view"
  | "clients.edit"
  | "clients.delete"
  | "contacts.manage"
  | "messages.view"
  | "messages.send"
  | "clients.invite"
  | "projects.manage"
  | "users.manage";

const rolePermissions: Record<UserRole, Permission[]> = {
  client: [],
  editor: [
    "clients.view",
    "clients.edit",
    "contacts.manage",
    "messages.view",
  ],
  admin: [
    "clients.view",
    "clients.edit",
    "clients.delete",
    "contacts.manage",
    "messages.view",
    "messages.send",
    "clients.invite",
    "projects.manage",
    "users.manage",
  ],
};

export function hasPermission(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function canAccessAdmin(role: UserRole | undefined): boolean {
  return role === "admin" || role === "editor";
}
