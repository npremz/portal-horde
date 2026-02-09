import type { Project, Phase, Deliverable } from "@/types/database";

export const mockProjects: Project[] = [
  {
    id: "project-1",
    name: "Site Web Acme",
    description: "Refonte complète du site web",
    client_id: "client-1",
    status: "active",
    staging_url: "https://staging.acme.com",
    created_at: "2025-07-01T10:00:00Z",
    updated_at: "2026-01-15T14:30:00Z",
  },
  {
    id: "project-2",
    name: "E-commerce Beta",
    description: "Boutique en ligne",
    client_id: "client-2",
    status: "active",
    staging_url: null,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
  },
];

export const mockPhases: Phase[] = [
  {
    id: "phase-1",
    project_id: "project-1",
    name: "Maquette",
    description: "Design UI/UX",
    status: "completed",
    order_index: 0,
    started_at: "2025-07-05T10:00:00Z",
    completed_at: "2025-07-20T10:00:00Z",
  },
  {
    id: "phase-2",
    project_id: "project-1",
    name: "Développement",
    description: "Intégration technique",
    status: "in_progress",
    order_index: 1,
    started_at: "2025-07-21T10:00:00Z",
    completed_at: null,
  },
];

export const mockDeliverables: Deliverable[] = [
  {
    id: "deliverable-1",
    phase_id: "phase-1",
    title: "Maquette Page Accueil",
    description: "Design de la page d'accueil",
    status: "approved",
    created_by: "user-1",
    created_at: "2025-07-10T10:00:00Z",
    updated_at: "2025-07-15T10:00:00Z",
  },
  {
    id: "deliverable-2",
    phase_id: "phase-2",
    title: "Intégration Header",
    description: "Composant header responsive",
    status: "pending_review",
    created_by: "user-1",
    created_at: "2025-08-01T10:00:00Z",
    updated_at: "2025-08-10T10:00:00Z",
  },
];
