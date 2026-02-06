"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  ChevronRight,
  FolderOpen,
  Search,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { projectStatusConfig } from "@/lib/constants";
import type { ProjectStatus } from "@/types/database";

type ProjectWithRelations = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  client_id: string | null;
  staging_url: string | null;
  created_at: string;
  client: { id: string; name: string; email: string } | null;
  phases: { id: string; status: string }[];
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [deletingProject, setDeletingProject] = useState<ProjectWithRelations | null>(null);

  const fetchProjects = async () => {
    const supabase = createClient();

    const { data } = await supabase
      .from("projects")
      .select(
        `
        *,
        client:clients!projects_client_id_fkey(id, name, email),
        phases(id, status)
      `
      )
      .order("created_at", { ascending: false });

    setProjects((data as ProjectWithRelations[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchProjects();
  }, []);

  const handleDelete = async (project: ProjectWithRelations) => {
    const supabase = createClient();
    const { error } = await supabase.from("projects").delete().eq("id", project.id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success(`${project.name} supprimé`);
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    setDeletingProject(null);
  };

  // Get unique clients for filter
  const uniqueClients = Array.from(
    new Map(
      projects
        .filter((p) => p.client)
        .map((p) => [p.client!.id, p.client!])
    ).values()
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Apply filters
  let filteredProjects = projects;

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredProjects = filteredProjects.filter((p) =>
      p.name.toLowerCase().includes(query)
    );
  }

  if (filterStatus) {
    filteredProjects = filteredProjects.filter((p) => p.status === filterStatus);
  }

  if (filterClient) {
    if (filterClient === "none") {
      filteredProjects = filteredProjects.filter((p) => !p.client_id);
    } else {
      filteredProjects = filteredProjects.filter((p) => p.client_id === filterClient);
    }
  }

  const hasActiveFilters = searchQuery || filterStatus || filterClient;

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterStatus("");
    setFilterClient("");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-display uppercase">Projets</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {filteredProjects.length} projet{filteredProjects.length > 1 ? "s" : ""}
            {hasActiveFilters && " (filtre actif)"}
          </p>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link href="/admin/projects/new">
            <Plus className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Nouveau projet</span>
          </Link>
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un projet..."
            className="pl-9 h-9"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(projectStatusConfig).map(([status, config]) => (
              <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${config.dotColor}`} />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Non assigné</SelectItem>
            {uniqueClients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
            <X className="h-4 w-4" />
            Effacer
          </Button>
        )}
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => {
            const status = projectStatusConfig[project.status];
            const completedPhases = project.phases?.filter(
              (p) => p.status === "completed"
            ).length || 0;
            const totalPhases = project.phases?.length || 0;

            return (
              <Link key={project.id} href={`/admin/projects/${project.id}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium truncate">{project.name}</p>
                          <Badge variant={status.variant} className="shrink-0 text-xs">
                            {status.label}
                          </Badge>
                        </div>
                        {project.client && (
                          <p className="text-sm text-muted-foreground truncate">
                            {project.client.name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: Math.min(totalPhases, 10) }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-1.5 h-4 rounded-sm ${
                                  i < completedPhases ? "bg-green-500" : "bg-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {completedPhases}/{totalPhases} étapes
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              {hasActiveFilters ? (
                <>
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun projet correspond aux filtres</p>
                  <Button variant="link" onClick={clearAllFilters}>
                    Effacer les filtres
                  </Button>
                </>
              ) : (
                <>
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Aucun projet</p>
                  <Button asChild>
                    <Link href="/admin/projects/new">Créer un projet</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop: Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => {
                  const status = projectStatusConfig[project.status];
                  const completedPhases = project.phases?.filter(
                    (p) => p.status === "completed"
                  ).length || 0;
                  const totalPhases = project.phases?.length || 0;

                  return (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{project.name}</p>
                          {project.description && (
                            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                              {project.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {project.client ? (
                          <Link
                            href={`/admin/clients/${project.client.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            <p className="font-medium">
                              {project.client.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {project.client.email}
                            </p>
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">Non assigné</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-0.5">
                            {Array.from({ length: totalPhases }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2 h-6 rounded-sm ${
                                  i < completedPhases ? "bg-green-500" : "bg-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {completedPhases}/{totalPhases}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/projects/${project.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/projects/${project.id}/edit`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeletingProject(project)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {hasActiveFilters ? (
                      <>
                        <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucun projet correspond aux filtres</p>
                        <Button variant="link" onClick={clearAllFilters}>
                          Effacer les filtres
                        </Button>
                      </>
                    ) : (
                      <>
                        <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucun projet</p>
                        <Button className="mt-4" asChild>
                          <Link href="/admin/projects/new">Créer un projet</Link>
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingProject} onOpenChange={(open) => !open && setDeletingProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {deletingProject?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les phases, livrables et commentaires seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingProject && handleDelete(deletingProject)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
