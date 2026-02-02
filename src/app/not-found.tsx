"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, HelpCircle } from "lucide-react";

export default function NotFound() {
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
          {/* 404 Number */}
          <div className="mb-6">
            <span className="text-8xl md:text-9xl font-display font-bold text-muted-foreground/20">
              404
            </span>
          </div>

          {/* Message */}
          <h1 className="text-2xl md:text-3xl font-semibold mb-3">
            Page introuvable
          </h1>
          <p className="text-muted-foreground mb-8">
            Oups ! La page que vous recherchez n'existe pas ou a été déplacée.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/dashboard">
                <Home className="h-4 w-4 mr-2" />
                Retour au dashboard
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/contact">
                <HelpCircle className="h-4 w-4 mr-2" />
                Nous contacter
              </Link>
            </Button>
          </div>

          {/* Back link */}
          <div className="mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la page précédente
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <Link href="/legal" className="hover:text-foreground transition-colors">
            Mentions légales
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Confidentialité
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
