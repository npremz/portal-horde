import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types/database";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

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

    // Prevent modifying own role
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Impossible de modifier votre propre role" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { role } = body as { role: UserRole };

    // Validate role
    if (!role || !["client", "editor", "admin"].includes(role)) {
      return NextResponse.json({ error: "Role invalide" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check if user exists
    const { data: targetProfile, error: fetchError } = await adminClient
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", userId)
      .single();

    if (fetchError || !targetProfile) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Update the role
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({ role })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating role:", updateError);
      return NextResponse.json(
        { error: "Erreur lors de la mise a jour du role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        role,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise a jour" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

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

    // Prevent self-deletion
    if (userId === user.id) {
      return NextResponse.json(
        { error: "Impossible de supprimer votre propre compte" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Check if user exists
    const { data: targetProfile, error: fetchError } = await adminClient
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", userId)
      .single();

    if (fetchError || !targetProfile) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Delete the user from auth (this will cascade to profiles via trigger or RLS)
    const { error: deleteError } =
      await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    // Also delete the profile manually if needed (in case no cascade)
    await adminClient.from("profiles").delete().eq("id", userId);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
