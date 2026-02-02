"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

/**
 * Error boundary for the root layout.
 * Catches errors in the main app routes.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Horde] [ERROR] Route error:", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo.svg"
              alt="Horde"
              width={80}
              height={26}
              priority
            />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-semibold mb-3">
            Une erreur s&apos;est produite
          </h1>

          {/* Description */}
          <p className="text-muted-foreground mb-6">
            Nous n&apos;avons pas pu charger cette page. Veuillez réessayer ou
            retourner au dashboard.
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
                <Home className="h-4 w-4 mr-2" />
                Retour au dashboard
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link
            href="/legal"
            className="hover:text-foreground transition-colors"
          >
            Mentions légales
          </Link>
          <span>•</span>
          <a
            href="https://hordeagence.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            hordeagence.com
          </a>
        </div>
      </footer>
    </div>
  );
}
