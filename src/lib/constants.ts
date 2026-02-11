import type { DeliverableStatus, PhaseStatus, ProjectStatus, ClientStatus, ContactRole, MessageType, UserRole } from "@/types/database";

export const deliverableStatusConfig: Record<
  DeliverableStatus,
  { label: string; color: string }
> = {
  draft: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  pending_review: { label: "En attente de validation", color: "bg-status-warning-bg text-status-warning-text" },
  approved: { label: "Validé", color: "bg-status-success-bg text-status-success-text" },
  revision_requested: { label: "Révision demandée", color: "bg-status-danger-bg text-status-danger-text" },
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
    color: "bg-status-info-bg text-status-info-text",
    dotColor: "bg-status-info-text border-status-info-text",
    textColor: "text-foreground",
  },
  review: {
    label: "À valider",
    color: "bg-status-warning-bg text-status-warning-text",
    dotColor: "bg-status-orange-text border-status-orange-text",
    textColor: "text-foreground",
  },
  completed: {
    label: "Terminée",
    color: "bg-status-success-bg text-status-success-text",
    dotColor: "bg-status-success-text border-status-success-text",
    textColor: "text-muted-foreground",
  },
};

export const projectStatusConfig: Record<
  ProjectStatus,
  { label: string; color: string; variant: "default" | "secondary" | "outline" | "destructive"; dotColor: string }
> = {
  active: { label: "Actif", color: "bg-status-success-bg text-status-success-text", variant: "default", dotColor: "bg-status-success-text" },
  paused: { label: "En pause", color: "bg-status-warning-bg text-status-warning-text", variant: "secondary", dotColor: "bg-status-warning-text" },
  completed: { label: "Terminé", color: "bg-status-info-bg text-status-info-text", variant: "outline", dotColor: "bg-status-info-text" },
  archived: { label: "Archivé", color: "bg-muted text-muted-foreground", variant: "outline", dotColor: "bg-muted-foreground" },
};

// CRM client status configuration
export const clientStatusConfig: Record<
  ClientStatus,
  { label: string; color: string; dotColor: string }
> = {
  lead: {
    label: "Lead",
    color: "bg-status-neutral-bg text-status-neutral-text",
    dotColor: "bg-status-neutral-text",
  },
  contacted: {
    label: "Contacté",
    color: "bg-status-info-bg text-status-info-text",
    dotColor: "bg-status-info-text",
  },
  in_project: {
    label: "En projet",
    color: "bg-status-success-bg text-status-success-text",
    dotColor: "bg-status-success-text",
  },
  pending_review: {
    label: "En attente de validation",
    color: "bg-status-warning-bg text-status-warning-text",
    dotColor: "bg-status-warning-text",
  },
  completed: {
    label: "Terminé",
    color: "bg-status-success-bg text-status-success-text",
    dotColor: "bg-status-success-text",
  },
  archived: {
    label: "Archivé",
    color: "bg-muted text-muted-foreground",
    dotColor: "bg-muted-foreground",
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
    color: "bg-status-info-bg text-status-info-text",
  },
  followup: {
    label: "Relance",
    color: "bg-status-orange-bg text-status-orange-text",
  },
  custom: {
    label: "Personnalisé",
    color: "bg-status-neutral-bg text-status-neutral-text",
  },
};

// Prospecting email templates
export const prospectingTemplates = {
  default: {
    subject: "Petit retour technique sur {{website}}",
    content: `Bonjour {{entreprise}},

Je visitais votre site {{website}} tout à l'heure et j'ai noté 2-3 points techniques qui freinent un peu l'expérience (notamment le chargement des images sur mobile).

Je suis co-fondateur de Horde, une jeune agence web Bruxelloise.
Concrètement, on aide les entreprises à avoir une présence en ligne dont ils peuvent être fier :
- On répare ce qui est lent ou cassé (pour plaire à Google).
- On refait le design pour qu'il soit à la hauteur de la qualité de vos services.
- On s'assure que votre site soit pratique pour vous et non un poid de plus à gérer dans votre activité

J'ai enregistré une courte vidéo d'écran (1m30) pour vous montrer concrètement ce qui pourrait être amélioré. C'est sans engagement, juste un regard neuf.

Je vous l'envoie ?

Belle journée,
Nicolas

+32 487 47 97 98
Horde Agence (hordeagence.com)`,
  },
  followup: {
    subject: "Re: {{entreprise}}",
    content: `Hey {{prenom}},

Je te relance vite fait, t'as eu le temps de jeter un oeil?

[Ton message]

Nico`,
  },
};

// Followup delay in days
export const FOLLOWUP_DELAY_DAYS = 10;

// Project types for CRM
export const projectTypes = [
  { value: "website", label: "Site vitrine" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "webapp", label: "Application web" },
  { value: "mobile", label: "Application mobile" },
  { value: "branding", label: "Branding / Identité" },
  { value: "seo", label: "SEO / Marketing" },
  { value: "maintenance", label: "Maintenance" },
  { value: "other", label: "Autre" },
];

// Business sectors for CRM
export const sectors = [
  { value: "restaurant", label: "Restauration / Horeca" },
  { value: "retail", label: "Commerce / Retail" },
  { value: "health", label: "Santé / Bien-être" },
  { value: "realestate", label: "Immobilier" },
  { value: "tech", label: "Tech / SaaS" },
  { value: "finance", label: "Finance / Assurance" },
  { value: "education", label: "Éducation / Formation" },
  { value: "industry", label: "Industrie" },
  { value: "services", label: "Services B2B" },
  { value: "nonprofit", label: "Association / ONG" },
  { value: "creative", label: "Créatif / Média" },
  { value: "other", label: "Autre" },
];

// User role configuration
export const userRoleConfig: Record<
  UserRole,
  { label: string; color: string; description: string }
> = {
  client: {
    label: "Client",
    color: "bg-status-neutral-bg text-status-neutral-text",
    description: "Accès au portail client uniquement",
  },
  editor: {
    label: "Éditeur",
    color: "bg-status-info-bg text-status-info-text",
    description: "Peut gérer les clients et contacts",
  },
  admin: {
    label: "Admin",
    color: "bg-status-purple-bg text-status-purple-text",
    description: "Accès complet au système",
  },
};
