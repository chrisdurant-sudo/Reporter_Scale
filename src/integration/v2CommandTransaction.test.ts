import { describe, expect, it, vi } from "vitest";
import type { DemoRepositoryV2, DemoSnapshotV2, V2CommandEnvelope, V2CommandMutation, WorkEditPayload } from "../contracts/v2";
import { createDemoRepositoryV2, DEMO_SNAPSHOT_V2 } from "../data/v2";
import { commitV2Command } from "./v2CommandTransaction";

const command = (expectedRevision = 0): V2CommandEnvelope<"work.edit", WorkEditPayload> => ({
  type: "work.edit", context: { commandId: "interview-command-test" as never, expectedRevision, actorId: "actor-team-1" as never, occurredAt: DEMO_SNAPSHOT_V2.currentAsOfAt },
  payload: { workItemId: DEMO_SNAPSHOT_V2.workItems[0]!.id, changes: { title: "Inspect the linked case" }, reason: "Manager reviewed the next action." },
});
const prepare = (snapshot: DemoSnapshotV2): V2CommandMutation => ({ snapshot: { ...snapshot, workItems: snapshot.workItems.map((work, index) => index ? work : {
  ...work, title: "Inspect the linked case", editHistory: [...work.editHistory ?? [], {
    commandId: command().context.commandId, actorId: command().context.actorId, occurredAt: snapshot.currentAsOfAt,
    reason: command().payload.reason, previous: work.title === undefined ? {} : { title: work.title }, changes: { title: "Inspect the linked case" },
  }],
}) }, affectedRecords: [{ kind: "work-item", id: snapshot.workItems[0]!.id }], message: "Work saved." });

describe("single-repository command transactions", () => {
  it("commits one revision and replays before rejecting the old revision without running the action twice", async () => {
    const repo = createDemoRepositoryV2(); const handler = vi.fn(prepare);
    const first = await commitV2Command(repo, command(), handler);
    expect(first).toMatchObject({ ok: true, revision: 1, changed: true, replayed: false });
    const replay = await commitV2Command(repo, command(), handler);
    expect(replay).toMatchObject({ ok: true, revision: 1, changed: false, replayed: true });
    expect(handler).toHaveBeenCalledTimes(1);
    if (!replay.ok) throw new Error(replay.message);
    expect(replay.value.commandRecords.at(-1)).toMatchObject({ expectedRevision: 0, appliedRevision: 1, commandType: "work.edit" });
    const stale = { ...command(), context: { ...command().context, commandId: "another-command" as never } };
    expect(await commitV2Command(repo, stale, handler)).toMatchObject({ ok: false, errors: [{ code: "stale-revision" }] });
    expect(handler).toHaveBeenCalledTimes(1);
  });
  it("does not save on invalid actor, future time, or altered command history", async () => {
    const repo = createDemoRepositoryV2(); const save = vi.spyOn(repo, "save");
    const c = command();
    expect(await commitV2Command(repo, { ...c, context: { ...c.context, actorId: "unknown" as never } }, prepare)).toMatchObject({ ok: false });
    expect(await commitV2Command(repo, { ...c, context: { ...c.context, occurredAt: "2099-01-01T00:00:00Z" as never } }, prepare)).toMatchObject({ ok: false });
    expect(await commitV2Command(repo, c, (snapshot) => ({ ...prepare(snapshot), snapshot: { ...snapshot, revision: 4 } }))).toMatchObject({ ok: false, errors: [{ code: "invariant-failed" }] });
    expect(save).not.toHaveBeenCalled();
  });
  it("does not acknowledge a failed write or mutate the repository through a rejected handler", async () => {
    const memory = createDemoRepositoryV2();
    const repo: DemoRepositoryV2 = { ...memory, save: async () => ({ ok: false, revision: 0, message: "Storage is unavailable.", errors: [{ code: "storage-failed", message: "Storage is unavailable.", field: null, relatedRecords: [] }] }) };
    expect(await commitV2Command(repo, command(), prepare)).toMatchObject({ ok: false, errors: [{ code: "storage-failed" }] });
    const loaded = await memory.load();
    expect(loaded.ok && loaded.value).toEqual(DEMO_SNAPSHOT_V2);
    const result = await commitV2Command(memory, command(), () => { throw new Error("Completion needs evidence."); });
    expect(result).toMatchObject({ ok: false, message: "Completion needs evidence." });
    expect((await memory.load()).revision).toBe(0);
  });
});
