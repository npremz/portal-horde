"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LogIn,
  Eye,
  Download,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Mail,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Activity,
} from "lucide-react";
import { actionLabels, actionColors } from "@/lib/activity";
import type { ActivityLog, ActivityAction, Profile, Project } from "@/types/database";

const actionIcons: Record<ActivityAction, React.ReactNode> = {
  login: <LogIn className="h-4 w-4" />,
  view_project: <Eye className="h-4 w-4" />,
  view_deliverable: <Eye className="h-4 w-4" />,
  download_file: <Download className="h-4 w-4" />,
  add_comment: <MessageSquare className="h-4 w-4" />,
  validate_deliverable: <CheckCircle2 className="h-4 w-4" />,
  request_revision: <XCircle className="h-4 w-4" />,
  email_sent: <Mail className="h-4 w-4" />,
};

const PAGE_SIZE = 25;

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const supabase = createClient();

  // Fetch filter options
  useEffect(() => {
    async function fetchOptions() {
      const [usersRes, projectsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("role", "client").order("full_name"),
        supabase.from("projects").select("*").order("name"),
      ]);
      setUsers(usersRes.data || []);
      setProjects(projectsRes.data || []);
    }
    fetchOptions();
  }, [supabase]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("activity_logs")
      .select(`
        *,
        user:profiles(*),
        project:projects(*),
        deliverable:deliverables(*)
      `)
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    // Apply filters
    if (actionFilter !== "all") {
      query = query.eq("action", actionFilter);
    }
    if (userFilter !== "all") {
      query = query.eq("user_id", userFilter);
    }
    if (projectFilter !== "all") {
      query = query.eq("project_id", projectFilter);
    }
    if (dateFrom) {
      query = query.gte("created_at", `${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching logs:", error);
    } else {
      setLogs(data || []);
      setHasMore((data?.length || 0) === PAGE_SIZE);
    }

    setLoading(false);
  }, [supabase, page, actionFilter, userFilter, projectFilter, dateFrom, dateTo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchLogs();
  }, [fetchLogs]);

  // Reset page when filters change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(0);
  }, [actionFilter, userFilter, projectFilter, dateFrom, dateTo]);

  function resetFilters() {
    setActionFilter("all");
    setUserFilter("all");
    setProjectFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display uppercase">Activite</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Historique des actions clients sur le portail
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {Object.entries(actionLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.company || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Projet</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Du</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Au</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reinitialiser
            </Button>
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs list */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4" />
              Aucune activite trouvee
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!loading && logs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs md:text-sm text-muted-foreground">
            Page {page + 1}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Precedent</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setPage(page + 1)}
            >
              <span className="hidden sm:inline mr-1">Suivant</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function LogEntry({ log }: { log: ActivityLog }) {
  const action = log.action as ActivityAction;
  const icon = actionIcons[action];
  const label = actionLabels[action];
  const colorClass = actionColors[action];

  const userName = log.user?.full_name || log.user?.company || log.user?.email || "Utilisateur inconnu";
  const projectName = log.project?.name;
  const deliverableTitle = log.deliverable?.title;

  // Build description based on action type
  let description = "";
  switch (action) {
    case "login":
      description = "s'est connecte";
      break;
    case "view_project":
      description = `a consulte le projet "${projectName}"`;
      break;
    case "view_deliverable":
      description = `a consulte le livrable "${deliverableTitle || (log.metadata as Record<string, unknown>)?.title}"`;
      break;
    case "download_file":
      description = `a telecharge "${(log.metadata as Record<string, unknown>)?.fileName}"`;
      break;
    case "add_comment":
      description = `a commente sur "${deliverableTitle}"`;
      break;
    case "validate_deliverable":
      description = `a valide "${deliverableTitle || (log.metadata as Record<string, unknown>)?.deliverableTitle}"`;
      break;
    case "request_revision":
      description = `a demande une revision sur "${deliverableTitle || (log.metadata as Record<string, unknown>)?.deliverableTitle}"`;
      break;
    case "email_sent":
      description = "a recu un email";
      break;
  }

  const date = new Date(log.created_at);
  const formattedDate = date.toLocaleDateString("fr-BE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("fr-BE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-start gap-3 p-3 md:p-4 hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-lg shrink-0 ${colorClass}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm md:text-base">
              <span className="font-medium text-primary">{userName}</span>{" "}
              <span className="text-muted-foreground">{description}</span>
            </p>
            {projectName && action !== "view_project" && (
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Projet: {projectName}
              </p>
            )}
          </div>
          <Badge variant="outline" className="shrink-0 text-xs hidden md:inline-flex">
            {label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {formattedDate} {formattedTime}
        </p>
      </div>
    </div>
  );
}
