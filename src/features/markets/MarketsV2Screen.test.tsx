import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarketsV2Screen } from "./MarketsV2Screen";

const view = { overview: { kpis: { marketCount: { value: 5 }, availableReporters: { value: 51 }, openSlots: { value: 38 }, projectedAdditionalNeed: { value: 3 } }, attention: [] }, evidence: [{ navigationTarget: {} }], marketRows: [], supplyDemandSeries: null } as never;

describe("MarketsV2Screen", () => {
  it("uses stateful controls and deterministic summary-card navigation without a growth-goal panel", () => {
    const onNavigateWorkspace = vi.fn();
    render(<MarketsV2Screen onNavigateWorkspace={onNavigateWorkspace} onOpenEvidence={vi.fn()} onPreviewGoal={vi.fn()} onSaveGoal={vi.fn()} onSelectMarket={vi.fn()} view={view} />);
    expect(screen.queryByText("Growth goal")).not.toBeInTheDocument();
    const overview = screen.getByRole("button", { name: "Overview" });
    fireEvent.click(overview);
    expect(overview).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Projection on" }));
    expect(screen.getByRole("button", { name: "Projection off" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "View Funnel" }));
    fireEvent.click(screen.getByRole("button", { name: "View Team" }));
    fireEvent.click(screen.getByRole("button", { name: "View Programs" }));
    expect(onNavigateWorkspace).toHaveBeenNthCalledWith(1, "recruiting");
    expect(onNavigateWorkspace).toHaveBeenNthCalledWith(2, "team");
    expect(onNavigateWorkspace).toHaveBeenNthCalledWith(3, "programs");
    fireEvent.click(screen.getByRole("button", { name: "View Markets" }));
    expect(screen.getByRole("button", { name: "Trends" })).toHaveAttribute("aria-pressed", "true");
  });
});
