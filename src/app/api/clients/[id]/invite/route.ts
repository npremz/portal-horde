import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";
import { NextResponse } from "next/server";

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

    // Check if already invited
    if (client.profile_id) {
      return NextResponse.json(
        { error: "Ce client a deja ete invite" },
        { status: 400 }
      );
    }

    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "https://portal.hordeagence.com";

    // Get first project name for email
    const { data: projects } = await adminClient
      .from("projects")
      .select("name")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1);

    const projectName = projects?.[0]?.name || "votre projet";

    // Check if user with this email already exists in auth
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u) => u.email === client.email);

    let profileId: string;

    if (existingUser) {
      // User already exists, link to client
      profileId = existingUser.id;

      // Make sure profile exists
      await adminClient.from("profiles").upsert({
        id: profileId,
        email: client.email,
        full_name: client.name,
        role: "client",
      });
    } else {
      // Create new user
      const { data: newUser, error: createError } =
        await adminClient.auth.admin.createUser({
          email: client.email,
          email_confirm: true,
          user_metadata: {
            full_name: client.name,
          },
        });

      if (createError) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { error: "Erreur lors de la creation de l'utilisateur" },
          { status: 500 }
        );
      }

      if (!newUser.user) {
        return NextResponse.json(
          { error: "Erreur lors de la creation de l'utilisateur" },
          { status: 500 }
        );
      }

      profileId = newUser.user.id;

      // Create profile
      await adminClient.from("profiles").upsert({
        id: profileId,
        email: client.email,
        full_name: client.name,
        role: "client",
      });
    }

    // Link client to profile
    const { error: updateError } = await adminClient
      .from("clients")
      .update({
        profile_id: profileId,
        status: client.status === "lead" || client.status === "contacted"
          ? "in_project"
          : client.status,
      })
      .eq("id", clientId);

    if (updateError) {
      console.error("Error linking client:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la liaison du client" },
        { status: 500 }
      );
    }

    // Send welcome email
    const html = welcomeEmail({
      clientName: client.name,
      projectName,
      portalUrl,
      loginUrl: `${portalUrl}/login`,
    });

    await sendEmail({
      to: client.email,
      subject: `Bienvenue sur votre espace projet - ${projectName}`,
      html,
    });

    return NextResponse.json({
      success: true,
      profile_id: profileId,
    });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'invitation" },
      { status: 500 }
    );
  }
}
