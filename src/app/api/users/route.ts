import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types/database";

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

    // Parse request body
    const body = await request.json();
    const { email, full_name, role, company } = body as {
      email: string;
      full_name: string;
      role: UserRole;
      company?: string;
    };

    // Validate required fields
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: "Email, nom et role requis" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["client", "editor", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Role invalide" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe deja" },
        { status: 400 }
      );
    }

    // Create user via invitation (sends magic link email)
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name,
        },
      });

    if (inviteError) {
      console.error("Error inviting user:", inviteError);
      return NextResponse.json(
        { error: "Erreur lors de l'invitation" },
        { status: 500 }
      );
    }

    if (!inviteData.user) {
      return NextResponse.json(
        { error: "Erreur lors de la creation de l'utilisateur" },
        { status: 500 }
      );
    }

    // Create profile with the specified role
    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: inviteData.user.id,
      email,
      full_name,
      role,
      company: company || null,
    });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      // Try to clean up the created user
      await adminClient.auth.admin.deleteUser(inviteData.user.id);
      return NextResponse.json(
        { error: "Erreur lors de la creation du profil" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: inviteData.user.id,
        email,
        full_name,
        role,
        company: company || null,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la creation" },
      { status: 500 }
    );
  }
}
