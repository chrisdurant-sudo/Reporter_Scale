import { describe, expect, it } from "vitest";
import { INTERVIEW_V2_STORAGE_KEY, type DemoSnapshotStorage, type DemoSnapshotV2, type RepositoryResult, type WorkItem, type WorkItemChanges } from "../contracts/v2";
import { assessCommandGate } from "../logic/shared/revision";
import { projectWorkItemAt } from "../logic/shared/work";
import { applyScenarioCheckpoint, createDemoRepositoryV2, DEMO_SNAPSHOT_V2, validateDemoSnapshot } from "./v2";

function memoryStorage() {
  const values = new Map<string, string>();
  const operations: string[] = [];
  const state = { failRead: false, failWrite: false };
  const storage: DemoSnapshotStorage = {
    getItem(key) { operations.push(`read:${key}`); if (state.failRead) throw new Error("blocked"); return values.get(key) ?? null; },
    setItem(key, value) { operations.push(`write:${key}`); if (state.failWrite) throw new Error("quota"); values.set(key, value); },
    removeItem() { throw new Error("Repository must not remove other data"); },
  };
  return { values, operations, state, storage };
}
function unwrap(result: RepositoryResult<DemoSnapshotV2>) {
  if (!result.ok) throw new Error(result.message);
  return result.value;
}
function edit(snapshot: DemoSnapshotV2): DemoSnapshotV2 {
  const commandId = "interview-edit-1" as never;
  const occurredAt = snapshot.currentAsOfAt;
  const actorId = "actor-team-1" as never;
  return {
    ...snapshot,
    appliedCommandIds: [...snapshot.appliedCommandIds, commandId],
    commandRecords: [...snapshot.commandRecords, { id: commandId, expectedRevision: snapshot.revision, appliedRevision: snapshot.revision + 1, actorId, occurredAt, commandType: "work.edit", affectedRecords: [{ kind: "work-item", id: "work-avery-verification" }], result: "applied" }],
    workItems: snapshot.workItems.map((item) => item.id !== "work-avery-verification" ? item : {
      ...item, dueAt: "2026-02-20T17:00:00Z" as never, priority: "high",
      editHistory: [{ commandId, actorId, occurredAt, reason: "Allow the reviewer to inspect the supplied evidence.", previous: { dueAt: item.dueAt }, changes: { dueAt: "2026-02-20T17:00:00Z" as never, priority: "high" } }],
      notes: [{ commandId, actorId, occurredAt, text: "Review  the evidence\nwith the owner." }],
    }),
  };
}
const changedWork = (changes: Partial<WorkItem>, id = "work-interview-lax-screen-review") => ({ ...DEMO_SNAPSHOT_V2, workItems: DEMO_SNAPSHOT_V2.workItems.map((item) => item.id === id ? { ...item, ...changes } : item) });

describe("IC07 durable injected repository", () => {
  it("preserves the default isolated memory adapter and does not initialize browser storage on read", async () => {
    const fake = memoryStorage();
    const repository = createDemoRepositoryV2(undefined, { storage: fake.storage });
    expect(unwrap(await repository.load())).toEqual(DEMO_SNAPSHOT_V2);
    expect(fake.values.size).toBe(0);
    const memory = createDemoRepositoryV2(undefined, { storage: null });
    unwrap(await memory.save(edit(DEMO_SNAPSHOT_V2), 0));
    expect(unwrap(await createDemoRepositoryV2().load())).toEqual(DEMO_SNAPSHOT_V2);
  });

  it("retains revision, exact note whitespace, commands and scenario clock across reconstruction", async () => {
    const fake = memoryStorage();
    const repository = createDemoRepositoryV2(undefined, { storage: fake.storage });
    const saved = unwrap(await repository.save(edit(DEMO_SNAPSHOT_V2), 0));
    const advanced = unwrap(await repository.save(applyScenarioCheckpoint(saved, "original-plan-delivered"), saved.revision));
    const recovered = unwrap(await createDemoRepositoryV2(undefined, { storage: fake.storage }).load());
    expect(recovered).toEqual(advanced);
    expect(recovered.workItems[0]!.notes![0]!.text).toBe("Review  the evidence\nwith the owner.");
    expect(recovered.revision).toBe(2);
    expect(applyScenarioCheckpoint(recovered, "original-plan-delivered").appliedScenarioEventIds).toEqual(recovered.appliedScenarioEventIds);
    expect(assessCommandGate(recovered, { commandId: "interview-edit-1" as never, expectedRevision: 0, actorId: "actor-team-1" as never, occurredAt: recovered.currentAsOfAt })).toEqual({ kind: "replay", appliedRevision: 1 });
    expect(JSON.parse(fake.values.get(INTERVIEW_V2_STORAGE_KEY)!)).toMatchObject({ format: "reporter-growth-v2", storageVersion: 1, seedVersion: DEMO_SNAPSHOT_V2.seedVersion });
  });

  it("rejects cross-instance stale saves and permits a fresh reload", async () => {
    const fake = memoryStorage();
    const first = createDemoRepositoryV2(undefined, { storage: fake.storage });
    const second = createDemoRepositoryV2(undefined, { storage: fake.storage });
    unwrap(await first.load()); unwrap(await second.load());
    const saved = unwrap(await first.save(edit(DEMO_SNAPSHOT_V2), 0));
    expect(await second.save(DEMO_SNAPSHOT_V2, 0)).toMatchObject({ ok: false, revision: 1, errors: [{ code: "stale-revision" }] });
    expect(unwrap(await second.load())).toEqual(saved);
    expect(unwrap(await second.save(saved, 1)).revision).toBe(2);
  });

  it("detects an externally replaced same-revision snapshot before save", async () => {
    const fake = memoryStorage();
    const repository = createDemoRepositoryV2(undefined, { storage: fake.storage });
    unwrap(await repository.reset());
    const envelope = JSON.parse(fake.values.get(INTERVIEW_V2_STORAGE_KEY)!);
    envelope.snapshot.workItems[0].priority = "low";
    fake.values.set(INTERVIEW_V2_STORAGE_KEY, JSON.stringify(envelope));
    expect(await repository.save(DEMO_SNAPSHOT_V2, 0)).toMatchObject({ ok: false, errors: [{ code: "stale-revision" }] });
  });

  it.each([
    "{broken", "null", JSON.stringify({ schemaVersion: 1 }),
    JSON.stringify({ format: "reporter-growth-v2", storageVersion: 2, seedVersion: DEMO_SNAPSHOT_V2.seedVersion, snapshot: DEMO_SNAPSHOT_V2 }),
    JSON.stringify({ format: "reporter-growth-v2", storageVersion: 1, seedVersion: "unknown-seed", snapshot: DEMO_SNAPSHOT_V2 }),
    JSON.stringify({ format: "reporter-growth-v2", storageVersion: 1, seedVersion: DEMO_SNAPSHOT_V2.seedVersion, snapshot: { ...DEMO_SNAPSHOT_V2, workItems: [null] } }),
  ])("preserves incompatible/invalid bytes until explicit namespace reset (%#)", async (bytes) => {
    const fake = memoryStorage();
    fake.values.set(INTERVIEW_V2_STORAGE_KEY, bytes);
    fake.values.set("reporter-growth.v1", "preserve legacy bytes");
    const repository = createDemoRepositoryV2(undefined, { storage: fake.storage });
    expect(await repository.load()).toMatchObject({ ok: false, errors: [{ code: "validation-failed" }] });
    expect(await repository.save(DEMO_SNAPSHOT_V2, 0)).toMatchObject({ ok: false });
    expect(fake.values.get(INTERVIEW_V2_STORAGE_KEY)).toBe(bytes);
    expect(unwrap(await repository.reset())).toEqual(DEMO_SNAPSHOT_V2);
    expect(fake.values.get("reporter-growth.v1")).toBe("preserve legacy bytes");
    expect(fake.operations.every((operation) => operation.endsWith(INTERVIEW_V2_STORAGE_KEY))).toBe(true);
    expect(unwrap(await createDemoRepositoryV2(undefined, { storage: fake.storage }).load())).toEqual(DEMO_SNAPSHOT_V2);
  });

  it("surfaces read and write failures without acknowledging or losing the prior saved state", async () => {
    const fake = memoryStorage();
    const repository = createDemoRepositoryV2(undefined, { storage: fake.storage });
    const saved = unwrap(await repository.save(edit(DEMO_SNAPSHOT_V2), 0));
    const bytes = fake.values.get(INTERVIEW_V2_STORAGE_KEY);
    fake.state.failRead = true;
    expect(await repository.load()).toMatchObject({ ok: false, revision: 1, errors: [{ code: "storage-failed" }] });
    expect(await repository.save(saved, 1)).toMatchObject({ ok: false, revision: 1, errors: [{ code: "storage-failed" }] });
    fake.state.failRead = false; fake.state.failWrite = true;
    expect(await repository.save(saved, 1)).toMatchObject({ ok: false, revision: 1, errors: [{ code: "storage-failed" }] });
    expect(await repository.reset()).toMatchObject({ ok: false, revision: 1, errors: [{ code: "storage-failed" }] });
    expect(fake.values.get(INTERVIEW_V2_STORAGE_KEY)).toBe(bytes);
    expect(unwrap(await repository.load())).toEqual(saved);
    fake.state.failWrite = false;
    expect(unwrap(await repository.reset())).toEqual(DEMO_SNAPSHOT_V2);
  });

  it("resets clock, commands, edits and scenario deterministically in the injected namespace only", async () => {
    const fake = memoryStorage();
    fake.values.set(INTERVIEW_V2_STORAGE_KEY, "other namespace left untouched");
    const repository = createDemoRepositoryV2(undefined, { storage: fake.storage, storageKey: "test-interview" });
    const saved = unwrap(await repository.save(edit(DEMO_SNAPSHOT_V2), 0));
    unwrap(await repository.save(applyScenarioCheckpoint(saved, "two-new-ready"), 1));
    expect(unwrap(await repository.reset())).toEqual(DEMO_SNAPSHOT_V2);
    const firstReset = fake.values.get("test-interview");
    unwrap(await repository.reset());
    expect(fake.values.get("test-interview")).toBe(firstReset);
    expect(fake.values.get(INTERVIEW_V2_STORAGE_KEY)).toBe("other namespace left untouched");
  });

  it("rejects record corruption and rewrites of saved work/replay history", async () => {
    const repository = createDemoRepositoryV2();
    const saved = unwrap(await repository.save(edit(DEMO_SNAPSHOT_V2), 0));
    for (const next of [
      { ...saved, appliedCommandIds: [] }, { ...saved, commandRecords: [] },
      { ...saved, workItems: saved.workItems.slice(1) },
      { ...saved, workItems: saved.workItems.map((item, index) => index === 0 ? { ...item, notes: [] } : item) },
      { ...saved, workItems: saved.workItems.map((item, index) => index === 0 ? { ...item, dueAt: null } : item) },
    ]) expect(await repository.save(next, 1)).toMatchObject({ ok: false });
    expect(unwrap(await repository.load())).toEqual(saved);
  });
});

describe("IC07 required work history values", () => {
  function withEdit(snapshot: DemoSnapshotV2, changes: WorkItemChanges, previous: WorkItemChanges) {
    return {
      ...snapshot,
      workItems: snapshot.workItems.map((work, index) => index !== 0 ? work : {
        ...work, ...changes,
        editHistory: [...(work.editHistory ?? []), {
          commandId: "history-validation-edit" as never, actorId: "actor-team-1" as never,
          occurredAt: snapshot.currentAsOfAt, reason: "Inspect the recorded work history.", previous, changes,
        }],
      }),
    };
  }
  const envelope = (snapshot: DemoSnapshotV2) => JSON.stringify({ format: "reporter-growth-v2", storageVersion: 1, seedVersion: snapshot.seedVersion, snapshot });
  const beforeEdit = new Date(Date.parse(DEMO_SNAPSHOT_V2.currentAsOfAt) - 1).toISOString() as DemoSnapshotV2["currentAsOfAt"];

  it.each(["dueAt", "blockerCode"] as const)("rejects a missing previous %s on load and preserves bytes until explicit reset", async (field) => {
    const fake = memoryStorage();
    const repository = createDemoRepositoryV2(undefined, { storage: fake.storage });
    const saved = unwrap(await repository.save(DEMO_SNAPSHOT_V2, 0));
    const bytes = envelope(withEdit(saved, { [field]: null }, {}));
    fake.values.set(INTERVIEW_V2_STORAGE_KEY, bytes);
    fake.values.set("reporter-growth.v1", "preserve legacy bytes");
    fake.operations.length = 0;

    expect(await repository.load()).toMatchObject({ ok: false, revision: saved.revision, errors: [{ code: "validation-failed" }] });
    expect(await createDemoRepositoryV2(undefined, { storage: fake.storage }).load()).toMatchObject({ ok: false, errors: [{ code: "validation-failed" }] });
    expect(await repository.save(saved, saved.revision)).toMatchObject({ ok: false, revision: saved.revision, errors: [{ code: "validation-failed" }] });
    expect(fake.values.get(INTERVIEW_V2_STORAGE_KEY)).toBe(bytes);
    expect(fake.operations.every((operation) => operation === `read:${INTERVIEW_V2_STORAGE_KEY}`)).toBe(true);

    expect(unwrap(await repository.reset())).toEqual(DEMO_SNAPSHOT_V2);
    const resetBytes = fake.values.get(INTERVIEW_V2_STORAGE_KEY);
    expect(unwrap(await repository.reset())).toEqual(DEMO_SNAPSHOT_V2);
    expect(fake.values.get(INTERVIEW_V2_STORAGE_KEY)).toBe(resetBytes);
    expect(fake.values.get("reporter-growth.v1")).toBe("preserve legacy bytes");
    expect(unwrap(await createDemoRepositoryV2(undefined, { storage: fake.storage }).load())).toEqual(DEMO_SNAPSHOT_V2);
  });

  it.each(["dueAt", "blockerCode"] as const)("rejects a proposed missing previous %s without changing acknowledged memory or storage", async (field) => {
    const fake = memoryStorage();
    for (const storage of [null, fake.storage]) {
      const repository = createDemoRepositoryV2(undefined, { storage });
      const saved = unwrap(await repository.save(DEMO_SNAPSHOT_V2, 0));
      const bytes = fake.values.get(INTERVIEW_V2_STORAGE_KEY);
      fake.operations.length = 0;
      expect(await repository.save(withEdit(saved, { [field]: null }, {}), saved.revision)).toMatchObject({ ok: false, revision: saved.revision, errors: [{ code: "validation-failed" }] });
      expect(fake.values.get(INTERVIEW_V2_STORAGE_KEY)).toBe(bytes);
      expect(fake.operations.some((operation) => operation.startsWith("write:"))).toBe(false);
      expect(unwrap(await repository.load())).toEqual(saved);
    }
  });

  it.each([
    ["dueAt", undefined], ["dueAt", "invalid date"], ["dueAt", 12],
    ["blockerCode", undefined], ["blockerCode", "  "], ["blockerCode", 12],
  ] as const)("rejects invalid current, changed and previous %s values (%#)", (field, value) => {
    const invalid = { [field]: value } as WorkItemChanges;
    const validPrevious = { [field]: DEMO_SNAPSHOT_V2.workItems[0]![field] };
    const current = { ...DEMO_SNAPSHOT_V2, workItems: DEMO_SNAPSHOT_V2.workItems.map((work, index) => index === 0 ? { ...work, ...invalid } : work) };
    for (const snapshot of [current, JSON.parse(JSON.stringify(current)), withEdit(DEMO_SNAPSHOT_V2, invalid, validPrevious), withEdit(DEMO_SNAPSHOT_V2, { [field]: null }, invalid)]) {
      expect(validateDemoSnapshot(snapshot)).toMatchObject({ ok: false, errors: [{ code: "validation-failed" }] });
    }
  });

  it("accepts an empty previous object when introducing only optional title and priority", async () => {
    const fake = memoryStorage();
    const repository = createDemoRepositoryV2(undefined, { storage: fake.storage });
    const saved = unwrap(await repository.save(withEdit(DEMO_SNAPSHOT_V2, { title: "Review supplied verification", priority: "normal" }, {}), 0));
    const recovered = unwrap(await createDemoRepositoryV2(undefined, { storage: fake.storage }).load());
    expect(recovered).toEqual(saved);
    expect(projectWorkItemAt(recovered.workItems[0]!, beforeEdit)).toEqual({ ...DEMO_SNAPSHOT_V2.workItems[0], editHistory: recovered.workItems[0]!.editHistory });
  });

  it("round-trips explicit null clearing and preserves absent optional fields before their first edit", async () => {
    const fake = memoryStorage();
    const repository = createDemoRepositoryV2(undefined, { storage: fake.storage });
    const work = DEMO_SNAPSHOT_V2.workItems[0]!;
    expect(work).not.toHaveProperty("title");
    expect(work).not.toHaveProperty("priority");
    const first = withEdit(DEMO_SNAPSHOT_V2, { title: "Review supplied verification", priority: "high", dueAt: null, blockerCode: null }, { dueAt: work.dueAt, blockerCode: work.blockerCode });
    const saved = unwrap(await repository.save(first, 0));
    const recovered = unwrap(await createDemoRepositoryV2(undefined, { storage: fake.storage }).load());
    expect(recovered).toEqual(saved);
    expect(recovered.workItems[0]).toMatchObject({ dueAt: null, blockerCode: null });
    const original = projectWorkItemAt(recovered.workItems[0]!, beforeEdit);
    expect(original).toMatchObject({ dueAt: work.dueAt, blockerCode: work.blockerCode });
    expect(original).not.toHaveProperty("title");
    expect(original).not.toHaveProperty("priority");

    // The next edit must retain explicit null previous values, including at the same timestamp.
    const second = withEdit(saved, { dueAt: work.dueAt, blockerCode: work.blockerCode }, { dueAt: null, blockerCode: null });
    const next = { ...second, workItems: second.workItems.map((item, index) => index !== 0 ? item : { ...item, editHistory: item.editHistory!.map((entry, editIndex) => editIndex === 1 ? { ...entry, commandId: "history-validation-second-edit" as never } : entry) }) };
    const resaved = unwrap(await repository.save(next, saved.revision));
    expect(unwrap(await createDemoRepositoryV2(undefined, { storage: fake.storage }).load())).toEqual(resaved);
    expect(projectWorkItemAt(resaved.workItems[0]!, beforeEdit)).toEqual({ ...original, editHistory: resaved.workItems[0]!.editHistory });
  });
});

describe("IC08 linked work and process integrity", () => {
  it("has 25 useful work items, existing people only, varied ownership/status and inspected coaching", () => {
    const snapshot = DEMO_SNAPSHOT_V2;
    expect(validateDemoSnapshot(snapshot)).toMatchObject({ ok: true });
    expect(snapshot.workItems).toHaveLength(25);
    expect(snapshot.reporters).toHaveLength(113);
    expect(snapshot.acquisitionCases).toHaveLength(113);
    expect(snapshot.workItems.filter((work) => work.id.startsWith("work-interview-"))).toHaveLength(18);
    expect(snapshot.workItems.filter((work) => work.ownerHistory.at(-1)!.ownerId === null)).toHaveLength(5);
    expect(snapshot.workItems.filter((work) => work.statusHistory.at(-1)!.status === "completed")).toHaveLength(4);
    expect(snapshot.workItems.some((work) => work.ownerHistory.length > 1)).toBe(true);
    expect(snapshot.workItems.some((work) => work.dueAt && work.dueAt < snapshot.currentAsOfAt && work.statusHistory.at(-1)!.status !== "completed")).toBe(true);
    expect(snapshot.workQualityChecks).toHaveLength(4);
    expect(snapshot.coachingActions).toHaveLength(3);
    expect(snapshot.teamMembers.every((member) => snapshot.teamTargets.some((target) => target.teamMemberId === member.id || target.role === member.focusRole))).toBe(true);
    for (const market of snapshot.markets) expect(snapshot.workItems.some((work) => (work.primaryEntityRef.kind === "market" && work.primaryEntityRef.id === market.id) || snapshot.reporters.some((person) => person.id === work.primaryEntityRef.id && person.recruitingMarketId === market.id))).toBe(true);
    expect(snapshot.reporters.filter((person) => person.id.startsWith("person-p4-"))).toHaveLength(50);
    expect(snapshot.programEnrollments.filter((entry) => entry.programId === "program-readiness-checklist")).toHaveLength(40);
  });

  it("adds an inspectable draft without rewriting the historical process or frozen enrollment", () => {
    const [historical, draft] = DEMO_SNAPSHOT_V2.processVersions;
    expect(historical!.id).toBe("process-checklist-v1");
    expect(historical!.requiredSteps[0]!.responsibleRole).toBeUndefined();
    expect(draft).toMatchObject({ id: "process-checklist-v2", version: 2, status: "draft" });
    expect(draft!.requiredSteps.every((step) => step.responsibleRole && step.slaElapsedHours! > 0 && step.evidenceRequirement && step.exceptionRoute)).toBe(true);
    expect(DEMO_SNAPSHOT_V2.programEnrollments.some((entry) => entry.processVersionId === draft!.id)).toBe(false);
  });

  it("fails safely on malformed collections, duplicates, revision and timestamp values", () => {
    for (const value of [null, {}, { ...DEMO_SNAPSHOT_V2, sources: undefined }, { ...DEMO_SNAPSHOT_V2, workItems: [null] }, { ...DEMO_SNAPSHOT_V2, revision: -1 }, { ...DEMO_SNAPSHOT_V2, revision: 0.5 }, { ...DEMO_SNAPSHOT_V2, workItems: [...DEMO_SNAPSHOT_V2.workItems, DEMO_SNAPSHOT_V2.workItems[0]] }, { ...DEMO_SNAPSHOT_V2, currentAsOfAt: "2026-02-31T17:00:00Z" }]) {
      expect(() => validateDemoSnapshot(value)).not.toThrow();
      expect(validateDemoSnapshot(value).ok).toBe(false);
    }
  });

  it("rejects bad work fields, ownership, chronology, history reconstruction and duplicate note IDs", () => {
    const work = DEMO_SNAPSHOT_V2.workItems.find((item) => item.id === "work-interview-lax-screen-review")!;
    for (const changes of [
      { priority: "critical" as never }, { title: "  " }, { dueAt: "no date" as never },
      { primaryEntityRef: { kind: "reporter" as const, id: "missing" } },
      { ownerHistory: [{ ...work.ownerHistory[0]!, ownerId: "missing" as never }] },
      { notes: [{ ...work.notes![0]!, occurredAt: "2026-02-17T17:00:00Z" as never }] },
      { notes: [work.notes![0]!, work.notes![0]!] },
      { editHistory: [{ ...work.editHistory![0]!, changes: { priority: "low" as const } }] },
      { statusHistory: [...work.statusHistory, { ...work.statusHistory[0]!, occurredAt: "2026-02-01T17:00:00Z" as never }] },
    ]) expect(validateDemoSnapshot(changedWork(changes)).ok).toBe(false);
  });

  it("requires related completion evidence known at completion and prevents terminal reopening", () => {
    const work = DEMO_SNAPSHOT_V2.workItems.find((item) => item.id === "work-interview-atl-history-sample")!;
    for (const changes of [
      { completionEvidenceRefs: [] },
      { completionEvidenceRefs: [{ kind: "reporter" as const, id: "missing" }] },
      { completionEvidenceRefs: [{ kind: "reporter" as const, id: "person-lax-001" }] },
      { statusHistory: [...work.statusHistory, { ...work.statusHistory[0]!, occurredAt: DEMO_SNAPSHOT_V2.currentAsOfAt }] },
    ]) expect(validateDemoSnapshot(changedWork(changes, work.id)).ok).toBe(false);
    const future = { ...DEMO_SNAPSHOT_V2, jobOutcomes: DEMO_SNAPSHOT_V2.jobOutcomes.map((job) => job.id === "job-atl-historic-1" ? { ...job, recordedAt: DEMO_SNAPSHOT_V2.currentAsOfAt } : job) };
    expect(validateDemoSnapshot(future).ok).toBe(false);
  });

  it("validates process owner/SLA/exception completeness and sampled quality/coaching dates", () => {
    const process = DEMO_SNAPSHOT_V2.processVersions[1]!;
    for (const changes of [{ slaElapsedHours: -1 }, { responsibleRole: "" }, { exceptionRoute: undefined }]) {
      expect(validateDemoSnapshot({ ...DEMO_SNAPSHOT_V2, processVersions: [{ ...process, requiredSteps: [{ ...process.requiredSteps[0]!, ...changes }] }] }).ok).toBe(false);
    }
    expect(validateDemoSnapshot({ ...DEMO_SNAPSHOT_V2, workQualityChecks: [{ ...DEMO_SNAPSHOT_V2.workQualityChecks[0]!, checkedAt: "2027-01-01T00:00:00Z" }] }).ok).toBe(false);
    expect(validateDemoSnapshot({ ...DEMO_SNAPSHOT_V2, coachingActions: [{ ...DEMO_SNAPSHOT_V2.coachingActions[0]!, updatedAt: "2020-01-01T00:00:00Z" }] }).ok).toBe(false);
  });
});
