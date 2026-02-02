import { createAdminClient } from "@/lib/supabase/admin";
import { createHash, randomBytes } from "crypto";
import type { ApiPermission } from "@/types/database";

export interface ApiKeyAuth {
  valid: boolean;
  profileId?: string;
  permissions?: ApiPermission[];
  keyId?: string;
  error?: string;
}

const API_KEY_PREFIX = "horde_";

/**
 * Generate a new API key
 * Returns: { key: "horde_xxxxx", hash: "sha256hash", prefix: "horde_xx" }
 */
export function generateApiKey(): {
  key: string;
  hash: string;
  prefix: string;
} {
  // Generate 32 random bytes and convert to base62
  const randomPart = randomBytes(24).toString("base64url");
  const key = `${API_KEY_PREFIX}${randomPart}`;
  const hash = hashApiKey(key);
  const prefix = `${API_KEY_PREFIX}${randomPart.substring(0, 4)}`;

  return { key, hash, prefix };
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Validate an API key and return auth info
 */
export async function validateApiKey(key: string): Promise<ApiKeyAuth> {
  if (!key || !key.startsWith(API_KEY_PREFIX)) {
    return { valid: false, error: "Invalid API key format" };
  }

  const hash = hashApiKey(key);
  const supabase = createAdminClient();

  const { data: apiKey, error } = await supabase
    .from("api_keys")
    .select("id, profile_id, permissions, is_active, expires_at")
    .eq("key_hash", hash)
    .single();

  if (error || !apiKey) {
    return { valid: false, error: "Invalid API key" };
  }

  if (!apiKey.is_active) {
    return { valid: false, error: "API key is disabled" };
  }

  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    return { valid: false, error: "API key has expired" };
  }

  // Update last_used_at asynchronously (don't wait)
  supabase.rpc("update_api_key_last_used", { key_hash_param: hash }).then();

  return {
    valid: true,
    profileId: apiKey.profile_id,
    permissions: apiKey.permissions as ApiPermission[],
    keyId: apiKey.id,
  };
}

/**
 * Check if permissions array includes the required permission
 */
export function hasApiPermission(
  permissions: ApiPermission[] | undefined,
  required: ApiPermission
): boolean {
  if (!permissions) return false;
  return permissions.includes(required);
}

/**
 * Extract API key from Authorization header
 * Expects: "Bearer horde_xxxxx"
 */
export function extractApiKey(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  if (!parts[1].startsWith(API_KEY_PREFIX)) return null;
  return parts[1];
}

/**
 * All available API permissions with descriptions
 */
export const API_PERMISSIONS: {
  value: ApiPermission;
  label: string;
  description: string;
}[] = [
  {
    value: "clients:read",
    label: "Lire clients",
    description: "Accès en lecture aux clients et contacts",
  },
  {
    value: "clients:write",
    label: "Modifier clients",
    description: "Créer et modifier clients et contacts",
  },
  {
    value: "clients:delete",
    label: "Supprimer clients",
    description: "Supprimer clients et contacts",
  },
  {
    value: "messages:send",
    label: "Envoyer messages",
    description: "Envoyer des messages de prospection",
  },
  {
    value: "stats:read",
    label: "Lire statistiques",
    description: "Accès aux statistiques du dashboard",
  },
];
