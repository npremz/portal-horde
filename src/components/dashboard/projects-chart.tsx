"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { projectStatusConfig } from "@/lib/constants";
import type { ProjectStatus } from "@/types/database";

interface ProjectsChartProps {
  data?: { status: ProjectStatus; count: number }[];
  loading?: boolean;
}

const statusColors: Record<ProjectStatus, string> = {
  active: "#22c55e",
  paused: "#eab308",
  completed: "#3b82f6",
  archived: "#9ca3af",
};

export function ProjectsChart({ data, loading }: ProjectsChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-2">
          <CardTitle className="text-sm md:text-base">Projets par statut</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <Skeleton className="h-[200px] md:h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data
    ?.filter((d) => d.count > 0)
    .map((d) => ({
      ...d,
      name: projectStatusConfig[d.status]?.label || d.status,
    })) || [];

  const total = chartData.reduce((acc, d) => acc + d.count, 0);

  return (
    <Card>
      <CardHeader className="p-4 md:p-6 pb-2 md:pb-2">
        <CardTitle className="text-sm md:text-base">Projets par statut</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        {chartData.length === 0 ? (
          <div className="h-[200px] md:h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            Aucun projet
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.status} fill={statusColors[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [String(value), name]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                  />
                  <text
                    x="50%"
                    y="45%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground font-bold text-xl"
                  >
                    {total}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Desktop */}
            <div className="hidden md:block h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.status} fill={statusColors[entry.status]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [String(value), name]}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-sm text-muted-foreground">{value}</span>
                    )}
                  />
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground font-bold text-2xl"
                  >
                    {total}
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
