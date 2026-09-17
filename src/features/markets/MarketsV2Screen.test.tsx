import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EvidenceBundle, WorkspaceFilterPayload } from "../../contracts/v2";
import type { PreparedMarketsView } from "../../logic/capacity";
import { MarketsV2Screen } from "./MarketsV2Screen";

const filters: WorkspaceFilterPayload = {
  selectedMarket: "LAX",
  marketBasis: "demand-market",
  marketIds: [],
  reporterIds: [],
  acquisitionCaseIds: [],
  requestIds: [],
  workItemIds: [],
  programIds: [],
  programEnrollmentIds: [],
  sourceIds: [],
  jobOutcomeIds: [],
  capabilityCodes: [],
  attendanceModes: [],
  recordRefs: [],
  window: null,
};

function view(growthGoal: PreparedMarketsView["growthGoal"]): PreparedMarketsView {
  return {
    workspace: "markets",
    evaluation: {
      asOfAt: "2026-02-16T17:00:00Z" as never,
      snapshotRevision: 1,
      reportingTimeZone: "America/Los_Angeles" as never,
    },
    appliedFilters: filters,
    evidence: [],
    coverage: { requested: 0, confirmed: 0, possible: 0, noVerifiedReadyMatch: 0, requirementsUnknown: 0, confirmedRate: null },
    requests: [],
    requirementBreakdown: [],
    marketRows: [],
    growthGoal,
    originalPlan: { status: "unavailable", requestIds: [], completedRequests: null, firstJobs: null, evidence: [], limitation: "No frozen request set." },
    limitations: [],
  };
}

function renderScreen(growthGoal: PreparedMarketsView["growthGoal"]) {
  const onPreviewGoal = vi.fn();
  const onSaveGoal = vi.fn();
  render(<MarketsV2Screen view={view(growthGoal)} onSelectMarket={vi.fn()} onOpenEvidence={vi.fn()} onPreviewGoal={onPreviewGoal} onSaveGoal={onSaveGoal} />);
  return { onPreviewGoal, onSaveGoal };
}

describe("MarketsV2Screen growth goal", () => {
  afterEach(cleanup);

  it("offers preview and save actions before any goal revision is saved", async () => {
    const user = userEvent.setup();
    const actions = renderScreen(null);

    expect(screen.getByText(/no growth-goal revision is saved/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Preview goal revision" }));
    await user.click(screen.getByRole("button", { name: "Save goal revision" }));
    expect(actions.onPreviewGoal).toHaveBeenCalledOnce();
    expect(actions.onSaveGoal).toHaveBeenCalledOnce();
  });

  it("continues to show the saved revision's record-derived values and actions", () => {
    const evidence = {} as EvidenceBundle;
    renderScreen({
      goalRevisionId: "goal-revision-test",
      goalId: "goal-test",
      target: 7,
      baselineAsOfAt: "2026-02-10T17:00:00Z" as never,
      deadline: "2026-02-28T17:00:00Z" as never,
      actual: 3,
      metric: { id: "M04" as never, version: "v2-test" as never },
      evidence,
    });

    expect(screen.getByText("3 of 7 first-time readiness additions. Baseline: 2026-02-10T17:00:00Z; deadline: 2026-02-28T17:00:00Z.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview goal revision" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save goal revision" })).toBeInTheDocument();
  });
});
