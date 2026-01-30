import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
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

    // Get request data
    const { email, full_name, company } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Create user with admin client
    const adminClient = createAdminClient();

    const { data: newUser, error: createError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name,
          company,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      });

    if (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json(
        { error: "Erreur lors de la creation de l'utilisateur" },
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
