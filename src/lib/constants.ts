import type { DeliverableStatus, PhaseStatus, ProjectStatus, ClientStatus, ContactRole, MessageType } from "@/types/database";

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

// CRM client status configuration
export const clientStatusConfig: Record<
  ClientStatus,
  { label: string; color: string; dotColor: string }
> = {
  lead: {
    label: "Lead",
    color: "bg-gray-100 text-gray-800",
    dotColor: "bg-gray-500",
  },
  contacted: {
    label: "Contacté",
    color: "bg-blue-100 text-blue-800",
    dotColor: "bg-blue-500",
  },
  in_project: {
    label: "En projet",
    color: "bg-green-100 text-green-800",
    dotColor: "bg-green-500",
  },
  pending_review: {
    label: "En attente de validation",
    color: "bg-yellow-100 text-yellow-800",
    dotColor: "bg-yellow-500",
  },
  completed: {
    label: "Terminé",
    color: "bg-emerald-100 text-emerald-800",
    dotColor: "bg-emerald-500",
  },
  archived: {
    label: "Archivé",
    color: "bg-muted text-muted-foreground",
    dotColor: "bg-gray-400",
  },
};

// Contact role configuration
export const contactRoleConfig: Record<
  ContactRole,
  { label: string; description: string }
> = {
  decision_maker: {
    label: "Décideur",
    description: "La personne qui valide et signe",
  },
  technical: {
    label: "Technique",
    description: "Contact technique (développeur, IT)",
  },
  billing: {
    label: "Facturation",
    description: "Contact comptabilité/finance",
  },
  marketing: {
    label: "Marketing",
    description: "Contact marketing",
  },
  other: {
    label: "Autre",
    description: "Autre rôle",
  },
};

// Message type configuration
export const messageTypeConfig: Record<
  MessageType,
  { label: string; color: string }
> = {
  prospecting: {
    label: "Prospection",
    color: "bg-blue-100 text-blue-800",
  },
  followup: {
    label: "Relance",
    color: "bg-orange-100 text-orange-800",
  },
  custom: {
    label: "Personnalisé",
    color: "bg-gray-100 text-gray-800",
  },
};

// Prospecting email templates
export const prospectingTemplates = {
  default: {
    subject: "{{entreprise}} - Collaboration avec Horde",
    content: `Bonjour {{prenom}},

Je me permets de vous contacter au sujet de {{entreprise}}.

[Votre message personnalisé]

Cordialement,
L'équipe Horde`,
  },
  followup: {
    subject: "Re: {{entreprise}} - Suite à notre premier contact",
    content: `Bonjour {{prenom}},

Je me permets de revenir vers vous concernant notre échange au sujet de {{entreprise}}.

[Votre message de relance]

Cordialement,
L'équipe Horde`,
  },
};

// Followup delay in days
export const FOLLOWUP_DELAY_DAYS = 10;
