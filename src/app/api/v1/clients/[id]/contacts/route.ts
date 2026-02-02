import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateApiKey,
  hasApiPermission,
  extractApiKey,
} from "@/lib/api-auth";
import { NextResponse } from "next/server";

/**
 * GET /api/v1/clients/:id/contacts
 * List contacts for a client
 * Required permission: clients:read
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = extractApiKey(request.headers.get("Authorization"));
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!hasApiPermission(auth.permissions, "clients:read")) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const { id: clientId } = await params;
  const supabase = createAdminClient();

  // Verify client exists
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("client_contacts")
    .select("id, name, email, phone, role, is_primary, notes")
    .eq("client_id", clientId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Minimal response format
  return NextResponse.json({
    data: data?.map((c) => {
      const contact: Record<string, unknown> = {
        id: c.id,
        name: c.name,
        role: c.role,
      };
      if (c.email) contact.email = c.email;
      if (c.phone) contact.phone = c.phone;
      if (c.is_primary) contact.is_primary = true;
      if (c.notes) contact.notes = c.notes;
      return contact;
    }),
  });
}

/**
 * POST /api/v1/clients/:id/contacts
 * Create a contact for a client
 * Required permission: clients:write
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiKey = extractApiKey(request.headers.get("Authorization"));
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 401 });
  }

  const auth = await validateApiKey(apiKey);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  if (!hasApiPermission(auth.permissions, "clients:write")) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const { id: clientId } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, phone, role, is_primary, notes } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify client exists
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .single();

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("client_contacts")
    .insert({
      client_id: clientId,
      name,
      email: email || null,
      phone: phone || null,
      role: role || "other",
      is_primary: is_primary || false,
      notes: notes || null,
    })
    .select("id, name, role")
    .single();

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
