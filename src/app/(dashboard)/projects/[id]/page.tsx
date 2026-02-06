import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ActivityTracker } from "@/components/activity-tracker";
import {
  ExternalLink,
  CheckCircle2,
  ChevronRight,
  FileText,
  MessageSquare,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { phaseStatusConfig, deliverableStatusConfig } from "@/lib/constants";
import type { Phase, Deliverable, PhaseStatus, DeliverableStatus } from "@/types/database";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      *,
      phases(
        *,
        deliverables(
          *,
          files(id),
          comments(id)
        )
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !project) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Check access: admin can see all, clients can only see their own projects
  if (profile?.role !== "admin") {
    // For clients, check if they have access via clients table
    const { data: clientRecord } = await supabase
      .from("clients")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (!clientRecord || project.client_id !== clientRecord.id) {
      notFound();
    }
  }

  const sortedPhases = project.phases
    ? [...project.phases].sort((a: Phase, b: Phase) => a.order_index - b.order_index)
    : [];

  // Count pending validations
  const pendingValidations = sortedPhases.reduce((acc: number, phase: Phase & { deliverables?: Deliverable[] }) => {
    return acc + (phase.deliverables?.filter(d => d.status === "pending_review").length || 0);
  }, 0);

  // Progress percentage
  const completedCount = sortedPhases.filter((p: Phase) => p.status === "completed").length;
  const progressPercent = Math.round((completedCount / sortedPhases.length) * 100);

  // Track view only for clients
  const isClient = profile?.role !== "admin";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Activity tracking for clients */}
      {isClient && (
        <ActivityTracker
          action="view_project"
          projectId={project.id}
          metadata={{ projectName: project.name }}
        />
      )}

      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Breadcrumb className="mb-3 md:mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">Mes projets</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl md:text-2xl font-display uppercase tracking-tight">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-sm md:text-base text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
          {project.staging_url && (
            <Button variant="outline" size="sm" asChild className="self-start shrink-0">
              <a href={project.staging_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </a>
            </Button>
          )}
        </div>

        {/* Progress bar + stats */}
        <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-lg bg-muted/50 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progression</span>
            <span className="text-sm text-muted-foreground">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm">
            <span className="text-muted-foreground">
              {completedCount}/{sortedPhases.length} étapes
            </span>
            {pendingValidations > 0 && (
              <span className="text-yellow-600 font-medium">
                {pendingValidations} livrable(s) à valider
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline vertical */}
      <div className="relative">
        {sortedPhases.map((phase: Phase & { deliverables?: (Deliverable & { files: { id: string }[]; comments: { id: string }[] })[] }, index: number) => {
          const config = phaseStatusConfig[phase.status as PhaseStatus];
          const isActive = phase.status === "in_progress" || phase.status === "review";
          const isCompleted = phase.status === "completed";
          const isPending = phase.status === "pending";
          const deliverables = phase.deliverables || [];
          const hasPendingReview = deliverables.some(d => d.status === "pending_review");
          const isLast = index === sortedPhases.length - 1;

          return (
            <div key={phase.id} className="relative pb-8 last:pb-0">
              {/* Vertical line */}
              {!isLast && (
                <div
                  className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${
                    isCompleted ? "bg-green-500" : "bg-border"
                  }`}
                />
              )}

              <div className="flex gap-4">
                {/* Dot */}
                <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${config.dotColor} ${
                  isActive ? "ring-4 ring-yellow-100" : ""
                }`}>
                  {isCompleted && <CheckCircle2 className="h-3 w-3 text-white" />}
                  {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>

                {/* Content */}
                <div className={`flex-1 ${isPending ? "opacity-50" : ""}`}>
                  {/* Phase header */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-medium ${config.textColor}`}>
                      {phase.name}
                    </h3>
                    {isActive && (
                      <Badge variant="secondary" className="text-xs">
                        {config.label}
                      </Badge>
                    )}
                    {hasPendingReview && (
                      <Badge className="text-xs bg-yellow-100 text-yellow-800">
                        Action requise
                      </Badge>
                    )}
                  </div>

                  {/* Deliverables */}
                  {deliverables.length > 0 && !isPending && (
                    <div className="mt-3 space-y-2">
                      {deliverables.map((deliverable) => {
                        const statusConfig = deliverableStatusConfig[
                          deliverable.status as DeliverableStatus
                        ];
                        const filesCount = deliverable.files?.length || 0;
                        const commentsCount = deliverable.comments?.length || 0;
                        const needsAction = deliverable.status === "pending_review";

                        return (
                          <Link
                            key={deliverable.id}
                            href={`/projects/${project.id}/deliverables/${deliverable.id}`}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:border-foreground/20 ${
                              needsAction
                                ? "bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
                                : "bg-card hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <FileText className={`h-4 w-4 shrink-0 ${
                                needsAction ? "text-yellow-600" : "text-muted-foreground"
                              }`} />
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {deliverable.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {filesCount > 0 && <span>{filesCount} fichier(s)</span>}
                                  {commentsCount > 0 && (
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" />
                                      {commentsCount}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={`text-xs ${statusConfig.color}`}>
                                {statusConfig.label}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}

                  {/* Empty state for active phase */}
                  {deliverables.length === 0 && isActive && (
                    <p className="text-sm text-muted-foreground mt-2">
                      En attente de livrables...
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
