"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserPlus, Mail, Phone, ExternalLink, Eye, Bell, Calendar } from "lucide-react";
import { CreateClientDialog } from "@/components/create-client-dialog";
import { clientStatusConfig } from "@/lib/constants";
import type { Client } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type ClientWithProjects = Client & {
  projects?: { id: string; name: string; status: string }[];
};

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientWithProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFollowups, setShowFollowups] = useState(false);

  const fetchClients = async () => {
    const supabase = createClient();

    const { data } = await supabase
      .from("clients")
      .select(
        `
        *,
        projects:projects!projects_client_id_fkey(id, name, status)
      `
      )
      .order("created_at", { ascending: false });

    setClients(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const today = new Date().toISOString().split("T")[0];

  // Filter clients needing followup
  const filteredClients = showFollowups
    ? clients.filter(
        (c) => c.next_followup_date && c.next_followup_date.split("T")[0] <= today
      )
    : clients;

  // Count followups
  const followupCount = clients.filter(
    (c) => c.next_followup_date && c.next_followup_date.split("T")[0] <= today
  ).length;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-display uppercase">Clients CRM</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Gerez vos clients et leurs projets
          </p>
        </div>
        <CreateClientDialog onClientCreated={() => fetchClients()} />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={showFollowups ? "default" : "outline"}
          onClick={() => setShowFollowups(!showFollowups)}
          className="gap-2"
        >
          <Bell className="h-4 w-4" />
          A relancer
          {followupCount > 0 && (
            <Badge variant={showFollowups ? "secondary" : "destructive"} className="ml-1">
              {followupCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const statusConfig = clientStatusConfig[client.status];
            const activeProjects = client.projects?.filter(
              (p) => p.status === "active"
            ).length || 0;
            const needsFollowup =
              client.next_followup_date &&
              client.next_followup_date.split("T")[0] <= today;

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
                          {needsFollowup && (
                            <Badge variant="destructive">
                              <Bell className="h-3 w-3 mr-1" />
                              Relancer
                            </Badge>
                          )}
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
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-wrap">
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
                      {client.first_contact_date && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          1er contact{" "}
                          {formatDistanceToNow(new Date(client.first_contact_date), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              {showFollowups ? (
                <>
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun client a relancer</p>
                </>
              ) : (
                <>
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Aucun client</p>
                  <CreateClientDialog onClientCreated={() => fetchClients()} />
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
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Projets</TableHead>
                <TableHead>Suivi</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => {
                  const statusConfig = clientStatusConfig[client.status];
                  const activeProjects = client.projects?.filter(
                    (p) => p.status === "active"
                  ).length || 0;
                  const needsFollowup =
                    client.next_followup_date &&
                    client.next_followup_date.split("T")[0] <= today;

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
                        <div className="flex flex-col gap-1">
                          <Badge className={statusConfig.color} variant="secondary">
                            <div className={`h-2 w-2 rounded-full ${statusConfig.dotColor} mr-1.5`} />
                            {statusConfig.label}
                          </Badge>
                          {needsFollowup && (
                            <Badge variant="destructive" className="w-fit">
                              <Bell className="h-3 w-3 mr-1" />
                              A relancer
                            </Badge>
                          )}
                        </div>
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
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {client.first_contact_date ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              1er contact{" "}
                              {formatDistanceToNow(new Date(client.first_contact_date), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </div>
                          ) : (
                            <span>Pas encore contacte</span>
                          )}
                          {client.profile_id && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              Compte actif
                            </Badge>
                          )}
                        </div>
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
                    {showFollowups ? (
                      <>
                        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucun client a relancer</p>
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Aucun client</p>
                        <CreateClientDialog onClientCreated={() => fetchClients()} />
                      </>
                    )}
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
