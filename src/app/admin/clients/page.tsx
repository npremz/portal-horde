import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus } from "lucide-react";
import { InviteClientDialog } from "@/components/invite-client-dialog";

export default async function AdminClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("profiles")
    .select(
      `
      *,
      projects:projects!projects_client_id_fkey(id, name, status)
    `
    )
    .eq("role", "client")
    .order("created_at", { ascending: false });

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-display uppercase">Clients</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerez vos clients et leurs acces
          </p>
        </div>
        <InviteClientDialog />
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {clients && clients.length > 0 ? (
          clients.map((client) => {
            const activeProjects = client.projects?.filter(
              (p: { status: string }) => p.status === "active"
            ).length || 0;

            return (
              <Card key={client.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={client.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(client.full_name, client.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {client.full_name || "Non renseigne"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {client.email}
                      </p>
                      {client.company && (
                        <p className="text-xs text-muted-foreground">
                          {client.company}
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
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(client.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Aucun client</p>
              <InviteClientDialog />
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
                <TableHead>Entreprise</TableHead>
                <TableHead>Projets</TableHead>
                <TableHead>Inscription</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients && clients.length > 0 ? (
                clients.map((client) => {
                  const activeProjects = client.projects?.filter(
                    (p: { status: string }) => p.status === "active"
                  ).length || 0;

                  return (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={client.avatar_url || undefined} />
                            <AvatarFallback>
                              {getInitials(client.full_name, client.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {client.full_name || "Non renseigne"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {client.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.company || (
                          <span className="text-muted-foreground">-</span>
                        )}
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
                      <TableCell className="text-muted-foreground">
                        {new Date(client.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Aucun client</p>
                    <InviteClientDialog />
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
