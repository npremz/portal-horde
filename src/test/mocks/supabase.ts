import { vi } from "vitest";
import type { UserRole } from "@/types/database";

// Mock user data
export const mockAdminUser = {
  id: "admin-user-id",
  email: "admin@horde.com",
  role: "admin" as UserRole,
};

export const mockEditorUser = {
  id: "editor-user-id",
  email: "editor@horde.com",
  role: "editor" as UserRole,
};

export const mockClientUser = {
  id: "client-user-id",
  email: "client@example.com",
  role: "client" as UserRole,
};

// Create mock query builder
export function createMockQueryBuilder(data: unknown = null, error: unknown = null) {
  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: (value: { data: unknown; error: unknown }) => void) => {
      resolve({ data, error });
      return Promise.resolve({ data, error });
    },
  };
  return queryBuilder;
}

// Create mock Supabase client
export function createMockSupabaseClient(options: {
  user?: { id: string; email: string } | null;
  profile?: { role: UserRole } | null;
  additionalMocks?: Record<string, unknown>;
} = {}) {
  const { user = mockAdminUser, profile = { role: "admin" } } = options;

  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user },
      error: null,
    }),
    admin: {
      listUsers: vi.fn().mockResolvedValue({
        data: { users: [] },
        error: null,
      }),
      createUser: vi.fn().mockResolvedValue({
        data: { user: { id: "new-user-id", email: "new@example.com" } },
        error: null,
      }),
      inviteUserByEmail: vi.fn().mockResolvedValue({
        data: { user: { id: "invited-user-id", email: "invited@example.com" } },
        error: null,
      }),
      deleteUser: vi.fn().mockResolvedValue({ error: null }),
    },
  };

  const mockFrom = vi.fn((table: string) => {
    if (table === "profiles") {
      return createMockQueryBuilder(profile);
    }
    return createMockQueryBuilder(null);
  });

  return {
    auth: mockAuth,
    from: mockFrom,
  };
}

// Create mock admin client
export function createMockAdminClient() {
  return createMockSupabaseClient({ user: null });
}
