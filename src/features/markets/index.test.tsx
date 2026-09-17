import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MarketsScreenProps } from "../../contracts";
import { MarketsScreen } from "./index";

const laxPlan = {
  marketId: "LAX" as const,
  marketName: "Los Angeles",
  goal: 12,
  assumptions: { screeningPassRate: 0.6, onboardingStartRate: 0.7, firstJobWithin14DaysRate: 0.8, leadTimeDays: 21 },
  planningStartAt: "2026-02-01T00:00:00.000Z",
  planningEndAt: "2026-03-31T23:59:59.000Z",
  actualFirstJobsCompleted: 5,
  populationNote: "Actual first jobs are counted in their completed market.",
  leadTimeNote: "Lead time is an illustrative planning assumption.",
};

function makeProps(overrides: Partial<MarketsScreenProps> = {}): MarketsScreenProps {
  const actions: MarketsScreenProps["actions"] = {
    onSelectMarket: vi.fn(),
    onOpenReporterWork: vi.fn(),
    onCancelPlan: vi.fn(),
    onPreviewPlan: vi.fn(() => ({ ok: true as const, message: "Preview ready", value: { marketId: "LAX" as const, goal: 12, requiredScreeningStarts: 36, requiredOnboardingStarts: 22, requiredReadyReporters: 16, earliestExpectedFirstJobAt: "2026-02-22T00:00:00.000Z", limitation: "Fresh recruiting only; existing pipeline is not credited." } })),
    onSavePlan: vi.fn(async () => ({ ok: true as const, value: undefined, message: "Plan saved" })),
  };
  return {
    view: {
      status: "ready",
      selectedMarket: "LAX",
      statusMessage: "Five market records ready.",
      selectedPlan: laxPlan,
      rows: [
        { marketId: "LAX", code: "LAX", name: "Los Angeles", periodLabel: "February–March 2026", firstJobsCompleted: 5, goal: 12, remaining: 7, progressPercent: 42, observedIssue: "Few completed screening reviews", nextAction: "Review stalled screening work", supportingRecords: [{ id: "event-1", label: "Screening review overdue", occurredAt: "2026-02-14T00:00:00.000Z" }] },
        { marketId: "SFO", code: "SFO", name: "San Francisco", periodLabel: "February–March 2026", firstJobsCompleted: 6, goal: 10, remaining: 4, progressPercent: 60, observedIssue: "Onboarding starts are delayed", nextAction: "Confirm onboarding availability", supportingRecords: [] },
        { marketId: "DFW", code: "DFW", name: "Dallas–Fort Worth", periodLabel: "February–March 2026", firstJobsCompleted: 4, goal: 9, remaining: 5, progressPercent: 44, observedIssue: "Follow-ups are waiting", nextAction: "Assign owner", supportingRecords: [] },
        { marketId: "ORD", code: "ORD", name: "Chicago", periodLabel: "February–March 2026", firstJobsCompleted: 8, goal: 11, remaining: 3, progressPercent: 73, observedIssue: "First-job timing varies", nextAction: "Review first-job support", supportingRecords: [] },
        { marketId: "ATL", code: "ATL", name: "Atlanta", periodLabel: "February–March 2026", firstJobsCompleted: 3, goal: 8, remaining: 5, progressPercent: 38, observedIssue: "More screening starts needed", nextAction: "Plan recruiter outreach", supportingRecords: [] },
      ],
    },
    actions,
    ...overrides,
  };
}

describe("MarketsScreen", () => {
  afterEach(cleanup);

  it("shows five prepared market records with record support and actions", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<MarketsScreen {...props} />);
    expect(screen.getByText("Five-market first-job progress and next recruiting action")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(6);
    expect(screen.getByText("Screening review overdue")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /open reporter work/i })[0]!);
    expect(props.actions.onOpenReporterWork).toHaveBeenCalledWith("LAX");
    await user.click(screen.getByRole("button", { name: /san francisco/i }));
    expect(props.actions.onSelectMarket).toHaveBeenCalledWith("SFO");
  });

  it("delegates a hypothetical plan preview and saves the edited draft without changing actuals", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<MarketsScreen {...props} />);
    const goal = screen.getByLabelText("First-job goal");
    await user.clear(goal);
    await user.type(goal, "15");
    await user.click(screen.getByRole("button", { name: "Preview plan" }));
    expect(props.actions.onPreviewPlan).toHaveBeenCalledWith(expect.objectContaining({ marketId: "LAX", goal: 15 }));
    expect(screen.getByText("Hypothetical plan preview")).toBeInTheDocument();
    expect(screen.getByText(/saving this plan does not change completed first jobs/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save plan" }));
    expect(props.actions.onSavePlan).toHaveBeenCalledWith(expect.objectContaining({ goal: 15 }));
    expect(await screen.findAllByText("Plan saved")).toHaveLength(2);
  });

  it("cancels and restores local planning values", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<MarketsScreen {...props} />);
    const goal = screen.getByLabelText("First-job goal");
    await user.clear(goal);
    await user.type(goal, "15");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(goal).toHaveValue(12);
    expect(props.actions.onCancelPlan).toHaveBeenCalledOnce();
  });

  it("shows rejected saves as an error with the returned validation message", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    props.actions.onSavePlan = vi.fn(async () => ({
      ok: false as const,
      message: "Plan was rejected.",
      errors: [{ code: "GOAL_INVALID", field: "goal", message: "Goal must be a nonnegative integer." }],
    }));
    render(<MarketsScreen {...props} />);
    await user.click(screen.getByRole("button", { name: "Save plan" }));
    expect(await screen.findByText("Plan was not saved")).toBeInTheDocument();
    expect(screen.getByText("Goal must be a nonnegative integer.")).toBeInTheDocument();
    expect(document.querySelector(".ui-notice--danger")).toHaveTextContent("Plan was not saved");
  });
});
