"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, Globe, Linkedin, Instagram, Facebook, Twitter } from "lucide-react";
import { toast } from "sonner";
import { clientStatusConfig, projectTypes, sectors } from "@/lib/constants";
import {
  validateEmail,
  validatePhone,
  validateWebsite,
  validateNotes,
  validateName,
} from "@/lib/validation";
import { FormFieldError } from "@/components/ui/form-field-error";
import type { Client, ClientStatus } from "@/types/database";

interface ClientFormProps {
  client?: Client;
  onSave: (data: ClientFormData) => Promise<void>;
  onCancel?: () => void;
}

export interface ClientFormData {
  name: string;
  email: string;
  phone: string | null;
  website: string | null;
  socials: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  status: ClientStatus;
  project_type: string | null;
  sector: string | null;
  notes: string | null;
}

export function ClientForm({ client, onSave, onCancel }: ClientFormProps) {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const [formData, setFormData] = useState<ClientFormData>({
    name: client?.name || "",
    email: client?.email || "",
    phone: client?.phone || "",
    website: client?.website || "",
    socials: client?.socials || {},
    status: client?.status || "lead",
    project_type: client?.project_type || "",
    sector: client?.sector || "",
    notes: client?.notes || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
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
      const firstErrorField = Object.keys(newErrors)[0];
      const el = document.getElementById(firstErrorField);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await onSave({
        name: nameResult.sanitized,
        email: emailResult.sanitized,
        phone: phoneResult.sanitized,
        website: websiteResult.sanitized,
        socials: formData.socials,
        status: formData.status,
        project_type: formData.project_type || null,
        sector: formData.sector || null,
        notes: notesResult.sanitized,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'enregistrement"
      );
    } finally {
      setLoading(false);
    }
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informations principales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom / Entreprise <span className="text-destructive">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  clearError("name");
                }}
                placeholder="Nom du client ou de l'entreprise"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              <FormFieldError id="name-error" error={errors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  clearError("email");
                }}
                placeholder="contact@entreprise.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              <FormFieldError id="email-error" error={errors.email} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telephone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  clearError("phone");
                }}
                placeholder="+33 6 12 34 56 78"
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
              <FormFieldError id="phone-error" error={errors.phone} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
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
              <Label htmlFor="project_type">Type de projet</Label>
              <Select
                value={formData.project_type || ""}
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
              <Label htmlFor="sector">Secteur</Label>
              <Select
                value={formData.sector || ""}
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
            <Label htmlFor="website">Site web</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="website"
                type="url"
                value={formData.website || ""}
                onChange={(e) => {
                  setFormData({ ...formData, website: e.target.value });
                  clearError("website");
                }}
                placeholder="https://exemple.com"
                className="pl-10"
                aria-invalid={!!errors.website}
                aria-describedby={errors.website ? "website-error" : undefined}
              />
            </div>
            <FormFieldError id="website-error" error={errors.website} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Réseaux sociaux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="linkedin"
                  type="url"
                  value={formData.socials.linkedin || ""}
                  onChange={(e) => updateSocial("linkedin", e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <div className="relative">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="instagram"
                  type="url"
                  value={formData.socials.instagram || ""}
                  onChange={(e) => updateSocial("instagram", e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="facebook">Facebook</Label>
              <div className="relative">
                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="facebook"
                  type="url"
                  value={formData.socials.facebook || ""}
                  onChange={(e) => updateSocial("facebook", e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitter">Twitter / X</Label>
              <div className="relative">
                <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="twitter"
                  type="url"
                  value={formData.socials.twitter || ""}
                  onChange={(e) => updateSocial("twitter", e.target.value)}
                  placeholder="https://twitter.com/..."
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes internes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="notes"
            value={formData.notes || ""}
            onChange={(e) => {
              setFormData({ ...formData, notes: e.target.value });
              clearError("notes");
            }}
            placeholder="Notes internes (visibles uniquement par les admins)..."
            rows={4}
            aria-invalid={!!errors.notes}
            aria-describedby={errors.notes ? "notes-error" : undefined}
          />
          <FormFieldError id="notes-error" error={errors.notes} />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {client ? "Enregistrer" : "Créer le client"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
      </div>
    </form>
  );
}
