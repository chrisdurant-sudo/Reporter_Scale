import { describe, expect, it, vi } from "vitest";
import type { DemoSnapshotV2, V2CommandContext } from "../contracts/v2";
import { createDemoRepositoryV2, DEMO_SNAPSHOT_V2 } from "../data/v2";
import { prepareTeamView } from "../logic/team";
import { commitNetworkFollowUp } from "./v2NetworkComposition";

const seed = DEMO_SNAPSHOT_V2;
const reporter = seed.reporters.find((person) => !seed.workItems.some((work) => work.kind === "re-engage" && work.primaryEntityRef.kind === "reporter" && work.primaryEntityRef.id === person.id))!;
const payload = { reporterId: reporter.id, marketId: reporter.serviceMarketIds[0]!, ownerId: null, dueAt: null };
const context = (key: string, revision = 0): V2CommandContext => ({ commandId: key as never, expectedRevision: revision, actorId: seed.teamMembers[2]!.actorId, occurredAt: seed.currentAsOfAt });
const outcomes = (snapshot: DemoSnapshotV2) => [snapshot.lifecycleEvents, snapshot.readinessEvents, snapshot.availabilityWindows, snapshot.assignmentEvents, snapshot.jobOutcomes, snapshot.programEnrollments];

describe("Network to canonical Team follow-up composition", () => {
  it("saves one work item and opens it again without duplicate work, reassignment or an extra write", async () => {
    const repository = createDemoRepositoryV2();
    const save = vi.spyOn(repository, "save");
    const first = await commitNetworkFollowUp(repository, context("network-follow-up"), payload);
    expect(first).toMatchObject({ ok: true, changed: true });
    if (!first.ok) throw new Error(first.message);
    expect(first.value.revision).toBe(1);
    expect(first.value.workItems).toHaveLength(26);
    expect(first.value.workItems.at(-1)).toMatchObject({ kind: "re-engage", dueAt: null, ownerHistory: [{ ownerId: null }], primaryEntityRef: { kind: "reporter", id: reporter.id } });
    expect(first.navigationTarget?.filters.workItemIds).toEqual([first.workItemId]);
    expect(outcomes(first.value)).toEqual(outcomes(seed));
    const next = await commitNetworkFollowUp(repository, context("open-again", 1), { ...payload, ownerId: seed.teamMembers[0]!.id });
    expect(next).toMatchObject({ ok: true, changed: false, workItemId: first.workItemId });
    expect(save).toHaveBeenCalledTimes(1);
    if (next.ok) expect(next.value).toEqual(first.value);
  });

  it("keeps storage failure and stale writes from acknowledging or creating work", async () => {
    const repository = createDemoRepositoryV2(seed, { storage: { getItem: () => null, setItem: () => { throw new Error("denied"); }, removeItem: () => undefined } });
    expect(await commitNetworkFollowUp(repository, context("denied"), payload)).toMatchObject({ ok: false });
    const loaded = await repository.load();
    expect(loaded.ok && loaded.value).toEqual(seed);
    const memory = createDemoRepositoryV2();
    expect(await commitNetworkFollowUp(memory, context("stale", 5), payload)).toMatchObject({ ok: false, message: expect.stringContaining("snapshot changed") });
    expect((await memory.load()).revision).toBe(0);
  });

  it("opens a canonical task even when the source reporter job market is outside its recorded task scope", async () => {
    const repository = createDemoRepositoryV2();
    const otherMarket = seed.markets.find((market) => !reporter.serviceMarketIds.includes(market.id) && !seed.acquisitionCases.some((item) => item.reporterId === reporter.id && item.ownerMarketId === market.id))!.id;
    const result = await commitNetworkFollowUp(repository, context("cross-market-follow-up"), { ...payload, marketId: otherMarket });
    expect(result.ok).toBe(true);
    if (!result.ok || !result.navigationTarget) throw new Error("Expected saved exact work target.");
    expect(result.navigationTarget.filters.selectedMarket).toBe("ALL");
    const view = prepareTeamView(result.value, { workspace: "team", evaluation: { asOfAt: result.value.currentAsOfAt, snapshotRevision: result.value.revision, reportingTimeZone: "America/Los_Angeles" as never }, filters: result.navigationTarget.filters }, result.navigationTarget.evidenceContext.metric);
    expect(view.workDetails.map((item) => item.id)).toEqual([result.workItemId]);
  });
});
