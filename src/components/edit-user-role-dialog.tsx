"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/dialog";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { userRoleConfig } from "@/lib/constants";
import type { UserRole } from "@/types/database";

interface EditUserRoleDialogProps {
  user: {
    id: string;
    email: string;
    full_name: string | null;
    role: UserRole;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserUpdated?: () => void;
  isCurrentUser?: boolean;
}

export function EditUserRoleDialog({
  user,
  open,
  onOpenChange,
  onUserUpdated,
  isCurrentUser,
}: EditUserRoleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);

  const handleUpdate = async () => {
    if (selectedRole === user.role) {
      onOpenChange(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      toast.success(
        `Rôle de ${user.full_name || user.email} mis à jour`,
        { description: `Nouveau rôle : ${userRoleConfig[selectedRole].label}` }
      );
      onOpenChange(false);

      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la mise à jour"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setSelectedRole(user.role);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le role</DialogTitle>
          <DialogDescription>
            Changez le role de {user.full_name || user.email}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{user.full_name || "Sans nom"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>

          {isCurrentUser ? (
            <div className="p-3 border border-status-warning-border bg-status-warning-bg rounded-lg">
              <p className="text-sm text-status-warning-text">
                Vous ne pouvez pas modifier votre propre rôle.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit_role">Nouveau role</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value: UserRole) => setSelectedRole(value)}
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

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleUpdate}
                  disabled={loading || selectedRole === user.role}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 h-4 w-4" />
                  )}
                  Mettre a jour
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Annuler
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
