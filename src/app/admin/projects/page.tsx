import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusConfig = {
  active: { label: "Actif", variant: "default" as const },
  paused: { label: "En pause", variant: "secondary" as const },
  completed: { label: "Termine", variant: "outline" as const },
  archived: { label: "Archive", variant: "outline" as const },
};

export default async function AdminProjectsPage() {
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select(
      `
      *,
      client:profiles!projects_client_id_fkey(id, full_name, company, email),
      phases(id, status)
    `
    )
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display uppercase">Projets</h1>
          <p className="text-muted-foreground">
            Gerez tous les projets clients
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau projet
          </Link>
        </Button>
      </div>

      <Card>
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
              {projects && projects.length > 0 ? (
                projects.map((project) => {
                  const status = statusConfig[project.status as keyof typeof statusConfig];
                  const completedPhases = project.phases?.filter(
                    (p: { status: string }) => p.status === "completed"
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
                          <div>
                            <p className="font-medium">
                              {project.client.company || project.client.full_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {project.client.email}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Non assigne</span>
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
                            <Button variant="ghost" size="icon">
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
                            <DropdownMenuItem className="text-destructive">
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
                    <p className="text-muted-foreground">Aucun projet</p>
                    <Button className="mt-4" asChild>
                      <Link href="/admin/projects/new">Creer un projet</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
