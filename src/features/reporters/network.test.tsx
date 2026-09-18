import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PreparedNetworkView } from "../../logic/network";
import { ReportersNetworkScreen } from "./network";

const view = {
  evaluation: { asOfAt: "2026-02-16T08:00:00.000Z" },
  reporters: [
    { reporterId: "r-1", name: "Avery Stone", serviceMarkets: ["LAX"], capabilitySummary: "1 verified", certificationSummary: "CA · RPR", availability: "unknown", compliance: { state: "needs-check", evidenceLabel: "Credential evidence needs review" }, lastCompletedJobAt: null, recentJobCount: 0, followUp: null },
    { reporterId: "r-2", name: "Morgan Reed", serviceMarkets: ["LAX"], capabilitySummary: "1 verified", certificationSummary: "CA · CRR", availability: "available", compliance: { state: "clear", evidenceLabel: "Verified credential evidence current" }, lastCompletedJobAt: "2026-02-14T08:00:00.000Z", recentJobCount: 1, followUp: null },
  ],
  trend: [{ activeReporterIds: ["r-2"] }],
  reengagementCandidates: [],
  evidence: [],
} as unknown as PreparedNetworkView;
const actions = { onConfirmAvailability: vi.fn(), onCreateReengagementTask: vi.fn(), onOpenEvidence: vi.fn(), onOpenRecruitingChecklist: vi.fn() };

describe("ReportersNetworkScreen", () => {
  it("changes the visible grid scope and uses prepared attention and compliance", async () => {
    const user = userEvent.setup();
    render(<ReportersNetworkScreen actions={actions} view={view} />);
    expect(screen.getByText("Confirm availability for Avery Stone")).toBeInTheDocument();
    expect(screen.getByText("Needs check")).toBeInTheDocument();
    expect(screen.getByText("Morgan Reed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Activity" }));
    expect(screen.queryByText("Confirm availability for Avery Stone")).not.toBeInTheDocument();
    expect(screen.queryByText("Avery Stone")).not.toBeInTheDocument();
    expect(screen.getByText("Morgan Reed")).toBeInTheDocument();
  });
});
