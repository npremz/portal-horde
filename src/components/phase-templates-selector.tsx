"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronUp, ChevronDown, Plus, Trash2, Loader2 } from "lucide-react";
import type { PhaseTemplate } from "@/types/database";

interface SelectedPhase {
  id: string;
  name: string;
  description: string | null;
  isCustom: boolean;
}

interface PhaseTemplatesSelectorProps {
  value: SelectedPhase[];
  onChange: (phases: SelectedPhase[]) => void;
}

export function PhaseTemplatesSelector({
  value,
  onChange,
}: PhaseTemplatesSelectorProps) {
  const [templates, setTemplates] = useState<PhaseTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplates() {
      const supabase = createClient();
      const { data } = await supabase
        .from("phase_templates")
        .select("*")
        .order("order_index");

      if (data) {
        setTemplates(data);

        // If no phases selected yet, select default templates
        if (value.length === 0) {
          const defaultPhases = data
            .filter((t) => t.is_default)
            .map((t) => ({
              id: t.id,
              name: t.name,
              description: t.description,
              isCustom: false,
            }));
          onChange(defaultPhases);
        }
      }
      setLoading(false);
    }

    void loadTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const movePhase = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= value.length) return;

    const newValue = [...value];
    [newValue[index], newValue[newIndex]] = [newValue[newIndex], newValue[index]];
    onChange(newValue);
  };

  const toggleTemplate = (template: PhaseTemplate, checked: boolean) => {
    if (checked) {
      // Add at appropriate position based on order_index
      const newPhase: SelectedPhase = {
        id: template.id,
        name: template.name,
        description: template.description,
        isCustom: false,
      };

      // Find insertion point
      const templateIndex = templates.findIndex((t) => t.id === template.id);
      let insertIndex = value.length;

      for (let i = 0; i < value.length; i++) {
        const existingTemplate = templates.find((t) => t.id === value[i].id);
        if (existingTemplate) {
          const existingIndex = templates.indexOf(existingTemplate);
          if (templateIndex < existingIndex) {
            insertIndex = i;
            break;
          }
        }
      }

      const newValue = [...value];
      newValue.splice(insertIndex, 0, newPhase);
      onChange(newValue);
    } else {
      onChange(value.filter((p) => p.id !== template.id));
    }
  };

  const addCustomPhase = () => {
    const customPhase: SelectedPhase = {
      id: `custom-${Date.now()}`,
      name: "",
      description: "",
      isCustom: true,
    };
    onChange([...value, customPhase]);
  };

  const updatePhase = (id: string, name: string, description: string) => {
    onChange(
      value.map((p) => (p.id === id ? { ...p, name, description } : p))
    );
  };

  const removePhase = (id: string) => {
    onChange(value.filter((p) => p.id !== id));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Templates de phases</CardTitle>
          <CardDescription>
            Selectionnez les phases a inclure dans ce projet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((template) => {
              const isSelected = value.some((p) => p.id === template.id);
              return (
                <label
                  key={template.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      toggleTemplate(template, checked === true)
                    }
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{template.name}</div>
                    {template.description && (
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {template.description}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Phases selectionnees ({value.length})</CardTitle>
            <CardDescription>
              Reordonnez et personnalisez les phases du projet
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addCustomPhase}>
            <Plus className="h-4 w-4 mr-2" />
            Phase personnalisee
          </Button>
        </CardHeader>
        <CardContent>
          {value.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Selectionnez au moins une phase ci-dessus
            </p>
          ) : (
            <div className="space-y-2">
              {value.map((phase, index) => (
                <div
                  key={phase.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="flex flex-col gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => movePhase(index, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => movePhase(index, "down")}
                      disabled={index === value.length - 1}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <span className="text-sm text-muted-foreground w-6 text-center">
                    {index + 1}
                  </span>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input
                      value={phase.name}
                      onChange={(e) =>
                        updatePhase(phase.id, e.target.value, phase.description || "")
                      }
                      placeholder="Nom de la phase"
                      className="font-medium"
                    />
                    <Input
                      value={phase.description || ""}
                      onChange={(e) =>
                        updatePhase(phase.id, phase.name, e.target.value)
                      }
                      placeholder="Description (optionnel)"
                      className="text-sm"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePhase(phase.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
