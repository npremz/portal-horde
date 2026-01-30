import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Verify admin user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Get request data
    const { email, full_name, company, projectName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const portalUrl = process.env.NEXT_PUBLIC_APP_URL || "https://portal.hordeagence.com";

    // Check if user already exists
    const { data: existingUser } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      // User already exists, just send welcome email
      const html = welcomeEmail({
        clientName: full_name || "",
        projectName: projectName || "votre projet",
        portalUrl,
        loginUrl: `${portalUrl}/login`,
      });

      await sendEmail({
        to: email,
        subject: `Votre espace projet est prêt - ${projectName || "Horde"}`,
        html,
      });

      return NextResponse.json({ success: true, existing: true });
    }

    // Create new user with admin client (without sending Supabase default email)
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name,
          company,
        },
      });

    if (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'utilisateur" },
        { status: 500 }
      );
    }

    // Update profile with additional info
    if (newUser.user) {
      await adminClient.from("profiles").upsert({
        id: newUser.user.id,
        email,
        full_name,
        company,
        role: "client",
      });

      // Send our custom welcome email
      const html = welcomeEmail({
        clientName: full_name || "",
        projectName: projectName || "votre projet",
        portalUrl,
        loginUrl: `${portalUrl}/login`,
      });

      await sendEmail({
        to: email,
        subject: `Bienvenue sur votre espace projet - ${projectName || "Horde"}`,
        html,
      });
    }

    return NextResponse.json({ success: true, user: newUser.user });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'invitation" },
      { status: 500 }
    );
  }
}
