"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link as LinkIcon, ExternalLink, Trash2, Plus } from "lucide-react";
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

  async function handleAddLink() {
    if (!newLinkTitle.trim() || !newLinkUrl.trim() || !onAddLink) return;

    let url = newLinkUrl.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    await onAddLink(newLinkTitle.trim(), url);
    setNewLinkTitle("");
    setNewLinkUrl("");
    setAddingLink(false);
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
          <div className="space-y-3 p-3 bg-white border border-border rounded-lg">
            <div className="space-y-2">
              <Input
                placeholder="Titre du lien"
                value={newLinkTitle}
                onChange={(e) => setNewLinkTitle(e.target.value)}
              />
              <Input
                placeholder="URL (ex: https://example.com)"
                value={newLinkUrl}
                onChange={(e) => setNewLinkUrl(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddLink}>
                Ajouter
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAddingLink(false);
                  setNewLinkTitle("");
                  setNewLinkUrl("");
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {links.length === 0 && !addingLink ? (
          <p className="text-center py-8 text-muted-foreground">
            Aucun lien pour ce livrable
          </p>
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
                  >
                    <ExternalLink className="h-4 w-4 md:mr-2" />
                    {!canEdit && <span className="hidden md:inline">Ouvrir</span>}
                  </Button>
                  {canEdit && onDeleteLink && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteLink(link)}
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
