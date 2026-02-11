"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormFieldError } from "@/components/ui/form-field-error";
import { Link as LinkIcon, ExternalLink, Trash2, Plus, Loader2 } from "lucide-react";
import type { Link, Profile } from "@/types/database";

interface LinkWithCreator extends Link {
  creator?: Profile;
}

interface LinksSectionProps {
  links: LinkWithCreator[];
  onAddLink?: (title: string, url: string) => Promise<void>;
  onDeleteLink?: (link: Link) => void;
  canEdit?: boolean;
}

export function LinksSection({
  links,
  onAddLink,
  onDeleteLink,
  canEdit = false,
}: LinksSectionProps) {
  const [addingLink, setAddingLink] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function clearError(field: string) {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleAddLink() {
    if (!onAddLink) return;

    const newErrors: Record<string, string> = {};
    if (!newLinkTitle.trim()) {
      newErrors.title = "Le titre est requis";
    }
    const trimmedUrl = newLinkUrl.trim();
    if (!trimmedUrl) {
      newErrors.url = "L'URL est requise";
    } else {
      try {
        const testUrl = trimmedUrl.startsWith("http://") || trimmedUrl.startsWith("https://")
          ? trimmedUrl
          : "https://" + trimmedUrl;
        new URL(testUrl);
      } catch {
        newErrors.url = "L'URL n'est pas valide";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    let url = trimmedUrl;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    setLoading(true);
    try {
      await onAddLink(newLinkTitle.trim(), url);
      setNewLinkTitle("");
      setNewLinkUrl("");
      setErrors({});
      setAddingLink(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Liens ({links.length})</CardTitle>
        {canEdit && onAddLink && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddingLink(!addingLink)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Ajouter un lien
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {canEdit && addingLink && (
          <div className="space-y-3 p-3 bg-card border border-border rounded-lg">
            <div className="space-y-2">
              <div>
                <Label htmlFor="link-title">Titre</Label>
                <Input
                  id="link-title"
                  placeholder="Titre du lien"
                  value={newLinkTitle}
                  onChange={(e) => { setNewLinkTitle(e.target.value); clearError("title"); }}
                  aria-invalid={!!errors.title}
                />
                <FormFieldError error={errors.title} />
              </div>
              <div>
                <Label htmlFor="link-url">URL</Label>
                <Input
                  id="link-url"
                  placeholder="https://example.com"
                  value={newLinkUrl}
                  onChange={(e) => { setNewLinkUrl(e.target.value); clearError("url"); }}
                  aria-invalid={!!errors.url}
                />
                <FormFieldError error={errors.url} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddLink} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Ajouter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingLink(false);
                  setNewLinkTitle("");
                  setNewLinkUrl("");
                  setErrors({});
                }}
                disabled={loading}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {links.length === 0 && !addingLink ? (
          <div className="text-center py-8 text-muted-foreground">
            <LinkIcon className="h-10 w-10 mx-auto mb-3" />
            <p>Aucun lien pour ce livrable</p>
          </div>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                  <LinkIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{link.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {link.url}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant={canEdit ? "ghost" : "outline"}
                    size={canEdit ? "icon" : "sm"}
                    onClick={() => window.open(link.url, "_blank")}
                    className="shrink-0"
                    aria-label={`Ouvrir ${link.title}`}
                  >
                    <ExternalLink className="h-4 w-4 md:mr-2" />
                    {!canEdit && <span className="hidden md:inline">Ouvrir</span>}
                  </Button>
                  {canEdit && onDeleteLink && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteLink(link)}
                      aria-label={`Supprimer ${link.title}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
