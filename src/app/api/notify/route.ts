import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import {
  deliverablePendingReviewEmail,
  deliverableValidatedEmail,
} from "@/lib/email/templates";

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function POST(request: Request) {
  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const { type, deliverableId } = body;


    if (!type || !deliverableId) {
      return NextResponse.json(
        { error: "Missing type or deliverableId" },
        { status: 400 }
      );
    }

    // Get deliverable with phase and project info
    const { data: deliverable, error: deliverableError } = await supabase
      .from("deliverables")
      .select(`
        *,
        phase:phases(
          *,
          project:projects(
            *,
            client:profiles!projects_client_id_fkey(*)
          )
        )
      `)
      .eq("id", deliverableId)
      .single();

    if (deliverableError || !deliverable) {
      console.error("[Notify API] Deliverable not found:", deliverableError);
      return NextResponse.json(
        { error: "Deliverable not found" },
        { status: 404 }
      );
    }

    const project = deliverable.phase?.project;
    const client = project?.client;
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "https://portal.hordeagence.com";
    const deliverableUrl = `${portalUrl}/projects/${project?.id}/deliverables/${deliverableId}`;

    // Get admin users to notify
    const { data: admins } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "admin");

    switch (type) {
      case "pending_review": {
        if (!client?.email) {
          return NextResponse.json(
            { error: "Client has no email" },
            { status: 400 }
          );
        }

        const html = deliverablePendingReviewEmail({
          clientName: client.full_name || "",
          projectName: project?.name || "",
          deliverableTitle: deliverable.title,
          phaseName: deliverable.phase?.name || "",
          portalUrl,
          deliverableUrl,
        });

        const emailResult = await sendEmail({
          to: client.email,
          subject: `Nouveau livrable a valider - ${project?.name}`,
          html,
        });

        // Log email sent and create in-app notification
        if (emailResult.success) {
          await supabase.from("activity_logs").insert({
            user_id: client.id,
            project_id: project?.id,
            deliverable_id: deliverableId,
            action: "email_sent",
            metadata: { type: "pending_review", to: client.email },
          });
        }

        // Create in-app notification for client
        await supabase.from("notifications").insert({
          user_id: client.id,
          type: "deliverable_ready",
          title: `Nouveau livrable à valider`,
          message: `${deliverable.title} - ${project?.name}`,
          link: `/projects/${project?.id}/deliverables/${deliverableId}`,
        });

        break;
      }

      case "approved":
      case "revision_requested": {
        if (!admins || admins.length === 0) {
          return NextResponse.json(
            { error: "No admins to notify" },
            { status: 400 }
          );
        }

        const approved = type === "approved";

        for (const admin of admins) {
          if (!admin.email) continue;

          const html = deliverableValidatedEmail({
            adminName: admin.full_name || "",
            clientName: client?.full_name || client?.company || "Le client",
            projectName: project?.name || "",
            deliverableTitle: deliverable.title,
            phaseName: deliverable.phase?.name || "",
            deliverableUrl: `${portalUrl}/admin/projects/${project?.id}/deliverables/${deliverableId}`,
            approved,
          });

          const emailResult = await sendEmail({
            to: admin.email,
            subject: approved
              ? `Livrable valide - ${project?.name}`
              : `Revision demandee - ${project?.name}`,
            html,
          });

          // Log email sent
          if (emailResult.success) {
            await supabase.from("activity_logs").insert({
              user_id: admin.id,
              project_id: project?.id,
              deliverable_id: deliverableId,
              action: "email_sent",
              metadata: { type: approved ? "approved" : "revision_requested", to: admin.email },
            });
          }

          // Create in-app notification for admin
          await supabase.from("notifications").insert({
            user_id: admin.id,
            type: approved ? "deliverable_validated" : "revision_requested",
            title: approved
              ? `Livrable validé par ${client?.full_name || "le client"}`
              : `Révision demandée par ${client?.full_name || "le client"}`,
            message: `${deliverable.title} - ${project?.name}`,
            link: `/admin/projects/${project?.id}/deliverables/${deliverableId}`,
          });
        }

        break;
      }

      default:
        return NextResponse.json(
          { error: "Unknown notification type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Notify API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
