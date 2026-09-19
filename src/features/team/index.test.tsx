import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DemoActionContext, WorkspaceQueryContext } from "../../contracts/v2";
import { DEMO_SNAPSHOT_V2 } from "../../data/v2";
import { prepareTeamView } from "../../logic/team";
import { TeamScreen, type TeamScreenProps } from "./index";
afterEach(cleanup);
const seed = DEMO_SNAPSHOT_V2;
const context: WorkspaceQueryContext<"team"> = { workspace: "team", evaluation: { asOfAt: seed.currentAsOfAt, snapshotRevision: 0, reportingTimeZone: "America/Los_Angeles" as never }, filters: { selectedMarket: "ALL", marketBasis: "all-markets", marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: { startAt: "2026-02-09T08:00:00Z" as never, endAt: "2026-02-16T08:00:00Z" as never, boundary: "[start,end)" } } };
const view = prepareTeamView(seed, context, { id: "M11" as never, version: "v2-frozen-1" as never });
const actor = seed.teamMembers[0]!;
const commandContext: DemoActionContext = { snapshotRevision: 0, occurredAt: seed.currentAsOfAt, actor: { memberId: actor.id, actorId: actor.actorId, name: actor.fictionalName }, busy: false };
function props(): TeamScreenProps { return { view, commandContext, onChangeFilters: vi.fn(), onNavigateTarget: vi.fn(), onCreateRecordId: vi.fn((kind) => `new-${kind}`), onEditWork: vi.fn().mockResolvedValue(undefined), onTransitionWork: vi.fn().mockResolvedValue(undefined), actions: { onOpenEvidence: vi.fn(), onCreateWork: vi.fn().mockResolvedValue(undefined), onReassignWork: vi.fn().mockResolvedValue(undefined), onSaveTargetRevision: vi.fn().mockResolvedValue(undefined), onRecordQuality: vi.fn().mockResolvedValue(undefined), onRecordCoaching: vi.fn().mockResolvedValue(undefined), onReviewCoaching: vi.fn().mockResolvedValue(undefined), onSharePractice: vi.fn().mockResolvedValue(undefined) } }; }
const change = (name: string, value: string) => fireEvent.change(screen.getByLabelText(name, { exact: true }), { target: { value } });
const openMember = () => fireEvent.click(screen.getByRole("button", { name: actor.fictionalName }));

describe("Team interview presentation", () => {
  it("renders three prepared columns and sends stable filters including toggle-clear", () => {
    const p = props(); const { rerender } = render(<TeamScreen {...p} />);
    expect(screen.getAllByRole("region").map((item) => item.getAttribute("aria-label"))).toEqual(expect.arrayContaining(["To do", "In progress", "Done"]));
    expect(screen.queryByRole("region", { name: "Blocked" })).not.toBeInTheDocument();
    change("Member", "unassigned"); expect(p.onChangeFilters).toHaveBeenLastCalledWith({ memberId: "unassigned" });
    change("Domain filter", "screening"); expect(p.onChangeFilters).toHaveBeenLastCalledWith({ domains: ["screening"] });
    fireEvent.click(screen.getByRole("button", { name: "Blocked" })); expect(p.onChangeFilters).toHaveBeenLastCalledWith({ blocked: true });
    rerender(<TeamScreen {...p} view={prepareTeamView(seed, context, { id: "M11" as never, version: "v2-frozen-1" as never }, { blocked: true })} />);
    fireEvent.click(screen.getByRole("button", { name: "Blocked" })); expect(p.onChangeFilters).toHaveBeenLastCalledWith({ blocked: undefined });
    fireEvent.click(screen.getByRole("button", { name: "Clear all" })); expect(p.onChangeFilters).toHaveBeenLastCalledWith({});
  });
  it("awaits creation and retains every field when a repository write rejects", async () => {
    const p = props(); let reject!: (error: Error) => void;
    vi.mocked(p.actions.onCreateWork!).mockImplementation(() => new Promise((_, fail) => { reject = fail; }));
    render(<TeamScreen {...p} />); fireEvent.click(screen.getByRole("button", { name: "Add work" }));
    change("Work title", "Specific linked follow-up"); change("Owner", "team-2"); change("Due date (UTC)", "2026-02-20T17:00"); change("Priority", "high"); change("Related record", "market:LAX");
    fireEvent.submit(screen.getByRole("form", { name: "Add work" }));
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(p.actions.onCreateWork).toHaveBeenCalledWith(expect.objectContaining({ title: "Specific linked follow-up", ownerId: "team-2", primaryEntityRef: { kind: "market", id: "LAX" }, dueAt: "2026-02-20T17:00:00Z", priority: "high" }));
    reject(new Error("Storage unavailable; retry.")); expect(await screen.findByRole("alert")).toHaveTextContent("Storage unavailable"); expect(screen.getByLabelText("Work title")).toHaveValue("Specific linked follow-up"); expect(screen.getByLabelText("Owner")).toHaveValue("team-2");
  });
  it("saves notes verbatim, retains failed drafts and does not send assignment with a detail edit", async () => {
    const p = props(); vi.mocked(p.onEditWork!).mockRejectedValue(new Error("Save rejected"));
    render(<TeamScreen {...p} />); const detail = view.workDetails.find((item) => item.card?.status === "In progress")!;
    fireEvent.click(screen.getByRole("button", { name: detail.title }));
    change("Note", "  Review evidence\nNext step  "); change("Edit reason", "Manager review");
    fireEvent.submit(screen.getByRole("form", { name: "Edit work details" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Save rejected"); expect(screen.getByLabelText("Note")).toHaveValue("  Review evidence\nNext step  ");
    expect(p.onEditWork).toHaveBeenCalledWith({ workItemId: detail.id, changes: {}, appendNote: "  Review evidence\nNext step  ", reason: "Manager review" }); expect(p.actions.onReassignWork).not.toHaveBeenCalled();
  });
  it("requires explicit completion evidence and preserves historical completion actor after reassignment", async () => {
    const p = props(); render(<TeamScreen {...p} />); const detail = view.workDetails.find((item) => item.completion)!;
    fireEvent.click(screen.getByRole("button", { name: detail.title }));
    expect(screen.getByText(/Original actor:/)).toHaveTextContent(detail.completion!.actorId);
    expect(screen.queryByRole("form", { name: "Change work status" })).not.toBeInTheDocument();
    change("Owner", "team-3"); change("Assignment reason", "Review workload"); fireEvent.submit(screen.getByRole("form", { name: "Assign work" }));
    await waitFor(() => expect(p.actions.onReassignWork).toHaveBeenCalledWith({ workItemId: detail.id, ownerId: "team-3", reason: "Review workload" })); expect(p.onTransitionWork).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: `Close ${detail.title}` }));
    const open = view.workDetails.find((item) => item.allowedStatuses.includes("completed"))!; fireEvent.click(screen.getByRole("button", { name: open.title })); change("Status", "completed");
    const input = screen.getByLabelText("Completion evidence"); expect(input).toBeRequired(); fireEvent.change(input, { target: { value: `${open.completionEvidenceOptions[0]!.kind}:${open.completionEvidenceOptions[0]!.id}` } }); change("Status reason", "Evidence reviewed"); fireEvent.submit(screen.getByRole("form", { name: "Change work status" }));
    await waitFor(() => expect(p.onTransitionWork).toHaveBeenCalledWith(expect.objectContaining({ status: "completed", completionEvidenceRefs: [{ kind: open.completionEvidenceOptions[0]!.kind, id: open.completionEvidenceOptions[0]!.id }] })));
  });
  it("uses command actor/time for quality rather than historical evaluation and separates count from ratio", async () => {
    const p = { ...props(), commandContext: { ...commandContext, occurredAt: "2026-02-17T17:00:00Z" as never } };
    render(<TeamScreen {...p} />); openMember(); fireEvent.click(screen.getByRole("button", { name: "Quality" }));
    expect(screen.getByText(/inspected work passed/)).toHaveTextContent(`${view.members[0]!.quality.passedCount} / ${view.members[0]!.quality.inspectedCount}`);
    change("Linked work", view.workDetails.find((item) => item.ownerId === actor.id)!.id); change("Required check", "Evidence completeness"); change("Inspection reason", "Linked evidence inspected");
    fireEvent.submit(screen.getByRole("form", { name: "Record quality inspection" }));
    await waitFor(() => expect(p.actions.onRecordQuality).toHaveBeenCalledWith({ qualityCheck: expect.objectContaining({ checkedBy: actor.id, checkedAt: "2026-02-17T17:00:00Z", outcome: "passed", requiredCheckResults: [{ checkCode: "Evidence completeness", reason: "Linked evidence inspected", passed: true }] }) }));
  });
  it("saves a target revision with its prepared metric/window and retains inputs on failure", async () => {
    const p = props(); vi.mocked(p.actions.onSaveTargetRevision).mockRejectedValue(new Error("Target conflict")); render(<TeamScreen {...p} />); openMember(); fireEvent.click(screen.getByRole("button", { name: "Goal" }));
    const current = view.members[0]!.targetRevisions.find((item) => item.selectedForComparison)!;
    change("Target (tasks)", "5"); change("Rationale", "Reviewed role capacity"); fireEvent.submit(screen.getByRole("form", { name: "Save goal" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Target conflict"); expect(screen.getByLabelText("Target (tasks)")).toHaveValue(5);
    expect(p.actions.onSaveTargetRevision).toHaveBeenCalledWith({ supersedesTargetId: current.target.id, target: expect.objectContaining({ metric: current.target.metric, reportingWindow: current.target.reportingWindow, target: 5, createdAt: commandContext.occurredAt }) });
  });
  it("records coaching and learning using the current actor and explicit dates, retaining failed input", async () => {
    const p = props(); vi.mocked(p.actions.onRecordCoaching).mockRejectedValue(new Error("Try again")); render(<TeamScreen {...p} />); openMember(); fireEvent.click(screen.getByRole("button", { name: "Coaching" }));
    change("Linked work", view.workDetails.find((item) => item.ownerId === actor.id)!.id); change("Observed issue or strength", "Clear source notes"); change("Expected practice", "Reuse source links"); change("Next action", "Review another case"); change("Due date (UTC)", "2026-02-19T17:00"); change("Review date (UTC)", "2026-02-20T17:00"); fireEvent.submit(screen.getByRole("form", { name: "Record coaching" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Try again"); expect(screen.getByLabelText("Next action")).toHaveValue("Review another case");
    fireEvent.click(screen.getByRole("button", { name: "Learning" })); fireEvent.submit(screen.getByRole("form", { name: "Share practice" }));
    await waitFor(() => expect(p.actions.onSharePractice).toHaveBeenCalledWith({ coachingAction: expect.objectContaining({ authorId: actor.actorId, createdAt: commandContext.occurredAt, updatedAt: commandContext.occurredAt, dueAt: "2026-02-19T17:00:00Z", reviewAt: "2026-02-20T17:00:00Z", teamMemberId: actor.id }) }));
  });
  it("disables mutations without a current actor and uses supplied exact navigation after closing", () => {
    const p = { ...props(), commandContext: { ...commandContext, actor: null } }; vi.stubGlobal("requestAnimationFrame", (callback: () => void) => callback());
    render(<TeamScreen {...p} />); const detail = view.workDetails.find((item) => item.card?.status === "In progress")!; fireEvent.click(screen.getByRole("button", { name: detail.title }));
    expect(screen.getByRole("button", { name: "Save details" })).toBeDisabled(); expect(within(screen.getByRole("dialog")).getByText(/active manager/)).toBeVisible(); fireEvent.click(screen.getByRole("button", { name: "Open linked work context" })); expect(p.onNavigateTarget).toHaveBeenCalledWith(detail.navigationTarget); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); vi.unstubAllGlobals();
  });
});
