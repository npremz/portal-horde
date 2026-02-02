import type { Profile } from "@/types/database";

export const mockUsers: Profile[] = [
  {
    id: "user-admin",
    email: "admin@horde.com",
    full_name: "Admin User",
    avatar_url: null,
    company: "Horde Agence",
    role: "admin",
    created_at: "2025-01-01T10:00:00Z",
  },
  {
    id: "user-editor",
    email: "editor@horde.com",
    full_name: "Editor User",
    avatar_url: null,
    company: "Horde Agence",
    role: "editor",
    created_at: "2025-02-01T10:00:00Z",
  },
  {
    id: "user-client",
    email: "client@acme.com",
    full_name: "Client User",
    avatar_url: null,
    company: "Acme Corp",
    role: "client",
    created_at: "2025-06-01T10:00:00Z",
  },
];

export const adminUser = mockUsers[0];
export const editorUser = mockUsers[1];
export const clientUser = mockUsers[2];
