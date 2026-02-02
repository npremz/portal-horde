"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, AlertTriangle } from "lucide-react";
import { clientStatusConfig } from "@/lib/constants";
import type { Client, ClientStatus } from "@/types/database";

interface FollowupTableProps {
  clients?: Pick<Client, "id" | "name" | "status" | "next_followup_date">[];
  loading?: boolean;
}

export function FollowupTable({ clients, loading }: FollowupTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-2">
          <CardTitle className="text-sm md:text-base flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 md:h-4 md:w-4" />
            <span className="md:hidden">Relances</span>
            <span className="hidden md:inline">Clients a relancer</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-10 md:h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDaysOverdue = (dateStr: string | null) => {
    if (!dateStr) return 0;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - date.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Card>
      <CardHeader className="p-4 md:p-6 pb-2 md:pb-2">
        <CardTitle className="text-sm md:text-base flex items-center gap-2">
          <Bell className="h-3.5 w-3.5 md:h-4 md:w-4" />
          <span className="md:hidden">Relances</span>
          <span className="hidden md:inline">Clients a relancer</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        {!clients || clients.length === 0 ? (
          <div className="py-6 md:py-8 text-center text-muted-foreground text-xs md:text-sm">
            Aucun client a relancer
          </div>
        ) : (
          <div className="space-y-1.5 md:space-y-2">
            {clients.map((client) => {
              const daysOverdue = getDaysOverdue(client.next_followup_date);
              const isUrgent = daysOverdue >= 7;
              const statusConfig = clientStatusConfig[client.status as ClientStatus];

              return (
                <Link
                  key={client.id}
                  href={`/admin/clients/${client.id}`}
                  className="flex items-center justify-between p-2 md:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs md:text-sm truncate">{client.name}</p>
                      <Badge variant="outline" className={`text-[10px] md:text-xs px-1.5 md:px-2 ${statusConfig?.color || ""}`}>
                        {statusConfig?.label || client.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                    <span
                      className={`text-[10px] md:text-xs font-medium ${
                        isUrgent ? "text-red-600" : "text-orange-600"
                      }`}
                    >
                      {daysOverdue}j
                    </span>
                    {isUrgent && <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-500" />}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
