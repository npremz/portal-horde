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
import { UserPlus, Mail, Phone, ExternalLink, Eye, Bell, Calendar, X, Trash2, Star, ArrowUpDown } from "lucide-react";
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
import type { Client, ClientStatus } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type ClientWithProjects = Client & {
  projects?: { id: string; name: string; status: string }[];
};

export default function AdminClientsPage() {
  const [clients, setClients] = useState<ClientWithProjects[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFollowups, setShowFollowups] = useState(false);
  const [showPriority, setShowPriority] = useState(false);
  const [filterProjectType, setFilterProjectType] = useState<string>("");
  const [filterSector, setFilterSector] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "priority">("date");

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

  if (showPriority) {
    filteredClients = filteredClients.filter((c) => c.is_priority);
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

  // Sort clients
  filteredClients = [...filteredClients].sort((a, b) => {
    if (sortBy === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === "priority") {
      if (a.is_priority !== b.is_priority) {
        return a.is_priority ? -1 : 1;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    // Default: date
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Count followups and priority
  const followupCount = clients.filter(
    (c) => c.next_followup_date && c.next_followup_date.split("T")[0] <= today
  ).length;
  const priorityCount = clients.filter((c) => c.is_priority).length;

  // Check if any filter is active
  const hasActiveFilters = showFollowups || showPriority || filterProjectType || filterSector || filterStatus;

  const clearAllFilters = () => {
    setShowFollowups(false);
    setShowPriority(false);
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

  const togglePriority = async (clientId: string, currentPriority: boolean) => {
    const supabase = createClient();

    // Optimistic update
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, is_priority: !currentPriority } : c))
    );

    const { error } = await supabase
      .from("clients")
      .update({ is_priority: !currentPriority })
      .eq("id", clientId);

    if (error) {
      // Revert on error
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, is_priority: currentPriority } : c))
      );
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const updateClientStatus = async (clientId: string, oldStatus: ClientStatus, newStatus: ClientStatus) => {
    if (oldStatus === newStatus) return;
    const supabase = createClient();

    // Optimistic update
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, status: newStatus } : c))
    );

    const { error } = await supabase
      .from("clients")
      .update({ status: newStatus })
      .eq("id", clientId);

    if (error) {
      // Revert on error
      setClients((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, status: oldStatus } : c))
      );
      toast.error("Erreur lors de la mise à jour du statut");
    } else {
      toast.success(`Statut mis à jour : ${clientStatusConfig[newStatus].label}`);
    }
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
          À relancer
          {followupCount > 0 && (
            <Badge variant={showFollowups ? "secondary" : "destructive"} className="ml-1">
              {followupCount}
            </Badge>
          )}
        </Button>

        <Button
          variant={showPriority ? "default" : "outline"}
          onClick={() => setShowPriority(!showPriority)}
          className="gap-2"
          size="sm"
        >
          <Star className={`h-4 w-4 ${showPriority ? "fill-current" : ""}`} />
          Prioritaires
          {priorityCount > 0 && (
            <Badge variant={showPriority ? "secondary" : "default"} className="ml-1">
              {priorityCount}
            </Badge>
          )}
        </Button>

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-[130px] h-9">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="name">Nom</SelectItem>
            <SelectItem value="priority">Priorité</SelectItem>
          </SelectContent>
        </Select>

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
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <span className="text-xs text-muted-foreground font-mono">
                        {index + 1}
                      </span>
                      <button
                        onClick={() => togglePriority(client.id, client.is_priority)}
                        className="p-1 hover:bg-muted rounded"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            client.is_priority
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/admin/clients/${client.id}`} className="font-medium truncate hover:underline">
                          {client.name}
                        </Link>
                        <Select
                          value={client.status}
                          onValueChange={(v) => updateClientStatus(client.id, client.status, v as ClientStatus)}
                        >
                          <SelectTrigger
                            className={`h-6 w-auto gap-1 border-0 px-2 text-xs font-medium ${statusConfig.color}`}
                          >
                            <SelectValue />
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
                        {needsFollowup && (
                          <Badge variant="destructive">
                            <Bell className="h-3 w-3 mr-1" />
                            Relancer
                          </Badge>
                        )}
                      </div>
                      <Link href={`/admin/clients/${client.id}`} className="block">
                        <p className="text-sm text-muted-foreground truncate">
                          {client.email}
                        </p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {new Date(client.created_at).toLocaleDateString("fr-FR")}
                          </span>
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
                      </Link>
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
                            Cette action est irréversible. Le client et toutes ses données associées seront supprimés.
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
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
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
                        <button
                          onClick={() => togglePriority(client.id, client.is_priority)}
                          className="p-1 hover:bg-muted rounded"
                          title={client.is_priority ? "Retirer priorité" : "Marquer prioritaire"}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              client.is_priority
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        </button>
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
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(client.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Select
                            value={client.status}
                            onValueChange={(v) => updateClientStatus(client.id, client.status, v as ClientStatus)}
                          >
                            <SelectTrigger
                              className={`h-7 w-auto gap-1.5 border-0 px-2.5 text-xs font-medium ${statusConfig.color}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <SelectValue />
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
                          {needsFollowup && (
                            <Badge variant="destructive" className="w-fit">
                              <Bell className="h-3 w-3 mr-1" />
                              À relancer
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
                                  Cette action est irréversible. Le client et toutes ses données associées seront supprimés.
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
                  <TableCell colSpan={9} className="text-center py-8">
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
