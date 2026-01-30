export type UserRole = "client" | "admin";
export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type PhaseStatus = "pending" | "in_progress" | "review" | "completed";
export type DeliverableStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "revision_requested";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  role: UserRole;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  client_id: string | null;
  status: ProjectStatus;
  staging_url: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  client?: Profile;
  phases?: Phase[];
}

export interface Phase {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: PhaseStatus;
  order_index: number;
  started_at: string | null;
  completed_at: string | null;
  // Relations
  deliverables?: Deliverable[];
}

export interface Deliverable {
  id: string;
  phase_id: string;
  title: string;
  description: string | null;
  status: DeliverableStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  files?: FileRecord[];
  comments?: Comment[];
  creator?: Profile;
}

export interface FileRecord {
  id: string;
  deliverable_id: string;
  name: string;
  storage_path: string;
  size_bytes: number | null;
  mime_type: string | null;
  version: number;
  uploaded_by: string | null;
  created_at: string;
  // Relations
  uploader?: Profile;
}

export interface Comment {
  id: string;
  deliverable_id: string;
  author_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  // Relations
  author?: Profile;
}

export interface ProjectMember {
  project_id: string;
  user_id: string;
  // Relations
  user?: Profile;
  project?: Project;
}

export type ActivityAction =
  | "login"
  | "view_project"
  | "view_deliverable"
  | "download_file"
  | "add_comment"
  | "validate_deliverable"
  | "request_revision"
  | "email_sent";

export interface ActivityLog {
  id: string;
  user_id: string | null;
  project_id: string | null;
  deliverable_id: string | null;
  action: ActivityAction;
  metadata: Record<string, unknown>;
  created_at: string;
  // Relations
  user?: Profile;
  project?: Project;
  deliverable?: Deliverable;
}

// Default phases template
export const DEFAULT_PHASES = [
  { name: "Audit", description: "Analyse de l'existant et benchmark concurrentiel" },
  { name: "Proposition", description: "Proposition commerciale et devis" },
  { name: "Brief", description: "Definition des besoins, objectifs et specifications" },
  { name: "Maquette", description: "Design UI/UX et wireframes" },
  { name: "Validation maquette", description: "Approbation des maquettes par le client" },
  { name: "Developpement", description: "Integration et developpement technique" },
  { name: "Validation staging", description: "Tests et recette sur environnement de pre-production" },
  { name: "Mise en production", description: "Deploiement et lancement officiel" },
  { name: "Review", description: "Retour d'experience et ajustements post-lancement" },
];
