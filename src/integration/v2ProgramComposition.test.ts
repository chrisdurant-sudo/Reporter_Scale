import { describe, expect, it, vi } from "vitest";
import type { DemoSnapshotV2, ProgramsCommandEnvelope, ProgramsCommandMutation, TeamCommandEnvelope, V2CommandMutation, WorkItem } from "../contracts/v2";
import { createDemoRepositoryV2, DEMO_SNAPSHOT_V2 } from "../data/v2";
import { commitV2Command } from "./v2CommandTransaction";
import { composeProgramsCommand } from "./v2ProgramComposition";

const programId = DEMO_SNAPSHOT_V2.programs[0]!.id;
const command: ProgramsCommandEnvelope = {
  type: "programs.record-decision",
  context: { commandId: "program-composition-test" as never, expectedRevision: 0, actorId: "actor-team-2" as never, occurredAt: DEMO_SNAPSHOT_V2.currentAsOfAt },
  payload: { programId, decision: "expand", rationale: "Review a bounded next step.", ownerId: "team-2" as never, nextReviewAt: "2026-03-01T17:00:00Z" as never },
};

// Minimal preparers isolate atomic composition; domain command semantics have their own tests.
function programPreparation(snapshot: DemoSnapshotV2): ProgramsCommandMutation {
  return {
    snapshot: { ...snapshot, programs: snapshot.programs.map((program) => program.id === programId ? { ...program, reviewAt: "2026-03-01T17:00:00Z" as never } : program) },
    affectedRecords: [{ kind: "program", id: programId }], message: "Program and review work saved.",
    requestedWork: ["Inspect the next cohort", "Review the partner deliverable"].map((title) => ({ title, ownerId: "team-2" as never, domain: "program", kind: "partner-task", status: "open", programId, primaryEntityRef: { kind: "program", id: programId }, dueAt: "2026-03-01T17:00:00Z" as never })),
  };
}
function workPreparation(snapshot: DemoSnapshotV2, child: TeamCommandEnvelope): V2CommandMutation {
  if (child.type !== "work.create") throw new Error("Expected a creation request.");
  const payload = child.payload;
  const work: WorkItem = {
    id: `work-${child.context.commandId}` as never, title: payload.title, kind: "partner-task",
    primaryEntityRef: { kind: "program", id: programId }, relatedRequestIds: [], programId,
    createdAt: child.context.occurredAt, dueAt: payload.dueAt ?? null,
    ownerHistory: [{ ownerId: payload.ownerId, actorId: child.context.actorId, occurredAt: child.context.occurredAt, reason: "Own the review." }],
    statusHistory: [{ status: "open", actorId: child.context.actorId, occurredAt: child.context.occurredAt, reason: "Review requested." }],
    blockerCode: null, completionEvidenceRefs: [], provenance: "demo-simulation",
  };
  return { snapshot: { ...snapshot, workItems: [...snapshot.workItems, work] }, affectedRecords: [{ kind: "program", id: programId }, { kind: "work-item", id: work.id }], message: "Work prepared." };
}

describe("atomic Programs and Team composition", () => {
  it("saves all prepared records once and replays the parent without duplicate work", async () => {
    const repository = createDemoRepositoryV2();
    const preparePrograms = vi.fn(programPreparation), prepareTeam = vi.fn(workPreparation);
    const prepare = (snapshot: DemoSnapshotV2, value: ProgramsCommandEnvelope) => composeProgramsCommand(snapshot, value, preparePrograms, prepareTeam);
    const saved = await commitV2Command(repository, command, prepare);
    expect(saved).toMatchObject({ ok: true, revision: 1, changed: true });
    if (!saved.ok) throw new Error(saved.message);
    expect(saved.value.workItems).toHaveLength(DEMO_SNAPSHOT_V2.workItems.length + 2);
    expect(saved.value.programs.find((program) => program.id === programId)?.reviewAt).toBe("2026-03-01T17:00:00Z");
    expect(saved.value.appliedCommandIds).toEqual([command.context.commandId]);
    expect(saved.value.commandRecords).toHaveLength(1);
    expect(saved.affectedRecords).toHaveLength(3);
    expect(prepareTeam.mock.calls.map((call) => call[1].context.commandId)).toEqual(["program-composition-test/work/1", "program-composition-test/work/2"]);
    expect(await commitV2Command(repository, command, prepare)).toMatchObject({ ok: true, revision: 1, changed: false, replayed: true });
    expect(preparePrograms).toHaveBeenCalledTimes(1);
    expect(prepareTeam).toHaveBeenCalledTimes(2);
  });

  it("saves neither the program change nor the first child when a later child is invalid", async () => {
    const repository = createDemoRepositoryV2();
    const save = vi.spyOn(repository, "save");
    const result = await commitV2Command(repository, command, (snapshot, value) => composeProgramsCommand(snapshot, value, programPreparation, (current, child) => {
      if (child.context.commandId.endsWith("/2")) throw new Error("Second review needs a valid owner.");
      return workPreparation(current, child);
    }));
    expect(result).toMatchObject({ ok: false, message: "Second review needs a valid owner.", errors: [{ code: "validation-failed" }] });
    expect(save).not.toHaveBeenCalled();
    const current = await repository.load();
    expect(current.ok && current.value).toEqual(DEMO_SNAPSHOT_V2);
  });
});
