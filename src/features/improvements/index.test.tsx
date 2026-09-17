import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ActionResult, ImprovementsScreenProps } from "../../contracts";
import { ImprovementsScreen } from "./index";

const success = (message: string): ActionResult => ({ ok: true, value: undefined, message });
const actions: ImprovementsScreenProps["actions"] = {
  onRecordDecision: vi.fn(async () => success("Decision recorded.")),
  onCreateProcessDraft: vi.fn(async () => success("Draft created.")),
  onUpdateProcessDraft: vi.fn(async () => success("Draft updated.")),
};

const view: ImprovementsScreenProps["view"] = {
  status: "ready",
  selectedMarket: "LAX",
  statusMessage: "One LAX improvement is ready for review.",
  teamMemberOptions: [{ id: "team-1", name: "Mina Patel" }],
  improvements: [{
    id: "improvement-1", title: "Screening brief", marketIds: ["LAX"], marketLabel: "LAX — Los Angeles", changeTypeLabel: "Screening",
    hypothesis: "A brief clarifies the sample checks.", changeSummary: "Send the brief before a review.", ownerId: "team-1", ownerName: "Mina Patel", partnerDeliverable: "Partner supplies the brief", reviewAt: "2026-02-20T00:00:00.000Z", observationWindowLabel: "Feb 1–Feb 14",
    results: [{ label: "Brief group", reporterCount: 8, completedCount: 3, rateLabel: "3 of 8", observationComplete: false, note: "Five reporters are still observing." }],
    limitations: ["The observation window is incomplete."], currentDecision: "continue", decisionRationale: "Keep collecting the incomplete sample.", canSaveAsProcess: true, processDraft: null,
  }],
  weeklyReview: { windowLabel: "Feb 9–15", summary: "Review the linked records before deciding.", evidence: [{ label: "Open sample", value: "5 reporters", sourceRecordIds: ["improvement-1"] }], nextActions: ["Review the remaining observations."] },
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ImprovementsScreen", () => {
  it("shows descriptive limits and requires a rationale before recording a decision", async () => {
    const user = userEvent.setup();
    render(<ImprovementsScreen view={view} actions={actions} />);
    expect(screen.getByText("Descriptive sample results only; they do not establish a causal winner.")).toBeInTheDocument();
    expect(screen.getByText("Not enough results yet")).toBeInTheDocument();
    const rationale = screen.getByLabelText("Rationale (required)");
    await user.clear(rationale);
    expect(screen.getByRole("button", { name: "Save decision" })).toBeDisabled();
    await user.type(rationale, "Continue through the full window.");
    await user.click(screen.getByRole("button", { name: "Save decision" }));
    expect(actions.onRecordDecision).toHaveBeenLastCalledWith({ improvementId: "improvement-1", decision: "continue", rationale: "Continue through the full window." });
  });

  it("does not treat a placeholder rationale as a recorded rationale", () => {
    const undecidedView = { ...view, improvements: [{ ...view.improvements[0]!, currentDecision: null, decisionRationale: "No decision recorded yet." }] };
    render(<ImprovementsScreen view={undecidedView} actions={actions} />);
    expect(screen.getByLabelText("Rationale (required)")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Save decision" })).toBeDisabled();
  });

  it("creates an editable draft only for a recorded Continue decision", async () => {
    const user = userEvent.setup();
    render(<ImprovementsScreen view={view} actions={actions} />);
    expect(screen.getByText("Available after a Continue decision. This creates a draft, not a rollout.")).toBeInTheDocument();
    const title = screen.getByLabelText("Draft title");
    await user.clear(title);
    await user.type(title, "Screening brief checklist");
    await user.click(screen.getByRole("button", { name: "Save as process" }));
    expect(actions.onCreateProcessDraft).toHaveBeenLastCalledWith(expect.objectContaining({ improvementId: "improvement-1", title: "Screening brief checklist" }));
    expect(screen.getByText("Weekly review · Feb 9–15")).toBeInTheDocument();
    expect(screen.getByText("Records: improvement-1")).toBeInTheDocument();
  });

  it("keeps edits to an existing process draft and sends them through the update action", async () => {
    const user = userEvent.setup();
    const draftView = { ...view, improvements: [{ ...view.improvements[0]!, processDraft: { id: "draft-1", title: "Original draft", ownerId: "team-1", ownerName: "Mina Patel", trigger: "Original trigger", steps: [{ id: "step-1", order: 1, instruction: "Original step" }], updatedAt: "2026-02-16T00:00:00.000Z" } }] };
    render(<ImprovementsScreen view={draftView} actions={actions} />);
    const title = screen.getByLabelText("Draft title");
    await user.clear(title);
    await user.type(title, "Revised draft");
    expect(title).toHaveValue("Revised draft");
    await user.click(screen.getByRole("button", { name: "Save draft changes" }));
    expect(actions.onUpdateProcessDraft).toHaveBeenLastCalledWith(expect.objectContaining({ draftId: "draft-1", title: "Revised draft" }));
  });

  it("shows a rejected action as an error notice", async () => {
    const user = userEvent.setup();
    const rejectedActions: ImprovementsScreenProps["actions"] = { ...actions, onRecordDecision: async () => ({ ok: false, message: "A rationale is required.", errors: [{ code: "RATIONALE_REQUIRED", message: "A rationale is required." }] }) };
    render(<ImprovementsScreen view={view} actions={rejectedActions} />);
    await user.click(screen.getByRole("button", { name: "Save decision" }));
    expect(screen.getByText("Could not save")).toBeInTheDocument();
    expect(screen.getByText("A rationale is required.")).toBeInTheDocument();
  });
});
