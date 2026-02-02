import { http, HttpResponse } from "msw";
import type { DashboardStats } from "@/app/api/dashboard/stats/route";

// Mock dashboard stats data
export const mockDashboardStats: DashboardStats = {
  totalClients: 25,
  activePipeline: 8,
  activeProjects: 5,
  pendingFollowups: 3,
  clientsByStatus: [
    { status: "lead", count: 5 },
    { status: "contacted", count: 3 },
    { status: "in_project", count: 10 },
    { status: "pending_review", count: 2 },
    { status: "completed", count: 4 },
    { status: "archived", count: 1 },
  ],
  projectsByStatus: [
    { status: "active", count: 5 },
    { status: "paused", count: 2 },
    { status: "completed", count: 8 },
    { status: "archived", count: 3 },
  ],
  activityByDay: [
    { date: "2026-01-01", messages: 2, actions: 5 },
    { date: "2026-01-02", messages: 3, actions: 8 },
  ],
  clientsToFollowup: [
    { id: "1", name: "Client A", status: "contacted", next_followup_date: "2026-01-01" },
    { id: "2", name: "Client B", status: "lead", next_followup_date: "2026-01-02" },
  ],
  recentProjects: [
    { id: "p1", name: "Projet Web", status: "active", client_name: "Client A", progress: 60 },
    { id: "p2", name: "Projet Mobile", status: "active", client_name: "Client B", progress: 30 },
  ],
  conversionRate: 56,
  monthlyMessages: 15,
  pendingDeliverables: 4,
  newClientsLast30Days: 7,
};

export const handlers = [
  // Dashboard stats API
  http.get("/api/dashboard/stats", () => {
    return HttpResponse.json(mockDashboardStats);
  }),

  // Users API - POST (create user)
  http.post("/api/users", async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;

    if (!body.email || !body.full_name || !body.role) {
      return HttpResponse.json({ error: "Email, nom et role requis" }, { status: 400 });
    }

    if (!["client", "editor", "admin"].includes(body.role as string)) {
      return HttpResponse.json({ error: "Role invalide" }, { status: 400 });
    }

    return HttpResponse.json({
      success: true,
      user: {
        id: "new-user-123",
        email: body.email,
        full_name: body.full_name,
        role: body.role,
        company: body.company || null,
      },
    });
  }),

  // Contact form API
  http.post("/api/contact", async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;

    if (!body.name || !body.email || !body.category || !body.subject || !body.message) {
      return HttpResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    return HttpResponse.json({ success: true });
  }),
];
