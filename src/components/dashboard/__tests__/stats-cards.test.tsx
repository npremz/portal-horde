import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils";
import { StatsCards } from "../stats-cards";
import type { DashboardStats } from "@/app/api/dashboard/stats/route";

const mockStats: DashboardStats = {
  totalClients: 25,
  activePipeline: 8,
  activeProjects: 5,
  pendingFollowups: 3,
  clientsByStatus: [],
  projectsByStatus: [],
  activityByDay: [],
  clientsToFollowup: [],
  recentProjects: [],
  conversionRate: 56,
  monthlyMessages: 15,
  pendingDeliverables: 4,
  newClientsLast30Days: 7,
};

describe("StatsCards", () => {
  it("renders loading skeletons when loading", () => {
    render(<StatsCards stats={null} loading={true} />);

    // Should render 4 skeleton cards
    const skeletons = document.querySelectorAll("[data-slot='skeleton']");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders stats when data is provided", () => {
    render(<StatsCards stats={mockStats} loading={false} />);

    // Check that values are displayed
    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("displays correct KPI labels", () => {
    render(<StatsCards stats={mockStats} loading={false} />);

    // Check for card titles (mobile versions)
    expect(screen.getByText("Clients")).toBeInTheDocument();
    expect(screen.getByText("Pipeline")).toBeInTheDocument();
    expect(screen.getByText("Projets")).toBeInTheDocument();
    expect(screen.getByText("Relances")).toBeInTheDocument();
  });

  it("shows new clients count in description", () => {
    render(<StatsCards stats={mockStats} loading={false} />);

    // Check for "+7 (30j)" description
    expect(screen.getByText("+7 (30j)")).toBeInTheDocument();
  });

  it("shows conversion rate in description", () => {
    render(<StatsCards stats={mockStats} loading={false} />);

    // Check for "56% conv." description
    expect(screen.getByText("56% conv.")).toBeInTheDocument();
  });

  it("shows pending deliverables count", () => {
    render(<StatsCards stats={mockStats} loading={false} />);

    // Check for "4 en attente" description
    expect(screen.getByText("4 en attente")).toBeInTheDocument();
  });

  it("handles null stats gracefully", () => {
    render(<StatsCards stats={null} loading={false} />);

    // Should render with 0 values when stats is null
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(4);
  });

  it("handles zero values correctly", () => {
    const zeroStats: DashboardStats = {
      ...mockStats,
      totalClients: 0,
      activePipeline: 0,
      activeProjects: 0,
      pendingFollowups: 0,
      newClientsLast30Days: 0,
      conversionRate: 0,
      pendingDeliverables: 0,
    };

    render(<StatsCards stats={zeroStats} loading={false} />);

    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBeGreaterThanOrEqual(4);
  });
});
