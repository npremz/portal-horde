import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// App version from package.json
const APP_VERSION = process.env.npm_package_version || "0.1.0";

interface HealthCheck {
  status: "ok" | "error";
  message?: string;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  checks: {
    database: HealthCheck;
    auth: HealthCheck;
  };
}

/**
 * GET /api/health
 * Health check endpoint for monitoring and deployment verification.
 */
export async function GET(): Promise<NextResponse<HealthResponse>> {
  const timestamp = new Date().toISOString();
  const checks: HealthResponse["checks"] = {
    database: { status: "ok" },
    auth: { status: "ok" },
  };

  // Check Supabase database connection
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("profiles").select("id").limit(1);

    if (error) {
      checks.database = { status: "error", message: error.message };
    }
  } catch (err) {
    checks.database = {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // Check Supabase auth service
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      checks.auth = { status: "error", message: error.message };
    }
  } catch (err) {
    checks.auth = {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }

  // Determine overall status
  const allOk = Object.values(checks).every((c) => c.status === "ok");
  const anyError = Object.values(checks).some((c) => c.status === "error");

  let status: HealthResponse["status"] = "healthy";
  if (anyError && !allOk) {
    status = "degraded";
  }
  if (Object.values(checks).every((c) => c.status === "error")) {
    status = "unhealthy";
  }

  const response: HealthResponse = {
    status,
    version: APP_VERSION,
    timestamp,
    checks,
  };

  // Return appropriate HTTP status
  const httpStatus = status === "healthy" ? 200 : status === "degraded" ? 200 : 503;

  return NextResponse.json(response, { status: httpStatus });
}
