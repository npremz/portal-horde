import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApiKey } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import type { ApiPermission } from "@/types/database";

/**
 * GET /api/api-keys
 * List all API keys (admin only)
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("api_keys")
      .select(`
        id, name, key_prefix, permissions, is_active, expires_at, last_used_at, created_at,
        profile:profiles(id, full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching API keys:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("API keys list error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

/**
 * POST /api/api-keys
 * Create a new API key (admin only)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { name, permissions, expires_at } = body as {
      name: string;
      permissions: ApiPermission[];
      expires_at?: string;
    };

    if (!name || !permissions || permissions.length === 0) {
      return NextResponse.json(
        { error: "name et permissions sont requis" },
        { status: 400 }
      );
    }

    // Generate the API key
    const { key, hash, prefix } = generateApiKey();

    const adminClient = createAdminClient();

    const { data, error } = await adminClient
      .from("api_keys")
      .insert({
        profile_id: user.id,
        name,
        key_hash: hash,
        key_prefix: prefix,
        permissions,
        expires_at: expires_at || null,
      })
      .select("id, name, key_prefix, permissions, created_at")
      .single();

    if (error) {
      console.error("Error creating API key:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Return the full key ONLY on creation (never shown again)
    return NextResponse.json(
      {
        data: {
          ...data,
          key, // Full key - show once only!
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("API key creation error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
