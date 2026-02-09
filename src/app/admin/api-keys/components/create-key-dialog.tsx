"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2, Copy, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { FormFieldError } from "@/components/ui/form-field-error";
import { validateName } from "@/lib/validation";
import { KeyPermissions } from "./key-permissions";
import type { ApiPermission } from "@/types/database";

interface CreateKeyDialogProps {
  onKeyCreated?: () => void;
}

interface FormData {
  name: string;
  permissions: ApiPermission[];
  expires_at: string;
}

const emptyForm: FormData = {
  name: "",
  permissions: [],
  expires_at: "",
};

export function CreateKeyDialog({ onKeyCreated }: CreateKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    const nameResult = validateName(formData.name);
    if (!nameResult.valid) {
      newErrors.name = nameResult.error!;
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = "Sélectionnez au moins une permission";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameResult.sanitized,
          permissions: formData.permissions,
          expires_at: formData.expires_at || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      // Show the key (only time it will be shown)
      setCreatedKey(data.data.key);
      toast.success("Clé API créée");

      if (onKeyCreated) {
        onKeyCreated();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!createdKey) return;

    try {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      toast.success("Clé copiée");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFormData(emptyForm);
      setCreatedKey(null);
      setCopied(false);
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle clé API
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>Clé API créée</DialogTitle>
              <DialogDescription>
                Copiez cette clé maintenant. Elle ne sera plus jamais affichée.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Conservez cette cle en lieu sur. Vous ne pourrez plus la voir.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  value={createdKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  aria-label="Copier la clé"
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Button
                className="w-full"
                onClick={() => handleOpenChange(false)}
              >
                J&apos;ai copie ma cle
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Creer une cle API</DialogTitle>
              <DialogDescription>
                La cle sera affichee une seule fois apres creation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key_name">Nom *</Label>
                <Input
                  id="key_name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  onFocus={() => clearError("name")}
                  placeholder="Bot CRM, Agent Prospection..."
                  aria-invalid={!!errors.name}
                  required
                />
                <FormFieldError error={errors.name} />
              </div>

              <div className="space-y-2">
                <Label>Permissions *</Label>
                <KeyPermissions
                  value={formData.permissions}
                  onChange={(permissions) => {
                    setFormData({ ...formData, permissions });
                    clearError("permissions");
                  }}
                />
                <FormFieldError error={errors.permissions} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key_expires">Expiration (optionnel)</Label>
                <Input
                  id="key_expires"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) =>
                    setFormData({ ...formData, expires_at: e.target.value })
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
                <p className="text-xs text-muted-foreground">
                  Laisser vide pour une cle sans expiration
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Créer la clé
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
