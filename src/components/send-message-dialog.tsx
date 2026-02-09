"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { FormFieldError } from "@/components/ui/form-field-error";
import { prospectingTemplates, messageTypeConfig } from "@/lib/constants";
import { replaceTemplateVariables } from "@/lib/email/templates";
import type { Client, ClientContact, MessageType } from "@/types/database";

const CLIENT_EMAIL_ID = "__client__";

interface Recipient {
  id: string;
  name: string;
  email: string;
  isClient?: boolean;
}

interface SendMessageDialogProps {
  client: Client;
  contacts: ClientContact[];
  onMessageSent?: () => void;
  trigger?: React.ReactNode;
}

export function SendMessageDialog({
  client,
  contacts,
  onMessageSent,
  trigger,
}: SendMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>("");
  const [messageType, setMessageType] = useState<MessageType>("prospecting");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
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

  // Build list of recipients: client email + contacts with email
  const recipients = useMemo(() => {
    const list: Recipient[] = [];

    // Add client email as first option
    if (client.email) {
      list.push({
        id: CLIENT_EMAIL_ID,
        name: client.name,
        email: client.email,
        isClient: true,
      });
    }

    // Add contacts with email
    contacts.forEach((c) => {
      if (c.email) {
        list.push({
          id: c.id,
          name: c.name,
          email: c.email,
        });
      }
    });

    return list;
  }, [client, contacts]);


  // Extract first name from name
  const getFirstName = (name: string) => {
    return name.split(" ")[0];
  };

  // Apply template with variables
  const applyTemplate = (type: MessageType) => {
    const template = type === "followup"
      ? prospectingTemplates.followup
      : prospectingTemplates.default;

    const recipient = recipients.find((r) => r.id === selectedRecipientId);

    const variables = {
      nom: recipient?.name || "",
      prenom: recipient ? getFirstName(recipient.name) : "",
      entreprise: client.name,
      email: recipient?.email || "",
      website: client.website || "",
    };

    setSubject(replaceTemplateVariables(template.subject, variables));
    setContent(replaceTemplateVariables(template.content, variables));
  };

  // Initialize with template when dialog opens or recipient changes
  useEffect(() => {
    if (open && selectedRecipientId) {
      applyTemplate(messageType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedRecipientId]);

  // Update template when type changes
  const handleTypeChange = (type: MessageType) => {
    setMessageType(type);
    if (type !== "custom") {
      applyTemplate(type);
    }
  };

  // Auto-select first recipient
  useEffect(() => {
    if (open && recipients.length > 0 && !selectedRecipientId) {
      // Prefer primary contact if they have email
      const primaryContact = contacts.find((c) => c.is_primary && c.email);
      if (primaryContact) {
        setSelectedRecipientId(primaryContact.id);
      } else {
        setSelectedRecipientId(recipients[0].id);
      }
    }
  }, [open, recipients, contacts, selectedRecipientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!selectedRecipientId) newErrors.recipient = "Selectionnez un destinataire";
    if (!subject.trim()) newErrors.subject = "Le sujet est requis";
    if (!content.trim()) newErrors.content = "Le contenu est requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const isClientEmail = selectedRecipientId === CLIENT_EMAIL_ID;

      const response = await fetch(`/api/clients/${client.id}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contact_id: isClientEmail ? null : selectedRecipientId,
          recipient_email: isClientEmail ? client.email : null,
          recipient_name: isClientEmail ? client.name : null,
          subject,
          content,
          message_type: messageType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }

      toast.success("Message envoyé");
      setOpen(false);

      // Reset form
      setSubject("");
      setContent("");
      setMessageType("prospecting");

      onMessageSent?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'envoi"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubject("");
    setContent("");
    setSelectedRecipientId("");
    setMessageType("prospecting");
    setErrors({});
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && (subject.trim() || content.trim())) {
      setShowCloseConfirm(true);
      return;
    }
    setOpen(newOpen);
    if (!newOpen) resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Mail className="h-4 w-4 mr-2" />
            Envoyer un message
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Envoyer un message</DialogTitle>
          <DialogDescription>
            Envoyer un email à {client.name}
          </DialogDescription>
        </DialogHeader>

        {recipients.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune adresse email disponible</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact">Destinataire <span className="text-destructive">*</span></Label>
                <Select
                  value={selectedRecipientId}
                  onValueChange={(v) => { setSelectedRecipientId(v); clearError("recipient"); }}
                >
                  <SelectTrigger className="w-full" aria-invalid={!!errors.recipient}>
                    <SelectValue placeholder="Selectionner un destinataire" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipients.map((recipient) => (
                      <SelectItem key={recipient.id} value={recipient.id}>
                        {recipient.name} ({recipient.email})
                        {recipient.isClient && " - Principal"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormFieldError error={errors.recipient} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type de message</Label>
                <Select
                  value={messageType}
                  onValueChange={(v) => handleTypeChange(v as MessageType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(messageTypeConfig).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Sujet <span className="text-destructive">*</span></Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => { setSubject(e.target.value); clearError("subject"); }}
                placeholder="Sujet de l'email"
                aria-invalid={!!errors.subject}
              />
              <FormFieldError error={errors.subject} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Message <span className="text-destructive">*</span></Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => { setContent(e.target.value); clearError("content"); }}
                placeholder="Contenu du message..."
                rows={10}
                aria-invalid={!!errors.content}
              />
              <FormFieldError error={errors.content} />
              <p className="text-xs text-muted-foreground">
                Variables disponibles : {"{{nom}}"}, {"{{prenom}}"}, {"{{entreprise}}"}, {"{{email}}"}
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Envoyer
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
        )}
      </DialogContent>

      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Modifications non sauvegardées</AlertDialogTitle>
            <AlertDialogDescription>
              Votre message n&apos;a pas été envoyé. Voulez-vous vraiment fermer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuer l&apos;édition</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setOpen(false); resetForm(); }}>
              Fermer sans envoyer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
