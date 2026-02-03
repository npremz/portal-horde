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
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { userRoleConfig } from "@/lib/constants";
import { validateEmail, validateName } from "@/lib/validation";
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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const nameResult = validateName(formData.full_name);
    if (!nameResult.valid) {
      toast.error(nameResult.error);
      return;
    }

    const emailResult = validateEmail(formData.email);
    if (!emailResult.valid) {
      toast.error(emailResult.error);
      return;
    }

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
        throw new Error(data.error || "Erreur lors de la creation");
      }

      toast.success(
        `Invitation envoyee a ${emailResult.sanitized}`,
        { description: `Role: ${userRoleConfig[formData.role].label}` }
      );
      setFormData(emptyForm);
      setOpen(false);

      if (onUserCreated) {
        onUserCreated();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la creation"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setFormData(emptyForm);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            Un email d&apos;invitation sera envoye a l&apos;utilisateur.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user_name">Nom complet *</Label>
            <Input
              id="user_name"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user_email">Email *</Label>
            <Input
              id="user_email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="jean@exemple.com"
              required
            />
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
              onClick={() => setOpen(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
