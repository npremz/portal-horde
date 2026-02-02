import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/database";
import {
  generateRequestId,
  apiError,
  apiSuccess,
  apiErrors,
  AppError,
  ErrorCode,
  mapDatabaseError,
  createLogger,
} from "@/lib/errors";

const log = createLogger("Users API");

export async function POST(request: Request) {
  const requestId = generateRequestId();

  try {
    // Verify admin user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiErrors.unauthorized(requestId);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return apiErrors.forbidden(requestId, "Seuls les administrateurs peuvent créer des utilisateurs");
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
      return apiErrors.badRequest(requestId, "Email, nom et rôle requis");
    }

    // Validate role
    if (!["client", "editor", "admin"].includes(role)) {
      return apiErrors.badRequest(requestId, "Rôle invalide");
    }

    const adminClient = createAdminClient();

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return apiErrors.duplicate(requestId, "Un utilisateur avec cet email existe déjà");
    }

    // Create user via invitation (sends magic link email)
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name,
        },
      });

    if (inviteError) {
      log.error("Failed to invite user", { requestId, email, error: inviteError.message });
      return apiError(
        new AppError({
          code: ErrorCode.EMAIL_SEND_FAILED,
          message: "Erreur lors de l'envoi de l'invitation",
          cause: inviteError,
          requestId,
        }),
        requestId
      );
    }

    if (!inviteData.user) {
      return apiError(
        new AppError({
          code: ErrorCode.DATABASE_ERROR,
          message: "Erreur lors de la création de l'utilisateur",
          requestId,
        }),
        requestId
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
      log.error("Failed to create profile, cleaning up", {
        requestId,
        userId: inviteData.user.id,
        error: profileError.message,
      });
      // Clean up the created user
      await adminClient.auth.admin.deleteUser(inviteData.user.id);

      const dbError = mapDatabaseError(profileError, requestId);
      if (dbError) {
        return apiError(dbError, requestId);
      }
      return apiErrors.database(requestId, "Erreur lors de la création du profil");
    }

    log.info("User created successfully", { requestId, userId: inviteData.user.id, email, role });

    return apiSuccess(
      {
        id: inviteData.user.id,
        email,
        full_name,
        role,
        company: company || null,
      },
      undefined,
      201
    );
  } catch (error) {
    return apiError(error, requestId, { url: "/api/users" });
  }
}
