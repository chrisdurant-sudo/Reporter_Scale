import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { EvidenceBundle } from "../contracts/v2";
import { EmptyStateV2, ErrorState, EvidencePresentation, LoadingState, MetricSignal } from "./v2";

const evidence = {
  id: "evidence-1",
  metric: { id: "metric-coverage", version: "v1" },
  asOfAt: "2026-02-16T17:00:00Z",
  snapshotRevision: 4,
  unit: "requests",
  scope: { workspace: "markets", marketBasis: "demand-market", selectedMarket: "LAX", populationDescription: "Upcoming LAX requests" },
  filters: {},
  reportingWindow: null,
  computation: { status: "available", value: 2, numerator: null, denominator: null },
  contributingRecords: [{ kind: "demand-request", id: "request-1", label: "LAX realtime deposition · Feb 20", occurredAt: "2026-02-20T18:00:00Z", joinPath: [] }],
  numeratorMembers: [], denominatorMembers: [], exclusions: [], unknownCount: 1,
  limitations: ["Availability is explicit and may change."],
  explanation: "2 requests need confirmation before they are covered.",
  navigationTarget: { workspace: "reporters", intent: "work-list", filters: {}, evidenceContext: { asOfAt: "2026-02-16T17:00:00Z", snapshotRevision: 4, metric: { id: "metric-coverage", version: "v1" } } },
} as unknown as EvidenceBundle;

describe("v2 evidence and state primitives", () => {
  it("makes the prepared calculation and human-readable source records available before exact navigation", async () => {
    const user = userEvent.setup();
    const onOpenWork = vi.fn();
    render(<EvidencePresentation evidence={evidence} onOpenWork={onOpenWork} />);
    expect(screen.queryByText("Contributing source records")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Why this?" }));
    expect(screen.getByText("LAX realtime deposition · Feb 20")).toBeVisible();
    expect(screen.getByText("Unknown information:").parentElement).toHaveTextContent("1");
    await user.click(screen.getByRole("button", { name: "Open the work" }));
    expect(onOpenWork).toHaveBeenCalledWith(evidence.navigationTarget);
  });

  it("uses readable status text and exposes loading, empty, and error states", () => {
    render(<><MetricSignal label="Confirmed coverage" status="Needs review" value="6 of 10" /><LoadingState /><EmptyStateV2 title="No participants" detail="No participants in this market." /><ErrorState detail="Try returning to the workspace." /></>);
    expect(screen.getByText("Needs review")).toBeVisible();
    expect(screen.getByText("Loading prepared workspace data…")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByText("No participants in this market.")).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent("Try returning to the workspace.");
  });
});
