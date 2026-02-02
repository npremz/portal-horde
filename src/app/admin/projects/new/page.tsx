"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { PhaseTemplatesSelector } from "@/components/phase-templates-selector";
import { CreateClientDialog } from "@/components/create-client-dialog";
import type { Client } from "@/types/database";
import { validateName, validateDescription, validateUrl } from "@/lib/validation";

interface SelectedPhase {
  id: string;
  name: string;
  description: string | null;
  isCustom: boolean;
}

export default function NewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get("client");

  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedPhases, setSelectedPhases] = useState<SelectedPhase[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client_id: preselectedClientId || "",
    staging_url: "",
  });

  useEffect(() => {
    const fetchClients = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("clients")
        .select("*")
        .order("name");

      if (data) {
        setClients(data);
      }
    };

    fetchClients();
  }, []);

  // Update client_id when preselected client changes
  useEffect(() => {
    if (preselectedClientId) {
      setFormData((prev) => ({ ...prev, client_id: preselectedClientId }));
    }
  }, [preselectedClientId]);

  const handleClientCreated = (newClientId: string) => {
    // Refresh clients list and select the new client
    const fetchClients = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("clients").select("*").order("name");
      if (data) {
        setClients(data);
        setFormData((prev) => ({ ...prev, client_id: newClientId }));
      }
    };
    fetchClients();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate inputs
    const nameValidation = validateName(formData.name);
    if (!nameValidation.valid) {
      toast.error(nameValidation.error);
      return;
    }

    const descValidation = validateDescription(formData.description);
    if (!descValidation.valid) {
      toast.error(descValidation.error);
      return;
    }

    const urlValidation = validateUrl(formData.staging_url);
    if (!urlValidation.valid) {
      toast.error(urlValidation.error);
      return;
    }

    // Validate phases
    if (selectedPhases.length === 0) {
      toast.error("Selectionnez au moins une phase");
      return;
    }

    // Check that all phases have names
    const emptyPhase = selectedPhases.find((p) => !p.name.trim());
    if (emptyPhase) {
      toast.error("Toutes les phases doivent avoir un nom");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    // Create project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        name: nameValidation.sanitized,
        description: descValidation.sanitized,
        client_id: formData.client_id || null,
        staging_url: urlValidation.sanitized,
      })
      .select()
      .single();

    if (projectError) {
      toast.error("Erreur lors de la creation du projet");
      setLoading(false);
      return;
    }

    // Create phases
    const phasesData = selectedPhases.map((phase, index) => ({
      project_id: project.id,
      name: phase.name.trim(),
      description: phase.description?.trim() || null,
      order_index: index,
      status: "pending" as const,
    }));

    const { error: phasesError } = await supabase
      .from("phases")
      .insert(phasesData);

    if (phasesError) {
      // Rollback: delete the project
      await supabase.from("projects").delete().eq("id", project.id);
      toast.error("Erreur lors de la creation des phases");
      setLoading(false);
      return;
    }

    // Update client status if needed
    if (formData.client_id) {
      const client = clients.find((c) => c.id === formData.client_id);
      if (client && (client.status === "lead" || client.status === "contacted")) {
        await supabase
          .from("clients")
          .update({ status: "in_project" })
          .eq("id", formData.client_id);
      }
    }

    toast.success("Projet cree avec succes");
    router.push(`/admin/projects/${project.id}`);
  };

  const selectedClient = clients.find((c) => c.id === formData.client_id);

  return (
    <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
          <Link href="/admin/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-display uppercase">Nouveau projet</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Creez un nouveau projet et configurez ses phases
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informations du projet</CardTitle>
            <CardDescription>
              Definissez les informations de base du projet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du projet *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Refonte site web"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description du projet..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="client">Client</Label>
                <CreateClientDialog onClientCreated={handleClientCreated} />
              </div>
              <Select
                value={formData.client_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, client_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectionner un client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                      {client.email && (
                        <span className="text-muted-foreground ml-2">
                          ({client.email})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClient && !selectedClient.profile_id && (
                <p className="text-xs text-muted-foreground">
                  Ce client n'a pas encore de compte. Pensez a l'inviter au portail.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="staging_url">URL de preview (staging)</Label>
              <Input
                id="staging_url"
                type="url"
                value={formData.staging_url}
                onChange={(e) =>
                  setFormData({ ...formData, staging_url: e.target.value })
                }
                placeholder="https://staging.example.com"
              />
            </div>
          </CardContent>
        </Card>

        <PhaseTemplatesSelector
          value={selectedPhases}
          onChange={setSelectedPhases}
        />

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/admin/projects">Annuler</Link>
          </Button>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Creer le projet
          </Button>
        </div>
      </form>
    </div>
  );
}
