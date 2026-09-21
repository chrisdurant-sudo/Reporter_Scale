import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DemoActionContext, WorkspaceQueryContext } from "../../contracts/v2";
import { DEMO_SNAPSHOT_V2 } from "../../data/v2";
import { prepareNetworkView } from "../../logic/network";
import { ReportersNetworkScreen } from "./network";
import { AvailabilityForm, FollowUpForm } from "./networkForms";

afterEach(cleanup);
const seed = DEMO_SNAPSHOT_V2;
const query: WorkspaceQueryContext<"reporters"> = { workspace: "reporters", evaluation: { asOfAt: seed.currentAsOfAt, snapshotRevision: seed.revision, reportingTimeZone: "America/Los_Angeles" as never }, filters: { selectedMarket: "ALL", marketBasis: "service-market", marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: null } };
const view = prepareNetworkView(seed, query);
const context: DemoActionContext = { occurredAt: seed.currentAsOfAt, snapshotRevision: 0, actor: { memberId: "team-3" as never, actorId: "actor-team-3" as never, name: "Sam Rivera" }, busy: false };
const actions = () => ({ onOpenEvidence: vi.fn(), onOpenRecruitingChecklist: vi.fn(), onConfirmAvailability: vi.fn(), onCreateReengagementTask: vi.fn() });
const formProps = () => ({ row: view.reporters[0]!, view, context, onCancel: vi.fn(), onSaved: vi.fn() });
function fillAvailability() {
  fireEvent.change(screen.getByLabelText("Status"), { target: { value: "available" } });
  fireEvent.click(screen.getByLabelText("LAX")); fireEvent.click(screen.getByLabelText("SFO"));
  fireEvent.click(screen.getByLabelText("Remote"));
  fireEvent.change(screen.getByLabelText("Starts at (UTC)"), { target: { value: "2026-02-18T10:00" } });
  fireEvent.change(screen.getByLabelText("Ends at (UTC)"), { target: { value: "2026-02-18T15:00" } });
  fireEvent.change(screen.getByLabelText("Confirmation expires at (UTC)"), { target: { value: "2026-02-18T15:00" } });
}
describe("Reporters interview presentation", () => {
  it("uses availability conditions rather than credential checks for counted filters and preserves filters through the drawer", async () => {
    const user = userEvent.setup(); render(<ReportersNetworkScreen view={view} actions={actions()} />);
    const summary = screen.getByRole("region", { name: "Reporter network summary" });
    expect(within(summary).getByText("Needs confirmation").parentElement).toHaveTextContent(String(view.needsConfirmationReporterIds.length));
    expect(view.needsConfirmationReporterIds.length).not.toBe(view.reporters.filter((r) => r.compliance.state !== "clear").length);
    await user.selectOptions(screen.getByRole("combobox", { name: "Availability" }), "expired");
    const count = view.reporters.filter((r) => r.availability === "expired").length;
    expect(screen.getByText(`${count} shown`)).toBeVisible();
    const status = screen.getByRole("button", { name: `Needs confirmation ${count}` });
    await user.click(status); expect(status).toHaveAttribute("aria-pressed", "true");
    const row = view.reporters.find((r) => r.availability === "expired")!;
    await user.click(screen.getByRole("button", { name: row.name }));
    expect(screen.getByRole("dialog", { name: row.name })).toBeVisible();
    await user.click(screen.getByRole("button", { name: `Close ${row.name}` }));
    expect(screen.getByRole("combobox", { name: "Availability" })).toHaveValue("expired");
    await user.click(status); expect(status).toHaveAttribute("aria-pressed", "false");
    await user.click(screen.getByRole("button", { name: "Clear all" }));
    expect(screen.getByText(`${view.reporters.length} shown`)).toBeVisible();
  });
  it("combines stable skill filters, search and sort without changing market summaries", async () => {
    const user = userEvent.setup(); render(<ReportersNetworkScreen view={view} actions={actions()}/>);
    await user.selectOptions(screen.getByLabelText("Skill"), "realtime-transcription");
    await user.type(screen.getByRole("searchbox"), "Marcus");
    await user.selectOptions(screen.getByLabelText("Sort"), "name");
    expect(screen.getByText("1 shown")).toBeVisible();
    expect(screen.getByRole("table")).toHaveTextContent("Marcus Wren");
    expect(within(screen.getByRole("region", { name: "Reporter network summary" })).getByText("Ready").parentElement).toHaveTextContent(String(view.reporters.length));
  });
  it("opens exact person and checklist targets and reopens existing work without a write", async () => {
    const user = userEvent.setup(); const navigate = vi.fn(); const ports = actions(); const request = vi.fn();
    const row = view.reporters.find((r) => r.followUpTarget && r.checklistTarget)!;
    render(<ReportersNetworkScreen view={{ ...view, reporters: [row], attention: [] }} actions={ports} onNavigateTarget={navigate} onRequestFollowUp={request}/>);
    await user.click(screen.getByRole("button", { name: "Open linked work" }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(row.followUpTarget));
    expect(request).not.toHaveBeenCalled(); expect(ports.onCreateReengagementTask).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Inspect checklist" }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(row.checklistTarget));
    await user.click(screen.getByRole("button", { name: row.name }));
    await user.click(screen.getByRole("button", { name: "Inspect person evidence" }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith(row.detailTarget));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("awaits the explicit availability save, sends entered scope, and retains draft on rejection", async () => {
    let reject!: (error: Error) => void;
    const onSave = vi.fn(() => new Promise<void>((_, fail) => { reject = fail; }));
    const props = formProps(); render(<AvailabilityForm {...props} onSave={onSave}/>); fillAvailability();
    fireEvent.click(screen.getByRole("button", { name: "Save availability" }));
    expect(onSave).toHaveBeenCalledWith({ reporterId: props.row.reporterId, status: "available", serviceMarketIds: ["LAX", "SFO"], attendanceModes: ["remote"], startAt: "2026-02-18T10:00:00.000Z", endAt: "2026-02-18T15:00:00.000Z", confirmationExpiresAt: "2026-02-18T15:00:00.000Z" });
    expect(props.onSaved).not.toHaveBeenCalled(); expect(screen.getByRole("button", { name: "Saving availability…" })).toBeDisabled();
    await act(async () => reject(new Error("Storage denied")));
    expect(screen.getByRole("alert")).toHaveTextContent("Storage denied");
    expect(screen.getByLabelText("Starts at (UTC)")).toHaveValue("2026-02-18T10:00");
    expect(screen.getByLabelText("SFO")).toBeChecked(); expect(props.onSaved).not.toHaveBeenCalled();
  });
  it("supports explicit null expiry and acknowledges only a completed save", async () => {
    const props = formProps(); const onSave = vi.fn().mockResolvedValue(undefined);
    render(<AvailabilityForm {...props} onSave={onSave}/>); fillAvailability(); fireEvent.click(screen.getByLabelText("No expiry"));
    fireEvent.click(screen.getByRole("button", { name: "Save availability" }));
    await waitFor(() => expect(props.onSaved).toHaveBeenCalledOnce());
    expect(onSave.mock.calls[0]![0].confirmationExpiresAt).toBeNull();
    expect(screen.getByText(/Acting as Sam Rivera/)).toHaveTextContent("Feb 16, 2026 17:00 UTC");
  });
  it("keeps explicit owner/date follow-up values on failure, then saves nullable choices", async () => {
    const props = formProps(); const onSave = vi.fn().mockRejectedValueOnce(new Error("Stale revision")).mockResolvedValue(undefined);
    render(<FollowUpForm {...props} onSave={onSave}/>);
    fireEvent.change(screen.getByLabelText("Market"), { target: { value: "LAX" } });
    fireEvent.change(screen.getByLabelText("Owner"), { target: { value: "team-1" } });
    fireEvent.change(screen.getByLabelText("Due date (UTC)"), { target: { value: "2026-02-20" } });
    fireEvent.click(screen.getByRole("button", { name: "Save and open linked work" }));
    await screen.findByRole("alert"); expect(props.onSaved).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Owner")).toHaveValue("team-1"); expect(screen.getByLabelText("Due date (UTC)")).toHaveValue("2026-02-20");
    expect(onSave).toHaveBeenLastCalledWith({ reporterId: props.row.reporterId, marketId: "LAX", ownerId: "team-1", dueAt: "2026-02-20T00:00:00.000Z" });
    fireEvent.change(screen.getByLabelText("Owner"), { target: { value: "unassigned" } }); fireEvent.click(screen.getByLabelText("No due date"));
    fireEvent.click(screen.getByRole("button", { name: "Save and open linked work" }));
    await waitFor(() => expect(props.onSaved).toHaveBeenCalledOnce());
    expect(onSave).toHaveBeenLastCalledWith({ reporterId: props.row.reporterId, marketId: "LAX", ownerId: null, dueAt: null });
  });
});
