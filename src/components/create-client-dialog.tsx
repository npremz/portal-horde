"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Separator } from "@/components/ui/separator";
import { UserPlus, Loader2, Globe, Linkedin, Instagram, Facebook, Twitter } from "lucide-react";
import { toast } from "sonner";
import { clientStatusConfig, projectTypes, sectors } from "@/lib/constants";
import {
  validateEmail,
  validatePhone,
  validateName,
  validateWebsite,
  validateNotes,
} from "@/lib/validation";
import { FormFieldError } from "@/components/ui/form-field-error";
import type { ClientStatus } from "@/types/database";

interface CreateClientDialogProps {
  onClientCreated?: (clientId: string) => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  website: string;
  status: ClientStatus;
  project_type: string;
  sector: string;
  notes: string;
  socials: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
}

const emptyForm: FormData = {
  name: "",
  email: "",
  phone: "",
  website: "",
  status: "lead",
  project_type: "",
  sector: "",
  notes: "",
  socials: {},
};

export function CreateClientDialog({ onClientCreated }: CreateClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateSocial = (key: string, value: string) => {
    setFormData({
      ...formData,
      socials: {
        ...formData.socials,
        [key]: value || undefined,
      },
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields and collect errors
    const newErrors: Record<string, string> = {};

    const nameResult = validateName(formData.name);
    if (!nameResult.valid) newErrors.name = nameResult.error!;

    const emailResult = validateEmail(formData.email);
    if (!emailResult.valid) newErrors.email = emailResult.error!;

    const phoneResult = validatePhone(formData.phone || null);
    if (!phoneResult.valid) newErrors.phone = phoneResult.error!;

    const websiteResult = validateWebsite(formData.website || null);
    if (!websiteResult.valid) newErrors.website = websiteResult.error!;

    const notesResult = validateNotes(formData.notes || null);
    if (!notesResult.valid) newErrors.notes = notesResult.error!;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("clients")
        .insert({
          name: nameResult.sanitized,
          email: emailResult.sanitized,
          phone: phoneResult.sanitized,
          website: websiteResult.sanitized,
          status: formData.status,
          project_type: formData.project_type || null,
          sector: formData.sector || null,
          notes: notesResult.sanitized,
          socials: formData.socials,
        })
        .select("id")
        .single();

      if (error) {
        if (error.code === "23505") {
          throw new Error("Un client avec cet email existe déjà");
        }
        throw error;
      }

      toast.success(`Client "${nameResult.sanitized}" créé`);
      setFormData(emptyForm);
      setOpen(false);

      if (onClientCreated && data) {
        onClientCreated(data.id);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la création"
      );
    } finally {
      setLoading(false);
    }
  };

  const isDirty = () => JSON.stringify(formData) !== JSON.stringify(emptyForm);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isDirty()) {
      setShowCloseConfirm(true);
      return;
    }
    setOpen(newOpen);
    if (!newOpen) {
      setFormData(emptyForm);
      setErrors({});
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouveau client</DialogTitle>
          <DialogDescription>
            Ajoutez un client au CRM avec toutes ses informations.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-6">
          {/* Informations principales */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Informations principales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_name">Nom / Entreprise <span className="text-destructive">*</span></Label>
                <Input
                  id="client_name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    clearError("name");
                  }}
                  placeholder="Nom du client"
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "client_name-error" : undefined}
                />
                <FormFieldError id="client_name-error" error={errors.name} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_email">Email <span className="text-destructive">*</span></Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    clearError("email");
                  }}
                  placeholder="contact@entreprise.com"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "client_email-error" : undefined}
                />
                <FormFieldError id="client_email-error" error={errors.email} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_phone">Telephone</Label>
                <Input
                  id="client_phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    clearError("phone");
                  }}
                  placeholder="+33 6 12 34 56 78"
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "client_phone-error" : undefined}
                />
                <FormFieldError id="client_phone-error" error={errors.phone} />
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

              <div className="space-y-2">
                <Label htmlFor="client_project_type">Type de projet</Label>
                <Select
                  value={formData.project_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, project_type: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_sector">Secteur</Label>
                <Select
                  value={formData.sector}
                  onValueChange={(value) =>
                    setFormData({ ...formData, sector: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_website">Site web</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client_website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => {
                    setFormData({ ...formData, website: e.target.value });
                    clearError("website");
                  }}
                  placeholder="https://exemple.com"
                  className="pl-10"
                  aria-invalid={!!errors.website}
                  aria-describedby={errors.website ? "client_website-error" : undefined}
                />
              </div>
              <FormFieldError id="client_website-error" error={errors.website} />
            </div>
          </div>

          <Separator />

          {/* Reseaux sociaux */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Réseaux sociaux</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client_linkedin">LinkedIn</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="client_linkedin"
                    type="url"
                    value={formData.socials.linkedin || ""}
                    onChange={(e) => updateSocial("linkedin", e.target.value)}
                    placeholder="https://linkedin.com/company/..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="client_instagram"
                    type="url"
                    value={formData.socials.instagram || ""}
                    onChange={(e) => updateSocial("instagram", e.target.value)}
                    placeholder="https://instagram.com/..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_facebook">Facebook</Label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="client_facebook"
                    type="url"
                    value={formData.socials.facebook || ""}
                    onChange={(e) => updateSocial("facebook", e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_twitter">Twitter / X</Label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="client_twitter"
                    type="url"
                    value={formData.socials.twitter || ""}
                    onChange={(e) => updateSocial("twitter", e.target.value)}
                    placeholder="https://twitter.com/..."
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Notes internes</h3>
            <Textarea
              id="client_notes"
              value={formData.notes}
              onChange={(e) => {
                setFormData({ ...formData, notes: e.target.value });
                clearError("notes");
              }}
              placeholder="Notes internes (visibles uniquement par les admins)..."
              rows={3}
              aria-invalid={!!errors.notes}
              aria-describedby={errors.notes ? "client_notes-error" : undefined}
            />
            <FormFieldError id="client_notes-error" error={errors.notes} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Créer le client
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
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
            <AlertDialogAction onClick={() => { setOpen(false); setFormData(emptyForm); setErrors({}); }}>
              Fermer sans sauvegarder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
