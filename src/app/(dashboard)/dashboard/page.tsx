import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  FolderKanban,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { projectStatusConfig } from "@/lib/constants";
import type { ProjectStatus } from "@/types/database";

const phaseStatusIcons = {
  pending: Clock,
  in_progress: AlertCircle,
  review: AlertCircle,
  completed: CheckCircle2,
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // Get projects based on role
  let projects;

  if (isAdmin) {
    // Admin: Get all projects with client info from clients table
    const { data } = await supabase
      .from("projects")
      .select(
        `
        *,
        client:clients!projects_client_id_fkey(id, name, email),
        phases(id, name, status, order_index)
      `
      )
      .order("updated_at", { ascending: false });
    projects = data;
  } else {
    // Client: Get projects via clients table (profile_id link)
    // First, find the client record linked to this profile
    const { data: clientRecord } = await supabase
      .from("clients")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (clientRecord) {
      const { data } = await supabase
        .from("projects")
        .select(
          `
          *,
          phases(id, name, status, order_index)
        `
        )
        .eq("client_id", clientRecord.id)
        .order("updated_at", { ascending: false });
      projects = data;
    } else {
      projects = [];
    }
  }

  // Calculate stats
  const activeProjects = projects?.filter((p) => p.status === "active").length || 0;
  const pendingReviews =
    projects?.reduce((acc, p) => {
      const reviewPhases = p.phases?.filter((ph: { status: string }) => ph.status === "review").length || 0;
      return acc + reviewPhases;
    }, 0) || 0;

  // Get current phase for each project
  const getActivePhase = (phases: { name: string; status: string; order_index: number }[] | null) => {
    if (!phases || phases.length === 0) return null;
    const sorted = [...phases].sort((a, b) => a.order_index - b.order_index);
    const inProgress = sorted.find((p) => p.status === "in_progress" || p.status === "review");
    if (inProgress) return inProgress;
    const pending = sorted.find((p) => p.status === "pending");
    return pending || sorted[sorted.length - 1];
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display uppercase">
          {isAdmin ? "Dashboard Admin" : "Bienvenue"}
          {!isAdmin && profile?.full_name && `, ${profile.full_name.split(" ")[0]}`}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          {isAdmin
            ? "Vue d'ensemble de tous les projets"
            : "Suivez l'avancement de vos projets"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets actifs</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente de validation</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total projets</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg md:text-xl font-semibold">
            {isAdmin ? "Tous les projets" : "Vos projets"}
          </h2>
          {isAdmin && (
            <Button asChild size="sm">
              <Link href="/admin/projects/new">
                <span className="hidden sm:inline">Nouveau projet</span>
                <span className="sm:hidden">+ Projet</span>
              </Link>
            </Button>
          )}
        </div>

        {projects && projects.length > 0 ? (
          <div className="grid gap-3 md:gap-4 md:grid-cols-2">
            {projects.map((project) => {
              const status = projectStatusConfig[project.status as ProjectStatus];
              const activePhase = getActivePhase(project.phases);
              const PhaseIcon = activePhase
                ? phaseStatusIcons[activePhase.status as keyof typeof phaseStatusIcons]
                : Clock;

              return (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        {isAdmin && project.client && (
                          <p className="text-sm text-muted-foreground">
                            {project.client.name}
                          </p>
                        )}
                      </div>
                      <Badge variant={status.variant}>
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${status.dotColor}`}
                        />
                        {status.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activePhase && (
                      <div className="flex items-center gap-2 text-sm">
                        <PhaseIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Phase actuelle:</span>
                        <span className="font-medium">{activePhase.name}</span>
                      </div>
                    )}

                    {/* Phase progress */}
                    {project.phases && project.phases.length > 0 && (
                      <div className="flex gap-1">
                        {[...project.phases]
                          .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
                          .map((phase: { id: string; status: string }) => (
                            <div
                              key={phase.id}
                              className={`h-1.5 flex-1 rounded-full ${
                                phase.status === "completed"
                                  ? "bg-green-500"
                                  : phase.status === "in_progress" || phase.status === "review"
                                  ? "bg-yellow-500"
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                      </div>
                    )}

                    <Button variant="ghost" className="w-full justify-between" asChild>
                      <Link
                        href={
                          isAdmin
                            ? `/admin/projects/${project.id}`
                            : `/projects/${project.id}`
                        }
                      >
                        Voir le projet
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-1">Aucun projet</h3>
              <p className="text-muted-foreground text-center">
                {isAdmin
                  ? "Creez votre premier projet pour commencer."
                  : "Vous n'avez pas encore de projet en cours."}
              </p>
              {isAdmin && (
                <Button className="mt-4" asChild>
                  <Link href="/admin/projects/new">Creer un projet</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
