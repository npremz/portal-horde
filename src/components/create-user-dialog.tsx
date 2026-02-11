"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { userRoleConfig } from "@/lib/constants";
import { validateEmail, validateName } from "@/lib/validation";
import { FormFieldError } from "@/components/ui/form-field-error";
import { useFormDialog } from "@/lib/hooks/use-form-dialog";
import type { UserRole } from "@/types/database";

interface CreateUserDialogProps {
  onUserCreated?: () => void;
}

interface FormData {
  email: string;
  full_name: string;
  role: UserRole;
  company: string;
}

const emptyForm: FormData = {
  email: "",
  full_name: "",
  role: "client",
  company: "",
};

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const {
    errors, setErrors, clearError,
    loading, setLoading,
    showCloseConfirm, setShowCloseConfirm,
    handleOpenChange,
    confirmClose,
  } = useFormDialog<FormData>({
    initialData: emptyForm,
    onOpenChange: (newOpen) => {
      setOpen(newOpen);
      if (!newOpen) setFormData(emptyForm);
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    const nameResult = validateName(formData.full_name);
    if (!nameResult.valid) newErrors.full_name = nameResult.error!;

    const emailResult = validateEmail(formData.email);
    if (!emailResult.valid) newErrors.email = emailResult.error!;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailResult.sanitized,
          full_name: nameResult.sanitized,
          role: formData.role,
          company: formData.company || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création");
      }

      toast.success(
        `Invitation envoyée à ${emailResult.sanitized}`,
        { description: `Rôle : ${userRoleConfig[formData.role].label}` }
      );
      setFormData(emptyForm);
      setOpen(false);

      if (onUserCreated) {
        onUserCreated();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => handleOpenChange(newOpen, formData)}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un utilisateur</DialogTitle>
          <DialogDescription>
            Un email d&apos;invitation sera envoyé à l&apos;utilisateur.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_name">Nom complet <span className="text-destructive">*</span></Label>
            <Input
              id="user_name"
              value={formData.full_name}
              onChange={(e) => {
                setFormData({ ...formData, full_name: e.target.value });
                clearError("full_name");
              }}
              placeholder="Jean Dupont"
              aria-invalid={!!errors.full_name}
              aria-describedby={errors.full_name ? "user_name-error" : undefined}
            />
            <FormFieldError id="user_name-error" error={errors.full_name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_email">Email <span className="text-destructive">*</span></Label>
            <Input
              id="user_email"
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                clearError("email");
              }}
              placeholder="jean@exemple.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "user_email-error" : undefined}
            />
            <FormFieldError id="user_email-error" error={errors.email} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: UserRole) =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(userRoleConfig).map(([role, config]) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex flex-col">
                      <span>{config.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {config.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_company">Entreprise</Label>
            <Input
              id="user_company"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
              placeholder="Nom de l&apos;entreprise (optionnel)"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Envoyer l&apos;invitation
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false, formData)}
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non sauvegardées</AlertDialogTitle>
            <AlertDialogDescription>
              Le formulaire contient des données non sauvegardées. Voulez-vous vraiment fermer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer l&apos;édition</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>
              Fermer sans sauvegarder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
