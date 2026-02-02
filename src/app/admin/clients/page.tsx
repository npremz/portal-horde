import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
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
import { UserPlus, Building2, Mail, Phone, ExternalLink, Eye } from "lucide-react";
import { CreateClientDialog } from "@/components/create-client-dialog";
import { clientStatusConfig } from "@/lib/constants";
import type { Client } from "@/types/database";

export default async function AdminClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select(
      `
      *,
      projects:projects!projects_client_id_fkey(id, name, status)
    `
    )
    .order("created_at", { ascending: false });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-display uppercase">Clients CRM</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerez vos clients et leurs projets
          </p>
        </div>
        <CreateClientDialog />
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {clients && clients.length > 0 ? (
          clients.map((client: Client & { projects?: { id: string; name: string; status: string }[] }) => {
            const statusConfig = clientStatusConfig[client.status];
            const activeProjects = client.projects?.filter(
              (p) => p.status === "active"
            ).length || 0;

            return (
              <Link key={client.id} href={`/admin/clients/${client.id}`}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-primary">
                          {getInitials(client.name)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{client.name}</p>
                          <Badge className={statusConfig.color} variant="secondary">
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {client.email}
                        </p>
                        {client.phone && (
                          <p className="text-xs text-muted-foreground">
                            {client.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Badge variant="outline" className="text-xs">
                        {client.projects?.length || 0} projet(s)
                      </Badge>
                      {activeProjects > 0 && (
                        <Badge variant="default" className="text-xs">
                          {activeProjects} actif(s)
                        </Badge>
                      )}
                      {client.profile_id && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Compte actif
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(client.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Aucun client</p>
              <CreateClientDialog />
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
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Projets</TableHead>
                <TableHead>Compte</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients && clients.length > 0 ? (
                clients.map((client: Client & { projects?: { id: string; name: string; status: string }[] }) => {
                  const statusConfig = clientStatusConfig[client.status];
                  const activeProjects = client.projects?.filter(
                    (p) => p.status === "active"
                  ).length || 0;

                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary">
                              {getInitials(client.name)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            {client.website && (
                              <a
                                href={client.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Site web
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig.color} variant="secondary">
                          <div className={`h-2 w-2 rounded-full ${statusConfig.dotColor} mr-1.5`} />
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {client.projects?.length || 0} projet(s)
                          </Badge>
                          {activeProjects > 0 && (
                            <Badge variant="default">{activeProjects} actif(s)</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.profile_id ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Actif
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Non invite
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/clients/${client.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Aucun client</p>
                    <CreateClientDialog />
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
