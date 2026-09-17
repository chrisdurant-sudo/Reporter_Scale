import { describe, expect, it } from "vitest";
import type { DemoSnapshotV2, WorkspaceQueryContext } from "../../contracts/v2";
import { advanceLimitedPilotProcess, buildProcessDraft, calculateSourceContribution, prepareProgramsView, projectGoalIntegrity, PROGRAMS_WORKSPACE } from "./index";

const stamp = "2026-02-16T17:00:00.000Z";
const programId = "program-readiness-checklist" as never;

function fixture(): DemoSnapshotV2 {
  const people = Array.from({ length: 40 }, (_, index) => {
    const market = index % 20 < 10 ? "LAX" : "SFO";
    const group = index < 20 ? "earlier" : "pilot";
    const localIndex = index % 10;
    const successful = index < 20 ? localIndex < 3 : index < 30 ? localIndex < 6 : localIndex < 5;
    const id = `person-${index + 1}` as never;
    const caseId = `case-${index + 1}` as never;
    const enrollmentId = `enrollment-${index + 1}` as never;
    const assignmentId = `assignment-${index + 1}` as never;
    return {
      reporter: { id, fictionalName: `Fictional ${index + 1}`, recruitingMarketId: market, serviceMarketIds: [market], createdAt: stamp, recordedAt: stamp, preferences: { attendanceModes: ["remote"], supportedProceedingTypes: [], supportedCapabilityCodes: [], serviceMarkets: [], notes: "" }, provenance: "synthetic-demo" },
      case: { id: caseId, reporterId: id, ownerMarketId: market, primarySourceId: "source-referral" as never, openedAt: "2026-01-01T00:00:00.000Z", recordedAt: stamp, purpose: "first-time", originProgramId: programId, provenance: "synthetic-demo" },
      lifecycle: { id: `lifecycle-${index + 1}` as never, acquisitionCaseId: caseId, reporterId: id, eventType: "onboarding-started", occurredAt: "2026-01-01T00:00:00.000Z", recordedAt: stamp, actorId: "actor-1" as never, reasonCode: "fixture", reasonText: "Synthetic completed history", marketAtEntry: market, linkedWorkItemId: null, provenance: "synthetic-demo" },
      enrollment: { id: enrollmentId, programId, groupId: group, reporterId: id, acquisitionCaseId: caseId, enteredAt: "2026-01-01T00:00:00.000Z", eligibilityEvidenceRefs: [], marketAtEntry: market, sourceAtEntry: "source-referral" as never, processVersionId: null, provenance: "synthetic-demo" },
      assignment: { id: assignmentId, requestId: `request-${index + 1}` as never, reporterId: id, state: "accepted", occurredAt: stamp, recordedAt: stamp, actorId: "actor-1" as never, source: "synthetic-seed", reason: "fixture", provenance: "synthetic-demo" },
      job: successful ? { id: `job-${index + 1}` as never, requestId: `request-${index + 1}` as never, reporterId: id, acceptedAssignmentEventId: assignmentId, outcome: "completed", startedAt: stamp, completedAt: "2026-01-10T00:00:00.000Z", deliveryAt: null, recordedAt: stamp, provenance: "synthetic-demo" } : null,
    };
  });
  return {
    schemaVersion: 2, seedVersion: "test", revision: 3, baseAsOfAt: stamp as never, currentAsOfAt: stamp as never, appliedCommandIds: [], appliedScenarioEventIds: [], markets: [], metricDefinitions: [], evidenceSnapshots: [], manualMarketNotes: [],
    reporters: people.map((item) => item.reporter), acquisitionCases: people.map((item) => item.case), lifecycleEvents: people.map((item) => item.lifecycle), credentialRecords: [], capabilityVerifications: [], screeningReviews: [], onboardingSteps: [], readinessEvents: [], availabilityWindows: [], demandRequests: [], assignmentEvents: people.map((item) => item.assignment), jobOutcomes: people.flatMap((item) => item.job ? [item.job] : []), teamMembers: [], workItems: [], teamTargets: [], workQualityChecks: [], coachingActions: [],
    sources: [{ id: "source-referral" as never, label: "Targeted referral", kind: "referral", description: "Synthetic source", provenance: "synthetic-demo" }], sourceSpend: [],
    programs: [{ id: programId, title: "Readiness checklist", marketIds: ["LAX", "SFO"], linkedNeedRefs: [], type: "workflow", stage: "reviewing", ownerId: "team-1" as never, hypothesis: "Synthetic hypothesis", changeSummary: "Checklist", primaryMetric: { id: "metric-m08" as never, version: "v1" as never }, targetRef: "goal-1" as never, startAt: stamp as never, reviewAt: stamp as never, measurementPlan: { metric: { id: "metric-m08" as never, version: "v1" as never }, entryWindow: { startAt: "2026-01-01T00:00:00.000Z" as never, endAt: "2026-01-02T00:00:00.000Z" as never, boundary: "[start,end)" }, followUpDays: 14, eligibilityRule: "Complete histories", attributionRule: "Source fixed at entry" }, originWorkaroundRef: null, limitations: ["Non-random synthetic sample"], provenance: "synthetic-demo" }],
    programEnrollments: people.map((item) => item.enrollment), programNotes: [], programDecisions: [], goalRevisions: [{ id: "goal-revision-1" as never, goalId: "goal-1" as never, version: 1, metric: { id: "metric-m08" as never, version: "v1" as never }, scope: { marketIds: ["LAX", "SFO"], programIds: [programId], acquisitionCasePurpose: "first-time", requiredCapabilityCodes: [] }, baselineAsOfAt: stamp as never, baselineEvidenceSnapshotId: "evidence-1" as never, target: 0.5, deadline: stamp as never, ownerId: "team-1" as never, savedAt: stamp as never, changeReason: "Fixture", supersedesRevisionId: null, provenance: "synthetic-demo" }], workaroundExamples: [], processVersions: [], commandRecords: [],
  } as unknown as DemoSnapshotV2;
}

function context(market: "ALL" | "LAX" | "SFO"): WorkspaceQueryContext<typeof PROGRAMS_WORKSPACE> {
  const filters = { selectedMarket: market, marketBasis: "program-market-at-entry" as const, marketIds: market === "ALL" ? [] : [market], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: null };
  return { workspace: PROGRAMS_WORKSPACE, evaluation: { asOfAt: stamp as never, snapshotRevision: 3, reportingTimeZone: "America/Los_Angeles" as never }, filters };
}

describe("prepareProgramsView", () => {
  it("reconstructs pilot results from forty explicit participant histories and weighted market subsets", () => {
    const all = prepareProgramsView(fixture(), context("ALL"));
    const results = all.resultsByProgram.get(programId)!;
    expect(results.map((result) => [result.groupId, result.timelyFirstJobs, result.entrants])).toEqual([["earlier", 6, 20], ["pilot", 11, 20]]);
    expect(prepareProgramsView(fixture(), context("LAX")).resultsByProgram.get(programId)!.map((result) => [result.timelyFirstJobs, result.entrants])).toEqual([[3, 10], [6, 10]]);
    expect(prepareProgramsView(fixture(), context("SFO")).resultsByProgram.get(programId)!.map((result) => [result.timelyFirstJobs, result.entrants])).toEqual([[3, 10], [5, 10]]);
    expect(results[1]!.evidence.limitations.join(" ")).toMatch(/do not establish causality/i);
    expect(results[1]!.evidence.contributingRecords.some((record) => record.kind === "lifecycle-event")).toBe(true);
  });

  it("treats a zero-participant market as unavailable rather than a failed rate", () => {
    const view = prepareProgramsView(fixture(), context("LAX"));
    const altered = { ...view.appliedFilters, selectedMarket: "DFW" as const, marketIds: ["DFW" as const] };
    const zero = prepareProgramsView(fixture(), { ...context("LAX"), filters: altered });
    expect(zero.rows[0]!.result?.evidence.computation).toMatchObject({ status: "unavailable", reason: "No participants in this market." });
    expect(zero.resultsByProgram.get(programId)!.every((result) => result.label && result.entrants === 0)).toBe(true);
  });

  it("excludes immature members, including just-before-boundary members, and includes the exact follow-up boundary", () => {
    const snapshot = fixture();
    const first = snapshot.programEnrollments[0]!;
    const second = snapshot.programEnrollments[1]!;
    const near = { ...first, id: "observing-near" as never, reporterId: "observing-near" as never, enteredAt: "2026-01-01T00:00:00.001Z" as never };
    const exact = { ...second, id: "mature-exact" as never, reporterId: "mature-exact" as never, enteredAt: "2026-01-01T00:00:00.000Z" as never };
    const amended = { ...snapshot, programEnrollments: [...snapshot.programEnrollments, near, exact] };
    const baseContext = context("ALL");
    const view = prepareProgramsView(amended, { ...baseContext, evaluation: { ...baseContext.evaluation, asOfAt: "2026-01-15T00:00:00.000Z" as never } });
    const earlier = view.resultsByProgram.get(programId)!.find((item) => item.groupId === "earlier")!;
    expect(earlier.stillObservingEntrants).toBe(1);
    expect(earlier.matureEntrants).toBe(21);
    expect(earlier.evidence.limitations.join(" ")).toMatch(/still observing/i);
  });

  it("attributes exact source spend once, never treats missing spend as free, and preserves historic goal revisions", () => {
    const snapshot = fixture();
    const withSpend = { ...snapshot, sourceSpend: [{ id: "spend-1" as never, sourceId: "source-referral" as never, programId, cohortRef: "earlier", attributableWindow: null, amountMinor: 1200 as never, currency: "USD" as never, occurredAt: stamp as never, allocationNote: "Fixture", provenance: "synthetic-demo" as const }] } as DemoSnapshotV2;
    expect(calculateSourceContribution(withSpend, withSpend.programs[0]!, "earlier", context("ALL"))[0]).toMatchObject({ attributableSpendMinor: 1200, timelyFirstJobs: 6, spendPerFirstJobMinor: 200, status: "available" });
    expect(calculateSourceContribution(snapshot, snapshot.programs[0]!, "earlier", context("ALL"))[0]?.reason).toBe("Spend not recorded.");
    const noJobs = { ...withSpend, jobOutcomes: [] } as DemoSnapshotV2;
    expect(calculateSourceContribution(noJobs, noJobs.programs[0]!, "earlier", context("ALL"))[0]).toMatchObject({ attributableSpendMinor: 1200, timelyFirstJobs: 0, spendPerFirstJobMinor: null, status: "unavailable" });
    const revision2 = { ...snapshot.goalRevisions[0]!, id: "goal-revision-2" as never, version: 2, target: 0.7, supersedesRevisionId: snapshot.goalRevisions[0]!.id };
    const projection = projectGoalIntegrity({ ...snapshot, goalRevisions: [...snapshot.goalRevisions, revision2] }, "goal-1");
    expect(projection.revisions.map((revision) => [revision.version, revision.target, revision.metricVersion])).toEqual([[1, 0.5, "v1"], [2, 0.7, "v1"]]);
  });

  it("creates a versioned draft and requires review before a limited pilot without enrolling anyone", () => {
    const snapshot = fixture();
    const draft = buildProcessDraft(snapshot, { id: "process-1" as never, programId, trigger: "Missing checklist evidence", ownerId: "team-1" as never, requiredSteps: [], exceptions: [], evidenceSnapshotId: "evidence-1" as never, nextReviewAt: stamp as never, definitionVersion: "v1" as never, provenance: "synthetic-demo", actorId: "actor-1", occurredAt: stamp, rationale: "Draft only" });
    expect(draft.status).toBe("draft");
    expect(snapshot.programEnrollments).toHaveLength(40);
    const reviewed = advanceLimitedPilotProcess(draft, { status: "review-ready", actorId: "actor-1", occurredAt: stamp, rationale: "Review evidence" });
    expect(advanceLimitedPilotProcess(reviewed, { status: "approved-for-limited-pilot", actorId: "actor-1", occurredAt: stamp, rationale: "Limited pilot only" }).status).toBe("approved-for-limited-pilot");
    expect(() => advanceLimitedPilotProcess(draft, { status: "approved-for-limited-pilot", actorId: "actor-1", occurredAt: stamp, rationale: "Skip review" })).toThrow(/only move/);
  });
});
