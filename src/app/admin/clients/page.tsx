"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { UserPlus, Mail, Phone, ExternalLink, Eye, Bell, Calendar, X, Trash2 } from "lucide-react";
import { CreateClientDialog } from "@/components/create-client-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { clientStatusConfig, projectTypes, sectors } from "@/lib/constants";
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
  const [filterProjectType, setFilterProjectType] = useState<string>("");
  const [filterSector, setFilterSector] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchClients();
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

  // Apply all filters
  let filteredClients = clients;

  if (showFollowups) {
    filteredClients = filteredClients.filter(
      (c) => c.next_followup_date && c.next_followup_date.split("T")[0] <= today
    );
  }

  if (filterProjectType) {
    filteredClients = filteredClients.filter((c) => c.project_type === filterProjectType);
  }

  if (filterSector) {
    filteredClients = filteredClients.filter((c) => c.sector === filterSector);
  }

  if (filterStatus) {
    filteredClients = filteredClients.filter((c) => c.status === filterStatus);
  }

  // Count followups
  const followupCount = clients.filter(
    (c) => c.next_followup_date && c.next_followup_date.split("T")[0] <= today
  ).length;

  // Check if any filter is active
  const hasActiveFilters = showFollowups || filterProjectType || filterSector || filterStatus;

  const clearAllFilters = () => {
    setShowFollowups(false);
    setFilterProjectType("");
    setFilterSector("");
    setFilterStatus("");
  };

  // Get labels for display
  const getProjectTypeLabel = (value: string | null) => {
    if (!value) return null;
    return projectTypes.find((t) => t.value === value)?.label || value;
  };

  const getSectorLabel = (value: string | null) => {
    if (!value) return null;
    return sectors.find((s) => s.value === value)?.label || value;
  };

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("clients").delete().eq("id", clientId);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success(`${clientName} supprimé`);
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-display uppercase">Clients CRM</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {filteredClients.length} client{filteredClients.length > 1 ? "s" : ""}
            {hasActiveFilters && ` (filtre actif)`}
          </p>
        </div>
        <CreateClientDialog onClientCreated={() => fetchClients()} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Button
          variant={showFollowups ? "default" : "outline"}
          onClick={() => setShowFollowups(!showFollowups)}
          className="gap-2"
          size="sm"
        >
          <Bell className="h-4 w-4" />
          A relancer
          {followupCount > 0 && (
            <Badge variant={showFollowups ? "secondary" : "destructive"} className="ml-1">
              {followupCount}
            </Badge>
          )}
        </Button>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(clientStatusConfig).map(([status, config]) => (
              <SelectItem key={status} value={status}>
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${config.dotColor}`} />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterProjectType} onValueChange={setFilterProjectType}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue placeholder="Type projet" />
          </SelectTrigger>
          <SelectContent>
            {projectTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterSector} onValueChange={setFilterSector}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Secteur" />
          </SelectTrigger>
          <SelectContent>
            {sectors.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
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
        {filteredClients.length > 0 ? (
          filteredClients.map((client, index) => {
            const statusConfig = clientStatusConfig[client.status];
            const activeProjects = client.projects?.filter(
              (p) => p.status === "active"
            ).length || 0;
            const needsFollowup =
              client.next_followup_date &&
              client.next_followup_date.split("T")[0] <= today;

            return (
              <Card key={client.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <Link href={`/admin/clients/${client.id}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <span className="text-xs text-muted-foreground font-mono">
                          {index + 1}
                        </span>
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {getInitials(client.name)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
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
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {getProjectTypeLabel(client.project_type) && (
                            <Badge variant="outline" className="text-xs">
                              {getProjectTypeLabel(client.project_type)}
                            </Badge>
                          )}
                          {getSectorLabel(client.sector) && (
                            <Badge variant="outline" className="text-xs">
                              {getSectorLabel(client.sector)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {client.projects?.length || 0} projet(s)
                    </Badge>
                    {activeProjects > 0 && (
                      <Badge variant="default" className="text-xs">
                        {activeProjects} actif(s)
                      </Badge>
                    )}
                    {client.first_contact_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(client.first_contact_date), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </span>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive ml-auto">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer {client.name} ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action est irreversible. Le client et toutes ses donnees associees seront supprimes.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteClient(client.id, client.name)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              {hasActiveFilters ? (
                <>
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun client correspond aux filtres</p>
                  <Button variant="link" onClick={clearAllFilters}>
                    Effacer les filtres
                  </Button>
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
                <TableHead className="w-[50px]">#</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Type / Secteur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Projets</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length > 0 ? (
                filteredClients.map((client, index) => {
                  const statusConfig = clientStatusConfig[client.status];
                  const activeProjects = client.projects?.filter(
                    (p) => p.status === "active"
                  ).length || 0;
                  const needsFollowup =
                    client.next_followup_date &&
                    client.next_followup_date.split("T")[0] <= today;

                  return (
                    <TableRow key={client.id}>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {index + 1}
                      </TableCell>
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
                        <div className="flex flex-col gap-1">
                          {getProjectTypeLabel(client.project_type) && (
                            <Badge variant="outline" className="w-fit">
                              {getProjectTypeLabel(client.project_type)}
                            </Badge>
                          )}
                          {getSectorLabel(client.sector) && (
                            <Badge variant="secondary" className="w-fit">
                              {getSectorLabel(client.sector)}
                            </Badge>
                          )}
                          {!client.project_type && !client.sector && (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[180px]">{client.email}</span>
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
                            {client.projects?.length || 0}
                          </Badge>
                          {activeProjects > 0 && (
                            <Badge variant="default">{activeProjects} actif</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/clients/${client.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer {client.name} ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est irreversible. Le client et toutes ses donnees associees seront supprimes.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteClient(client.id, client.name)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Supprimer
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    {hasActiveFilters ? (
                      <>
                        <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucun client correspond aux filtres</p>
                        <Button variant="link" onClick={clearAllFilters}>
                          Effacer les filtres
                        </Button>
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
