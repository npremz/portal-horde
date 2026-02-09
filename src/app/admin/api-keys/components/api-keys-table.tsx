"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
  Copy,
  Trash2,
  Power,
  PowerOff,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { ApiKey, ApiPermission } from "@/types/database";
import { API_PERMISSIONS } from "@/lib/api-auth";

interface ApiKeysTableProps {
  keys: (ApiKey & { profile?: { full_name: string | null; email: string } })[];
  onRefresh: () => void;
}

const permissionLabels: Record<ApiPermission, string> = API_PERMISSIONS.reduce(
  (acc, p) => ({ ...acc, [p.value]: p.label }),
  {} as Record<ApiPermission, string>
);

export function ApiKeysTable({ keys, onRefresh }: ApiKeysTableProps) {
  const [deletingKey, setDeletingKey] = useState<ApiKey | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCopyPrefix = async (prefix: string) => {
    try {
      await navigator.clipboard.writeText(prefix);
      toast.success("Préfixe copié");
    } catch {
      toast.error("Erreur lors de la copie");
    }
  };

  const handleToggleActive = async (key: ApiKey) => {
    try {
      const response = await fetch(`/api/api-keys/${key.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !key.is_active }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      toast.success(key.is_active ? "Clé désactivée" : "Clé activée");
      onRefresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la mise à jour"
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingKey) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/api-keys/${deletingKey.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast.success(`Clé "${deletingKey.name}" supprimée`);
      setDeletingKey(null);
      onRefresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeleting(false);
    }
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (keys.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune clé API</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {keys.map((key) => {
          const expired = isExpired(key.expires_at);

          return (
            <Card key={key.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{key.name}</p>
                      {!key.is_active && (
                        <Badge variant="secondary">Désactivée</Badge>
                      )}
                      {expired && (
                        <Badge variant="destructive">Expirée</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground font-mono mt-1">
                      {key.key_prefix}...
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {key.permissions.map((perm) => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {permissionLabels[perm] || perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleCopyPrefix(key.key_prefix)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copier le préfixe
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(key)}>
                        {key.is_active ? (
                          <>
                            <PowerOff className="mr-2 h-4 w-4" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-4 w-4" />
                            Activer
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeletingKey(key)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <span>
                    Créée{" "}
                    {formatDistanceToNow(new Date(key.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                  {key.last_used_at && (
                    <span>
                      Utilisée{" "}
                      {formatDistanceToNow(new Date(key.last_used_at), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop: Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Préfixe</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière utilisation</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => {
                const expired = isExpired(key.expires_at);

                return (
                  <TableRow key={key.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{key.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Créée{" "}
                          {formatDistanceToNow(new Date(key.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1.5 py-0.5 rounded">
                        {key.key_prefix}...
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {key.permissions.map((perm) => (
                          <Badge
                            key={perm}
                            variant="outline"
                            className="text-xs"
                          >
                            {permissionLabels[perm] || perm}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {expired ? (
                        <Badge variant="destructive">Expirée</Badge>
                      ) : key.is_active ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Désactivée</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {key.last_used_at ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(key.last_used_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Jamais
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleCopyPrefix(key.key_prefix)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Copier le préfixe
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(key)}
                          >
                            {key.is_active ? (
                              <>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Désactiver
                              </>
                            ) : (
                              <>
                                <Power className="mr-2 h-4 w-4" />
                                Activer
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeletingKey(key)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingKey}
        onOpenChange={(open) => !open && setDeletingKey(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la clé API ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La clé{" "}
              <strong>{deletingKey?.name}</strong> sera définitivement
              supprimée et ne pourra plus être utilisée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
