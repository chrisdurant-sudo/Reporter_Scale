import { describe, expect, it } from "vitest";
import type { DemoSnapshotV2, UtcTimestamp } from "../../contracts/v2";
import { validateEvidenceBundle } from "../shared/evidence";
import { applyRecruitingLocalNoteCommand, funnelWaitTimeTrends, globallyEarliestCompletedOutcomes, onboardingOutcomes, prepareRecruitingWorkspace, projectCurrentCases, resolveFunnelSlaConfiguration, sourceOutcomes } from "./recruiting";

const utc = (value: string) => value as UtcTimestamp;
const asOf = utc("2026-03-20T00:00:00Z");
function snapshot(overrides: Record<string, unknown> = {}): DemoSnapshotV2 {
  return {
    schemaVersion: 2, seedVersion: "test", revision: 7, baseAsOfAt: utc("2026-01-01T00:00:00Z"), currentAsOfAt: asOf,
    appliedCommandIds: [], appliedScenarioEventIds: [], markets: [], metricDefinitions: [], evidenceSnapshots: [], manualMarketNotes: [],
    reporters: [{ id: "reporter-a", fictionalName: "Avery", recruitingMarketId: "LAX", serviceMarketIds: [], createdAt: utc("2026-01-01T00:00:00Z"), recordedAt: utc("2026-01-01T00:00:00Z"), preferences: { attendanceModes: [], supportedProceedingTypes: [], supportedCapabilityCodes: [], serviceMarkets: [], notes: "" }, provenance: "synthetic-demo" }],
    acquisitionCases: [{ id: "case-a", reporterId: "reporter-a", ownerMarketId: "LAX", primarySourceId: "source-a", openedAt: utc("2026-02-01T00:00:00Z"), recordedAt: utc("2026-02-01T00:00:00Z"), purpose: "first-time", originProgramId: null, provenance: "synthetic-demo" }],
    lifecycleEvents: [{ id: "event-onboard", acquisitionCaseId: "case-a", reporterId: "reporter-a", eventType: "onboarding-started", occurredAt: utc("2026-02-10T00:00:00Z"), recordedAt: utc("2026-02-10T00:00:00Z"), actorId: "actor", reasonCode: "", reasonText: "", marketAtEntry: "LAX", linkedWorkItemId: null, provenance: "synthetic-demo" }],
    credentialRecords: [], capabilityVerifications: [], screeningReviews: [], onboardingSteps: [], readinessEvents: [], availabilityWindows: [], demandRequests: [], assignmentEvents: [{ id: "assignment-1", requestId: "request-1", reporterId: "reporter-a", state: "accepted", occurredAt: utc("2026-02-12T00:00:00Z"), recordedAt: utc("2026-02-12T00:00:00Z"), actorId: "actor", source: "synthetic-seed", reason: "accepted", provenance: "synthetic-demo" }],
    jobOutcomes: [], teamMembers: [], workItems: [], teamTargets: [], workQualityChecks: [], coachingActions: [], sources: [{ id: "source-a", label: "Referral", kind: "referral", description: "", provenance: "synthetic-demo" }], sourceSpend: [], programs: [], programEnrollments: [], programNotes: [], programDecisions: [], goalRevisions: [], workaroundExamples: [], processVersions: [], commandRecords: [], ...overrides,
  } as unknown as DemoSnapshotV2;
}
const window = { startAt: utc("2026-02-01T00:00:00Z"), endAt: utc("2026-03-01T00:00:00Z"), boundary: "[start,end)" as const };
const context = (selectedMarket: "ALL" | "LAX" | "SFO" = "ALL") => ({ workspace: "recruiting", evaluation: { asOfAt: asOf, snapshotRevision: 7, reportingTimeZone: "America/Los_Angeles" }, filters: { selectedMarket, marketBasis: "recruiting-market-at-entry", marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window } } as never);

describe("recruiting calculations", () => {
  it("keeps a late first job completed-to-date but out of the 14-day numerator, including the exact boundary", () => {
    const timely = { id: "job-timely", requestId: "request-1", reporterId: "reporter-a", acceptedAssignmentEventId: "assignment-1", outcome: "completed", startedAt: null, completedAt: utc("2026-02-24T00:00:00Z"), deliveryAt: null, recordedAt: utc("2026-02-24T00:00:00Z"), provenance: "synthetic-demo" };
    const exact = onboardingOutcomes(snapshot({ jobOutcomes: [timely] }), asOf, window);
    expect(exact.rate).toBe(1);
    const late = onboardingOutcomes(snapshot({ jobOutcomes: [{ ...timely, completedAt: utc("2026-02-24T00:00:00.001Z") }] }), asOf, window);
    expect(late.rate).toBe(0);
    expect(late.completedToDateCaseIds).toEqual(["case-a"]);
  });

  it("attributes only one first job globally even when later work is in another market", () => {
    const jobs = [{ id: "job-later", requestId: "request-lax", reporterId: "reporter-a", acceptedAssignmentEventId: "assignment-lax", outcome: "completed", startedAt: null, completedAt: utc("2026-02-20T00:00:00Z"), deliveryAt: null, recordedAt: utc("2026-02-20T00:00:00Z"), provenance: "synthetic-demo" }, { id: "job-first", requestId: "request-sfo", reporterId: "reporter-a", acceptedAssignmentEventId: "assignment-sfo", outcome: "completed", startedAt: null, completedAt: utc("2026-02-15T00:00:00Z"), deliveryAt: null, recordedAt: utc("2026-02-15T00:00:00Z"), provenance: "synthetic-demo" }];
    const assignments = [{ id: "assignment-lax", requestId: "request-lax", reporterId: "reporter-a", state: "accepted", occurredAt: utc("2026-02-12T00:00:00Z"), recordedAt: utc("2026-02-12T00:00:00Z"), actorId: "actor", source: "synthetic-seed", reason: "", provenance: "synthetic-demo" }, { id: "assignment-sfo", requestId: "request-sfo", reporterId: "reporter-a", state: "accepted", occurredAt: utc("2026-02-12T00:00:00Z"), recordedAt: utc("2026-02-12T00:00:00Z"), actorId: "actor", source: "synthetic-seed", reason: "", provenance: "synthetic-demo" }];
    expect(globallyEarliestCompletedOutcomes(snapshot({ jobOutcomes: jobs, assignmentEvents: assignments }), asOf).get("reporter-a" as never)?.id).toBe("job-first");
  });

  it("excludes orphaned, mismatched, and nonaccepted completed outcomes", () => {
    const outcome = { id: "job", requestId: "request-1", reporterId: "reporter-a", acceptedAssignmentEventId: "missing", outcome: "completed", startedAt: null, completedAt: utc("2026-02-15T00:00:00Z"), deliveryAt: null, recordedAt: utc("2026-02-15T00:00:00Z"), provenance: "synthetic-demo" };
    expect(globallyEarliestCompletedOutcomes(snapshot({ jobOutcomes: [outcome] }), asOf).size).toBe(0);
    expect(globallyEarliestCompletedOutcomes(snapshot({ jobOutcomes: [{ ...outcome, acceptedAssignmentEventId: "assignment-1", requestId: "other-request" }] }), asOf).size).toBe(0);
    expect(globallyEarliestCompletedOutcomes(snapshot({ jobOutcomes: [{ ...outcome, acceptedAssignmentEventId: "assignment-1" }], assignmentEvents: [{ id: "assignment-1", requestId: "request-1", reporterId: "reporter-a", state: "offered", occurredAt: utc("2026-02-12T00:00:00Z"), recordedAt: utc("2026-02-12T00:00:00Z"), actorId: "actor", source: "synthetic-seed", reason: "", provenance: "synthetic-demo" }] }), asOf).size).toBe(0);
  });

  it("does not put a completed case in the action queue unless concrete open work exists", () => {
    const done = snapshot({ jobOutcomes: [{ id: "job", requestId: "request", reporterId: "reporter-a", acceptedAssignmentEventId: "assignment", outcome: "completed", startedAt: null, completedAt: utc("2026-02-15T00:00:00Z"), deliveryAt: null, recordedAt: utc("2026-02-15T00:00:00Z"), provenance: "synthetic-demo" }] });
    expect(projectCurrentCases(done, asOf)[0]?.openActions).toEqual([]);
    const withFollowUp = snapshot({ ...done, workItems: [{ id: "work", kind: "first-opportunity", primaryEntityRef: { kind: "acquisition-case", id: "case-a" }, relatedRequestIds: [], programId: null, createdAt: utc("2026-02-15T00:00:00Z"), ownerHistory: [], dueAt: utc("2026-02-16T00:00:00Z"), statusHistory: [{ status: "open", occurredAt: utc("2026-02-15T00:00:00Z"), actorId: "actor", reason: "specific follow-up" }], blockerCode: null, completionEvidenceRefs: [], provenance: "synthetic-demo" }] });
    expect(projectCurrentCases(withFollowUp, asOf)[0]?.openActions[0]?.reason).toBe("Open work is overdue");
  });

  it("never turns positive recorded spend with zero first jobs into a zero cost rate", () => {
    const outcomes = sourceOutcomes(snapshot({ sourceSpend: [{ id: "spend", sourceId: "source-a", programId: null, cohortRef: null, attributableWindow: null, amountMinor: 5000, currency: "USD", occurredAt: utc("2026-02-12T00:00:00Z"), allocationNote: "direct", provenance: "synthetic-demo" }] }), asOf, window);
    expect(outcomes[0]?.spend.display).toBe("No first jobs yet; 5000 minor USD spent");
  });

  it("uses only declared cohort/window spend once and emits valid unavailable zero-denominator evidence", () => {
    const spend = { id: "included", sourceId: "source-a", programId: null, cohortRef: `${window.startAt}/${window.endAt}`, attributableWindow: window, amountMinor: 5000, currency: "USD", occurredAt: utc("2026-02-12T00:00:00Z"), allocationNote: "direct", provenance: "synthetic-demo" };
    const outcomes = sourceOutcomes(snapshot({ sourceSpend: [spend, { ...spend, id: "outside", amountMinor: 9000, attributableWindow: { ...window, endAt: utc("2026-03-02T00:00:00Z") } }, { ...spend, id: "other-cohort", amountMinor: 7000, cohortRef: "another-cohort" }] }), asOf, window);
    expect(outcomes[0]?.spend).toMatchObject({ status: "recorded", amountMinor: 5000 });
    const empty = prepareRecruitingWorkspace(snapshot({ lifecycleEvents: [] }), { workspace: "recruiting", evaluation: { asOfAt: asOf, snapshotRevision: 7, reportingTimeZone: "America/Los_Angeles" }, filters: { selectedMarket: "ALL", marketBasis: "recruiting-market-at-entry", marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window } } as never);
    expect(empty.evidence.filter((item) => item.metric.id === "M07" || item.metric.id === "M08").map((item) => item.computation.status)).toEqual(["unavailable", "unavailable"]);
    expect(empty.evidence.flatMap(validateEvidenceBundle)).toEqual([]);
  });

  it("excludes future acquisition cases and chooses timestamp-latest histories, not array-last histories", () => {
    const future = { ...snapshot().acquisitionCases[0]!, id: "case-future", openedAt: utc("2026-04-01T00:00:00Z"), recordedAt: utc("2026-04-01T00:00:00Z") };
    expect(projectCurrentCases(snapshot({ acquisitionCases: [...snapshot().acquisitionCases, future] }), asOf).map((item) => item.acquisitionCaseId)).toEqual(["case-a"]);
    expect(sourceOutcomes(snapshot({ acquisitionCases: [...snapshot().acquisitionCases, future] }), asOf, { ...window, endAt: utc("2026-05-01T00:00:00Z") })[0]?.caseIds).toEqual(["case-a"]);
    const work = { id: "work", kind: "screen", primaryEntityRef: { kind: "acquisition-case", id: "case-a" }, relatedRequestIds: [], programId: null, createdAt: utc("2026-02-01T00:00:00Z"), ownerHistory: [{ ownerId: "early-owner", occurredAt: utc("2026-02-10T00:00:00Z"), actorId: "actor", reason: "early" }, { ownerId: "late-owner", occurredAt: utc("2026-02-20T00:00:00Z"), actorId: "actor", reason: "late" }], dueAt: null, statusHistory: [{ status: "completed", occurredAt: utc("2026-02-25T00:00:00Z"), actorId: "actor", reason: "complete" }, { status: "open", occurredAt: utc("2026-02-15T00:00:00Z"), actorId: "actor", reason: "open" }], blockerCode: null, completionEvidenceRefs: [], provenance: "synthetic-demo" };
    expect(projectCurrentCases(snapshot({ workItems: [work] }), asOf)[0]?.openActions).toEqual([]);
    expect(projectCurrentCases(snapshot({ workItems: [{ ...work, statusHistory: [work.statusHistory[0]!, { ...work.statusHistory[1]!, occurredAt: utc("2026-02-26T00:00:00Z") }] }] }), asOf)[0]?.openActions[0]?.assignedTo).toBe("late-owner");
  });

  it("suppresses stale screening/onboarding actions after closure unless canonical work remains open", () => {
    const closed = { id: "closed", acquisitionCaseId: "case-a", reporterId: "reporter-a", eventType: "closed", occurredAt: utc("2026-02-20T00:00:00Z"), recordedAt: utc("2026-02-20T00:00:00Z"), actorId: "actor", reasonCode: "withdrawn", reasonText: "Withdrawn", marketAtEntry: "LAX", linkedWorkItemId: null, provenance: "synthetic-demo" };
    const step = { id: "step", acquisitionCaseId: "case-a", stepDefinitionId: "orientation", required: true, state: "blocked", assignedTo: null, dueAt: null, completedAt: null, completedBy: null, evidenceRef: null, blockerCode: "missing", recordedAt: utc("2026-02-10T00:00:00Z"), provenance: "synthetic-demo" };
    const base = snapshot({ lifecycleEvents: [...snapshot().lifecycleEvents, closed], onboardingSteps: [step] });
    expect(projectCurrentCases(base, asOf)[0]?.openActions).toEqual([]);
    const open = { id: "work", kind: "re-engage", primaryEntityRef: { kind: "acquisition-case", id: "case-a" }, relatedRequestIds: [], programId: null, createdAt: utc("2026-02-20T00:00:00Z"), ownerHistory: [], dueAt: null, statusHistory: [{ status: "open", occurredAt: utc("2026-02-20T00:00:00Z"), actorId: "actor", reason: "explicit re-engagement" }], blockerCode: null, completionEvidenceRefs: [], provenance: "synthetic-demo" };
    expect(projectCurrentCases(snapshot({ ...base, workItems: [open] }), asOf)[0]?.openActions.map((item) => item.kind)).toEqual(["work-item"]);
  });

  it("keeps late first jobs out of M09's fully observed cohort horizon", () => {
    const job = { id: "late", requestId: "request-1", reporterId: "reporter-a", acceptedAssignmentEventId: "assignment-1", outcome: "completed", startedAt: null, completedAt: utc("2026-03-04T00:00:00Z"), deliveryAt: null, recordedAt: utc("2026-03-04T00:00:00Z"), provenance: "synthetic-demo" };
    const outcomes = sourceOutcomes(snapshot({ jobOutcomes: [job], sourceSpend: [{ id: "spend", sourceId: "source-a", programId: null, cohortRef: null, attributableWindow: null, amountMinor: 5000, currency: "USD", occurredAt: utc("2026-02-12T00:00:00Z"), allocationNote: "direct", provenance: "synthetic-demo" }] }), asOf, window);
    expect(outcomes[0]?.firstJobCaseIds).toEqual([]);
    expect(outcomes[0]?.spend.display).toBe("No first jobs yet; 5000 minor USD spent");
  });

  it("projects source-backed total and current-status elapsed days at the selected as-of time", () => {
    const configuration = resolveFunnelSlaConfiguration({ marketOverrides: { LAX: { overallDays: 47, statusDays: { Onboarding: 38 } } } });
    const view = projectCurrentCases(snapshot(), asOf, "LAX", configuration)[0]!;
    expect(view).toMatchObject({ acquisitionCaseId: "case-a", marketId: "LAX", stage: "onboarding", funnelStatus: "Onboarding", totalElapsedDays: 47, statusElapsedDays: 38, stageEntryEventId: "event-onboard" });
    expect(view.sla.total.state).toBe("at");
    expect(view.sla.currentStatus.state).toBe("at");
    const earlier = projectCurrentCases(snapshot(), utc("2026-02-20T00:00:00Z"), "LAX", configuration)[0]!;
    expect(earlier.totalElapsedDays).toBe(19);
    expect(earlier.statusElapsedDays).toBe(10);
    expect(earlier.sla.currentStatus.state).toBe("under");
  });

  it("builds ordered R7/R28 source-backed status trends scoped to the selected market", () => {
    const reporterB = { ...snapshot().reporters[0]!, id: "reporter-b", fictionalName: "Blair", recruitingMarketId: "SFO" };
    const caseB = { ...snapshot().acquisitionCases[0]!, id: "case-b", reporterId: "reporter-b", ownerMarketId: "SFO", openedAt: utc("2026-02-15T00:00:00Z"), recordedAt: utc("2026-02-15T00:00:00Z") };
    const eventB = { ...snapshot().lifecycleEvents[0]!, id: "event-b", acquisitionCaseId: "case-b", reporterId: "reporter-b", occurredAt: utc("2026-03-10T00:00:00Z"), recordedAt: utc("2026-03-10T00:00:00Z") };
    const trends = funnelWaitTimeTrends(snapshot({ reporters: [...snapshot().reporters, reporterB], acquisitionCases: [...snapshot().acquisitionCases, caseB], lifecycleEvents: [...snapshot().lifecycleEvents, eventB] }), asOf, "LAX");
    const r7 = trends.R7.Onboarding;
    const r28 = trends.R28.Onboarding;
    expect(r7).toHaveLength(7);
    expect(r28).toHaveLength(7);
    expect(r7.map((point) => point.asOfAt)).toEqual([...r7.map((point) => point.asOfAt)].sort());
    expect(r28.map((point) => point.asOfAt)).toEqual([...r28.map((point) => point.asOfAt)].sort());
    expect(r7.at(-1)).toMatchObject({ acquisitionCaseIds: ["case-a"], lifecycleEventIds: ["event-onboard"], meanElapsedDays: 38 });
    expect(r28.at(-1)?.acquisitionCaseIds).toEqual(["case-a"]);
  });

  it("uses deterministic demo SLA inputs and distinguishes under, at, and over boundaries", () => {
    const configuration = resolveFunnelSlaConfiguration({ marketOverrides: { LAX: { overallDays: 47, statusDays: { Onboarding: 38 } } } });
    const at = projectCurrentCases(snapshot(), asOf, "LAX", configuration)[0]!;
    const under = projectCurrentCases(snapshot(), utc("2026-03-19T00:00:00Z"), "LAX", configuration)[0]!;
    const over = projectCurrentCases(snapshot(), utc("2026-03-21T00:00:00Z"), "LAX", configuration)[0]!;
    expect(configuration).toMatchObject({ source: "demo-input-not-persisted", canonicalPolicyStatus: "not-present-in-DemoSnapshotV2" });
    expect([under, at, over].map((item) => item.sla.total.state)).toEqual(["under", "at", "over"]);
    expect([under, at, over].map((item) => item.sla.currentStatus.state)).toEqual(["under", "at", "over"]);
    expect(resolveFunnelSlaConfiguration()).toEqual(resolveFunnelSlaConfiguration());
  });

  it("keeps local candidate/process notes outside canonical operational outcomes", () => {
    const source = snapshot();
    const baseline = prepareRecruitingWorkspace(source, { workspace: "recruiting", evaluation: { asOfAt: asOf, snapshotRevision: 7, reportingTimeZone: "America/Los_Angeles" }, filters: { selectedMarket: "LAX", marketBasis: "recruiting-market-at-entry", marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window } } as never);
    const initial = { persistence: "local-only-not-persisted" as const, notes: [] };
    const candidate = applyRecruitingLocalNoteCommand(source, asOf, initial, { type: "recruiting.local-note.set", target: { kind: "candidate", acquisitionCaseId: "case-a" as never }, text: "Awaiting fictional form" });
    const process = applyRecruitingLocalNoteCommand(source, asOf, candidate.ok ? candidate.state : initial, { type: "recruiting.local-note.set", target: { kind: "process", marketId: "LAX" }, text: "Review handoff wording" });
    expect(process.ok && process.state.notes).toHaveLength(2);
    expect(source.lifecycleEvents).toHaveLength(1);
    expect(prepareRecruitingWorkspace(source, { workspace: "recruiting", evaluation: { asOfAt: asOf, snapshotRevision: 7, reportingTimeZone: "America/Los_Angeles" }, filters: { selectedMarket: "LAX", marketBasis: "recruiting-market-at-entry", marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window } } as never).currentCases).toEqual(baseline.currentCases);
    expect(applyRecruitingLocalNoteCommand(source, asOf, initial, { type: "recruiting.local-note.set", target: { kind: "candidate", acquisitionCaseId: "unknown" as never }, text: "Nope" }).ok).toBe(false);
  });

  it("prepares Funnel KPIs without counting closed or completed cases as active", () => {
    const reporterB = { ...snapshot().reporters[0]!, id: "reporter-b", fictionalName: "Blair" };
    const reporterC = { ...snapshot().reporters[0]!, id: "reporter-c", fictionalName: "Casey" };
    const caseB = { ...snapshot().acquisitionCases[0]!, id: "case-b", reporterId: "reporter-b" };
    const caseC = { ...snapshot().acquisitionCases[0]!, id: "case-c", reporterId: "reporter-c" };
    const closed = { ...snapshot().lifecycleEvents[0]!, id: "closed-b", acquisitionCaseId: "case-b", reporterId: "reporter-b", eventType: "closed", occurredAt: utc("2026-03-01T00:00:00Z"), recordedAt: utc("2026-03-01T00:00:00Z") };
    const accepted = { ...snapshot().assignmentEvents[0]!, id: "accepted-c", reporterId: "reporter-c", requestId: "request-c" };
    const completed = { id: "completed-c", requestId: "request-c", reporterId: "reporter-c", acceptedAssignmentEventId: "accepted-c", outcome: "completed", startedAt: null, completedAt: utc("2026-03-02T00:00:00Z"), deliveryAt: null, recordedAt: utc("2026-03-02T00:00:00Z"), provenance: "synthetic-demo" };
    const view = prepareRecruitingWorkspace(snapshot({ reporters: [...snapshot().reporters, reporterB, reporterC], acquisitionCases: [...snapshot().acquisitionCases, caseB, caseC], lifecycleEvents: [...snapshot().lifecycleEvents, closed], assignmentEvents: [...snapshot().assignmentEvents, accepted], jobOutcomes: [completed] }), context());
    expect(view.kpis.activePeopleInFunnel).toMatchObject({ value: 1, acquisitionCaseIds: ["case-a"] });
    expect(view.kpis.percentStartedWork).toMatchObject({ numerator: 1, denominator: 3, value: 1 / 3, numeratorCaseIds: ["case-c"], denominatorCaseIds: ["case-a", "case-b", "case-c"] });
  });

  it("selects the default SLA for All and the explicit market override for a market scope", () => {
    const all = prepareRecruitingWorkspace(snapshot(), context());
    const lax = prepareRecruitingWorkspace(snapshot(), context("LAX"));
    expect(all.applicableSla).toMatchObject({ scope: "default-all-markets", marketId: "ALL", values: { overallDays: 35 } });
    expect(lax.applicableSla).toMatchObject({ scope: "market-override", marketId: "LAX", values: { overallDays: 32, statusDays: { Screening: 6 } } });
  });

  it("prepares status/waiting filters and deterministic attention with source records", () => {
    const step = { id: "step-a", acquisitionCaseId: "case-a", stepDefinitionId: "orientation", required: true, state: "blocked", assignedTo: null, dueAt: utc("2026-03-10T00:00:00Z"), completedAt: null, completedBy: null, evidenceRef: null, blockerCode: "missing-evidence", recordedAt: utc("2026-02-10T00:00:00Z"), provenance: "synthetic-demo" };
    const view = prepareRecruitingWorkspace(snapshot({ onboardingSteps: [step] }), context("LAX"));
    expect(view.statusFilterCounts.find((item) => item.status === "Onboarding")).toMatchObject({ count: 1, acquisitionCaseIds: ["case-a"] });
    expect(view.waitingOnFilterOptions).toEqual([{ key: "unowned", label: "Unowned action", count: 1, acquisitionCaseIds: ["case-a"], actionRecords: [{ kind: "onboarding-step", id: "step-a" }] }]);
    expect(view.attentionItems).toHaveLength(1);
    expect(view.attentionItems[0]).toMatchObject({ acquisitionCaseId: "case-a", nextAction: "Complete orientation: Blocked: missing-evidence", contributingRecords: [{ kind: "acquisition-case", id: "case-a" }, { kind: "lifecycle-event", id: "event-onboard" }, { kind: "onboarding-step", id: "step-a" }] });
    expect(view.focusCondition).toBe(view.attentionItems[0]!.finding);
  });
});
