export type UserRole = "client" | "editor" | "admin";
export type ProjectStatus = "active" | "paused" | "completed" | "archived";
export type PhaseStatus = "pending" | "in_progress" | "review" | "completed";
export type DeliverableStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "revision_requested";

// CRM types
export type ClientStatus =
  | "lead"
  | "contacted"
  | "in_project"
  | "pending_review"
  | "completed"
  | "archived";

export type ContactRole =
  | "decision_maker"
  | "technical"
  | "billing"
  | "marketing"
  | "other";

export type MessageType = "prospecting" | "followup" | "custom";

// API Key permissions
export type ApiPermission =
  | "clients:read"
  | "clients:write"
  | "clients:delete"
  | "messages:send"
  | "stats:read";

// API Key for bot/agent authentication
export interface ApiKey {
  id: string;
  profile_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  permissions: ApiPermission[];
  is_active: boolean;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
  // Relations
  profile?: Profile;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  company: string | null;
  role: UserRole;
  created_at: string;
}

// CRM Client (business entity, independent of user account)
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  website: string | null;
  socials: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  status: ClientStatus;
  project_type: string | null;
  sector: string | null;
  notes: string | null;
  profile_id: string | null;
  first_contact_date: string | null;
  next_followup_date: string | null;
  is_priority: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  profile?: Profile;
  contacts?: ClientContact[];
  projects?: Project[];
  messages?: ClientMessage[];
}

// Contact within a client organization
export interface ClientContact {
  id: string;
  client_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: ContactRole;
  is_primary: boolean;
  notes: string | null;
  created_at: string;
}

// Message sent to a client (CRM prospection history)
export interface ClientMessage {
  id: string;
  client_id: string;
  contact_id: string | null;
  subject: string;
  content: string;
  sent_at: string;
  sent_by: string | null;
  message_type: MessageType;
  // Relations
  contact?: ClientContact;
  sender?: Profile;
}

// Reusable phase template
export interface PhaseTemplate {
  id: string;
  name: string;
  description: string | null;
  order_index: number;
  is_default: boolean;
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
  client?: Client;  // Now references Client instead of Profile
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

export interface Link {
  id: string;
  deliverable_id: string;
  title: string;
  url: string;
  created_by: string | null;
  created_at: string;
  // Relations
  creator?: Profile;
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

export type NotificationType =
  | "deliverable_ready"
  | "deliverable_validated"
  | "revision_requested"
  | "new_comment";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
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
