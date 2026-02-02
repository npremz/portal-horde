import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateApiKey,
  hasApiPermission,
  extractApiKey,
} from "@/lib/api-auth";
import { NextResponse } from "next/server";
import type { ClientStatus } from "@/types/database";

/**
 * GET /api/v1/clients
 * List clients with pagination and filtering
 * Required permission: clients:read
 */
export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("per_page") || "20")));
  const status = searchParams.get("status") as ClientStatus | null;
  const search = searchParams.get("search");

  const supabase = createAdminClient();

  let query = supabase
    .from("clients")
    .select("id, name, email, phone, status, project_type, sector", { count: "exact" });

  if (status) {
    query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  // Minimal response format
  return NextResponse.json({
    data: data?.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      ...(c.phone && { phone: c.phone }),
      status: c.status,
      ...(c.project_type && { project_type: c.project_type }),
      ...(c.sector && { sector: c.sector }),
    })),
    meta: {
      total: count || 0,
      page,
      per_page: perPage,
    },
  });
}

/**
 * POST /api/v1/clients
 * Create a new client
 * Required permission: clients:write
 */
export async function POST(request: Request) {
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

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, phone, website, status, notes, project_type, sector, socials } = body;

  if (!name || !email) {
    return NextResponse.json(
      { error: "name and email are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      email,
      phone: phone || null,
      website: website || null,
      status: status || "lead",
      notes: notes || null,
      project_type: project_type || null,
      sector: sector || null,
      socials: socials || {},
    })
    .select("id, name, email, status")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Client with this email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
