"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { Client } from "@/types/database";

interface InviteClientButtonProps {
  client: Client;
  onInvited?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function InviteClientButton({
  client,
  onInvited,
  variant = "default",
  size = "default",
}: InviteClientButtonProps) {
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isAlreadyInvited = !!client.profile_id;

  const handleInvite = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/clients/${client.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'invitation");
      }

      toast.success(`Invitation envoyée à ${client.email}`);
      setDialogOpen(false);

      if (onInvited) {
        onInvited();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'invitation"
      );
    } finally {
      setLoading(false);
    }
  };

  if (isAlreadyInvited) {
    return (
      <Button variant="outline" size={size} disabled>
        <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
        Déjà invité
      </Button>
    );
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setDialogOpen(true)}
      >
        <Mail className="h-4 w-4 mr-2" />
        Inviter au portail
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter {client.name} au portail</DialogTitle>
            <DialogDescription>
              Un email d&apos;invitation sera envoyé pour créer un compte et accéder au portail client.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Destinataire:</span>
                <span className="font-medium">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Telephone:</span>
                  <span>{client.phone}</span>
                </div>
              )}
            </div>

            {client.status === "lead" && (
              <div className="flex items-start gap-2 text-sm text-status-warning-text bg-status-warning-bg rounded-lg p-3">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <p>
                  Ce client est encore au statut &quot;Lead&quot;. Son statut passera
                  automatiquement a &quot;En projet&quot; apres l&apos;invitation.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleInvite} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="mr-2 h-4 w-4" />
                )}
                Envoyer l&apos;invitation
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={loading}
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
