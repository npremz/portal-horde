"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ExternalLink,
  Edit,
  Plus,
  CheckCircle2,
  FileText,
  MessageSquare,
  Building,
  ChevronRight,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Trash2,
  Pencil,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import type {
  Project,
  Phase,
  Deliverable,
  Client,
  PhaseStatus,
  DeliverableStatus,
  ProjectStatus,
} from "@/types/database";
import {
  phaseStatusConfig,
  deliverableStatusConfig,
  projectStatusConfig,
} from "@/lib/constants";

type PhaseWithDeliverables = Phase & {
  deliverables: (Deliverable & { files: { id: string }[]; comments: { id: string }[] })[];
};

export default function AdminProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [phases, setPhases] = useState<PhaseWithDeliverables[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // Phase management
  const [newPhaseName, setNewPhaseName] = useState("");
  const [addPhaseOpen, setAddPhaseOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<Phase | null>(null);
  const [editPhaseName, setEditPhaseName] = useState("");
  const [deletingPhase, setDeletingPhase] = useState<Phase | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{id: string, newStatus: string, type: 'phase' | 'deliverable'} | null>(null);

  const supabase = createClient();

  const fetchProject = useCallback(async () => {
    setLoading(true);

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !projectData) {
      toast.error("Projet introuvable");
      router.push("/admin/projects");
      return;
    }

    setProject(projectData);

    if (projectData.client_id) {
      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", projectData.client_id)
        .single();
      setClient(clientData);
    } else {
      setClient(null);
    }

    const { data: phasesData } = await supabase
      .from("phases")
      .select(`
        *,
        deliverables(
          *,
          files(id),
          comments(id)
        )
      `)
      .eq("project_id", projectId)
      .order("order_index", { ascending: true });

    setPhases((phasesData as PhaseWithDeliverables[]) || []);
    setLoading(false);
  }, [projectId, router, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProject();
  }, [fetchProject]);

  async function addPhase() {
    if (!newPhaseName.trim()) return;

    const maxOrder = phases.length > 0 ? Math.max(...phases.map(p => p.order_index)) : -1;

    const { error } = await supabase.from("phases").insert({
      project_id: projectId,
      name: newPhaseName.trim(),
      order_index: maxOrder + 1,
      status: "pending",
    });

    if (error) {
      toast.error("Erreur lors de l'ajout");
    } else {
      toast.success("Étape ajoutée");
      setNewPhaseName("");
      setAddPhaseOpen(false);
      fetchProject();
    }
  }

  async function updatePhase(phaseId: string, updates: Partial<Phase>) {
    const { error } = await supabase
      .from("phases")
      .update(updates)
      .eq("id", phaseId);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success("Étape mise à jour");
      setEditingPhase(null);
      fetchProject();
    }
  }

  async function updatePhaseStatus(phaseId: string, status: PhaseStatus) {
    const updateData: { status: PhaseStatus; started_at?: string; completed_at?: string | null } = { status };

    if (status === "in_progress") {
      updateData.started_at = new Date().toISOString();
    } else if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = null;
    }

    await updatePhase(phaseId, updateData);
  }

  async function deletePhase(phaseId: string) {
    const phase = phases.find(p => p.id === phaseId);
    if (phase?.deliverables && phase.deliverables.length > 0) {
      toast.error("Supprimez d'abord les livrables de cette étape");
      return;
    }

    const { error } = await supabase.from("phases").delete().eq("id", phaseId);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Étape supprimée");
      fetchProject();
    }
  }

  async function movePhase(phaseId: string, direction: "up" | "down") {
    const currentIndex = phases.findIndex(p => p.id === phaseId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= phases.length) return;

    const currentPhase = phases[currentIndex];
    const swapPhase = phases[newIndex];

    // Swap order_index values
    await Promise.all([
      supabase.from("phases").update({ order_index: swapPhase.order_index }).eq("id", currentPhase.id),
      supabase.from("phases").update({ order_index: currentPhase.order_index }).eq("id", swapPhase.id),
    ]);

    fetchProject();
  }

  async function updateDeliverableStatus(deliverableId: string, status: DeliverableStatus) {
    const { error } = await supabase
      .from("deliverables")
      .update({ status })
      .eq("id", deliverableId);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success("Livrable mis à jour");

      // Notify client when deliverable is ready for review
      if (status === "pending_review") {
        toast.promise(
          fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "pending_review",
              deliverableId,
            }),
          }).then((res) => {
            if (!res.ok) throw new Error("Erreur envoi");
            return res.json();
          }),
          {
            loading: "Envoi de la notification au client...",
            success: "Notification envoyée au client",
            error: "Erreur lors de l'envoi de la notification",
          }
        );
      }

      fetchProject();
    }
  }

  function getStatusLabel(status: string | undefined, type: 'phase' | 'deliverable' | undefined) {
    if (!status || !type) return "";
    if (type === 'phase') return phaseStatusConfig[status as PhaseStatus]?.label ?? status;
    return deliverableStatusConfig[status as DeliverableStatus]?.label ?? status;
  }

  function handleConfirmStatusChange() {
    if (!pendingStatusChange) return;
    const { id, newStatus, type } = pendingStatusChange;
    if (type === 'phase') {
      updatePhaseStatus(id, newStatus as PhaseStatus);
    } else {
      updateDeliverableStatus(id, newStatus as DeliverableStatus);
    }
    setPendingStatusChange(null);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) return null;

  const statusConfig = projectStatusConfig[project.status as ProjectStatus];
  const completedCount = phases.filter((p) => p.status === "completed").length;
  const progressPercent = phases.length > 0 ? Math.round((completedCount / phases.length) * 100) : 0;
  const pendingValidations = phases.reduce((acc, phase) => {
    return acc + (phase.deliverables?.filter(d => d.status === "pending_review").length || 0);
  }, 0);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/admin/projects">Projets</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display uppercase tracking-tight">
                {project.name}
              </h1>
              <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-1">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {project.staging_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={project.staging_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/projects/${projectId}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Link>
            </Button>
          </div>
        </div>

        {/* Info row */}
        <div className="mt-4 flex items-center gap-6 text-sm">
          {client ? (
            <Link
              href={`/admin/clients/${client.id}`}
              className="flex items-center gap-2 hover:text-primary transition-colors"
            >
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>{client.name}</span>
              <span className="text-muted-foreground">({client.email})</span>
            </Link>
          ) : (
            <span className="text-muted-foreground">Aucun client assigné</span>
          )}
        </div>

        {/* Progress bar */}
        {phases.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
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
            <div className="flex gap-4 mt-3 text-sm">
              <span className="text-muted-foreground">
                {completedCount}/{phases.length} étapes
              </span>
              {pendingValidations > 0 && (
                <span className="text-yellow-600 font-medium">
                  {pendingValidations} en attente de validation client
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Phases header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Étapes du projet</h2>
        <Dialog open={addPhaseOpen} onOpenChange={setAddPhaseOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter une étape
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouvelle étape</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle étape au projet
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Nom de l&apos;étape (ex: Maquette page contact)"
              value={newPhaseName}
              onChange={(e) => setNewPhaseName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPhase()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddPhaseOpen(false)}>
                Annuler
              </Button>
              <Button onClick={addPhase} disabled={!newPhaseName.trim()}>
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timeline vertical */}
      {phases.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-muted/30">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Aucune étape pour ce projet</p>
          <Button onClick={() => setAddPhaseOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter la première étape
          </Button>
        </div>
      ) : (
        <div className="relative">
          {phases.map((phase, index) => {
            const config = phaseStatusConfig[phase.status as PhaseStatus];
            const isActive = phase.status === "in_progress" || phase.status === "review";
            const isCompleted = phase.status === "completed";
            const isPending = phase.status === "pending";
            const deliverables = phase.deliverables || [];
            const isLast = index === phases.length - 1;
            const isFirst = index === 0;

            return (
              <div key={phase.id} className="relative pb-6 last:pb-0">
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
                    isActive ? "ring-4 ring-blue-100" : ""
                  }`}>
                    {isCompleted && <CheckCircle2 className="h-3 w-3 text-white" />}
                    {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 min-w-0 ${isPending ? "opacity-60" : ""}`}>
                    {/* Phase header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className={`font-medium truncate ${config.textColor}`}>
                          {phase.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Select
                          value={phase.status}
                          onValueChange={(value) => setPendingStatusChange({ id: phase.id, newStatus: value, type: 'phase' })}
                        >
                          <SelectTrigger className="w-28 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">En attente</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="review">En review</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                          </SelectContent>
                        </Select>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions de la phase">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isFirst && (
                              <DropdownMenuItem onClick={() => movePhase(phase.id, "up")}>
                                <ChevronUp className="h-4 w-4 mr-2" />
                                Monter
                              </DropdownMenuItem>
                            )}
                            {!isLast && (
                              <DropdownMenuItem onClick={() => movePhase(phase.id, "down")}>
                                <ChevronDown className="h-4 w-4 mr-2" />
                                Descendre
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => {
                              setEditingPhase(phase);
                              setEditPhaseName(phase.name);
                            }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Renommer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingPhase(phase)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Deliverables */}
                    <div className="space-y-2">
                      {deliverables.map((deliverable) => {
                        const filesCount = deliverable.files?.length || 0;
                        const commentsCount = deliverable.comments?.length || 0;
                        const needsAction = deliverable.status === "pending_review";

                        return (
                          <div
                            key={deliverable.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                              needsAction
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-card"
                            }`}
                          >
                            <Link
                              href={`/admin/projects/${projectId}/deliverables/${deliverable.id}`}
                              className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-70 transition-opacity"
                            >
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
                            </Link>
                            <div className="flex items-center gap-2 shrink-0">
                              <Select
                                value={deliverable.status}
                                onValueChange={(value) =>
                                  setPendingStatusChange({ id: deliverable.id, newStatus: value, type: 'deliverable' })
                                }
                              >
                                <SelectTrigger className="w-28 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="draft">Brouillon</SelectItem>
                                  <SelectItem value="pending_review">À valider</SelectItem>
                                  <SelectItem value="approved">Validé</SelectItem>
                                  <SelectItem value="revision_requested">Révision</SelectItem>
                                </SelectContent>
                              </Select>
                              <Link href={`/admin/projects/${projectId}/deliverables/${deliverable.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Voir le livrable">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add deliverable button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
                        onClick={() => router.push(`/admin/projects/${projectId}/deliverables/new?phase=${phase.id}`)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un livrable
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete phase dialog */}
      <AlertDialog open={!!deletingPhase} onOpenChange={(open) => !open && setDeletingPhase(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;étape ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;étape «&nbsp;{deletingPhase?.name}&nbsp;» sera supprimée. Les livrables doivent être supprimés d&apos;abord.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingPhase) {
                  deletePhase(deletingPhase.id);
                  setDeletingPhase(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit phase dialog */}
      <Dialog open={!!editingPhase} onOpenChange={(open) => !open && setEditingPhase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer l&apos;étape</DialogTitle>
          </DialogHeader>
          <Input
            value={editPhaseName}
            onChange={(e) => setEditPhaseName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && editingPhase) {
                updatePhase(editingPhase.id, { name: editPhaseName });
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPhase(null)}>
              Annuler
            </Button>
            <Button
              onClick={() => editingPhase && updatePhase(editingPhase.id, { name: editPhaseName })}
              disabled={!editPhaseName.trim()}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status change confirmation dialog */}
      <AlertDialog open={!!pendingStatusChange} onOpenChange={(open) => { if (!open) setPendingStatusChange(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement de statut</AlertDialogTitle>
            <AlertDialogDescription>
              {`Êtes-vous sûr de vouloir changer le statut en « ${getStatusLabel(pendingStatusChange?.newStatus, pendingStatusChange?.type)} » ?`}
              {pendingStatusChange?.newStatus === 'pending_review' && " Cette action enverra une notification au client."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatusChange}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
