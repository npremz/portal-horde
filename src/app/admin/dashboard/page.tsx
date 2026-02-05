"use client";

import { useState, useEffect } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { PipelineChart } from "@/components/dashboard/pipeline-chart";
import { ProjectsChart } from "@/components/dashboard/projects-chart";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { FollowupTable } from "@/components/dashboard/followup-table";
import { ActiveProjectsTable } from "@/components/dashboard/active-projects-table";
import type { DashboardStats } from "@/app/api/dashboard/stats/route";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) {
          throw new Error("Erreur lors du chargement");
        }
        const data = await res.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="p-12 text-center">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-display uppercase">Dashboard</h1>
        <p className="text-muted-foreground text-sm md:text-base">
          Vue d&apos;ensemble de votre activité
        </p>
      </div>

      {/* KPI Cards */}
      <StatsCards stats={stats} loading={loading} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <PipelineChart data={stats?.clientsByStatus} loading={loading} />
        <ProjectsChart data={stats?.projectsByStatus} loading={loading} />
      </div>

      {/* Activity Chart (full width) */}
      <ActivityChart data={stats?.activityByDay} loading={loading} />

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <FollowupTable clients={stats?.clientsToFollowup} loading={loading} />
        <ActiveProjectsTable projects={stats?.recentProjects} loading={loading} />
      </div>
    </div>
  );
}
