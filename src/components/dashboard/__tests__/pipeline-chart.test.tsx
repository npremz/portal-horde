import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils";
import { PipelineChart } from "../pipeline-chart";

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
  }),
}));

// Mock recharts to avoid rendering issues in tests
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Cell: () => null,
}));

describe("PipelineChart", () => {
  it("renders loading skeleton when loading", () => {
    render(<PipelineChart loading={true} />);

    expect(screen.getByText("Pipeline CRM")).toBeInTheDocument();
    const skeleton = document.querySelector("[data-slot='skeleton']");
    expect(skeleton).toBeInTheDocument();
  });

  it("renders 'Aucune donnee' when data is empty", () => {
    render(<PipelineChart data={[]} loading={false} />);

    expect(screen.getByText("Aucune donnee")).toBeInTheDocument();
  });

  it("renders 'Aucune donnee' when all counts are zero", () => {
    const data = [
      { status: "lead" as const, count: 0 },
      { status: "contacted" as const, count: 0 },
    ];

    render(<PipelineChart data={data} loading={false} />);

    expect(screen.getByText("Aucune donnee")).toBeInTheDocument();
  });

  it("renders chart when data has values", () => {
    const data = [
      { status: "lead" as const, count: 5 },
      { status: "contacted" as const, count: 3 },
      { status: "in_project" as const, count: 10 },
    ];

    render(<PipelineChart data={data} loading={false} />);

    expect(screen.getByText("Pipeline CRM")).toBeInTheDocument();
    expect(screen.queryByText("Aucune donnee")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("bar-chart").length).toBeGreaterThan(0);
  });

  it("renders card header with title", () => {
    render(<PipelineChart data={[]} loading={false} />);

    expect(screen.getByText("Pipeline CRM")).toBeInTheDocument();
  });

  it("handles undefined data", () => {
    render(<PipelineChart loading={false} />);

    expect(screen.getByText("Aucune donnee")).toBeInTheDocument();
  });
});
