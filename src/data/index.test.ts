import { describe, expect, it } from "vitest";
import { createDemoRepository, DEMO_SNAPSHOT, validateDemoSnapshot } from "./index";
import { FIXED_AS_OF_AT, SCENARIO_IDS } from "../contracts";

describe("demo data repository", () => {
  it("provides five scenarios, 60 unique reporters, and stable anchors", () => {
    expect(DEMO_SNAPSHOT.fixedAsOfAt).toBe(FIXED_AS_OF_AT);
    expect(DEMO_SNAPSHOT.markets.map((m) => m.id)).toEqual(["LAX", "SFO", "DFW", "ORD", "ATL"]);
    expect(DEMO_SNAPSHOT.reporters).toHaveLength(60);
    expect(new Set(DEMO_SNAPSHOT.reporters.map((r) => r.id)).size).toBe(60);
    expect(DEMO_SNAPSHOT.reporters.some((r) => r.id === SCENARIO_IDS.lateReporter)).toBe(true);
    expect(DEMO_SNAPSHOT.jobs.some((j) => j.id === SCENARIO_IDS.lateJob && j.provenance === "demo-simulation")).toBe(true);
  });

  it("clones load/save state and rejects stale or invalid saves", async () => {
    const repository = createDemoRepository();
    const loaded = await repository.load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    loaded.value.reporters[0]!.fictionalName = "Mutated outside repository";
    const again = await repository.load();
    expect(again.ok && again.value.reporters[0]!.fictionalName).not.toBe("Mutated outside repository");
    const saved = await repository.save({ ...loaded.value, revision: loaded.value.revision }, loaded.value.revision);
    expect(saved.ok).toBe(true);
    const stale = await repository.save(loaded.value, loaded.value.revision);
    expect(stale.ok).toBe(false);
    expect(!stale.ok && stale.errors[0]!.code).toBe("STALE_REVISION");
    const invalid = await repository.save({ ...loaded.value, reporters: [] }, 1);
    expect(invalid.ok).toBe(false);
  });

  it("resets to an independent seed and validates shape", async () => {
    const repository = createDemoRepository();
    const loaded = await repository.load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const changed = { ...loaded.value, revision: 0, reporters: loaded.value.reporters.slice(0, 10) };
    expect((await repository.save(changed, 0)).ok).toBe(false);
    const reset = await repository.reset();
    expect(reset.ok && reset.value.reporters).toHaveLength(60);
    expect(validateDemoSnapshot(null).ok).toBe(false);
  });

  it("keeps creation before every lifecycle event", () => {
    const created = new Map(DEMO_SNAPSHOT.reporters.map((r) => [r.id, Date.parse(r.createdAt)]));
    expect(DEMO_SNAPSHOT.lifecycleEvents.every((event) => created.get(event.reporterId)! < Date.parse(event.occurredAt))).toBe(true);
  });

  it("accepts a bounded late simulation and rejects records after it", async () => {
    const repository = createDemoRepository();
    const loaded = await repository.load();
    expect(loaded.ok).toBe(true);
    if (!loaded.ok) return;
    const simulated = structuredClone(loaded.value);
    simulated.revision = loaded.value.revision;
    simulated.simulation.simulatedAsOfAt = "2026-02-20T17:00:00.000Z";
    const lateJob = simulated.jobs.find((job) => job.id === SCENARIO_IDS.lateJob)!;
    lateJob.status = "completed";
    lateJob.completedAt = "2026-02-18T17:00:00.000Z";
    simulated.simulation.replayedScenarioIds = [SCENARIO_IDS.lateFirstJob];
    simulated.lifecycleEvents.push({ id: `${SCENARIO_IDS.lateFirstJob}-event`, reporterId: SCENARIO_IDS.lateReporter, occurredAt: "2026-02-18T17:00:00.000Z", stage: "first-job-completed", reason: "Late first job completed in demo simulation", author: "team-maya", recruitingMarketIdAtEntry: "LAX" });
    const saved = await repository.save(simulated, loaded.value.revision);
    expect(saved.ok).toBe(true);
    const tooLate = structuredClone(simulated);
    tooLate.revision = saved.ok ? saved.value.revision : 1;
    tooLate.jobs.push({ ...lateJob, id: "job-after-simulation", completedAt: "2026-02-21T17:00:00.000Z" });
    tooLate.lifecycleEvents.push({ id: "arbitrary-future-event", reporterId: SCENARIO_IDS.lateReporter, occurredAt: "2026-02-21T17:00:00.000Z", stage: "screening", reason: "Unexpected future record", author: "team-maya", recruitingMarketIdAtEntry: "LAX" });
    expect((await repository.save(tooLate, tooLate.revision)).ok).toBe(false);
  });
});
