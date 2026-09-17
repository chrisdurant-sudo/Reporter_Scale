import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReportersScreenProps } from "../../contracts";
import { ReportersScreen } from "./index";

const success = { ok: true as const, value: undefined, message: "Saved" };
const props: ReportersScreenProps = {
  view: {
    status: "ready", selectedMarket: "LAX", marketLabel: "LAX — Los Angeles", asOfLabel: "February 16, 2026", populationNote: "Recruiting-market ownership determines this work list.", statusMessage: "Ready",
    stages: [{ stage: "screening", label: "Screening", count: 1, note: "Current work" }],
    reporters: [{ id: "r-1", name: "Avery Stone", recruitingMarketId: "LAX", marketLabel: "LAX", stage: "screening", stageLabel: "Screening", waitDays: 5, blocker: "Needs sample", nextStep: "Review sample", assignedTo: "Morgan Lee", dueAt: "2026-02-18T17:00:00.000Z", tone: "warning" }],
    reporterDetails: [{ id: "r-1", name: "Avery Stone", marketLabel: "LAX — Los Angeles", serviceMarketsLabel: "LAX, SFO", foundThrough: "Referral", preferences: [{ label: "Availability", value: "Weekdays" }], blocker: "Needs sample", stageLabel: "Screening", screeningReviewId: "s-1", screeningOutcome: "needs-information", screeningReason: "Sample needed", unresolvedInformation: ["Sample"], checks: [{ id: "check-1", label: "Sample review", required: true, status: "needs-information", note: "Awaiting upload" }], followUpId: "f-1", nextStep: "Review sample", assignedTeamMemberId: "tm-1", dueAt: "2026-02-18T17:00:00.000Z", history: [{ id: "h-1", occurredAt: "2026-02-10T17:00:00.000Z", label: "Screening started", reason: "Referral received", author: "Morgan Lee" }] }],
    teamMemberOptions: [{ id: "tm-1", name: "Morgan Lee" }], teamWorkload: [{ teamMemberId: "tm-1", name: "Morgan Lee", openFollowUps: 2, overdueFollowUps: 0, workloadNote: "Available for follow-up.", coachingNotes: [] }],
  },
  actions: { onSaveScreening: vi.fn(async () => success), onUpdateFollowUp: vi.fn(async () => success), onPreviewOutreach: vi.fn(() => ({ ok: true as const, value: { reporterId: "r-1", recipientLabel: "Avery Stone", subject: "Next step", body: "A local preview", disclosure: "Preview only — no message will be sent." as const }, message: "Preview prepared" })), onSaveCoaching: vi.fn(async () => success) },
};

afterEach(cleanup);

describe("ReportersScreen", () => {
  it("filters work and opens a detail panel with local message preview", async () => {
    const user = userEvent.setup(); render(<ReportersScreen {...props} />);
    expect(screen.getByText("Current stage snapshot")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search reporter work"), "no match");
    expect(screen.getByText("No matching reporter work")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("Search reporter work")); await user.click(screen.getByRole("button", { name: /Avery Stone/ }));
    expect(screen.getByTestId("reporter-detail")).toBeInTheDocument();
    await user.type(screen.getByLabelText("Search reporter work"), "no match");
    expect(screen.queryByTestId("reporter-detail")).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText("Search reporter work"));
    expect(screen.queryByTestId("reporter-detail")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Avery Stone/ }));
    await user.click(screen.getByRole("button", { name: "Preview message" }));
    expect(screen.getByText("Preview only — no message will be sent.")).toBeInTheDocument();
    expect(props.actions.onPreviewOutreach).toHaveBeenCalledWith("r-1");
  });

  it("uses the first team member for an unsaved follow-up and marks rejected saves as dangerous", async () => {
    const user = userEvent.setup();
    const update = vi.fn(async () => success);
    const rejected = vi.fn(async () => ({ ok: false as const, message: "Could not save", errors: [{ code: "INVALID", message: "Explain the screening reason." }] }));
    render(<ReportersScreen {...props} view={{ ...props.view, reporterDetails: [{ ...props.view.reporterDetails[0]!, followUpId: null, assignedTeamMemberId: "" }] }} actions={{ ...props.actions, onUpdateFollowUp: update, onSaveScreening: rejected }} />);
    await user.click(screen.getByRole("button", { name: /Avery Stone/ }));
    await user.click(screen.getByRole("button", { name: "Save follow-up" }));
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ assignedTeamMemberId: "tm-1" }));
    await user.click(screen.getByRole("button", { name: "Save screening review" }));
    expect(await screen.findByText("Could not save reporter work")).toBeInTheDocument();
    expect(screen.getByText("Explain the screening reason.").closest("section")).toHaveClass("ui-notice--danger");
  });

  it("delegates screening, follow-up, and coaching saves to actions", async () => {
    const user = userEvent.setup(); render(<ReportersScreen {...props} />); await user.click(screen.getByRole("button", { name: /Avery Stone/ }));
    await user.click(screen.getByRole("button", { name: "Save screening review" })); await user.click(screen.getByRole("button", { name: "Save follow-up" }));
    await user.click(screen.getByRole("button", { name: "Add coaching note" })); await user.type(screen.getByLabelText("Note"), "Clarify handoff"); await user.type(screen.getByLabelText("Next action"), "Send example"); fireEvent.change(screen.getAllByLabelText("Due")[0]!, { target: { value: "2026-02-20" } }); await user.click(screen.getByRole("button", { name: "Save coaching note" }));
    await waitFor(() => { expect(props.actions.onSaveScreening).toHaveBeenCalled(); expect(props.actions.onUpdateFollowUp).toHaveBeenCalled(); expect(props.actions.onSaveCoaching).toHaveBeenCalled(); });
  });
});
