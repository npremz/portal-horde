import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateApiKey,
  hasApiPermission,
  extractApiKey,
} from "@/lib/api-auth";
import { NextResponse } from "next/server";
import type { ClientStatus, ProjectStatus } from "@/types/database";

/**
 * GET /api/v1/stats
 * Get dashboard statistics
 * Required permission: stats:read
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

  if (!hasApiPermission(auth.permissions, "stats:read")) {
    return NextResponse.json({ error: "Permission denied" }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // Execute queries in parallel
    const [clientsRes, projectsRes, messagesRes] = await Promise.all([
      supabase
        .from("clients")
        .select("id, status, next_followup_date, created_at"),
      supabase.from("projects").select("id, status"),
      supabase
        .from("client_messages")
        .select("id")
        .gte("sent_at", thirtyDaysAgo),
    ]);

    const clients = clientsRes.data || [];
    const projects = projectsRes.data || [];
    const messages = messagesRes.data || [];

    // Calculate KPIs
    const totalClients = clients.length;
    const activePipeline = clients.filter(
      (c) => c.status === "lead" || c.status === "contacted"
    ).length;
    const activeProjects = projects.filter((p) => p.status === "active").length;
    const pendingFollowups = clients.filter((c) => {
      if (!c.next_followup_date) return false;
      return c.next_followup_date <= today;
    }).length;

    // Clients by status
    const statusCounts: Record<string, number> = {};
    for (const client of clients) {
      statusCounts[client.status] = (statusCounts[client.status] || 0) + 1;
    }
    const clientsByStatus = Object.entries(statusCounts).map(
      ([status, count]) => ({
        status: status as ClientStatus,
        count,
      })
    );

    // Projects by status
    const projectStatusCounts: Record<string, number> = {};
    for (const project of projects) {
      projectStatusCounts[project.status] =
        (projectStatusCounts[project.status] || 0) + 1;
    }
    const projectsByStatus = Object.entries(projectStatusCounts).map(
      ([status, count]) => ({
        status: status as ProjectStatus,
        count,
      })
    );

    // Conversion rate
    const totalLeadsEver = clients.filter(
      (c) =>
        c.status === "lead" ||
        c.status === "contacted" ||
        c.status === "in_project" ||
        c.status === "completed"
    ).length;
    const convertedClients = clients.filter(
      (c) => c.status === "in_project" || c.status === "completed"
    ).length;
    const conversionRate =
      totalLeadsEver > 0
        ? Math.round((convertedClients / totalLeadsEver) * 100)
        : 0;

    // New clients in last 30 days
    const newClientsLast30Days = clients.filter(
      (c) => c.created_at >= thirtyDaysAgo
    ).length;

    // Minimal response format
    return NextResponse.json({
      counts: {
        clients: totalClients,
        pipeline: activePipeline,
        projects: activeProjects,
        followups: pendingFollowups,
      },
      clients_by_status: clientsByStatus,
      projects_by_status: projectsByStatus,
      metrics: {
        conversion_rate: conversionRate,
        messages_30d: messages.length,
        new_clients_30d: newClientsLast30Days,
      },
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
