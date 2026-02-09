"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
import { FormFieldError } from "@/components/ui/form-field-error";
import type { Phase } from "@/types/database";

export default function NewDeliverablePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const preselectedPhase = searchParams.get("phase");

  const [loading, setLoading] = useState(false);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    phase_id: preselectedPhase || "",
  });

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const supabase = createClient();

  useEffect(() => {
    async function fetchPhases() {
      const { data } = await supabase
        .from("phases")
        .select("*")
        .eq("project_id", projectId)
        .order("order_index");

      if (data) {
        setPhases(data);
        if (!preselectedPhase && data.length > 0) {
          setFormData((prev) => ({ ...prev, phase_id: data[0].id }));
        }
      }
    }

    void fetchPhases();
  }, [projectId, preselectedPhase, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.phase_id) newErrors.phase_id = "Selectionnez une phase";
    if (!formData.title.trim()) newErrors.title = "Le titre est requis";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("deliverables").insert({
      phase_id: formData.phase_id,
      title: formData.title,
      description: formData.description || null,
      created_by: user?.id,
      status: "draft",
    });

    if (error) {
      toast.error("Erreur lors de la création du livrable");
      setLoading(false);
      return;
    }

    toast.success("Livrable créé avec succès");
    router.push(`/admin/projects/${projectId}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 -ml-2" asChild>
          <Link href={`/admin/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au projet
          </Link>
        </Button>
        <h1 className="text-3xl font-display uppercase">Nouveau livrable</h1>
        <p className="text-muted-foreground">
          Ajoutez un livrable a une phase du projet
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations du livrable</CardTitle>
            <CardDescription>
              Vous pourrez ajouter des fichiers apres la creation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phase">Phase <span className="text-destructive">*</span></Label>
              <Select
                value={formData.phase_id}
                onValueChange={(value) => {
                  setFormData({ ...formData, phase_id: value });
                  clearError("phase_id");
                }}
              >
                <SelectTrigger aria-invalid={!!errors.phase_id}>
                  <SelectValue placeholder="Selectionner une phase" />
                </SelectTrigger>
                <SelectContent>
                  {phases.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormFieldError error={errors.phase_id} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Titre <span className="text-destructive">*</span></Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  clearError("title");
                }}
                placeholder="Ex: Maquette homepage v1"
                aria-invalid={!!errors.title}
              />
              <FormFieldError error={errors.title} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description du livrable..."
                rows={3}
              />
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="submit" disabled={loading || !formData.phase_id}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Créer le livrable
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={`/admin/projects/${projectId}`}>Annuler</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
