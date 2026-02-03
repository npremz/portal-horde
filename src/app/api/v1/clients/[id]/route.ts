import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateApiKey,
  hasApiPermission,
  extractApiKey,
} from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { updateClientSchema } from "@/lib/api/schemas";

/**
 * GET /api/v1/clients/:id
 * Get client details with contacts
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

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select(`
      id, name, email, phone, website, status, notes, project_type, sector, socials,
      client_contacts (id, name, email, phone, role, is_primary)
    `)
    .eq("id", id)
    .single();

  if (error || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Minimal response format (omit null fields)
  const response: Record<string, unknown> = {
    id: client.id,
    name: client.name,
    email: client.email,
    status: client.status,
  };

  if (client.phone) response.phone = client.phone;
  if (client.website) response.website = client.website;
  if (client.notes) response.notes = client.notes;
  if (client.project_type) response.project_type = client.project_type;
  if (client.sector) response.sector = client.sector;
  if (client.socials && Object.keys(client.socials).length > 0) {
    response.socials = client.socials;
  }

  if (client.client_contacts && client.client_contacts.length > 0) {
    response.contacts = client.client_contacts.map((c) => {
      const contact: Record<string, unknown> = {
        id: c.id,
        name: c.name,
        role: c.role,
      };
      if (c.email) contact.email = c.email;
      if (c.phone) contact.phone = c.phone;
      if (c.is_primary) contact.is_primary = true;
      return contact;
    });
  }

  return NextResponse.json(response);
}

/**
 * PATCH /api/v1/clients/:id
 * Update client
 * Required permission: clients:write
 */
export async function PATCH(
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

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return NextResponse.json(
      { error: `${firstError.path.join(".")}: ${firstError.message}` },
      { status: 400 }
    );
  }

  // Filter out undefined values to only update provided fields
  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) {
      updates[key] = value;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", id)
    .select("id, name, email, status")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Client with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

/**
 * DELETE /api/v1/clients/:id
 * Delete client
 * Required permission: clients:delete
 */
export async function DELETE(
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

  if (!hasApiPermission(auth.permissions, "clients:delete")) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("clients").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
