"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Mail,
  Phone,
  Globe,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  Edit2,
  Trash2,
  FolderOpen,
  Plus,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { ClientForm, type ClientFormData } from "@/components/client-form";
import { ContactsSection } from "@/components/contacts-section";
import { InviteClientButton } from "@/components/invite-client-button";
import { SendMessageDialog } from "@/components/send-message-dialog";
import { MessagesTimeline } from "@/components/messages-timeline";
import { clientStatusConfig, projectStatusConfig } from "@/lib/constants";
import { hasPermission } from "@/lib/permissions";
import type { Client, ClientContact, ClientMessage, Project, UserRole } from "@/types/database";

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [contacts, setContacts] = useState<ClientContact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const fetchClient = useCallback(async () => {
    const supabase = createClient();

    // Get current user's role
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile) {
        setUserRole(profile.role as UserRole);
      }
    }

    const [clientRes, contactsRes, projectsRes, messagesRes] = await Promise.all([
      supabase.from("clients").select("*").eq("id", clientId).single(),
      supabase
        .from("client_contacts")
        .select("*")
        .eq("client_id", clientId)
        .order("is_primary", { ascending: false })
        .order("name"),
      supabase
        .from("projects")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("client_messages")
        .select("*, contact:client_contacts(*)")
        .eq("client_id", clientId)
        .order("sent_at", { ascending: false }),
    ]);

    if (clientRes.data) {
      setClient(clientRes.data);
    }
    if (contactsRes.data) {
      setContacts(contactsRes.data);
    }
    if (projectsRes.data) {
      setProjects(projectsRes.data);
    }
    if (messagesRes.data) {
      setMessages(messagesRes.data);
    }

    setLoading(false);
  }, [clientId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchClient();
  }, [fetchClient]);

  const handleSaveClient = async (data: ClientFormData) => {
    const supabase = createClient();

    const { error } = await supabase
      .from("clients")
      .update({
        name: data.name,
        email: data.email,
        phone: data.phone,
        website: data.website,
        socials: data.socials,
        status: data.status,
        project_type: data.project_type,
        sector: data.sector,
        notes: data.notes,
      })
      .eq("id", clientId);

    if (error) {
      if (error.code === "23505") {
        throw new Error("Un client avec cet email existe deja");
      }
      throw error;
    }

    toast.success("Client mis a jour");
    setEditing(false);
    fetchClient();
  };

  const handleDeleteClient = async () => {
    if (!confirm("Supprimer ce client ? Cette action est irreversible.")) return;

    const supabase = createClient();
    const { error } = await supabase.from("clients").delete().eq("id", clientId);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Client supprime");
    router.push("/admin/clients");
  };

  // Contact handlers
  const handleAddContact = async (contact: Omit<ClientContact, "id" | "client_id" | "created_at">) => {
    const supabase = createClient();

    // If this contact is primary, unset other primary contacts
    if (contact.is_primary) {
      await supabase
        .from("client_contacts")
        .update({ is_primary: false })
        .eq("client_id", clientId);
    }

    const { error } = await supabase.from("client_contacts").insert({
      client_id: clientId,
      ...contact,
    });

    if (error) throw error;
    fetchClient();
  };

  const handleUpdateContact = async (id: string, contact: Partial<ClientContact>) => {
    const supabase = createClient();

    // If setting as primary, unset other primary contacts
    if (contact.is_primary) {
      await supabase
        .from("client_contacts")
        .update({ is_primary: false })
        .eq("client_id", clientId)
        .neq("id", id);
    }

    const { error } = await supabase
      .from("client_contacts")
      .update(contact)
      .eq("id", id);

    if (error) throw error;
    fetchClient();
  };

  const handleDeleteContact = async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("client_contacts").delete().eq("id", id);
    if (error) throw error;
    fetchClient();
  };

  const handleSetPrimaryContact = async (id: string) => {
    const supabase = createClient();

    // Unset all primary
    await supabase
      .from("client_contacts")
      .update({ is_primary: false })
      .eq("client_id", clientId);

    // Set new primary
    const { error } = await supabase
      .from("client_contacts")
      .update({ is_primary: true })
      .eq("id", id);

    if (error) throw error;
    fetchClient();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <p className="text-muted-foreground mb-4">Client introuvable</p>
        <Button asChild>
          <Link href="/admin/clients">Retour aux clients</Link>
        </Button>
      </div>
    );
  }

  const statusConfig = clientStatusConfig[client.status];
  const canSendMessages = hasPermission(userRole ?? undefined, "messages.send");
  const canInviteClients = hasPermission(userRole ?? undefined, "clients.invite");
  const canDeleteClients = hasPermission(userRole ?? undefined, "clients.delete");

  if (editing) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2"
            onClick={() => setEditing(false)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <h1 className="text-2xl md:text-3xl font-display uppercase">
            Modifier {client.name}
          </h1>
        </div>
        <ClientForm
          client={client}
          onSave={handleSaveClient}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
          <Link href="/admin/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Clients
          </Link>
        </Button>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-display uppercase">
                {client.name}
              </h1>
              <Badge className={statusConfig.color} variant="secondary">
                <div className={`h-2 w-2 rounded-full ${statusConfig.dotColor} mr-1.5`} />
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Client depuis le {new Date(client.created_at).toLocaleDateString("fr-FR")}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {canSendMessages && (
              <SendMessageDialog
                client={client}
                contacts={contacts}
                onMessageSent={fetchClient}
              />
            )}
            {canInviteClients && (
              <InviteClientButton client={client} onInvited={fetchClient} />
            )}
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Modifier
            </Button>
            {canDeleteClients && (
              <Button
                variant="outline"
                onClick={handleDeleteClient}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact info card */}
          <Card>
            <CardHeader>
              <CardTitle>Coordonnees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a
                href={`mailto:${client.email}`}
                className="flex items-center gap-2 text-sm hover:text-primary"
              >
                <Mail className="h-4 w-4 text-muted-foreground" />
                {client.email}
              </a>

              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {client.phone}
                </a>
              )}

              {client.website && (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm hover:text-primary"
                >
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  {client.website}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}

              {/* Social links */}
              {Object.keys(client.socials || {}).length > 0 && (
                <>
                  <Separator />
                  <div className="flex gap-2 flex-wrap">
                    {client.socials.linkedin && (
                      <a
                        href={client.socials.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-md hover:bg-muted"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                    {client.socials.instagram && (
                      <a
                        href={client.socials.instagram}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-md hover:bg-muted"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {client.socials.facebook && (
                      <a
                        href={client.socials.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-md hover:bg-muted"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    {client.socials.twitter && (
                      <a
                        href={client.socials.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-md hover:bg-muted"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Contacts section */}
          <ContactsSection
            contacts={contacts}
            onAddContact={handleAddContact}
            onUpdateContact={handleUpdateContact}
            onDeleteContact={handleDeleteContact}
            onSetPrimary={handleSetPrimaryContact}
          />

          {/* Messages section */}
          <MessagesTimeline messages={messages} />

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes internes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Projects */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Projets ({projects.length})</CardTitle>
              <Button size="sm" asChild>
                <Link href={`/admin/projects/new?client=${clientId}`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-6">
                  <FolderOpen className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Aucun projet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => {
                    const projectStatusCfg = projectStatusConfig[project.status];
                    return (
                      <Link
                        key={project.id}
                        href={`/admin/projects/${project.id}`}
                        className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{project.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Cree le{" "}
                              {new Date(project.created_at).toLocaleDateString(
                                "fr-FR"
                              )}
                            </p>
                          </div>
                          <Badge className={projectStatusCfg.color} variant="secondary">
                            {projectStatusCfg.label}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
