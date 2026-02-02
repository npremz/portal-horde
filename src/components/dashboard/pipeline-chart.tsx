"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { clientStatusConfig } from "@/lib/constants";
import type { ClientStatus } from "@/types/database";

interface PipelineChartProps {
  data?: { status: ClientStatus; count: number }[];
  loading?: boolean;
}

const statusOrder: ClientStatus[] = ["lead", "contacted", "in_project", "pending_review", "completed", "archived"];

const statusColors: Record<ClientStatus, string> = {
  lead: "#6b7280",
  contacted: "#3b82f6",
  in_project: "#22c55e",
  pending_review: "#eab308",
  completed: "#10b981",
  archived: "#9ca3af",
};

// Short labels for mobile
const shortLabels: Record<ClientStatus, string> = {
  lead: "Lead",
  contacted: "Contact",
  in_project: "Projet",
  pending_review: "Review",
  completed: "Termine",
  archived: "Archive",
};

// Theme colors
const themeColors = {
  light: {
    text: "#4C4B4B",
    border: "#B1B1B1",
    background: "#ffffff",
    foreground: "#222121",
  },
  dark: {
    text: "#B1B1B1",
    border: "#4C4B4B",
    background: "#2d2c2c",
    foreground: "#F4F3F3",
  },
};

export function PipelineChart({ data, loading }: PipelineChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = themeColors[resolvedTheme === "dark" ? "dark" : "light"];

  if (loading) {
    return (
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-2">
          <CardTitle className="text-sm md:text-base">Pipeline CRM</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <Skeleton className="h-[200px] md:h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Sort data by status order
  const sortedData = statusOrder
    .map((status) => {
      const item = data?.find((d) => d.status === status);
      return {
        status,
        count: item?.count || 0,
        label: clientStatusConfig[status]?.label || status,
        shortLabel: shortLabels[status],
      };
    })
    .filter((d) => d.count > 0);

  return (
    <Card>
      <CardHeader className="p-4 md:p-6 pb-2 md:pb-2">
        <CardTitle className="text-sm md:text-base">Pipeline CRM</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        {sortedData.length === 0 ? (
          <div className="h-[200px] md:h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            Aucune donnee
          </div>
        ) : (
          <>
            {/* Mobile: Vertical bars */}
            <div className="md:hidden h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fontSize: 10, fill: colors.text }}
                    interval={0}
                    tickMargin={4}
                    stroke={colors.border}
                  />
                  <YAxis tick={{ fontSize: 10, fill: colors.text }} width={30} stroke={colors.border} />
                  <Tooltip
                    formatter={(value) => [String(value), "Clients"]}
                    contentStyle={{
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: colors.foreground,
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {sortedData.map((entry) => (
                      <Cell key={entry.status} fill={statusColors[entry.status]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Desktop: Horizontal bars */}
            <div className="hidden md:block h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" tick={{ fontSize: 12, fill: colors.text }} stroke={colors.border} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fontSize: 12, fill: colors.text }}
                    width={100}
                    stroke={colors.border}
                  />
                  <Tooltip
                    formatter={(value) => [String(value), "Clients"]}
                    contentStyle={{
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "6px",
                      color: colors.foreground,
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {sortedData.map((entry) => (
                      <Cell key={entry.status} fill={statusColors[entry.status]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
