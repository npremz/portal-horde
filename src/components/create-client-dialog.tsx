"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { clientStatusConfig } from "@/lib/constants";
import { validateEmail, validatePhone, validateName } from "@/lib/validation";
import type { ClientStatus } from "@/types/database";

interface CreateClientDialogProps {
  onClientCreated?: (clientId: string) => void;
}

export function CreateClientDialog({ onClientCreated }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    status: "lead" as ClientStatus,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const nameResult = validateName(formData.name);
    if (!nameResult.valid) {
      toast.error(nameResult.error);
      return;
    }

    const emailResult = validateEmail(formData.email);
    if (!emailResult.valid) {
      toast.error(emailResult.error);
      return;
    }

    const phoneResult = validatePhone(formData.phone || null);
    if (!phoneResult.valid) {
      toast.error(phoneResult.error);
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("clients")
        .insert({
          name: nameResult.sanitized,
          email: emailResult.sanitized,
          phone: phoneResult.sanitized,
          status: formData.status,
        })
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Un client avec cet email existe deja");
        }
        throw error;
      }

      toast.success(`Client "${nameResult.sanitized}" cree`);
      setFormData({ name: "", email: "", phone: "", status: "lead" });
      setOpen(false);

      if (onClientCreated && data) {
        onClientCreated(data.id);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la creation"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Creer un nouveau client</DialogTitle>
          <DialogDescription>
            Ajoutez un client au CRM. Vous pourrez l'inviter au portail plus tard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_name">Nom / Entreprise *</Label>
            <Input
              id="client_name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nom du client"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_email">Email *</Label>
            <Input
              id="client_email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="contact@entreprise.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_phone">Telephone</Label>
            <Input
              id="client_phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+33 6 12 34 56 78"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value: ClientStatus) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(clientStatusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${config.dotColor}`} />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Creer le client
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
