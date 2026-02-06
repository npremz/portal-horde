"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Shield,
  Trash2,
  Search,
  X,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { EditUserRoleDialog } from "@/components/edit-user-role-dialog";
import { userRoleConfig } from "@/lib/constants";
import type { Profile } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    const supabase = createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!deletingUser) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/users/${deletingUser.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      toast.success(`${deletingUser.full_name || deletingUser.email} supprimé`);
      setDeletingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la suppression"
      );
    } finally {
      setDeleting(false);
    }
  };

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

  // Apply filters
  let filteredUsers = users;

  if (filterRole) {
    filteredUsers = filteredUsers.filter((u) => u.role === filterRole);
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredUsers = filteredUsers.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        u.company?.toLowerCase().includes(query)
    );
  }

  // Check if any filter is active
  const hasActiveFilters = filterRole || searchQuery;

  const clearAllFilters = () => {
    setFilterRole("");
    setSearchQuery("");
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
          <h1 className="text-2xl md:text-3xl font-display uppercase">
            Utilisateurs
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            {filteredUsers.length} utilisateur
            {filteredUsers.length > 1 ? "s" : ""}
            {hasActiveFilters && ` (filtre actif)`}
          </p>
        </div>
        <CreateUserDialog onUserCreated={() => fetchUsers()} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(userRoleConfig).map(([role, config]) => (
              <SelectItem key={role} value={role}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Effacer
          </Button>
        )}
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => {
            const roleConfig = userRoleConfig[user.role];
            const isCurrentUser = user.id === currentUserId;

            return (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {getInitials(user.full_name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate">
                          {user.full_name || "Sans nom"}
                        </p>
                        <Badge className={roleConfig.color} variant="secondary">
                          {roleConfig.label}
                        </Badge>
                        {isCurrentUser && (
                          <Badge variant="outline">Vous</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                      {user.company && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {user.company}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Shield className="mr-2 h-4 w-4" />
                          Modifier le rôle
                        </DropdownMenuItem>
                        {!isCurrentUser && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeletingUser(user)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs text-muted-foreground">
                    Inscrit{" "}
                    {formatDistanceToNow(new Date(user.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
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
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucun utilisateur correspond aux filtres
                  </p>
                  <Button variant="link" onClick={clearAllFilters}>
                    Effacer les filtres
                  </Button>
                </>
              ) : (
                <>
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Aucun utilisateur
                  </p>
                  <CreateUserDialog onUserCreated={() => fetchUsers()} />
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
                <TableHead>Utilisateur</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Entreprise</TableHead>
                <TableHead>Inscrit</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const roleConfig = userRoleConfig[user.role];
                  const isCurrentUser = user.id === currentUserId;

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              {getInitials(user.full_name, user.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {user.full_name || "Sans nom"}
                              </p>
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-xs">
                                  Vous
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleConfig.color} variant="secondary">
                          {roleConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.company || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(user.created_at), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </span>
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
                              onClick={() => setEditingUser(user)}
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Modifier le rôle
                            </DropdownMenuItem>
                            {!isCurrentUser && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeletingUser(user)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
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
                        <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Aucun utilisateur correspond aux filtres
                        </p>
                        <Button variant="link" onClick={clearAllFilters}>
                          Effacer les filtres
                        </Button>
                      </>
                    ) : (
                      <>
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">
                          Aucun utilisateur
                        </p>
                        <CreateUserDialog onUserCreated={() => fetchUsers()} />
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Role Dialog */}
      {editingUser && (
        <EditUserRoleDialog
          user={editingUser}
          open={!!editingUser}
          onOpenChange={(open) => !open && setEditingUser(null)}
          onUserUpdated={() => fetchUsers()}
          isCurrentUser={editingUser.id === currentUserId}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;utilisateur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;utilisateur{" "}
              <strong>
                {deletingUser?.full_name || deletingUser?.email}
              </strong>{" "}
              sera définitivement supprimé.
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
    </div>
  );
}
