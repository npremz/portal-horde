"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, LayoutDashboard } from "lucide-react";

/**
 * Error boundary for the dashboard route group.
 * Renders within the dashboard layout.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Horde] [ERROR] Dashboard error:", {
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
          Une erreur s'est produite
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-6">
          Nous n'avons pas pu charger cette page. Veuillez réessayer ou
          retourner à l'accueil du dashboard.
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
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Retour au dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
