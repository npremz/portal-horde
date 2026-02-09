"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, FolderKanban, Bell } from "lucide-react";
import type { DashboardStats } from "@/app/api/dashboard/stats/route";

interface StatsCardsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      title: "Clients",
      titleFull: "Clients Total",
      value: stats?.totalClients ?? 0,
      icon: Users,
      description: `+${stats?.newClientsLast30Days ?? 0} (30j)`,
      descriptionFull: `+${stats?.newClientsLast30Days ?? 0} ces 30 derniers jours`,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pipeline",
      titleFull: "Pipeline Actif",
      value: stats?.activePipeline ?? 0,
      icon: TrendingUp,
      description: `${stats?.conversionRate ?? 0}% conv.`,
      descriptionFull: `${stats?.conversionRate ?? 0}% de conversion`,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Projets",
      titleFull: "Projets Actifs",
      value: stats?.activeProjects ?? 0,
      icon: FolderKanban,
      description: `${stats?.pendingDeliverables ?? 0} en attente`,
      descriptionFull: `${stats?.pendingDeliverables ?? 0} livrables en attente`,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Relances",
      titleFull: "À relancer",
      value: stats?.pendingFollowups ?? 0,
      icon: Bell,
      description: "à relancer",
      descriptionFull: "clients en attente de relance",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  if (loading) {
    return (
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 md:p-6">
              <Skeleton className="h-4 w-16 md:w-24 mb-2" />
              <Skeleton className="h-7 md:h-8 w-12 md:w-16 mb-2" />
              <Skeleton className="h-3 w-20 md:w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between mb-1 md:mb-2 gap-1">
              <span className="text-[10px] md:text-sm font-medium text-muted-foreground truncate">
                <span className="md:hidden">{card.title}</span>
                <span className="hidden md:inline">{card.titleFull}</span>
              </span>
              <div className={`p-1.5 md:p-2 rounded-lg shrink-0 ${card.bgColor}`}>
                <card.icon className={`h-3 w-3 md:h-4 md:w-4 ${card.color}`} />
              </div>
            </div>
            <div className="text-xl md:text-3xl font-bold">{card.value}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 md:mt-1 truncate">
              <span className="md:hidden">{card.description}</span>
              <span className="hidden md:inline">{card.descriptionFull}</span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
