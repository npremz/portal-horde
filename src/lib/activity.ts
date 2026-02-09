import { createClient } from "@/lib/supabase/client";
import type { ActivityAction } from "@/types/database";

interface LogActivityParams {
  action: ActivityAction;
  projectId?: string | null;
  deliverableId?: string | null;
  metadata?: Record<string, unknown>;
}

export async function logActivity({
  action,
  projectId,
  deliverableId,
  metadata = {},
}: LogActivityParams) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    project_id: projectId || null,
    deliverable_id: deliverableId || null,
    action,
    metadata,
  });
}

// Action labels for display
export const actionLabels: Record<ActivityAction, string> = {
  login: "Connexion",
  view_project: "Consultation projet",
  view_deliverable: "Consultation livrable",
  download_file: "Téléchargement",
  add_comment: "Commentaire",
  validate_deliverable: "Validation",
  request_revision: "Demande révision",
  email_sent: "Email envoyé",
};

// Action colors for badges
export const actionColors: Record<ActivityAction, string> = {
  login: "bg-blue-100 text-blue-800",
  view_project: "bg-gray-100 text-gray-800",
  view_deliverable: "bg-gray-100 text-gray-800",
  download_file: "bg-purple-100 text-purple-800",
  add_comment: "bg-yellow-100 text-yellow-800",
  validate_deliverable: "bg-green-100 text-green-800",
  request_revision: "bg-red-100 text-red-800",
  email_sent: "bg-indigo-100 text-indigo-800",
};
