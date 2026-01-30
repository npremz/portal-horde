"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/types/database";
import { validateName, validateDescription, validateUrl } from "@/lib/validation";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Profile[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    client_id: "",
    staging_url: "",
  });

  useEffect(() => {
    const fetchClients = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "client")
        .order("full_name");

      if (data) {
        setClients(data);
      }
    };

    fetchClients();
  }, []);

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

    toast.success("Projet cree - ajoutez les etapes");
    router.push(`/admin/projects/${project.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 md:space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
          <Link href="/admin/projects">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Link>
        </Button>
        <h1 className="text-2xl md:text-3xl font-display uppercase">Nouveau projet</h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Creez un nouveau projet pour un client
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du projet</CardTitle>
            <CardDescription>
              Vous pourrez ajouter les etapes apres la creation
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
              <Label htmlFor="client">Client</Label>
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
                      {client.company || client.full_name || client.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Vous pouvez assigner un client plus tard
              </p>
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

            <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
              <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
                <Link href="/admin/projects">Annuler</Link>
              </Button>
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Creer le projet
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
