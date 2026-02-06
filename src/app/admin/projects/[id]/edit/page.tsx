"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FormFieldError } from "@/components/ui/form-field-error";
import { validateName, validateUrl } from "@/lib/validation";
import type { Client, Project, ProjectStatus } from "@/types/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [, setProject] = useState<Project | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [stagingUrl, setStagingUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);

    // Fetch project
    const { data: projectData, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (error || !projectData) {
      toast.error("Projet introuvable");
      router.push("/admin/projects");
      return;
    }

    setProject(projectData);
    setName(projectData.name);
    setDescription(projectData.description || "");
    setClientId(projectData.client_id || "none");
    setStatus(projectData.status);
    setStagingUrl(projectData.staging_url || "");

    // Fetch clients
    const { data: clientsData } = await supabase
      .from("clients")
      .select("*")
      .order("name");

    setClients(clientsData || []);
    setLoading(false);
  }, [projectId, router, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchData();
  }, [fetchData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    const nameResult = validateName(name);
    if (!nameResult.valid) {
      newErrors.name = nameResult.error!;
    }

    if (stagingUrl) {
      const urlResult = validateUrl(stagingUrl);
      if (!urlResult.valid) {
        newErrors.staging_url = urlResult.error!;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    const { error } = await supabase
      .from("projects")
      .update({
        name: nameResult.sanitized,
        description: description || null,
        client_id: clientId === "none" ? null : clientId,
        status,
        staging_url: stagingUrl ? validateUrl(stagingUrl).sanitized : null,
      })
      .eq("id", projectId);

    setSaving(false);

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
      console.error(error);
    } else {
      toast.success("Projet mis à jour");
      router.push(`/admin/projects/${projectId}`);
    }
  }

  async function handleDelete() {
    setDeleting(true);

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    setDeleting(false);

    if (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    } else {
      toast.success("Projet supprimé");
      router.push("/admin/projects");
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/projects/${projectId}`}>
          <Button variant="ghost" size="icon" aria-label="Retour au projet">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-semibold">Modifier le projet</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du projet</CardTitle>
            <CardDescription>
              Modifiez les détails du projet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du projet *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => clearError("name")}
                placeholder="Ex: Site web Cafe Belga"
                aria-invalid={!!errors.name}
                required
              />
              <FormFieldError error={errors.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez brièvement le projet..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun client</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                      {client.email && ` (${client.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="paused">En pause</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="staging_url">URL de preview (staging)</Label>
              <Input
                id="staging_url"
                type="url"
                value={stagingUrl}
                onChange={(e) => setStagingUrl(e.target.value)}
                onFocus={() => clearError("staging_url")}
                placeholder="https://staging.exemple.com"
                aria-invalid={!!errors.staging_url}
              />
              <FormFieldError error={errors.staging_url} />
            </div>

            <div className="flex items-center justify-between pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer le projet ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action est irréversible. Toutes les phases, livrables et
                      commentaires seront supprimés.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <div className="flex gap-2">
                <Link href={`/admin/projects/${projectId}`}>
                  <Button type="button" variant="outline">
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" disabled={saving || !name}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
