import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Client, Project, ClientStatus, ProjectStatus } from "@/types/database";

export interface DashboardStats {
  // Counts
  totalClients: number;
  activePipeline: number;
  activeProjects: number;
  pendingFollowups: number;

  // Pipeline breakdown
  clientsByStatus: { status: ClientStatus; count: number }[];

  // Projects breakdown
  projectsByStatus: { status: ProjectStatus; count: number }[];

  // Activity (30 days)
  activityByDay: { date: string; messages: number; actions: number }[];

  // Lists
  clientsToFollowup: Pick<Client, "id" | "name" | "status" | "next_followup_date">[];
  recentProjects: (Pick<Project, "id" | "name" | "status"> & { client_name: string | null; progress: number })[];

  // Rates
  conversionRate: number;
  monthlyMessages: number;
  pendingDeliverables: number;
  newClientsLast30Days: number;
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify admin user
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

    if (profile?.role !== "admin" && profile?.role !== "editor") {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    // Execute all queries in parallel
    const [
      clientsRes,
      projectsRes,
      messagesRes,
      actionsRes,
      deliverablesRes,
    ] = await Promise.all([
      // All clients
      supabase.from("clients").select("id, name, status, next_followup_date, created_at"),
      // All projects with client info
      supabase.from("projects").select(`
        id, name, status, client_id,
        client:clients(name),
        phases(status)
      `),
      // Messages in last 30 days (grouped by day)
      supabase
        .from("client_messages")
        .select("sent_at")
        .gte("sent_at", thirtyDaysAgo),
      // Activity logs in last 30 days
      supabase
        .from("activity_logs")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo),
      // Pending deliverables
      supabase
        .from("deliverables")
        .select("id")
        .eq("status", "pending_review"),
    ]);

    const clients = clientsRes.data || [];
    const projects = projectsRes.data || [];
    const messages = messagesRes.data || [];
    const actions = actionsRes.data || [];
    const pendingDeliverables = deliverablesRes.data || [];

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
    const clientsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status: status as ClientStatus,
      count,
    }));

    // Projects by status
    const projectStatusCounts: Record<string, number> = {};
    for (const project of projects) {
      projectStatusCounts[project.status] = (projectStatusCounts[project.status] || 0) + 1;
    }
    const projectsByStatus = Object.entries(projectStatusCounts).map(([status, count]) => ({
      status: status as ProjectStatus,
      count,
    }));

    // Activity by day (last 30 days)
    const activityMap: Record<string, { messages: number; actions: number }> = {};

    // Initialize all days
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      activityMap[date] = { messages: 0, actions: 0 };
    }

    // Count messages
    for (const msg of messages) {
      const date = new Date(msg.sent_at).toISOString().split("T")[0];
      if (activityMap[date]) {
        activityMap[date].messages++;
      }
    }

    // Count actions
    for (const action of actions) {
      const date = new Date(action.created_at).toISOString().split("T")[0];
      if (activityMap[date]) {
        activityMap[date].actions++;
      }
    }

    const activityByDay = Object.entries(activityMap)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Clients to follow up (max 5)
    const clientsToFollowup = clients
      .filter((c) => c.next_followup_date && c.next_followup_date <= today)
      .sort((a, b) => (a.next_followup_date || "").localeCompare(b.next_followup_date || ""))
      .slice(0, 5)
      .map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status as ClientStatus,
        next_followup_date: c.next_followup_date,
      }));

    // Recent active projects (max 5)
    const recentProjects = projects
      .filter((p) => p.status === "active")
      .slice(0, 5)
      .map((p) => {
        // Calculate progress based on phases
        const phases = (p.phases as Array<{ status: string }>) || [];
        const totalPhases = phases.length;
        const completedPhases = phases.filter((ph) => ph.status === "completed").length;
        const progress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;

        return {
          id: p.id,
          name: p.name,
          status: p.status as ProjectStatus,
          client_name: (p.client as { name: string } | { name: string }[] | null)
            ? Array.isArray(p.client)
              ? p.client[0]?.name || null
              : (p.client as { name: string }).name
            : null,
          progress,
        };
      });

    // Conversion rate: leads that became in_project or completed
    const totalLeadsEver = clients.filter(
      (c) => c.status === "lead" || c.status === "contacted" || c.status === "in_project" || c.status === "completed"
    ).length;
    const convertedClients = clients.filter(
      (c) => c.status === "in_project" || c.status === "completed"
    ).length;
    const conversionRate = totalLeadsEver > 0
      ? Math.round((convertedClients / totalLeadsEver) * 100)
      : 0;

    // Monthly messages
    const monthlyMessages = messages.filter(
      (m) => m.sent_at >= monthStart
    ).length;

    // New clients in last 30 days
    const newClientsLast30Days = clients.filter(
      (c) => c.created_at >= thirtyDaysAgo
    ).length;

    const stats: DashboardStats = {
      totalClients,
      activePipeline,
      activeProjects,
      pendingFollowups,
      clientsByStatus,
      projectsByStatus,
      activityByDay,
      clientsToFollowup,
      recentProjects,
      conversionRate,
      monthlyMessages,
      pendingDeliverables: pendingDeliverables.length,
      newClientsLast30Days,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des statistiques" },
      { status: 500 }
    );
  }
}
