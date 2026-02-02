"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Settings } from "lucide-react";

/**
 * Error boundary for the admin route group.
 * Renders within the admin layout.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Horde] [ERROR] Admin error:", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold mb-3">
          Erreur d&apos;administration
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-6">
          Une erreur s&apos;est produite dans l&apos;espace d&apos;administration.
          Veuillez réessayer ou retourner au panneau admin.
        </p>

        {/* Error reference */}
        {error.digest && (
          <p className="text-xs text-muted-foreground/60 font-mono mb-6">
            Référence: {error.digest}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Réessayer
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin">
              <Settings className="h-4 w-4 mr-2" />
              Panneau admin
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
