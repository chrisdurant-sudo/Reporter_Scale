import { describe, expect, it, vi } from "vitest";
import type { DemoSnapshotV2, ProgramsCommandEnvelope, TeamCommandEnvelope, TeamTarget, UtcTimestamp, WorkCreatePayload, WorkItem, WorkspaceFilterPayload, WorkspaceQueryContext } from "../../contracts/v2";
import { createDemoRepositoryV2, DEMO_SNAPSHOT_V2 } from "../../data/v2";
import { commitV2Command } from "../../integration/v2CommandTransaction";
import { composeProgramsCommand } from "../../integration/v2ProgramComposition";
import { validateEvidenceBundle } from "../shared/evidence";
import { projectWorkItemAt } from "../shared/work";
import { prepareTeamCommand, prepareTeamView } from "./index";

const id = (value: string) => value as never;
const utc = (value: string) => value as UtcTimestamp;
const seed = DEMO_SNAPSHOT_V2;
const metric = { id: id("M11"), version: id("v2-frozen-1") };
const at = seed.currentAsOfAt;
const actor = seed.teamMembers[0]!;
const member2 = seed.teamMembers[1]!;
const window = { startAt: utc("2026-02-09T08:00:00Z"), endAt: utc("2026-02-16T08:00:00Z"), boundary: "[start,end)" as const };
const filters: WorkspaceFilterPayload = { selectedMarket: "ALL", marketBasis: "all-markets", marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window };
const query = (changes: Partial<WorkspaceFilterPayload> = {}, asOf = at): WorkspaceQueryContext<"team"> => ({ workspace: "team", evaluation: { asOfAt: asOf, snapshotRevision: seed.revision, reportingTimeZone: id("America/Los_Angeles") }, filters: { ...filters, ...changes } });
const context = (key: string, revision = seed.revision) => ({ commandId: id(key), expectedRevision: revision, actorId: actor.actorId, occurredAt: at });
const createPayload: WorkCreatePayload = { title: "Inspect the linked source record", ownerId: actor.id, status: "open", domain: "market", kind: "re-engage", programId: null, primaryEntityRef: { kind: "reporter", id: "person-atl-returning-1" }, relatedRequestIds: [], dueAt: utc("2026-02-18T17:00:00Z"), priority: "high" };
const create = (key = "create", payload: WorkCreatePayload = createPayload): TeamCommandEnvelope => ({ type: "work.create", context: context(key), payload });
const add = () => prepareTeamCommand(seed, create()).snapshot;
const workId = id("work-create");
const edit = (key: string, changes: Extract<TeamCommandEnvelope, { type: "work.edit" }>["payload"]["changes"], appendNote?: string): TeamCommandEnvelope => ({ type: "work.edit", context: context(key), payload: { workItemId: workId, changes, appendNote, reason: "Manager reviewed the source." } });
const view = (state = seed, changes: Partial<WorkspaceFilterPayload> = {}) => prepareTeamView(state, query(changes), metric);
const target = (key: string, amount: number, changes: Partial<TeamTarget> = {}): TeamTarget => ({ id: id(key), teamMemberId: actor.id, role: null, metric, target: amount, reportingWindow: window, createdAt: at, rationale: "Review the same work unit and reporting period.", provenance: "demo-simulation", ...changes });
const saveTarget = (value: TeamTarget, prior: string | null = null): TeamCommandEnvelope => ({ type: "team.target.save-revision", context: context(`save-${value.id}`), payload: { target: value, supersedesTargetId: prior as never } });

describe("IC03 pure Team commands", () => {
  it("preserves explicit kind, dates, priority, primary/program/request links and creates distinct child identities", () => {
    const payload = { ...createPayload, primaryEntityRef: { kind: "program" as const, id: seed.programs[0]!.id }, programId: seed.programs[0]!.id, relatedRequestIds: [seed.demandRequests[0]!.id] };
    const first = prepareTeamCommand(seed, create("parent/work/1", payload));
    const second = prepareTeamCommand(first.snapshot, create("parent/work/2", payload));
    expect(second.snapshot.workItems.slice(-2).map((work) => work.id)).toEqual(["work-parent/work/1", "work-parent/work/2"]);
    expect(second.snapshot.workItems.at(-1)).toMatchObject({ kind: "re-engage", dueAt: payload.dueAt, priority: "high", primaryEntityRef: payload.primaryEntityRef, programId: payload.programId, relatedRequestIds: payload.relatedRequestIds });
    for (const key of ["revision", "currentAsOfAt", "appliedCommandIds", "commandRecords", "readinessEvents", "assignmentEvents", "jobOutcomes", "lifecycleEvents", "programEnrollments"] as const) expect(second.snapshot[key]).toEqual(seed[key]);
    expect(seed.workItems).toHaveLength(25); expect(seed.reporters).toHaveLength(113);
  });
  it("keeps unlinked sourcing/program work explicitly self-linked and unscoped", () => {
    for (const domain of ["sourcing", "program"] as const) {
      const result = prepareTeamCommand(seed, create(domain, { title: "Unscoped internal review", ownerId: null, status: "open", domain, programId: null }));
      const work = result.snapshot.workItems.at(-1)!;
      expect(work.primaryEntityRef).toEqual({ kind: "work-item", id: work.id });
      expect(view(result.snapshot).board.find((card) => card.id === work.id)).toMatchObject({ unscoped: true, ownerId: null });
      expect(view(result.snapshot, { selectedMarket: "LAX" }).board.map((card) => card.id)).not.toContain(work.id);
    }
  });
  it("rejects incompatible kinds, unknown/future links and invalid owners without mutating inputs", () => {
    const before = structuredClone(seed);
    expect(() => prepareTeamCommand(seed, create("bad", { ...createPayload, domain: "screening" }))).toThrow(/kind/);
    expect(() => prepareTeamCommand(seed, create("bad", { ...createPayload, ownerId: id("missing") }))).toThrow(/active owner/);
    expect(() => prepareTeamCommand(seed, create("bad", { ...createPayload, primaryEntityRef: { kind: "reporter", id: "missing" } }))).toThrow(/Unknown/);
    expect(() => prepareTeamCommand(seed, { ...create(), context: { ...context("bad"), actorId: id("missing") } })).toThrow(/active actor/);
    expect(seed).toEqual(before);
  });
  it("keeps latest same-time ownership and edits and reconstructs explicit prior null/absent fields", () => {
    let state = add();
    state = prepareTeamCommand(state, edit("edit-1", { title: "First title", dueAt: null, priority: "urgent", blockerCode: "needs-evidence" }, "  Keep  spaces\nsecond line  ")).snapshot;
    state = prepareTeamCommand(state, edit("edit-2", { title: "Second title", dueAt: utc("2026-02-20T17:00:00Z"), blockerCode: null })).snapshot;
    for (const [index, ownerId] of [member2.id, null, actor.id].entries()) state = prepareTeamCommand(state, { type: "work.assign", context: context(`assign-${index}`), payload: { workItemId: workId, ownerId, reason: "Reassign deliberately." } }).snapshot;
    const work = state.workItems.at(-1)!;
    expect(work.editHistory?.at(-1)?.previous).toEqual({ title: "First title", dueAt: null, blockerCode: "needs-evidence" });
    expect(work.notes?.at(-1)?.text).toBe("  Keep  spaces\nsecond line  ");
    expect(view(state).board.find((card) => card.id === workId)).toMatchObject({ title: "Second title", ownerId: actor.id, priority: "urgent", blocked: false });
    expect(projectWorkItemAt(work, utc("2026-02-16T16:59:59Z"))).toMatchObject({ title: createPayload.title, priority: "high", dueAt: createPayload.dueAt, blockerCode: null });
    const untyped = prepareTeamCommand(seed, create("bare", { title: "No priority", ownerId: null, status: "open", domain: "sourcing", programId: null })).snapshot;
    const updated = prepareTeamCommand(untyped, { type: "work.edit", context: context("bare-edit"), payload: { workItemId: id("work-bare"), changes: { priority: "low", dueAt: null, blockerCode: null }, reason: "Set explicit values." } }).snapshot.workItems.at(-1)!;
    expect(updated.editHistory?.[0]?.previous).toEqual({ dueAt: null, blockerCode: null });
    expect(projectWorkItemAt(updated, utc("2026-02-16T16:59:59Z"))).not.toHaveProperty("priority");
  });
  it("keeps Blocked orthogonal to Todo/In progress, including initially blocked work and clearing", () => {
    let state = prepareTeamCommand(seed, create("create", { ...createPayload, status: "blocked", blockerCode: "needs-evidence" })).snapshot;
    expect(view(state).board.find((card) => card.id === workId)).toMatchObject({ status: "To do", blocked: true });
    state = prepareTeamCommand(state, edit("clear", { blockerCode: null })).snapshot;
    expect(view(state).board.find((card) => card.id === workId)).toMatchObject({ status: "To do", blocked: false });
    state = prepareTeamCommand(state, { type: "work.transition", context: context("progress"), payload: { workItemId: workId, status: "in-progress", reason: "Started review." } }).snapshot;
    state = prepareTeamCommand(state, edit("block", { blockerCode: "waiting" })).snapshot;
    state = prepareTeamCommand(state, { type: "work.transition", context: context("blocked"), payload: { workItemId: workId, status: "blocked", reason: "Await record." } }).snapshot;
    expect(view(state).board.find((card) => card.id === workId)).toMatchObject({ status: "In progress", blocked: true });
    state = prepareTeamCommand(state, edit("clear-again", { blockerCode: null })).snapshot;
    expect(view(state).board.find((card) => card.id === workId)).toMatchObject({ status: "In progress", blocked: false });
    expect(projectWorkItemAt(state.workItems.at(-1)!, utc("2026-02-16T16:59:59Z"))).toMatchObject({ blockerCode: "needs-evidence" });
  });
  it("requires related known evidence, fixes completion actor and prohibits reopening or duplicate completion", () => {
    const initial = add();
    const complete = (refs: WorkItem["completionEvidenceRefs"]): TeamCommandEnvelope => ({ type: "work.transition", context: context("complete"), payload: { workItemId: workId, status: "completed", reason: "Inspected the historical outcome.", completionEvidenceRefs: refs } });
    expect(() => prepareTeamCommand(initial, complete([]))).toThrow(/evidence/);
    expect(() => prepareTeamCommand(initial, complete([{ kind: "job-outcome", id: "missing" }]))).toThrow(/Unknown/);
    expect(() => prepareTeamCommand(initial, complete([{ kind: "reporter", id: "person-lax-007" }]))).toThrow(/related/);
    const evidence = [{ kind: "job-outcome" as const, id: "job-atl-historic-1" }];
    const finished = prepareTeamCommand(initial, complete(evidence)).snapshot;
    expect(finished.workItems.at(-1)?.completionEvidenceRefs).toEqual(evidence);
    expect(() => prepareTeamCommand(finished, { type: "work.transition", context: context("reopen"), payload: { workItemId: workId, status: "open", reason: "Try reopening." } })).toThrow(/Terminal/);
    expect(() => prepareTeamCommand(finished, complete(evidence))).toThrow(/Terminal/);
    const reassigned = prepareTeamCommand(finished, { type: "work.assign", context: context("after-complete"), payload: { workItemId: workId, ownerId: member2.id, reason: "Next owner." } }).snapshot;
    const current = prepareTeamView(reassigned, query({ window: { ...window, endAt: utc("2026-02-17T08:00:00Z") } }), metric);
    expect(current.completionComparison?.current.facts.find((fact) => fact.workItemId === workId)).toMatchObject({ memberId: actor.id, actorId: actor.actorId });
    expect(finished.readinessEvents).toEqual(seed.readinessEvents); expect(finished.assignmentEvents).toEqual(seed.assignmentEvents); expect(finished.jobOutcomes).toEqual(seed.jobOutcomes);
  });
  it("records quality reviewer explicitly and validates required checks", () => {
    const check = { id: id("quality-new"), workItemId: seed.workItems[0]!.id, checkedBy: actor.id, checkedAt: at, requiredCheckResults: [{ checkCode: "linked", passed: false, reason: "Missing a specific source." }], outcome: "needs-follow-up" as const, provenance: "demo-simulation" as const };
    const command: TeamCommandEnvelope = { type: "team.quality.record", context: context("quality"), payload: { qualityCheck: check } };
    expect(prepareTeamCommand(seed, command).snapshot.workQualityChecks.at(-1)).toEqual(check);
    expect(() => prepareTeamCommand(seed, { ...command, payload: { qualityCheck: { ...check, checkedBy: member2.id } } })).toThrow(/reviewer/);
    expect(() => prepareTeamCommand(seed, { ...command, payload: { qualityCheck: { ...check, outcome: "passed" } } })).toThrow(/outcome/);
  });
  it("retains target revisions and enforces latest compatible scope with equivalent UTC spelling", () => {
    const state = { ...seed, teamTargets: [] };
    const first = prepareTeamCommand(state, saveTarget(target("target-a", 3))).snapshot;
    const secondTarget = target("target-b", 4, { reportingWindow: { ...window, startAt: utc("2026-02-09T08:00:00.000Z"), endAt: utc("2026-02-16T08:00:00.000Z") } });
    expect(() => prepareTeamCommand(first, saveTarget(secondTarget))).toThrow(/latest target/);
    expect(() => prepareTeamCommand(first, saveTarget({ ...secondTarget, role: actor.focusRole }))).toThrow(/latest target/);
    const second = prepareTeamCommand(first, saveTarget(secondTarget, "target-a")).snapshot;
    const third = prepareTeamCommand(second, saveTarget(target("target-c", 6), "target-b")).snapshot;
    expect(third.teamTargets.map((item) => item.target)).toEqual([3, 4, 6]);
    const member = view(third).members.find((item) => item.id === actor.id)!;
    expect(member.completed).toMatchObject({ target: 6, targetId: "target-c", unit: "tasks" });
    expect(member.targetRevisions.filter((item) => item.selectedForComparison).map((item) => item.target.id)).toEqual(["target-c"]);
    expect(view(third, { selectedMarket: "LAX" }).members.find((item) => item.id === actor.id)?.completed).toMatchObject({ target: null, targetId: null, note: expect.stringContaining("no market/task subset") });
    expect(third.workItems).toEqual(state.workItems);
  });
  it("does not select future, other-metric, other-unit or other-window targets", () => {
    const taskTarget = target("proper", 3);
    const mixed = { ...seed, teamTargets: [taskTarget, target("future", 99, { createdAt: utc("2026-03-01T00:00:00Z") }), target("other-metric", 100, { metric: { id: id("M01"), version: metric.version } }), target("other-window", 200, { reportingWindow: { ...window, startAt: utc("2026-02-08T08:00:00Z") } })] };
    expect(view(mixed).members.find((item) => item.id === actor.id)?.completed.target).toBe(3);
    expect(view({ ...mixed, metricDefinitions: mixed.metricDefinitions.map((definition) => definition.id === metric.id ? { ...definition, unit: "hours" as const } : definition) }).members.find((item) => item.id === actor.id)?.completed.target).toBeNull();
  });
  it("records coaching and practice with source authors and updates only current result", () => {
    const action = { ...seed.coachingActions[0]!, id: id("coaching-new"), teamMemberId: actor.id, authorId: actor.actorId, createdAt: at, updatedAt: at, dueAt: utc("2026-02-18T17:00:00Z"), reviewAt: utc("2026-02-19T17:00:00Z"), outcomeNote: null };
    let state = prepareTeamCommand(seed, { type: "team.practice.share", context: context("practice"), payload: { coachingAction: action } }).snapshot;
    state = prepareTeamCommand(state, { type: "team.coaching.review", context: { ...context("review"), actorId: member2.actorId }, payload: { coachingActionId: action.id, reviewedAt: at, outcomeNote: "  Reviewed the next example.  " } }).snapshot;
    expect(state.coachingActions.at(-1)).toEqual({ ...action, provenance: "demo-simulation", outcomeNote: "  Reviewed the next example.  " });
    expect(state.coachingActions.at(-1)).not.toHaveProperty("reviewHistory");
    expect(() => prepareTeamCommand(seed, { type: "team.coaching.record", context: context("bad-coach"), payload: { coachingAction: { ...action, linkedWorkItemIds: [] } } })).toThrow(/linked work/);
    expect(prepareTeamCommand(seed, { type: "team.coaching.record", context: context("coach"), payload: { coachingAction: action } }).snapshot.coachingActions.at(-1)?.authorId).toBe(actor.actorId);
  });
});

describe("Team prepared scope, inspection and weekly review", () => {
  it("applies market/exact/record filters conjunctively and discloses unscoped work", () => {
    const all = view(); expect(all.board).toHaveLength(25);
    const lax = view(seed, { selectedMarket: "LAX" });
    expect(lax.board.length).toBeGreaterThan(0); expect(lax.board.length).toBeLessThan(all.board.length);
    expect(lax.board.every((card) => card.marketIds.includes("LAX"))).toBe(true);
    const target = lax.board[0]!;
    expect(view(seed, { selectedMarket: "LAX", workItemIds: [id(target.id)], recordRefs: [{ kind: "work-item", id: target.id }] }).board.map((card) => card.id)).toEqual([target.id]);
    expect(view(seed, { selectedMarket: "LAX", workItemIds: [id(target.id)], recordRefs: [{ kind: "work-item", id: "other" }] }).board).toEqual([]);
    expect(view(seed, { matchNone: true }).board).toEqual([]);
    expect(view(seed, { matchNone: true }).evidence.every((bundle) => bundle.filters.matchNone)).toBe(true);
    expect(new Set(all.board.map((card) => card.id)).size).toBe(all.board.length);
  });
  it("prepares exact member/domain/program/blocker filters with stable ID options and scoped versus total workload", () => {
    const base = view(seed, { selectedMarket: "LAX" });
    const member = prepareTeamView(seed, query({ selectedMarket: "LAX" }), metric, { memberId: actor.id, domains: ["screening"] });
    expect(member.appliedTeamFilters).toEqual({ memberId: actor.id, domains: ["screening"] });
    expect(member.board.length).toBeGreaterThan(0);
    expect(member.board.every((card) => card.ownerId === actor.id && card.ownershipDomain === "screening" && card.marketIds.includes("LAX"))).toBe(true);
    expect(member.memberFilterOptions.map((option) => option.id)).toEqual([null, ...seed.teamMembers.map((item) => item.id), "unassigned"]);
    expect(member.members[0]!.totalOpenWorkload).toBeGreaterThanOrEqual(member.members[0]!.selectedMarketOpenWorkload);
    const unassigned = prepareTeamView(seed, query({ selectedMarket: "LAX" }), metric, { memberId: "unassigned" });
    expect(unassigned.board.length).toBe(base.memberFilterOptions.find((option) => option.id === "unassigned")?.count);
    expect(unassigned.board.every((card) => card.ownerId === null)).toBe(true);
    const blocked = prepareTeamView(seed, query(), metric, { blocked: true }); expect(blocked.board.every((card) => card.blocked)).toBe(true);
    const program = seed.programs[0]!.id;
    expect(prepareTeamView(seed, query(), metric, { programIds: [program] }).board.every((card) => card.programId === program)).toBe(true);
  });
  it("anchors case and enrollment exact scope rather than expanding sibling cases or service markets", () => {
    const reporter = { ...seed.reporters[0]!, id: id("cross"), recruitingMarketId: "LAX" as const, serviceMarketIds: ["LAX", "SFO"] as const };
    const caseA = { ...seed.acquisitionCases[0]!, id: id("case-a"), reporterId: reporter.id, ownerMarketId: "LAX" as const, originProgramId: null };
    const caseB = { ...caseA, id: id("case-b"), ownerMarketId: "SFO" as const };
    const work = { ...seed.workItems[0]!, id: id("case-work"), primaryEntityRef: { kind: "acquisition-case" as const, id: caseA.id }, relatedRequestIds: [], programId: null };
    const enrollment = { ...seed.programEnrollments[0]!, id: id("enrollment-a"), acquisitionCaseId: caseA.id, reporterId: reporter.id, marketAtEntry: "LAX" as const };
    const state: DemoSnapshotV2 = { ...seed, reporters: [reporter], acquisitionCases: [caseA, caseB], programEnrollments: [enrollment], workItems: [work], lifecycleEvents: [], screeningReviews: [], readinessEvents: [], onboardingSteps: [], credentialRecords: [], capabilityVerifications: [], availabilityWindows: [], assignmentEvents: [], jobOutcomes: [], workQualityChecks: [], coachingActions: [] };
    expect(view(state, { selectedMarket: "LAX", acquisitionCaseIds: [caseA.id] }).board).toHaveLength(1);
    expect(view(state, { selectedMarket: "SFO" }).board).toEqual([]);
    expect(view(state, { acquisitionCaseIds: [caseB.id] }).board).toEqual([]);
    expect(view(state, { programEnrollmentIds: [enrollment.id] }).board).toEqual([]);
    const enrollmentState = { ...state, workItems: [{ ...work, primaryEntityRef: { kind: "program-enrollment" as const, id: enrollment.id } }] };
    expect(view(enrollmentState, { selectedMarket: "LAX", programEnrollmentIds: [enrollment.id] }).board).toHaveLength(1);
    expect(view(enrollmentState, { selectedMarket: "SFO" }).board).toEqual([]);
    expect(view(enrollmentState, { acquisitionCaseIds: [caseB.id] }).board).toEqual([]);
    expect(view({ ...state, workItems: [{ ...work, primaryEntityRef: { kind: "reporter", id: reporter.id } }] }, { acquisitionCaseIds: [caseB.id] }).board).toHaveLength(1);
  });
  it("offers source-backed details, creation choices, completion choices and exact navigation", () => {
    const prepared = view(); const detail = prepared.workDetails.find((item) => item.id === "work-interview-atl-history-sample")!;
    expect(detail.completionEvidenceOptions.some((option) => option.kind === "job-outcome" && option.id === "job-atl-historic-1")).toBe(true);
    expect(detail.completionEvidenceOptions.some((option) => option.kind === "reporter" && option.id === "person-lax-007")).toBe(false);
    expect(detail.allowedStatuses).toEqual([]);
    expect(view(seed, detail.navigationTarget.filters).board.map((card) => card.id)).toEqual([detail.id]);
    expect(prepared.addWorkOptions.primaryEntities.some((option) => option.kind === "reporter")).toBe(true);
    expect(prepared.addWorkOptions.relatedRequests.length).toBeGreaterThan(0);
    expect(prepared.workDetails.find((item) => item.id === "work-interview-lax-screen-review")?.editHistory.length).toBe(1);
  });
  it("attributes quality to owner at inspection, keeps unowned samples and lets latest same-time checks win", () => {
    const work = seed.workItems.find((item) => item.id === "work-interview-checklist-data-review")!;
    const original = seed.workQualityChecks.find((item) => item.workItemId === work.id)!;
    const newOwner = { ...work, ownerHistory: [...work.ownerHistory, { ownerId: actor.id, occurredAt: at, actorId: actor.actorId, reason: "Reassigned after inspection." }] };
    const fail = { ...original, id: id("latest-check"), requiredCheckResults: [{ checkCode: "reason", passed: false, reason: "Needs a follow-up record." }], outcome: "needs-follow-up" as const };
    const unownedWork = { ...work, id: id("unowned-quality"), ownerHistory: [{ ...work.ownerHistory[0]!, ownerId: null }] };
    const state = { ...seed, workItems: [...seed.workItems.filter((item) => item.id !== work.id), newOwner, unownedWork], workQualityChecks: [original, fail, { ...original, id: id("unowned-check"), workItemId: unownedWork.id }] };
    const prepared = view(state); const sample = prepared.inspectionSamples.find((item) => item.workItemId === work.id)!;
    expect(sample).toMatchObject({ id: fail.id, subjectMemberId: member2.id, reviewerId: actor.id, passed: false, attributionBasis: "owner-at-inspection" });
    expect(prepared.members.find((item) => item.id === actor.id)?.quality.sample.some((item) => item.workItemId === work.id)).toBe(false);
    expect(prepared.unownedInspectionSamples.map((item) => item.workItemId)).toEqual([unownedWork.id]);
  });
  it("keeps M11 inspection evidence in tasks while exposing the inspected-only pass ratio separately", () => {
    const prepared = view();
    for (const member of prepared.members) {
      const bundle = prepared.evidence.find((item) => item.id === `team-quality-${member.id}`)!;
      expect(bundle.unit).toBe(seed.metricDefinitions.find((definition) => definition.id === bundle.metric.id && definition.version === bundle.metric.version)?.unit);
      expect(bundle.unit).toBe("tasks");
      expect(bundle.computation).toMatchObject({ status: "available", value: member.quality.inspectedCount, numerator: null, denominator: null });
      expect(bundle.explanation).toContain("not completed-work output");
      expect(bundle.contributingRecords.map((record) => record.id)).toEqual(member.quality.sample.map((sample) => sample.workItemId));
      expect(member.quality.ratio).toBe(member.quality.inspectedCount ? member.quality.passedCount / member.quality.inspectedCount : null);
      expect(view(seed, bundle.navigationTarget.filters).board.map((card) => card.id).sort()).toEqual(member.quality.sample.map((sample) => sample.workItemId).sort());
      expect(validateEvidenceBundle(bundle)).toEqual([]);
    }
  });
  it("round-trips coaching, target and inspection links into prepared details", () => {
    const prepared = view();
    const coaching = prepared.members.flatMap((member) => member.coachingDetails)[0]!;
    const coachingRoundTrip = view(seed, coaching.navigationTarget.filters);
    expect(coachingRoundTrip.members.flatMap((member) => member.coachingDetails).map((detail) => detail.action.id)).toContain(coaching.action.id);
    const revision = prepared.members.flatMap((member) => member.targetRevisions)[0]!;
    expect(view(seed, revision.navigationTarget.filters).members.flatMap((member) => member.targetRevisions).map((item) => item.target.id)).toContain(revision.target.id);
    const inspection = prepared.inspectionSamples[0]!;
    expect(view(seed, inspection.navigationTarget.filters).workDetails.map((detail) => detail.id)).toEqual([inspection.workItemId]);
  });
  it("counts programs by canonical program owner rather than the owner of a linked task", () => {
    const program = { ...seed.programs[0]!, ownerId: member2.id };
    const linked = { ...seed.workItems[0]!, programId: program.id, ownerHistory: [{ ownerId: actor.id, occurredAt: seed.workItems[0]!.createdAt, actorId: actor.actorId, reason: "Task owner differs from program owner." }] };
    const state = { ...seed, programs: [program], workItems: [linked], coachingActions: [], workQualityChecks: [] };
    const prepared = prepareTeamView(state, query(), metric, { memberId: actor.id });
    expect(prepared.board).toHaveLength(1); expect(prepared.summary.programsOwned).toBe(0);
    expect(prepareTeamView(state, query(), metric, { memberId: member2.id }).summary.programsOwned).toBe(1);
  });
  it("hides a future coaching review result while disclosing that earlier content is unavailable", () => {
    const action = seed.coachingActions[0]!;
    const state = { ...seed, coachingActions: [{ ...action, outcomeNote: "Later review result", updatedAt: at }] };
    const prepared = prepareTeamView(state, query({}, utc("2026-02-16T16:59:59Z")), metric);
    const detail = prepared.members.flatMap((member) => member.coachingDetails)[0]!;
    expect(detail.action.outcomeNote).toBeNull(); expect(detail.action.authorId).toBe(action.authorId);
    expect(detail).toMatchObject({ reviewContentAvailable: false, limitation: expect.stringContaining("Earlier review content is unavailable") });
    expect(view(state).members.flatMap((member) => member.coachingDetails)[0]?.action.outcomeNote).toBe("Later review result");
  });
  it("prepares equal-duration completed-week counts/delta and source event IDs without current-day leakage", () => {
    const comparison = view().completionComparison!;
    expect(comparison.current.window).toEqual(window);
    expect(Date.parse(comparison.current.window.endAt) - Date.parse(comparison.current.window.startAt)).toBe(Date.parse(comparison.prior.window.endAt) - Date.parse(comparison.prior.window.startAt));
    expect(comparison).toMatchObject({ partialPeriod: false, limitation: null, delta: comparison.current.count - comparison.prior.count });
    expect(comparison.current.evidence.reportingWindow).toEqual(window);
    expect(comparison.prior.evidence.reportingWindow).toEqual(comparison.prior.window);
    expect(comparison.current.evidence.id).not.toBe(comparison.prior.evidence.id);
    expect(prepareTeamView(seed, query(), metric, { memberId: actor.id }).completionComparison?.current.evidence.id).not.toBe(comparison.current.evidence.id);
    expect(prepareTeamView(seed, query(), metric, { domains: ["screening"] }).completionComparison?.current.evidence.id).not.toBe(comparison.current.evidence.id);
    expect(comparison.current.evidence.contributingRecords.map((record) => record.id)).toEqual(comparison.current.facts.map((fact) => fact.workItemId));
    expect(comparison.current.facts.every((fact) => fact.eventId === `${fact.workItemId}:statusHistory:${fact.historyIndex}`)).toBe(true);
    const modified = prepareTeamCommand(seed, create("completed-today", { ...createPayload, status: "completed", completionEvidenceRefs: [{ kind: "job-outcome", id: "job-atl-historic-1" }] })).snapshot;
    expect(view(modified).completionComparison?.current.count).toBe(comparison.current.count);
    expect(prepareTeamView(seed, query({ window: { ...window, endAt: utc("2026-02-17T08:00:00Z") } }), metric).completionComparison).toMatchObject({ partialPeriod: true, limitation: expect.stringContaining("provisional") });
  });
});

describe("Team composition through the single repository", () => {
  it("persists Team edits, reloads them, replays once, rejects stale commands and resets the seed", async () => {
    let bytes: string | null = null;
    const storage = { removeItem: () => { bytes = null; }, getItem: () => bytes, setItem: (_key: string, value: string) => { bytes = value; } };
    const repository = createDemoRepositoryV2(seed, { storage });
    expect(await commitV2Command(repository, create(), prepareTeamCommand)).toMatchObject({ ok: true, revision: 1 });
    const editCommand = { ...edit("persist", { dueAt: null, priority: "urgent", blockerCode: "waiting" }, "Record the next review."), context: context("persist", 1) };
    expect(await commitV2Command(repository, editCommand, prepareTeamCommand)).toMatchObject({ ok: true, revision: 2 });
    expect(await commitV2Command(repository, editCommand, prepareTeamCommand)).toMatchObject({ ok: true, replayed: true, revision: 2 });
    const refreshed = createDemoRepositoryV2(seed, { storage }); const loaded = await refreshed.load();
    expect(loaded.ok && loaded.value.workItems.at(-1)).toMatchObject({ dueAt: null, priority: "urgent", blockerCode: "waiting", notes: [expect.objectContaining({ text: "Record the next review." })] });
    expect(await commitV2Command(refreshed, create("stale"), prepareTeamCommand)).toMatchObject({ ok: false, errors: [{ code: "stale-revision" }] });
    expect((await refreshed.reset()).ok).toBe(true);
    const reset = await refreshed.load(); expect(reset.ok && reset.value).toEqual(seed);
  });
  it("does not acknowledge or change stored bytes on invalid completion or storage failure", async () => {
    let bytes: string | null = null; let fail = false;
    const repository = createDemoRepositoryV2(seed, { storage: { removeItem: () => { bytes = null; }, getItem: () => bytes, setItem: (_key, value) => { if (fail) throw new Error("Disk unavailable"); bytes = value; } } });
    expect((await commitV2Command(repository, create(), prepareTeamCommand)).ok).toBe(true); const saved = bytes;
    expect(await commitV2Command(repository, { type: "work.transition", context: context("no-evidence", 1), payload: { workItemId: workId, status: "completed", reason: "Try without evidence." } }, prepareTeamCommand)).toMatchObject({ ok: false });
    expect(bytes).toBe(saved); fail = true;
    expect(await commitV2Command(repository, { ...edit("failed", { priority: "low" }), context: context("failed", 1) }, prepareTeamCommand)).toMatchObject({ ok: false, errors: [{ code: "storage-failed" }] });
    expect(bytes).toBe(saved); expect((await repository.load()).revision).toBe(1);
  });
  it("persists target, inspection, coaching and explicit completion with their original records intact", async () => {
    const repository = createDemoRepositoryV2(); let revision = 0;
    const commit = async (command: TeamCommandEnvelope) => {
      const result = await commitV2Command(repository, { ...command, context: { ...command.context, expectedRevision: revision } }, prepareTeamCommand);
      expect(result.ok, result.message).toBe(true); if (!result.ok) throw new Error(result.message); revision = result.revision; return result.value;
    };
    await commit(create());
    await commit(saveTarget(target("member-target-persist", 4)));
    const check = { id: id("quality-persist"), workItemId: workId, checkedBy: actor.id, checkedAt: at, requiredCheckResults: [{ checkCode: "record", passed: true, reason: "Inspected the dated source record." }], outcome: "passed" as const, provenance: "demo-simulation" as const };
    await commit({ type: "team.quality.record", context: context("quality-persist"), payload: { qualityCheck: check } });
    const coaching = { ...seed.coachingActions[0]!, id: id("coaching-persist"), linkedWorkItemIds: [workId], teamMemberId: actor.id, authorId: actor.actorId, createdAt: at, updatedAt: at, dueAt: utc("2026-02-18T17:00:00Z"), reviewAt: utc("2026-02-19T17:00:00Z"), outcomeNote: null };
    await commit({ type: "team.coaching.record", context: context("coaching-persist"), payload: { coachingAction: coaching } });
    await commit({ type: "team.coaching.review", context: context("coaching-review-persist"), payload: { coachingActionId: coaching.id, reviewedAt: at, outcomeNote: "Reviewed the source-backed example." } });
    const persisted = await commit({ type: "work.transition", context: context("complete-persist"), payload: { workItemId: workId, status: "completed", reason: "Inspected the actual historical job.", completionEvidenceRefs: [{ kind: "job-outcome", id: "job-atl-historic-1" }] } });
    expect(persisted.workItems.at(-1)?.completionEvidenceRefs).toEqual([{ kind: "job-outcome", id: "job-atl-historic-1" }]);
    expect(persisted.coachingActions.at(-1)).toMatchObject({ authorId: actor.actorId, outcomeNote: "Reviewed the source-backed example." });
    expect(persisted.teamTargets.at(-1)?.role).toBeNull(); expect(persisted.revision).toBe(6);
    expect(persisted.jobOutcomes).toEqual(seed.jobOutcomes); expect(persisted.reporters).toEqual(seed.reporters);
  });
  it("saves multiple program-requested tasks atomically with deterministic child IDs and rolls back a later invalid child", async () => {
    const command: ProgramsCommandEnvelope = { type: "programs.note.save", context: context("parent"), payload: { programId: seed.programs[0]!.id, field: "note", text: "Program coordination" } };
    const repository = createDemoRepositoryV2(); const save = vi.spyOn(repository, "save");
    const prep = (state: DemoSnapshotV2, value: ProgramsCommandEnvelope) => composeProgramsCommand(state, value, (snapshot) => ({ snapshot, affectedRecords: [], message: "Prepared two linked tasks.", requestedWork: [createPayload, createPayload] }), prepareTeamCommand);
    expect(await commitV2Command(repository, command, prep)).toMatchObject({ ok: true, revision: 1 });
    expect(await commitV2Command(repository, command, prep)).toMatchObject({ ok: true, replayed: true, revision: 1 });
    expect(save).toHaveBeenCalledTimes(1);
    const loaded = await repository.load(); if (!loaded.ok) throw new Error(loaded.message);
    expect(loaded.value.workItems.slice(-2).map((work) => work.id)).toEqual(["work-parent/work/1", "work-parent/work/2"]);
    expect(loaded.value.appliedCommandIds).toEqual([command.context.commandId]);
    const bad = { ...command, context: context("bad-parent", 1) };
    expect(await commitV2Command(repository, bad, (state, value) => composeProgramsCommand(state, value, (snapshot) => ({ snapshot, affectedRecords: [], message: "Try invalid second work.", requestedWork: [createPayload, { ...createPayload, domain: "screening" }] }), prepareTeamCommand))).toMatchObject({ ok: false });
    expect(save).toHaveBeenCalledTimes(1); expect((await repository.load()).revision).toBe(1);
  });
});
