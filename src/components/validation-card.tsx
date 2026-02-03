"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface ValidationCardProps {
  onValidate: (approved: boolean, comment?: string) => Promise<void>;
  disabled?: boolean;
}

export function ValidationCard({ onValidate, disabled = false }: ValidationCardProps) {
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);
  const [confirmRevisionOpen, setConfirmRevisionOpen] = useState(false);
  const [revisionComment, setRevisionComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    await onValidate(true);
    setLoading(false);
    setConfirmApproveOpen(false);
  }

  async function handleRequestRevision() {
    setLoading(true);
    await onValidate(false, revisionComment);
    setLoading(false);
    setConfirmRevisionOpen(false);
    setRevisionComment("");
  }

  return (
    <>
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="p-4">
          <p className="font-medium">Ce livrable attend votre validation</p>
          <p className="text-sm text-muted-foreground mb-3">
            Vérifiez les fichiers et validez ou demandez des modifications
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmRevisionOpen(true)}
              disabled={disabled}
              className="flex-1 sm:flex-none"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Demander révision
            </Button>
            <Button
              onClick={() => setConfirmApproveOpen(true)}
              disabled={disabled}
              className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Valider
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation dialog - Approve */}
      <Dialog open={confirmApproveOpen} onOpenChange={setConfirmApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la validation</DialogTitle>
            <DialogDescription>
              Vous confirmez que ce livrable correspond à vos attentes et qu&apos;il peut être considéré comme validé.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmApproveOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Confirmer la validation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog - Revision */}
      <Dialog open={confirmRevisionOpen} onOpenChange={(open) => {
        setConfirmRevisionOpen(open);
        if (!open) setRevisionComment("");
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une révision</DialogTitle>
            <DialogDescription>
              Expliquez les modifications souhaitées pour aider l&apos;équipe à comprendre vos attentes.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Décrivez les modifications souhaitées (optionnel)..."
            value={revisionComment}
            onChange={(e) => setRevisionComment(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            Si vous ne remplissez pas ce champ, nous vous contacterons directement.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRevisionOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleRequestRevision}
              disabled={loading}
              variant="destructive"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Demander révision
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
