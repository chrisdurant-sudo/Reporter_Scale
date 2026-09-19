import { describe, expect, it, vi } from "vitest";
import type { DemoSnapshotV2, ProgramsCommandEnvelope, WorkspaceQueryContext } from "../../contracts/v2";
import { createDemoRepositoryV2, DEMO_SNAPSHOT_V2 } from "../../data/v2";
import { composeProgramsCommand } from "../../integration/v2ProgramComposition";
import { commitV2Command } from "../../integration/v2CommandTransaction";
import { prepareTeamCommand } from "../team";
import { validateEvidenceBundle } from "../shared";
import { calculateSourceContribution, prepareProgramsCommand, prepareProgramsView, prepareWeeklyProgramsReview, programContext } from "./index";

const seed = DEMO_SNAPSHOT_V2;
const checklist = seed.programs.find((p) => p.id === "program-readiness-checklist")!;
const dfw = seed.programs.find((p) => p.id === "program-dfw-broad-outreach")!;
const referral = seed.programs.find((p) => p.id === "program-lax-realtime-referrals")!;
function context(program = checklist, market: "ALL" | "LAX" | "SFO" | "DFW" = "ALL"): WorkspaceQueryContext<"programs"> {
  const c = programContext(seed, program.id);
  return { ...c, filters: { ...c.filters, selectedMarket: market, marketIds: market === "ALL" ? [] : [market] } };
}
function decision(id = "interview-decision"): Extract<ProgramsCommandEnvelope, {type: "programs.record-decision"}> {
  return { type: "programs.record-decision", context: { commandId: id as never, expectedRevision: seed.revision, actorId: "actor-team-2" as never, occurredAt: seed.currentAsOfAt }, payload: { programId: checklist.id, decision: "expand", rationale: "  Review the bounded sample.\n  Preserve uncertainty.  ", ownerId: "team-2" as never, nextReviewAt: "2026-03-01T17:00:00Z" as never } };
}
const compose = (snapshot: DemoSnapshotV2, command: ProgramsCommandEnvelope) => composeProgramsCommand(snapshot, command, prepareProgramsCommand, prepareTeamCommand);
const groups = (snapshot = seed, c = context()) => prepareProgramsView(snapshot, c).resultsByProgram.get(c.filters.programIds[0]!)!;

describe("IC05 metric-specific frozen cohorts", () => {
  it("reconciles the canonical 113 people, 25 tasks and complete checklist memberships without a fabricated overall group", () => {
    expect(seed.reporters).toHaveLength(113); expect(seed.workItems).toHaveLength(25);
    expect(groups().map((g) => [g.timelyFirstJobs, g.matureEntrants, g.result])).toEqual([[6, 20, .3], [11, 20, .55]]);
    expect(groups(seed, context(checklist, "LAX")).map((g) => [g.timelyFirstJobs, g.matureEntrants])).toEqual([[3, 10], [6, 10]]);
    expect(groups(seed, context(checklist, "SFO")).map((g) => [g.timelyFirstJobs, g.matureEntrants])).toEqual([[3, 10], [5, 10]]);
    const row = prepareProgramsView(seed, context()).rows[0]!;
    expect(row.target).toBe(.5); expect(row.result?.groupId).toBe("pilot");
    const noSelection = { ...seed, programDecisions: [], goalRevisions: [], evidenceSnapshots: [] };
    expect(prepareProgramsView(noSelection, context()).rows[0]!.result).toBeNull();
    expect(prepareProgramsView(seed, context()).cohortComparisons.every((point) => point.kind === "cohort-comparison")).toBe(true);
  });
  it("DFW counts qualified lifecycle within 30 days, retains target/spend/reason, and never substitutes first jobs", () => {
    const result = groups(seed, context(dfw, "DFW"))[0]!;
    expect(result).toMatchObject({ qualified: 1, timelyFirstJobs: 0, matureEntrants: 6, result: 1/6, unit: "ratio", followUpDays: 30 });
    expect(result.evidence.computation).toMatchObject({ numerator: 1, denominator: 6 });
    expect(result.sourceContributions[0]).toMatchObject({ attributableSpendMinor: 360000, spendPerFirstJobMinor: null });
    const row = prepareProgramsView(seed, context(dfw, "DFW")).rows[0]!;
    expect(row.target).toBe(.4); expect(row.latestDecision?.decision).toBe("stop"); expect(row.latestDecision?.rationale).toBe(seed.programDecisions.find((d) => d.programId === dfw.id)!.rationale);
    const changed = { ...seed, lifecycleEvents: seed.lifecycleEvents.filter((event) => !(event.reporterId === "person-dfw-outreach-01" && event.eventType === "qualified")) };
    expect(groups(changed, context(dfw))[0]!.result).toBe(0);
    const late = { ...seed, lifecycleEvents: seed.lifecycleEvents.map((event) => event.reporterId === "person-dfw-outreach-01" && event.eventType === "qualified" ? { ...event, occurredAt: "2026-01-01T18:00:00Z" as never } : event) };
    expect(groups(late, context(dfw))[0]!.result).toBe(0);
  });
  it("keeps M09 currency-minor unavailable while observing, with separately labeled conversion and spend", () => {
    const result = groups(seed, context(referral))[0]!;
    expect(result).toMatchObject({ unit: "currency-minor", result: null, matureEntrants: 0, stillObservingEntrants: 2, currency: "USD" });
    expect(result.evidence.unit).toBe("currency-minor"); expect(result.sourceContributions[0]!.attributableSpendMinor).toBe(120000);
    expect(result.supportingOutcomes.firstJobConversion).toBeNull();
    expect(result.supportingOutcomes.label).toMatch(/Supporting/);
  });
  it("dispatches available M09 to cost per job, never a primary percentage, and validates its evidence", () => {
    const program = { ...checklist, primaryMetric: referral.primaryMetric, measurementPlan: { ...checklist.measurementPlan, metric: referral.primaryMetric }, targetRef: null };
    const sourceId = seed.programEnrollments.find((e) => e.programId === checklist.id)!.sourceAtEntry!;
    const changed = { ...seed, programs: [program], sourceSpend: [{ ...seed.sourceSpend[0]!, programId: checklist.id, sourceId, cohortRef: "pilot", attributableWindow: checklist.measurementPlan.entryWindow, amountMinor: 110000 as never }] };
    const result = groups(changed)[1]!;
    expect(result).toMatchObject({ unit: "currency-minor", result: 10000, timelyFirstJobs: 11 });
    expect(result.evidence.computation).toMatchObject({ value: 10000, numerator: null, denominator: null });
    expect(result.supportingOutcomes.firstJobConversion).toBe(.55); expect(validateEvidenceBundle(result.evidence)).toEqual([]);
  });
  it("keeps unknown and mismatched definitions unavailable and rejects incompatible targets", () => {
    for (const patch of [{ primaryMetric: referral.primaryMetric }, { measurementPlan: { ...checklist.measurementPlan, metric: { ...checklist.primaryMetric, version: "unknown" as never } } }]) {
      expect(groups({ ...seed, programs: [{ ...checklist, ...patch }] }).every((g) => g.result === null && validateEvidenceBundle(g.evidence).length === 0)).toBe(true);
    }
    const changed = { ...seed, goalRevisions: seed.goalRevisions.map((goal) => goal.goalId === checklist.targetRef ? { ...goal, metric: dfw.primaryMetric } : goal) };
    expect(prepareProgramsView(changed, context()).rows[0]!.target).toBeNull();
  });
  it("applies exact IDs, reference kinds and market-at-entry conjunctively, including empty navigation", () => {
    const entry = seed.programEnrollments.find((e) => e.programId === checklist.id && e.groupId === "pilot" && e.marketAtEntry === "LAX")!;
    const c = context();
    const selected = { ...c, filters: { ...c.filters, reporterIds: [entry.reporterId], programEnrollmentIds: [entry.id], recordRefs: [{ kind: "acquisition-case" as const, id: entry.acquisitionCaseId! }] } };
    expect(groups(seed, selected).reduce((sum, g) => sum + g.entrants, 0)).toBe(1);
    expect(prepareProgramsView(seed, selected).rows[0]!.target).toBeNull();
    const mismatch = { ...selected, filters: { ...selected.filters, sourceIds: ["missing" as never] } };
    for (const g of groups(seed, mismatch)) { expect(g.entrants).toBe(0); expect(g.evidence.navigationTarget.filters.matchNone).toBe(true); expect(validateEvidenceBundle(g.evidence)).toEqual([]); }
    expect(prepareProgramsView(seed, { ...c, filters: { ...c.filters, matchNone: true } }).rows).toEqual([]);
    const noMarket = { ...seed, programs: [{ ...checklist, marketIds: [...checklist.marketIds, "DFW" as const] }] };
    expect(groups(noMarket, context(checklist, "DFW")).every((g) => g.result === null && g.entrants === 0)).toBe(true);
  });
  it("parses equivalent UTC timestamps and half-open entry boundaries without changing denominator membership", () => {
    const c = context();
    const same = { ...seed, programEnrollments: seed.programEnrollments.map((entry) => ({ ...entry, enteredAt: entry.enteredAt.replace("Z", ".000Z") as never })) };
    expect(groups(same).map((g) => [g.result, g.matureEntrants])).toEqual(groups().map((g) => [g.result, g.matureEntrants]));
    const entry = seed.programEnrollments.find((e) => e.programId === checklist.id)!;
    const amended = { ...seed, programEnrollments: seed.programEnrollments.map((e) => e.id === entry.id ? { ...e, enteredAt: checklist.measurementPlan.entryWindow.endAt } : e) };
    expect(groups(amended, c).reduce((sum, g) => sum + g.entrants, 0)).toBe(39);
  });
  it("never allocates whole-cohort spend to a subset, adds currencies, or calls zero jobs free", () => {
    const spend = seed.sourceSpend.find((s) => s.programId === dfw.id)!;
    const c = context(dfw);
    const subset = { ...c, filters: { ...c.filters, reporterIds: ["person-dfw-outreach-01" as never] } };
    expect(calculateSourceContribution(seed, dfw, "broad-outreach", subset)[0]).toMatchObject({ attributableSpendMinor: null, spendPerFirstJobMinor: null, reason: expect.stringMatching(/filtered subset/) });
    const mixed = { ...seed, sourceSpend: [...seed.sourceSpend, { ...spend, id: "euro" as never, currency: "EUR" as never }] };
    expect(calculateSourceContribution(mixed, dfw, "broad-outreach", c)[0]).toMatchObject({ attributableSpendMinor: null, currency: null, reason: expect.stringMatching(/Mixed currencies/) });
    expect(calculateSourceContribution(seed, dfw, "broad-outreach", c)[0]).toMatchObject({ attributableSpendMinor: 360000, timelyFirstJobs: 0, spendPerFirstJobMinor: null });
  });
  it("validates every canonical prepared evidence bundle, including weekly review", () => {
    const c = context();
    const review = prepareWeeklyProgramsReview(seed, { ...c, filters: { ...c.filters, programIds: [], window: { startAt: "2026-02-16T08:00:00Z" as never, endAt: "2026-02-23T08:00:00Z" as never, boundary: "[start,end)" } } });
    expect(review.evidence.flatMap(validateEvidenceBundle)).toEqual([]);
    expect(review.actualResults.find((g) => g.programId === checklist.id && g.groupId === "pilot")!.result).toBe(.55);
    expect(review.actions.find((a) => a.id === `program-review-${checklist.id}`)).toMatchObject({ owner: { id: checklist.ownerId }, reviewAt: seed.programDecisions.find((d) => d.programId === checklist.id)!.nextReviewAt, dueAt: null });
    expect(review.actions.find((a) => a.id === `program-review-${dfw.id}`)).toBeUndefined();
  });
});

describe("IC06 pure Programs commands and actual repository composition", () => {
  it("keeps source outcomes intact, asks Team for review work, and saves/replays one atomic parent command", async () => {
    const command = decision();
    const prepared = prepareProgramsCommand(seed, command);
    expect(prepared.snapshot.workItems).toEqual(seed.workItems); expect(prepared.requestedWork).toHaveLength(1);
    expect(prepared.snapshot.programEnrollments).toEqual(seed.programEnrollments); expect(prepared.snapshot.jobOutcomes).toEqual(seed.jobOutcomes); expect(prepared.snapshot.lifecycleEvents).toEqual(seed.lifecycleEvents); expect(prepared.snapshot.readinessEvents).toEqual(seed.readinessEvents); expect(prepared.snapshot.assignmentEvents).toEqual(seed.assignmentEvents);
    expect(prepared.snapshot.programs.find((p) => p.id === checklist.id)!.stage).toBe("reviewing");
    const repository = createDemoRepositoryV2();
    const result = await commitV2Command(repository, command, compose);
    expect(result, result.message).toMatchObject({ ok: true, changed: true, revision: 1 });
    if (!result.ok) throw new Error(result.message);
    expect(result.value.workItems).toHaveLength(26); expect(result.value.commandRecords).toHaveLength(1); expect(result.value.programDecisions.at(-1)!.rationale).toBe(command.payload.rationale);
    expect(await commitV2Command(repository, command, compose)).toMatchObject({ ok: true, replayed: true, changed: false, revision: 1 });
    expect(await commitV2Command(repository, decision("stale"), compose)).toMatchObject({ ok: false, errors: [{ code: "stale-revision" }] });
    expect((await repository.reset()).ok).toBe(true);
  });
  it("persists note whitespace and latest append wins at equal UTC time", async () => {
    const repository = createDemoRepositoryV2();
    const base = decision();
    for (const [index, text] of ["First note", "  Second note\n with intentional  spacing.  "].entries()) {
      const command: ProgramsCommandEnvelope = { type: "programs.note.save", context: { ...base.context, commandId: `note-${index}` as never, expectedRevision: index }, payload: { programId: checklist.id, field: "next-step", text } };
      expect(await commitV2Command(repository, command, prepareProgramsCommand)).toMatchObject({ ok: true });
    }
    const loaded = await repository.load(); if (!loaded.ok) throw new Error(loaded.message);
    expect(prepareProgramsView(loaded.value, programContext(loaded.value, checklist.id)).rows[0]!.latestNextStep).toBe("  Second note\n with intentional  spacing.  ");
  });
  it("copies actual source process content/history without invented policy or rollout, including historical omissions", async () => {
    for (const source of seed.processVersions) {
      const command: ProgramsCommandEnvelope = { type: "programs.save-process-version", context: { ...decision().context, commandId: `draft-${source.id}` as never }, payload: { programId: checklist.id, sourceProcessVersionId: source.id, ownerId: "team-1" as never, nextReviewAt: "2026-03-01T17:00:00Z" as never } };
      const repository = createDemoRepositoryV2();
      const result = await commitV2Command(repository, command, prepareProgramsCommand);
      expect(result, result.message).toMatchObject({ ok: true }); if (!result.ok) throw new Error(result.message);
      const draft = result.value.processVersions.at(-1)!;
      expect(draft).toMatchObject({ requiredSteps: source.requiredSteps, trigger: source.trigger, exceptions: source.exceptions, version: 3, status: "draft", ownerId: "team-1" });
      expect(result.value.processVersions.slice(0, -1)).toEqual(seed.processVersions); expect(result.value.programEnrollments).toEqual(seed.programEnrollments);
      expect(draft.approvalHistory).toHaveLength(1); expect(draft.approvalHistory[0]!.rationale).toContain(source.id);
    }
  });
  it("rejects missing ownership, time, text, process source and decision inputs without mutating its input", () => {
    const before = structuredClone(seed); const command = decision();
    const bad = [ { ...command, context: { ...command.context, actorId: "unknown" as never } }, { ...command, context: { ...command.context, occurredAt: "2027-01-01T00:00:00Z" as never } }, { ...command, payload: { ...command.payload, ownerId: "unknown" as never } }, { ...command, payload: { ...command.payload, nextReviewAt: seed.currentAsOfAt } }, { ...command, payload: { ...command.payload, rationale: " " } } ] as ProgramsCommandEnvelope[];
    for (const invalid of bad) expect(() => prepareProgramsCommand(seed, invalid)).toThrow();
    expect(seed).toEqual(before);
  });
  it("rolls back Programs and requested Team work when Team rejects, and preserves state on storage failure", async () => {
    const repository = createDemoRepositoryV2(); const save = vi.spyOn(repository, "save");
    const result = await commitV2Command(repository, decision(), (snapshot, command) => composeProgramsCommand(snapshot, command, prepareProgramsCommand, () => { throw new Error("Team rejected review work"); }));
    expect(result).toMatchObject({ ok: false }); expect(save).not.toHaveBeenCalled(); const loaded = await repository.load(); expect(loaded.ok && loaded.value).toEqual(seed);
    const storage = { getItem: () => null, setItem: () => { throw new Error("Full disk"); }, removeItem: () => {} };
    const persistent = createDemoRepositoryV2(seed, { storage });
    expect(await commitV2Command(persistent, decision(), compose)).toMatchObject({ ok: false });
    const unchanged = await persistent.load(); expect(unchanged.ok && unchanged.value).toEqual(seed);
  });
});

describe("Programs boundary regressions", () => {
  it("keeps whole-program targets as benchmarks for a market subset", () => {
    const row = prepareProgramsView(seed, context(checklist, "LAX")).rows[0]!;
    expect(row.target).toBeNull(); expect(row.targetDetails.benchmark).toBe(.5);
    expect(row.targetDetails.reason).toMatch(/benchmark only/);
    expect(prepareProgramsView(seed, context(checklist, "LAX")).cohortComparisons.every((point) => point.targetState === "not-declared")).toBe(true);
  });
  it("counts globally first work before enrollment filters, and ignores invalid request/assignment joins", () => {
    const entry = seed.programEnrollments.find((e) => e.programId === checklist.id && e.groupId === "pilot" && e.marketAtEntry === "LAX")!;
    const job = seed.jobOutcomes.find((j) => j.reporterId === entry.reporterId)!;
    const request = seed.demandRequests.find((r) => r.id === job.requestId)!;
    const assignment = seed.assignmentEvents.find((a) => a.id === job.acceptedAssignmentEventId)!;
    const earlierTime = new Date(Date.parse(entry.enteredAt) - 86400000).toISOString() as never;
    const oldRequest = { ...request, id: "prior-request" as never, marketId: "SFO" as const, startAt: earlierTime, endAt: earlierTime, createdAt: earlierTime, recordedAt: earlierTime };
    const oldAssignment = { ...assignment, id: "prior-assignment" as never, requestId: oldRequest.id, occurredAt: earlierTime, recordedAt: earlierTime };
    const oldJob = { ...job, id: "prior-job" as never, requestId: oldRequest.id, acceptedAssignmentEventId: oldAssignment.id, startedAt: earlierTime, completedAt: earlierTime, recordedAt: earlierTime };
    const changed = { ...seed, reporters: seed.reporters.map((p) => p.id === entry.reporterId ? { ...p, createdAt: earlierTime, recordedAt: earlierTime } : p), demandRequests: [...seed.demandRequests, oldRequest], assignmentEvents: [...seed.assignmentEvents, oldAssignment], jobOutcomes: [...seed.jobOutcomes, oldJob] };
    expect(groups(changed, context(checklist, "LAX"))[1]!.timelyFirstJobs).toBe(5);
    const invalid = { ...seed, demandRequests: seed.demandRequests.filter((r) => r.id !== job.requestId) };
    expect(groups(invalid, context(checklist, "LAX"))[1]!.timelyFirstJobs).toBe(5);
  });
  it("aggregates compatible source spend including a source with zero jobs, but withholds partly observing spend", () => {
    const program = { ...checklist, primaryMetric: referral.primaryMetric, measurementPlan: { ...checklist.measurementPlan, metric: referral.primaryMetric }, targetRef: null };
    const pilot = seed.programEnrollments.filter((e) => e.programId === checklist.id && e.groupId === "pilot");
    const unsuccessful = pilot.find((e) => !seed.jobOutcomes.some((j) => j.reporterId === e.reporterId))!;
    const sourceId = pilot[0]!.sourceAtEntry!;
    const sourceSpend = [ { ...seed.sourceSpend[0]!, id: "spend-main" as never, programId: checklist.id, sourceId, cohortRef: "pilot", attributableWindow: checklist.measurementPlan.entryWindow, amountMinor: 100000 as never }, { ...seed.sourceSpend[0]!, id: "spend-zero" as never, programId: checklist.id, sourceId: "source-zero" as never, cohortRef: "pilot", attributableWindow: checklist.measurementPlan.entryWindow, amountMinor: 10000 as never } ];
    const changed = { ...seed, programs: [program], sourceSpend, programEnrollments: seed.programEnrollments.map((e) => e.id === unsuccessful.id ? { ...e, sourceAtEntry: "source-zero" as never } : e) };
    expect(groups(changed)[1]!.result).toBe(10000);
    const observingAt = new Date(Date.parse(pilot.at(-1)!.enteredAt) + 13 * 86400000).toISOString() as never;
    const c = context();
    const observing = groups(changed, { ...c, evaluation: { ...c.evaluation, asOfAt: observingAt } })[1]!;
    expect(observing.result).toBeNull(); expect(observing.stillObservingEntrants).toBeGreaterThan(0);
  });
  it("resolves work and decision reference navigation without widening person-specific work to a cohort", () => {
    const work = seed.workItems.find((w) => w.programId === dfw.id && w.primaryEntityRef.kind === "reporter")!;
    const c = context(dfw);
    const exact = { ...c, filters: { ...c.filters, workItemIds: [work.id], recordRefs: [{ kind: "work-item" as const, id: work.id }] } };
    expect(groups(seed, exact).reduce((sum, g) => sum + g.entrants, 0)).toBe(1);
    const decision = seed.programDecisions.find((d) => d.programId === dfw.id)!;
    expect(groups(seed, { ...c, filters: { ...c.filters, recordRefs: [{ kind: "program-decision", id: decision.id }] } })[0]!.entrants).toBe(6);
    const weekly = prepareWeeklyProgramsReview(seed, { ...c, filters: { ...c.filters, window: { startAt: "2026-01-01T00:00:00Z" as never, endAt: "2026-02-20T00:00:00Z" as never, boundary: "[start,end)" } } });
    expect(weekly.evidence.find((e) => e.id.includes("weekly-open"))!.navigationTarget.workspace).toBe("team");
    expect(weekly.evidence.find((e) => e.id.includes("weekly-open"))!.filters.workItemIds).toEqual(weekly.stillOpenWork.map((w) => w.id));
  });
  it("allows explicit text clearing and does not restore earlier text at equal command time", async () => {
    const repository = createDemoRepositoryV2();
    for (const [index, text] of ["Recorded next action", ""].entries()) {
      const command: ProgramsCommandEnvelope = { type: "programs.note.save", context: { ...decision().context, commandId: `clear-${index}` as never, expectedRevision: index }, payload: { programId: checklist.id, field: "next-step", text } };
      expect(await commitV2Command(repository, command, prepareProgramsCommand)).toMatchObject({ ok: true });
    }
    const loaded = await repository.load(); if (!loaded.ok) throw new Error(loaded.message);
    expect(prepareProgramsView(loaded.value, programContext(loaded.value, checklist.id)).rows[0]!.latestNextStep).toBe("");
  });
  it("reloads decisions/process changes from actual browser-local adapter storage and resets deterministically", async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    const repository = createDemoRepositoryV2(seed, { storage });
    expect(await commitV2Command(repository, decision(), compose)).toMatchObject({ ok: true });
    const refreshed = createDemoRepositoryV2(seed, { storage });
    const loaded = await refreshed.load(); if (!loaded.ok) throw new Error(loaded.message);
    expect(loaded.value.programDecisions.at(-1)!.rationale).toBe(decision().payload.rationale);
    expect(loaded.value.workItems).toHaveLength(26);
    expect(await commitV2Command(refreshed, decision(), compose)).toMatchObject({ ok: true, replayed: true });
    expect(await refreshed.reset()).toMatchObject({ ok: true });
    const reset = await refreshed.load(); expect(reset.ok && reset.value).toEqual(seed);
  });
});

describe("Retained evaluation and scope", () => {
  it("preserves the originally evaluated target after a later revision, while exposing all revisions", () => {
    const original = seed.goalRevisions.find((g) => g.goalId === checklist.targetRef)!;
    const currentAsOfAt = "2026-02-18T17:00:00Z" as never;
    const revision = { ...original, id: "new-checklist-target" as never, version: 2, target: .9, savedAt: "2026-02-17T17:00:00Z" as never, supersedesRevisionId: original.id };
    const changed = { ...seed, currentAsOfAt, goalRevisions: [...seed.goalRevisions, revision] };
    const view = prepareProgramsView(changed, programContext(changed, checklist.id));
    expect(view.rows[0]!.targetDetails).toMatchObject({ value: .5, revision: { id: original.id }, currentRevision: { id: revision.id, target: .9 }, targetGroupIds: ["pilot"] });
    expect(view.rows[0]!.targetDetails.revisions).toHaveLength(2);
    expect(view.cohortComparisons.find((g) => g.groupId === "pilot")!.targetState).toBe("met");
    expect(view.cohortComparisons.find((g) => g.groupId === "earlier")!.target).toBeNull();
  });
  it("retains latest equal-time decision/status append and projects historical work edits", () => {
    const command = decision();
    const first = prepareProgramsCommand(seed, command).snapshot;
    const second = prepareProgramsCommand(first, { ...command, context: { ...command.context, commandId: "second-decision" as never }, payload: { ...command.payload, decision: "change", rationale: "Second decision" } }).snapshot;
    expect(prepareProgramsView(second, programContext(second, checklist.id)).rows[0]!.latestDecision!.rationale).toBe("Second decision");
    const work = seed.workItems.find((w) => w.programId === checklist.id && w.statusHistory.at(-1)!.status !== "completed")!;
    const changed = { ...seed, workItems: seed.workItems.map((w) => w.id === work.id ? { ...w, statusHistory: [...w.statusHistory, { status: "completed" as const, occurredAt: seed.currentAsOfAt, actorId: "actor-team-2" as never, reason: "Latest equal-time completion" }] } : w) };
    const c = context(); const review = prepareWeeklyProgramsReview(changed, { ...c, filters: { ...c.filters, window: { startAt: "2026-02-16T00:00:00Z" as never, endAt: "2026-02-23T00:00:00Z" as never, boundary: "[start,end)" } } });
    expect(review.stillOpenWork.some((w) => w.id === work.id)).toBe(false);
  });
  it("keeps exact person work selections separate from whole-program tasks and discloses current-field history limits", () => {
    const work = seed.workItems.find((w) => w.programId === dfw.id && w.primaryEntityRef.kind === "reporter")!;
    const c = context(dfw);
    expect(prepareProgramsView(seed, { ...c, filters: { ...c.filters, reporterIds: [work.primaryEntityRef.id as never] } }).rows[0]!.work.map((w) => w.record.id)).toEqual([work.id]);
    const prior = { ...c, evaluation: { ...c.evaluation, asOfAt: "2026-02-15T17:00:00Z" as never } };
    expect(prepareProgramsView(seed, prior).rows[0]!.historyLimitations.join()).toMatch(/without full historical edit history/);
    expect(prepareProgramsView(seed, context(dfw)).rows[0]!.historyLimitations).toEqual([]);
  });
});

describe("Weekly exact follow-up scope", () => {
  it("retains an explicitly overdue next review for an active program", () => {
    const changed = { ...seed, programDecisions: seed.programDecisions.map((d) => d.programId === checklist.id ? { ...d, nextReviewAt: "2026-02-16T16:00:00Z" as never } : d) };
    const c = context();
    const review = prepareWeeklyProgramsReview(changed, { ...c, filters: { ...c.filters, window: { startAt: "2026-02-16T08:00:00Z" as never, endAt: "2026-02-23T08:00:00Z" as never, boundary: "[start,end)" } } });
    expect(review.actions.find((a) => a.id === `program-review-${checklist.id}`)).toMatchObject({ reviewAt: "2026-02-16T16:00:00Z", reviewDateLabel: "Decision next review date" });
  });
  it("restricts decision and process reference navigation to their actual program", () => {
    const c = context();
    const decision = seed.programDecisions.find((d) => d.programId === dfw.id)!;
    const view = prepareProgramsView(seed, { ...c, filters: { ...c.filters, programIds: [], recordRefs: [{ kind: "program-decision", id: decision.id }] } });
    expect(view.rows.map((row) => row.id)).toEqual([dfw.id]);
    const process = seed.processVersions[0]!;
    expect(prepareProgramsView(seed, { ...c, filters: { ...c.filters, programIds: [], recordRefs: [{ kind: "process-version", id: process.id }] } }).rows.map((row) => row.id)).toEqual([checklist.id]);
  });
});
