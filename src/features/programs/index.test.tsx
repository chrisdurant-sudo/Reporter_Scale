import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DemoActionContext, WorkspaceQueryContext } from "../../contracts/v2";
import { DEMO_SNAPSHOT_V2 } from "../../data/v2";
import { prepareProgramsView } from "../../logic/programs";
import { ProgramsScreen } from "./index";

afterEach(cleanup);
const seed = DEMO_SNAPSHOT_V2;
const context: WorkspaceQueryContext<"programs"> = { workspace: "programs", evaluation: { asOfAt: seed.currentAsOfAt, snapshotRevision: seed.revision, reportingTimeZone: "America/Los_Angeles" as never }, filters: { selectedMarket: "ALL", marketBasis: "program-market-at-entry", marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: null } };
const view = prepareProgramsView(seed, context);
const pilot = view.rows.find((row) => row.title === "Readiness checklist pilot")!;
const commandContext: DemoActionContext = { snapshotRevision: seed.revision, occurredAt: seed.currentAsOfAt, busy: false, actor: { memberId: seed.teamMembers[1]!.id, actorId: seed.teamMembers[1]!.actorId, name: seed.teamMembers[1]!.fictionalName } };
function setup(extra = {}) { const actions = { onOpenEvidence: vi.fn(), onSaveProgramText: vi.fn().mockResolvedValue(undefined) }; const ports = { onSaveDecision: vi.fn().mockResolvedValue(undefined), onSaveDraft: vi.fn().mockResolvedValue(undefined), onCreateLinkedWork: vi.fn().mockResolvedValue(undefined), onNavigateTarget: vi.fn() }; render(<ProgramsScreen view={view} actions={actions} commandContext={commandContext} {...ports} {...extra} />); return { actions, ...ports }; }
function openPilot() { fireEvent.click(screen.getAllByRole("button", { name: pilot.title })[0]!); }
function enterReview() { fireEvent.change(screen.getByLabelText("Next review date"), { target: { value: "2026-03-20" } }); }

describe("Programs prepared presentation", () => {
  it("uses categorical cohort denominators and each program's own outcome", () => {
    setup(); expect(screen.getByText(/20 mature · 0 observing · 6 \/ 20/)).toBeVisible(); expect(screen.getByText(/20 mature · 0 observing · 11 \/ 20/)).toBeVisible();
    expect(screen.getByText(/pilot: Target met in this sample/)).toBeVisible(); expect(screen.queryByText(/result over time/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Comparison program"), { target: { value: view.rows.find((row) => row.stage === "closed")!.id } });
    expect(screen.getByText(/6 mature · 0 observing · 1 \/ 6/)).toBeVisible(); expect(screen.getByText(/Qualified within the observation horizon · 30-day horizon/)).toBeVisible();
  });
  it("focuses and clears counted status with scope-consistent chart and table", () => {
    setup(); fireEvent.click(screen.getByRole("button", { name: "Stopped 1" })); expect(screen.getByText(/1 results · Market/)).toBeVisible(); expect(screen.queryByRole("button", { name: pilot.title })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Stopped 1" })); expect(screen.getByText(/3 results · Market/)).toBeVisible();
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "Process" } }); fireEvent.change(screen.getByLabelText("Find program"), { target: { value: "checklist" } }); openPilot(); fireEvent.click(screen.getByRole("button", { name: `Close ${pilot.title}` })); expect(screen.getByLabelText("Find program")).toHaveValue("checklist"); expect(screen.getByLabelText("Type")).toHaveValue("Process"); fireEvent.click(screen.getByRole("button", { name: "Clear all" })); expect(screen.getByText(/3 results · Market/)).toBeVisible();
  });
  it("never claims a whole-program target met in a market subset", () => {
    const scoped = prepareProgramsView(seed, { ...context, filters: { ...context.filters, selectedMarket: "LAX" } }); setup({ view: scoped });
    expect(screen.getByText(/10 mature · 0 observing · 3 \/ 10/)).toBeVisible(); expect(screen.getByText(/10 mature · 0 observing · 6 \/ 10/)).toBeVisible(); expect(screen.getAllByText(/benchmark only/).length).toBeGreaterThan(0); expect(screen.queryByText(/Target met in this sample/)).not.toBeInTheDocument();
  });
  it("awaits explicit decisions, retains whitespace and inputs on failure, and retries", async () => {
    const onSaveDecision = vi.fn().mockRejectedValueOnce(new Error("Storage unavailable")).mockResolvedValueOnce(undefined); setup({ onSaveDecision }); openPilot(); fireEvent.click(screen.getByRole("button", { name: "Record decision" }));
    fireEvent.change(screen.getByLabelText("Decision"), { target: { value: "expand" } }); enterReview(); fireEvent.change(screen.getByLabelText("Decision rationale"), { target: { value: "  Review only the bounded cohort.  " } }); fireEvent.click(screen.getByRole("button", { name: "Save decision" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Storage unavailable"); expect(screen.getByLabelText("Decision rationale")).toHaveValue("  Review only the bounded cohort.  "); expect(screen.queryByRole("status")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save decision" })); expect(await screen.findByRole("status")).toHaveTextContent("Decision saved"); expect(onSaveDecision).toHaveBeenLastCalledWith({ programId: pilot.id, decision: "expand", rationale: "  Review only the bounded cohort.  ", ownerId: pilot.ownerId, nextReviewAt: "2026-03-20T17:00:00.000Z" });
  });
  it("rejects review dates before command time without calling the port", async () => {
    const ports = setup(); openPilot(); fireEvent.click(screen.getByRole("button", { name: "Record decision" })); fireEvent.change(screen.getByLabelText("Next review date"), { target: { value: "2025-01-01" } }); fireEvent.change(screen.getByLabelText("Decision rationale"), { target: { value: "Keep evidence." } }); fireEvent.submit(screen.getByRole("button", { name: "Save decision" }).closest("form")!); expect(await screen.findByRole("alert")).toHaveTextContent("after the current demo date"); expect(ports.onSaveDecision).not.toHaveBeenCalled();
  });
  it("copies only the explicitly selected canonical process version", async () => {
    const ports = setup(); openPilot(); fireEvent.click(screen.getByRole("button", { name: "Save process draft" })); expect(screen.getByLabelText("Source process version")).toHaveValue(""); const source = pilot.processVersions[1]!; fireEvent.change(screen.getByLabelText("Source process version"), { target: { value: source.id } }); expect(screen.getByText(source.requiredSteps[0]!.instruction)).toBeVisible(); enterReview(); fireEvent.click(screen.getByRole("button", { name: "Save draft" })); expect(await screen.findByRole("status")).toHaveTextContent("selected canonical version"); expect(ports.onSaveDraft).toHaveBeenCalledWith({ programId: pilot.id, sourceProcessVersionId: source.id, ownerId: pilot.ownerId, nextReviewAt: "2026-03-20T17:00:00.000Z" });
  });
  it("creates explicit linked Team work without constructing a private record", async () => {
    const ports = setup(); openPilot(); fireEvent.click(screen.getByRole("button", { name: "Create linked work" })); fireEvent.change(screen.getByLabelText("Work title"), { target: { value: "Review Data evidence with the program owner" } }); fireEvent.change(screen.getByLabelText("Owner"), { target: { value: "" } }); fireEvent.change(screen.getByLabelText("Domain"), { target: { value: "program" } }); fireEvent.change(screen.getByLabelText("Priority"), { target: { value: "high" } }); fireEvent.change(screen.getByLabelText("Due date"), { target: { value: "2026-03-18" } }); fireEvent.click(screen.getByRole("button", { name: "Save linked work" })); await screen.findByRole("status"); expect(ports.onCreateLinkedWork).toHaveBeenCalledWith({ programId: pilot.id, title: "Review Data evidence with the program owner", ownerId: null, domain: "program", status: "open", dueAt: "2026-03-18T17:00:00.000Z", priority: "high", primaryEntityRef: { kind: "program", id: pilot.id } });
  });
  it("preserves entered text and explicit clearing through acknowledged saves", async () => {
    const { actions } = setup(); fireEvent.click(screen.getAllByRole("button", { name: "Edit notes & next step" })[0]!); fireEvent.change(screen.getByLabelText(`Notes for ${pilot.title}`), { target: { value: "  Keep the limitations.  " } }); fireEvent.change(screen.getByLabelText(`Next step for ${pilot.title}`), { target: { value: "" } }); expect(actions.onSaveProgramText).not.toHaveBeenCalled(); fireEvent.click(screen.getByRole("button", { name: "Save notes and next step" })); await screen.findByRole("status"); expect(actions.onSaveProgramText).toHaveBeenCalledWith({ programId: pilot.id, field: "note", text: "  Keep the limitations.  " }); expect(actions.onSaveProgramText).toHaveBeenCalledWith({ programId: pilot.id, field: "next-step", text: "" });
  });
  it("opens exact cohort evidence after closing the local drawer", async () => {
    const { actions } = setup(); fireEvent.click(screen.getByRole("button", { name: "Inspect earlier" })); const dialog = screen.getByRole("dialog"); fireEvent.click(within(dialog).getByRole("button", { name: "Why this?" })); await waitFor(() => expect(actions.onOpenEvidence).toHaveBeenCalledWith(pilot.groups.find((group) => group.groupId === "earlier")!.evidence.id)); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
