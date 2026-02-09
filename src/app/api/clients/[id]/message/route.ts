import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { prospectingEmail, replaceTemplateVariables } from "@/lib/email/templates";
import { FOLLOWUP_DELAY_DAYS } from "@/lib/constants";
import { NextResponse } from "next/server";
import type { MessageType } from "@/types/database";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clientId } = await params;

    // Verify admin user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    const body = await request.json();
    const { contact_id, recipient_email, recipient_name, subject, content, message_type } = body as {
      contact_id: string | null;
      recipient_email: string | null;
      recipient_name: string | null;
      subject: string;
      content: string;
      message_type: MessageType;
    };

    if (!subject || !content) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Get the client
    const { data: client, error: clientError } = await adminClient
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    }

    let recipientEmail: string;
    let recipientName: string;
    let contactId: string | null = null;

    if (contact_id) {
      // Get the contact
      const { data: contact, error: contactError } = await adminClient
        .from("client_contacts")
        .select("*")
        .eq("id", contact_id)
        .eq("client_id", clientId)
        .single();

      if (contactError || !contact) {
        return NextResponse.json({ error: "Contact introuvable" }, { status: 404 });
      }

      if (!contact.email) {
        return NextResponse.json(
          { error: "Ce contact n'a pas d'email" },
          { status: 400 }
        );
      }

      recipientEmail = contact.email;
      recipientName = contact.name;
      contactId = contact.id;
    } else if (recipient_email) {
      // Use provided email (client's email)
      recipientEmail = recipient_email;
      recipientName = recipient_name || client.name;
    } else {
      return NextResponse.json(
        { error: "Aucun destinataire specifie" },
        { status: 400 }
      );
    }

    // Extract first name
    const firstName = recipientName.split(" ")[0];

    // Replace variables in subject and content
    const variables = {
      nom: recipientName,
      prenom: firstName,
      entreprise: client.name,
      email: recipientEmail,
      website: client.website || "",
    };

    const finalSubject = replaceTemplateVariables(subject, variables);
    const finalContent = replaceTemplateVariables(content, variables);

    // Generate HTML email
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "https://portal.hordeagence.com";
    const html = prospectingEmail({
      subject: finalSubject,
      content: finalContent,
      portalUrl,
    });

    // Send email
    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: finalSubject,
      html,
    });

    if (!emailResult.success) {
      console.error("Email send error:", emailResult.error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    // Calculate next followup date (10 days from now)
    const nextFollowup = new Date();
    nextFollowup.setDate(nextFollowup.getDate() + FOLLOWUP_DELAY_DAYS);

    // Check if this is the first message
    const isFirstMessage = !client.first_contact_date;

    // Build update object for client
    const clientUpdate: Record<string, unknown> = {
      next_followup_date: nextFollowup.toISOString(),
    };

    if (isFirstMessage) {
      clientUpdate.first_contact_date = new Date().toISOString();
    }

    // Update status to contacted if lead
    if (client.status === "lead") {
      clientUpdate.status = "contacted";
    }

    // Update client
    const { error: updateError } = await adminClient
      .from("clients")
      .update(clientUpdate)
      .eq("id", clientId);

    if (updateError) {
      console.error("Client update error:", updateError);
      // Don't fail the request, email was sent
    }

    // Record message in history
    const { error: messageError } = await adminClient
      .from("client_messages")
      .insert({
        client_id: clientId,
        contact_id: contactId,
        subject: finalSubject,
        content: finalContent,
        message_type: message_type || "prospecting",
        sent_by: user.id,
      });

    if (messageError) {
      console.error("Message record error:", messageError);
      // Don't fail the request, email was sent
    }

    return NextResponse.json({
      success: true,
      email_id: emailResult.id,
      first_contact: isFirstMessage,
    });
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
