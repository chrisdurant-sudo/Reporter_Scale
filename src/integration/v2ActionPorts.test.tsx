import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DemoActionContext, NetworkAvailabilityRecordPayload, PersistedDemoSnapshotV2, ProgramDecisionSavePayload, ProcessDraftSavePayload, WorkEditPayload, WorkItemId, WorkTransitionPayload } from "../contracts/v2";
import { INTERVIEW_V2_STORAGE_KEY } from "../contracts/v2";
import { DEMO_SNAPSHOT_V2 } from "../data/v2";
import type { PreparedTeamView } from "../logic/team";
import type { NetworkFollowUpPayload } from "./v2NetworkComposition";
import { App } from "./App";

type NetworkPorts = {
  commandContext: DemoActionContext;
  onRecordAvailability(payload: NetworkAvailabilityRecordPayload): Promise<void>;
  onRequestFollowUp(payload: NetworkFollowUpPayload): Promise<void>;
};
type TeamPorts = {
  view: PreparedTeamView;
  onEditWork(payload: WorkEditPayload): Promise<void>;
  onTransitionWork(payload: WorkTransitionPayload): Promise<void>;
};
let network: NetworkPorts;
let team: TeamPorts;
type ProgramPorts = {
  onSaveDecision(payload: ProgramDecisionSavePayload): Promise<void>;
  onSaveDraft(payload: ProcessDraftSavePayload): Promise<void>;
};
let programs: ProgramPorts;
vi.mock("../features/reporters/network", () => ({ ReportersNetworkScreen: (props: NetworkPorts) => {
  network = props; return <main aria-label="Reporters">Network action ports</main>;
} }));
vi.mock("../features/team", () => ({ TeamScreen: (props: TeamPorts) => {
  team = props; return <main aria-label="Team">Team action ports</main>;
} }));
vi.mock("../features/programs", () => ({ ProgramsScreen: (props: ProgramPorts) => {
  programs = props; return <main aria-label="Programs">Programs action ports</main>;
} }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.removeItem(INTERVIEW_V2_STORAGE_KEY); });
const saved = () => (JSON.parse(localStorage.getItem(INTERVIEW_V2_STORAGE_KEY)!) as PersistedDemoSnapshotV2).snapshot;
const seed = DEMO_SNAPSHOT_V2;
const reporter = seed.reporters.find((person) => !seed.workItems.some((work) => work.kind === "re-engage" && work.primaryEntityRef.kind === "reporter" && work.primaryEntityRef.id === person.id))!;
const availability: NetworkAvailabilityRecordPayload = {
  reporterId: reporter.id, status: "available", serviceMarketIds: ["LAX"], attendanceModes: ["remote"],
  startAt: "2026-02-18T10:00:00Z" as never, endAt: "2026-02-18T15:00:00Z" as never,
  confirmationExpiresAt: "2026-02-18T15:00:00Z" as never,
};
async function openNetwork() {
  const user = userEvent.setup(); render(<App />);
  await screen.findByRole("region", { name: "Overview metrics" });
  await user.click(screen.getByRole("button", { name: "Reporters" }));
  await screen.findByRole("main", { name: "Reporters" });
  return user;
}

describe("coordinator interview action ports", () => {
  it("acknowledges the exact entered availability after storage, using the current synthetic actor and time", async () => {
    await openNetwork();
    expect(network.commandContext).toMatchObject({ occurredAt: seed.currentAsOfAt, busy: false, actor: { memberId: "team-3", actorId: "actor-team-3" } });
    await act(async () => network.onRecordAvailability(availability));
    const snapshot = saved();
    expect(snapshot.availabilityWindows.at(-1)).toMatchObject({ ...availability, recordedAt: seed.currentAsOfAt, actorId: "actor-team-3" });
    expect(snapshot.commandRecords.at(-1)?.commandType).toBe("network.record-availability");
    expect(snapshot.revision).toBe(1);
    expect([snapshot.readinessEvents, snapshot.assignmentEvents, snapshot.jobOutcomes]).toEqual([seed.readinessEvents, seed.assignmentEvents, seed.jobOutcomes]);
    expect(network.commandContext.snapshotRevision).toBe(1);
  });

  it("opens one follow-up task and retains its identity after an edit and repeated request", async () => {
    const user = await openNetwork();
    const payload: NetworkFollowUpPayload = { reporterId: reporter.id, marketId: reporter.serviceMarketIds[0]!, ownerId: null, dueAt: null };
    await act(async () => network.onRequestFollowUp(payload));
    await screen.findByRole("main", { name: "Team" });
    expect(team.view.workDetails).toHaveLength(1);
    const workItemId = team.view.workDetails[0]!.id as WorkItemId;
    await act(async () => team.onEditWork({ workItemId, changes: { priority: "high", dueAt: "2026-02-20T17:00:00Z" as never }, appendNote: "Keep  entered spacing", reason: "Manager reviewed the follow-up" }));
    const afterEdit = saved();
    const work = afterEdit.workItems.find((item) => item.id === workItemId)!;
    expect(work).toMatchObject({ priority: "high", dueAt: "2026-02-20T17:00:00Z" });
    expect(work.notes?.at(-1)?.text).toBe("Keep  entered spacing");
    await user.click(screen.getByRole("button", { name: "Reporters" }));
    await act(async () => network.onRequestFollowUp({ ...payload, ownerId: "team-1" as never }));
    await screen.findByRole("main", { name: "Team" });
    expect(team.view.workDetails.map((item) => item.id)).toEqual([workItemId]);
    expect(saved()).toEqual(afterEdit);
  });

  it("rejects denied storage without acknowledging a command or replacing the loaded state", async () => {
    await openNetwork();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("denied"); });
    await act(async () => { await expect(network.onRecordAvailability(availability)).rejects.toThrow(); });
    expect(network.commandContext.snapshotRevision).toBe(0);
    expect(localStorage.getItem(INTERVIEW_V2_STORAGE_KEY)).toBeNull();
    expect(screen.getByRole("region", { name: "Scenario and action result", hidden: true })).toHaveTextContent("Nothing was saved.");
  });

  it("persists entered decision accountability and requested Team work in one revision before copying a real process", async () => {
    const user = await openNetwork();
    await user.click(screen.getByRole("button", { name: "Programs" }));
    const source = seed.processVersions.find((item) => item.id === "process-checklist-v1")!;
    const accountability = { programId: source.programId, ownerId: "team-1" as const, nextReviewAt: "2026-03-20T17:00:00Z" as const };
    await act(async () => programs.onSaveDecision({ ...accountability, ownerId: accountability.ownerId as never, nextReviewAt: accountability.nextReviewAt as never, decision: "expand", rationale: "Review a bounded proposal with  entered limits." }));
    const decision = saved();
    expect(decision.revision).toBe(1);
    expect(decision.workItems).toHaveLength(seed.workItems.length + 1);
    expect(decision.programDecisions.at(-1)).toMatchObject({ rationale: "Review a bounded proposal with  entered limits.", nextReviewAt: accountability.nextReviewAt });
    expect(decision.workItems.at(-1)?.ownerHistory.at(-1)?.ownerId).toBe("team-1");
    expect(decision.commandRecords.at(-1)?.affectedRecords.some((item) => item.kind === "work-item")).toBe(true);
    await act(async () => programs.onSaveDraft({ ...accountability, ownerId: accountability.ownerId as never, nextReviewAt: accountability.nextReviewAt as never, sourceProcessVersionId: source.id }));
    const draft = saved();
    expect(draft.revision).toBe(2);
    expect(draft.processVersions.at(-1)?.requiredSteps).toEqual(source.requiredSteps);
    expect(draft.processVersions.at(-1)?.trigger).toBe(source.trigger);
    expect(draft.processVersions.at(-1)?.status).toBe("draft");
    expect([draft.programEnrollments, draft.readinessEvents, draft.assignmentEvents, draft.jobOutcomes]).toEqual([seed.programEnrollments, seed.readinessEvents, seed.assignmentEvents, seed.jobOutcomes]);
  });
});
