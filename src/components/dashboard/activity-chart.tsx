"use client";

import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ActivityChartProps {
  data?: { date: string; messages: number; actions: number }[];
  loading?: boolean;
}

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

export function ActivityChart({ data, loading }: ActivityChartProps) {
  const { resolvedTheme } = useTheme();
  const colors = themeColors[resolvedTheme === "dark" ? "dark" : "light"];

  if (loading) {
    return (
      <Card>
        <CardHeader className="p-4 md:p-6 pb-2 md:pb-2">
          <CardTitle className="text-sm md:text-base">Activite (30j)</CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <Skeleton className="h-[180px] md:h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Format date for display
  const chartData = data?.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("fr-BE", {
      day: "numeric",
      month: "short",
    }),
    shortDate: new Date(d.date).toLocaleDateString("fr-BE", {
      day: "numeric",
    }),
  })) || [];

  const hasData = chartData.some((d) => d.messages > 0 || d.actions > 0);

  return (
    <Card>
      <CardHeader className="p-4 md:p-6 pb-2 md:pb-2">
        <CardTitle className="text-sm md:text-base">
          <span className="md:hidden">Activite (30j)</span>
          <span className="hidden md:inline">Activite des 30 derniers jours</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
        {!hasData ? (
          <div className="h-[180px] md:h-[300px] flex items-center justify-center text-muted-foreground text-sm">
            Aucune activite recente
          </div>
        ) : (
          <>
            {/* Mobile */}
            <div className="md:hidden h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: -20, right: 10, top: 5, bottom: 0 }}>
                  <XAxis
                    dataKey="shortDate"
                    tick={{ fontSize: 8, fill: colors.text }}
                    interval={4}
                    tickMargin={4}
                    stroke={colors.border}
                  />
                  <YAxis tick={{ fontSize: 10, fill: colors.text }} width={30} stroke={colors.border} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: colors.foreground,
                    }}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend
                    verticalAlign="top"
                    height={24}
                    formatter={(value) => (
                      <span style={{ color: colors.text, fontSize: "10px" }}>
                        {value === "messages" ? "Msg" : "Actions"}
                      </span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="#3b82f6"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actions"
                    stroke="#22c55e"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                    activeDot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Desktop */}
            <div className="hidden md:block h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ left: 0, right: 20 }}>
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 10, fill: colors.text }}
                    interval="preserveStartEnd"
                    tickMargin={8}
                    stroke={colors.border}
                  />
                  <YAxis tick={{ fontSize: 12, fill: colors.text }} width={30} stroke={colors.border} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: colors.background,
                      border: `1px solid ${colors.border}`,
                      borderRadius: "6px",
                      color: colors.foreground,
                    }}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: colors.text, fontSize: "14px" }}>
                        {value === "messages" ? "Messages" : "Actions clients"}
                      </span>
                    )}
                  />
                  <Line
                    type="monotone"
                    dataKey="messages"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actions"
                    stroke="#22c55e"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
