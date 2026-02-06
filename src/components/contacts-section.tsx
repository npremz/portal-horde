"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Edit2,
  Mail,
  Phone,
  Star,
  Loader2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { FormFieldError } from "@/components/ui/form-field-error";
import { contactRoleConfig } from "@/lib/constants";
import { validateEmail, validatePhone, validateName, validateNotes } from "@/lib/validation";
import type { ClientContact, ContactRole } from "@/types/database";

interface ContactsSectionProps {
  contacts: ClientContact[];
  onAddContact: (contact: Omit<ClientContact, "id" | "client_id" | "created_at">) => Promise<void>;
  onUpdateContact: (id: string, contact: Partial<ClientContact>) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
  onSetPrimary: (id: string) => Promise<void>;
}

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  role: ContactRole;
  is_primary: boolean;
  notes: string;
}

const emptyForm: ContactFormData = {
  name: "",
  email: "",
  phone: "",
  role: "other",
  is_primary: false,
  notes: "",
};

export function ContactsSection({
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  onSetPrimary,
}: ContactsSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ClientContact | null>(null);
  const [contactToDelete, setContactToDelete] = useState<ClientContact | null>(null);
  const [formData, setFormData] = useState<ContactFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [initialFormData, setInitialFormData] = useState<ContactFormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const openAddDialog = () => {
    setEditingContact(null);
    setFormData(emptyForm);
    setInitialFormData(emptyForm);
    setErrors({});
    setDialogOpen(true);
  };

  const openEditDialog = (contact: ClientContact) => {
    setEditingContact(contact);
    const editData: ContactFormData = {
      name: contact.name,
      email: contact.email || "",
      phone: contact.phone || "",
      role: contact.role,
      is_primary: contact.is_primary,
      notes: contact.notes || "",
    };
    setFormData(editData);
    setInitialFormData(editData);
    setErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    const nameResult = validateName(formData.name);
    if (!nameResult.valid) {
      newErrors.name = nameResult.error!;
    }

    let emailSanitized = formData.email;
    if (formData.email) {
      const emailResult = validateEmail(formData.email);
      if (!emailResult.valid) {
        newErrors.email = emailResult.error!;
      } else {
        emailSanitized = emailResult.sanitized;
      }
    }

    let phoneSanitized = formData.phone;
    if (formData.phone) {
      const phoneResult = validatePhone(formData.phone);
      if (!phoneResult.valid) {
        newErrors.phone = phoneResult.error!;
      } else {
        phoneSanitized = phoneResult.sanitized ?? "";
      }
    }

    const notesResult = validateNotes(formData.notes || null);
    if (!notesResult.valid) {
      newErrors.notes = notesResult.error!;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const contactData = {
        name: nameResult.sanitized,
        email: emailSanitized || null,
        phone: phoneSanitized || null,
        role: formData.role,
        is_primary: formData.is_primary,
        notes: notesResult.sanitized,
      };

      if (editingContact) {
        await onUpdateContact(editingContact.id, contactData);
        toast.success("Contact mis a jour");
      } else {
        await onAddContact(contactData);
        toast.success("Contact ajoute");
      }

      setDialogOpen(false);
      setFormData(emptyForm);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'operation"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contact: ClientContact) => {
    try {
      await onDeleteContact(contact.id);
      toast.success("Contact supprime");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    } finally {
      setContactToDelete(null);
    }
  };

  const handleSetPrimary = async (contact: ClientContact) => {
    try {
      await onSetPrimary(contact.id);
      toast.success(`${contact.name} est maintenant le contact principal`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'operation"
      );
    }
  };

  // Sort contacts: primary first, then by name
  const sortedContacts = [...contacts].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contacts ({contacts.length})</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(newOpen) => {
          if (!newOpen && JSON.stringify(formData) !== JSON.stringify(initialFormData)) {
            setShowCloseConfirm(true);
            return;
          }
          setDialogOpen(newOpen);
        }}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingContact ? "Modifier le contact" : "Nouveau contact"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Nom *</Label>
                <Input
                  id="contact_name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  onFocus={() => clearError("name")}
                  placeholder="Jean Dupont"
                  aria-invalid={!!errors.name}
                  required
                />
                <FormFieldError error={errors.name} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    onFocus={() => clearError("email")}
                    placeholder="jean@exemple.com"
                    aria-invalid={!!errors.email}
                  />
                  <FormFieldError error={errors.email} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Telephone</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    onFocus={() => clearError("phone")}
                    placeholder="+33 6 12 34 56 78"
                    aria-invalid={!!errors.phone}
                  />
                  <FormFieldError error={errors.phone} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: ContactRole) =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(contactRoleConfig).map(([role, config]) => (
                      <SelectItem key={role} value={role}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_notes">Notes</Label>
                <Textarea
                  id="contact_notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  onFocus={() => clearError("notes")}
                  placeholder="Notes sur ce contact..."
                  aria-invalid={!!errors.notes}
                  rows={2}
                />
                <FormFieldError error={errors.notes} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {editingContact ? "Enregistrer" : "Ajouter"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {sortedContacts.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            <User className="h-10 w-10 mx-auto mb-2" />
            <p>Aucun contact</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedContacts.map((contact, index) => (
              <div key={contact.id}>
                {index > 0 && <Separator className="my-3" />}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{contact.name}</span>
                        {contact.is_primary && (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            Principal
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {contactRoleConfig[contact.role].label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-1 hover:text-foreground"
                          >
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </a>
                        )}
                      </div>
                      {contact.notes && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {contact.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {!contact.is_primary && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleSetPrimary(contact)}
                        title="Definir comme principal"
                        aria-label="Definir comme principal"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(contact)}
                      title="Modifier"
                      aria-label="Modifier le contact"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setContactToDelete(contact)}
                      title="Supprimer"
                      aria-label="Supprimer le contact"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le contact</AlertDialogTitle>
            <AlertDialogDescription>
              Supprimer le contact {contactToDelete?.name} ? Cette action est irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => contactToDelete && handleDelete(contactToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non sauvegardees</AlertDialogTitle>
            <AlertDialogDescription>
              Le formulaire contient des donnees non sauvegardees. Voulez-vous vraiment fermer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer l&apos;edition</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setDialogOpen(false); setFormData(emptyForm); }}>
              Fermer sans sauvegarder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
