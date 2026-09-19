import { describe, expect, it } from "vitest";
import type { WorkItem } from "../../contracts/v2";
import { DEMO_SNAPSHOT_V2 } from "../../data/v2";
import { projectWorkItemAt } from "./work";

describe("editable work at a historical time", () => {
  it("reverses later edits in append order, retaining originally absent fields and audit records", () => {
    const at = "2026-02-17T17:00:00Z" as const;
    const work: WorkItem = {
      ...DEMO_SNAPSHOT_V2.workItems[0]!, title: "Latest title", priority: "urgent", dueAt: null, blockerCode: "new-blocker",
      editHistory: [
        { commandId: "edit-1" as never, actorId: "actor-team-1" as never, occurredAt: at as never, reason: "First edit", previous: { dueAt: "2026-02-18T17:00:00Z" as never, blockerCode: null }, changes: { title: "First title", priority: "normal", dueAt: null, blockerCode: "new-blocker" } },
        { commandId: "edit-2" as never, actorId: "actor-team-1" as never, occurredAt: at as never, reason: "Second edit", previous: { title: "First title", priority: "normal" }, changes: { title: "Latest title", priority: "urgent" } },
      ],
    };
    const original = structuredClone(work);
    const before = projectWorkItemAt(work, DEMO_SNAPSHOT_V2.currentAsOfAt);
    expect(before).not.toHaveProperty("title");
    expect(before).not.toHaveProperty("priority");
    expect(before.dueAt).toBe("2026-02-18T17:00:00Z");
    expect(before.blockerCode).toBeNull();
    expect(before.editHistory).toEqual(work.editHistory);
    expect(projectWorkItemAt(work, at as never)).toEqual(work);
    expect(work).toEqual(original);
  });

  it("keeps the latest known edit while reversing only future changes", () => {
    const work: WorkItem = {
      ...DEMO_SNAPSHOT_V2.workItems[0]!, title: "Future title", dueAt: null,
      editHistory: [
        { commandId: "edit-known" as never, actorId: "actor-team-1" as never, occurredAt: "2026-02-15T17:00:00Z" as never, reason: "Known edit", previous: {}, changes: { title: "Known title" } },
        { commandId: "edit-future" as never, actorId: "actor-team-1" as never, occurredAt: "2026-02-20T17:00:00Z" as never, reason: "Later edit", previous: { title: "Known title", dueAt: "2026-02-19T17:00:00Z" as never }, changes: { title: "Future title", dueAt: null } },
      ],
    };
    expect(projectWorkItemAt(work, DEMO_SNAPSHOT_V2.currentAsOfAt)).toMatchObject({ title: "Known title", dueAt: "2026-02-19T17:00:00Z" });
    expect(projectWorkItemAt(DEMO_SNAPSHOT_V2.workItems[0]!, DEMO_SNAPSHOT_V2.currentAsOfAt)).toBe(DEMO_SNAPSHOT_V2.workItems[0]);
  });
});
