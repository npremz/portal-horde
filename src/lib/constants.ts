import type { DeliverableStatus, PhaseStatus, ProjectStatus } from "@/types/database";

export const deliverableStatusConfig: Record<
  DeliverableStatus,
  { label: string; color: string }
> = {
  draft: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  pending_review: { label: "En attente de validation", color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Validé", color: "bg-green-100 text-green-800" },
  revision_requested: { label: "Révision demandée", color: "bg-red-100 text-red-800" },
};

export const phaseStatusConfig: Record<
  PhaseStatus,
  { label: string; color: string; dotColor: string; textColor: string }
> = {
  pending: {
    label: "En attente",
    color: "bg-muted text-muted-foreground",
    dotColor: "bg-muted border-muted-foreground/30",
    textColor: "text-muted-foreground",
  },
  in_progress: {
    label: "En cours",
    color: "bg-blue-100 text-blue-800",
    dotColor: "bg-blue-500 border-blue-500",
    textColor: "text-foreground",
  },
  review: {
    label: "À valider",
    color: "bg-yellow-100 text-yellow-800",
    dotColor: "bg-orange-500 border-orange-500",
    textColor: "text-foreground",
  },
  completed: {
    label: "Terminée",
    color: "bg-green-100 text-green-800",
    dotColor: "bg-green-500 border-green-500",
    textColor: "text-muted-foreground",
  },
};

export const projectStatusConfig: Record<
  ProjectStatus,
  { label: string; color: string; variant: "default" | "secondary" | "outline" | "destructive"; dotColor: string }
> = {
  active: { label: "Actif", color: "bg-green-100 text-green-800", variant: "default", dotColor: "bg-green-500" },
  paused: { label: "En pause", color: "bg-yellow-100 text-yellow-800", variant: "secondary", dotColor: "bg-yellow-500" },
  completed: { label: "Terminé", color: "bg-blue-100 text-blue-800", variant: "outline", dotColor: "bg-blue-500" },
  archived: { label: "Archivé", color: "bg-muted text-muted-foreground", variant: "outline", dotColor: "bg-gray-500" },
};
