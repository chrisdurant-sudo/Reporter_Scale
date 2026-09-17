import { describe, expect, it } from "vitest";
import type { DemandRequest, DemoSnapshotV2, Reporter, WorkspaceFilterPayload, WorkspaceQueryContext } from "../../contracts/v2";
import { validateEvidenceBundle } from "../shared";
import { prepareMarketsWorkspace } from "./index";

const asOf = "2026-02-10T12:00:00Z";
const utc = (value: string) => value as never;
const id = (value: string) => value as never;

function filters(requestIds: readonly string[] = []): WorkspaceFilterPayload {
  return {
    selectedMarket: "LAX", marketBasis: "demand-market", marketIds: [], reporterIds: [],
    acquisitionCaseIds: [], requestIds: requestIds.map(id), workItemIds: [], programIds: [],
    programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [],
    attendanceModes: [], recordRefs: [], window: null,
  };
}
function context(requestIds: readonly string[] = [], time = asOf): WorkspaceQueryContext<"markets"> {
  return { workspace: "markets", evaluation: { asOfAt: utc(time), snapshotRevision: 7, reportingTimeZone: "America/Los_Angeles" as never }, filters: filters(requestIds) };
}
function request(name: string, start: string, end: string, requirementsVersion = "sample-v1", capabilities = ["realtime"]): DemandRequest {
  return {
    id: id(name), marketId: "LAX", createdAt: utc("2026-02-01T00:00:00Z"), recordedAt: utc("2026-02-01T00:00:00Z"), startAt: utc(start), endAt: utc(end), timeZone: "America/Los_Angeles" as never,
    proceedingType: "deposition" as never, attendanceMode: "remote", requiredCapabilityCodes: capabilities.map(id), sampleCredentialRequirements: [], requirementsVersion, status: "open", canceledAt: null, cancellationReason: null, agreedDeliveryAt: null, provenance: "synthetic-demo",
  };
}
function reporter(name: string): Reporter {
  return {
    id: id(name), fictionalName: name, recruitingMarketId: "LAX", serviceMarketIds: ["LAX"], createdAt: utc("2026-02-01T00:00:00Z"), recordedAt: utc("2026-02-01T00:00:00Z"),
    preferences: { attendanceModes: ["remote"], supportedProceedingTypes: ["deposition" as never], supportedCapabilityCodes: [id("realtime")], serviceMarkets: [{ marketId: "LAX", status: "serves" }], notes: "Synthetic test record." }, provenance: "synthetic-demo",
  };
}
function base(): DemoSnapshotV2 {
  const requests = [
    request("req-confirmed", "2026-02-20T10:00:00Z", "2026-02-20T12:00:00Z"),
    request("req-possible-a", "2026-02-21T10:00:00Z", "2026-02-21T12:00:00Z"),
    request("req-possible-b", "2026-02-21T10:30:00Z", "2026-02-21T12:30:00Z"),
    request("req-none", "2026-02-22T10:00:00Z", "2026-02-22T12:00:00Z"),
    request("req-unknown", "2026-02-23T10:00:00Z", "2026-02-23T12:00:00Z", "", []),
  ];
  const people = [reporter("Ari Confirmed"), reporter("Bea Shared"), reporter("Cy Missing")];
  return {
    schemaVersion: 2, seedVersion: "test", revision: 7, baseAsOfAt: utc(asOf), currentAsOfAt: utc(asOf), appliedCommandIds: [], appliedScenarioEventIds: [],
    markets: [{ id: "LAX", code: "LAX", name: "Los Angeles", timeZone: "America/Los_Angeles" as never, provenance: "synthetic-demo" }],
    metricDefinitions: ["M01", "M02", "M03", "M04", "M05"].map((metric) => ({ id: id(metric), version: id("v1"), unit: metric === "M02" ? "ratio" : "requests", description: "Synthetic test metric", timeWindowSemantics: "test", populationRule: "test", attributionRule: "test" })),
    evidenceSnapshots: [], manualMarketNotes: [], reporters: people as never, acquisitionCases: [], lifecycleEvents: [], credentialRecords: [],
    capabilityVerifications: people.slice(0, 2).map((person) => ({ id: id("cap-" + String(person.id)), reporterId: person.id, capabilityCode: id("realtime"), status: "verified", recordedAt: utc("2026-02-02T00:00:00Z"), reviewerId: id("team-1"), evidenceRef: { kind: "reporter", id: String(person.id) }, provenance: "synthetic-demo" })),
    screeningReviews: [], onboardingSteps: [],
    readinessEvents: people.slice(0, 2).map((person) => ({ id: id("ready-" + String(person.id)), acquisitionCaseId: id("case-" + String(person.id)), reporterId: person.id, occurredAt: utc("2026-02-03T00:00:00Z"), recordedAt: utc("2026-02-03T00:00:00Z"), actorId: id("team-1"), checklistVersion: "test", checkedStepIds: [], capabilityVerificationIds: [id("cap-" + String(person.id))], provenance: "synthetic-demo" })),
    availabilityWindows: [
      { id: id("avail-a"), reporterId: id("Ari Confirmed"), startAt: utc("2026-02-20T10:00:00Z"), endAt: utc("2026-02-20T12:00:00Z"), status: "available", serviceMarketIds: ["LAX"], attendanceModes: ["remote"], recordedAt: utc("2026-02-03T00:00:00Z"), confirmationExpiresAt: utc("2026-03-01T00:00:00Z"), source: "synthetic-seed", actorId: id("team-1"), provenance: "synthetic-demo" },
      { id: id("avail-b"), reporterId: id("Bea Shared"), startAt: utc("2026-02-21T10:00:00Z"), endAt: utc("2026-02-21T12:30:00Z"), status: "available", serviceMarketIds: ["LAX"], attendanceModes: ["remote"], recordedAt: utc("2026-02-03T00:00:00Z"), confirmationExpiresAt: utc("2026-03-01T00:00:00Z"), source: "synthetic-seed", actorId: id("team-1"), provenance: "synthetic-demo" },
    ],
    demandRequests: requests as never,
    assignmentEvents: [{ id: id("assign-1"), requestId: id("req-confirmed"), reporterId: id("Ari Confirmed"), state: "accepted", occurredAt: utc("2026-02-04T00:00:00Z"), recordedAt: utc("2026-02-04T00:00:00Z"), actorId: id("team-1"), source: "synthetic-seed", reason: "Synthetic accepted assignment", provenance: "synthetic-demo" }],
    jobOutcomes: [], teamMembers: [], workItems: [], teamTargets: [], workQualityChecks: [], coachingActions: [], sources: [], sourceSpend: [], programs: [], programEnrollments: [], programNotes: [], programDecisions: [], goalRevisions: [], workaroundExamples: [], processVersions: [], commandRecords: [],
  } as DemoSnapshotV2;
}

describe("capacity markets calculations", () => {
  it("keeps the baseline growth goal absent until a revision is saved", () => {
    const view = prepareMarketsWorkspace(base(), context());

    expect(view.growthGoal).toBeNull();
  });

  it("derives an exclusive request partition and exposes shared-candidate contention", () => {
    const view = prepareMarketsWorkspace(base(), context());
    expect(view.coverage).toMatchObject({ requested: 5, confirmed: 1, possible: 2, noVerifiedReadyMatch: 1, requirementsUnknown: 1 });
    expect(view.requests.find((item) => String(item.request.id) === "req-possible-a")?.candidates.find((item) => item.reporterName === "Bea Shared")?.sharedRequestIds).toEqual([id("req-possible-a"), id("req-possible-b")]);
    for (const evidence of view.evidence) expect(validateEvidenceBundle(evidence)).toEqual([]);
  });

  it("does not treat an offered assignment as confirmed coverage", () => {
    const snapshot = base();
    const offered = snapshot.assignmentEvents.map((item) => ({ ...item, state: "offered" as const }));
    const view = prepareMarketsWorkspace({ ...snapshot, assignmentEvents: offered }, context());
    expect(view.coverage.confirmed).toBe(0);
    expect(view.requests.find((item) => String(item.request.id) === "req-confirmed")?.status).toBe("possible-match");
  });

  it("invalidates overlapping accepted commitments and changes the demand signal when verification is removed", () => {
    const snapshot = base();
    const overlapping = { ...snapshot.assignmentEvents[0]!, id: id("assign-2"), requestId: id("req-possible-a"), occurredAt: utc("2026-02-05T00:00:00Z"), recordedAt: utc("2026-02-05T00:00:00Z") };
    const conflictedRequests = snapshot.demandRequests.map((item) => String(item.id) === "req-possible-a" ? { ...item, startAt: utc("2026-02-20T11:00:00Z"), endAt: utc("2026-02-20T13:00:00Z") } : item);
    const conflicted = prepareMarketsWorkspace({ ...snapshot, demandRequests: conflictedRequests, assignmentEvents: [...snapshot.assignmentEvents, overlapping] }, context());
    expect(conflicted.coverage.confirmed).toBe(0);
    const noVerification = prepareMarketsWorkspace({ ...snapshot, capabilityVerifications: snapshot.capabilityVerifications.filter((item) => item.reporterId !== id("Bea Shared")) }, context());
    expect(noVerification.coverage.possible).toBe(0);
    expect(noVerification.coverage.noVerifiedReadyMatch).toBe(3);
  });

  it("uses an explicit frozen request set for completed original-plan and globally first-job results", () => {
    const snapshot = base();
    const outcome = { id: id("job-1"), requestId: id("req-confirmed"), reporterId: id("Ari Confirmed"), acceptedAssignmentEventId: id("assign-1"), outcome: "completed" as const, startedAt: utc("2026-02-20T10:00:00Z"), completedAt: utc("2026-02-20T12:00:00Z"), deliveryAt: null, recordedAt: utc("2026-02-20T12:00:00Z"), provenance: "demo-simulation" as const };
    const view = prepareMarketsWorkspace({ ...snapshot, jobOutcomes: [outcome] }, context(["req-confirmed"], "2026-02-25T00:00:00Z"));
    expect(view.originalPlan).toMatchObject({ status: "available", completedRequests: 1, firstJobs: 1 });
    expect(view.originalPlan.evidence.every((evidence) => validateEvidenceBundle(evidence).length === 0)).toBe(true);
  });

  it("rejects orphaned, mismatched, nonaccepted, and future assignment outcomes from frozen and global first-job results", () => {
    const snapshot = base();
    const valid = { id: id("job-valid"), requestId: id("req-confirmed"), reporterId: id("Ari Confirmed"), acceptedAssignmentEventId: id("assign-1"), outcome: "completed" as const, startedAt: utc("2026-02-20T10:00:00Z"), completedAt: utc("2026-02-20T12:00:00Z"), deliveryAt: null, recordedAt: utc("2026-02-20T12:00:00Z"), provenance: "demo-simulation" as const };
    const mismatch = { ...snapshot.assignmentEvents[0]!, id: id("assign-mismatch"), requestId: id("req-possible-a") };
    const offered = { ...snapshot.assignmentEvents[0]!, id: id("assign-offered"), state: "offered" as const };
    const future = { ...snapshot.assignmentEvents[0]!, id: id("assign-future"), occurredAt: utc("2026-02-26T00:00:00Z"), recordedAt: utc("2026-02-26T00:00:00Z") };
    const priorRequest = request("req-prior", "2026-02-18T10:00:00Z", "2026-02-18T12:00:00Z");
    const priorInvalid = { ...valid, id: id("job-prior-invalid"), requestId: priorRequest.id, acceptedAssignmentEventId: id("missing-prior"), completedAt: utc("2026-02-18T12:00:00Z"), recordedAt: utc("2026-02-18T12:00:00Z") };
    const invalid = [
      { ...valid, id: id("job-orphan"), acceptedAssignmentEventId: id("missing") },
      { ...valid, id: id("job-mismatch"), acceptedAssignmentEventId: mismatch.id },
      { ...valid, id: id("job-offered"), acceptedAssignmentEventId: offered.id },
      { ...valid, id: id("job-future"), acceptedAssignmentEventId: future.id },
      priorInvalid,
    ];
    const view = prepareMarketsWorkspace({ ...snapshot, demandRequests: [...snapshot.demandRequests, priorRequest], assignmentEvents: [...snapshot.assignmentEvents, mismatch, offered, future], jobOutcomes: [valid, ...invalid] }, context(["req-confirmed"], "2026-02-25T00:00:00Z"));
    expect(view.originalPlan).toMatchObject({ completedRequests: 1, firstJobs: 1 });
  });

  it("uses the latest known capability status and excludes a reporter whose latest lifecycle state is closed", () => {
    const snapshot = base();
    const needsInformation = { ...snapshot.capabilityVerifications.find((item) => String(item.reporterId) === "Bea Shared")!, id: id("cap-bea-later"), status: "needs-information" as const, recordedAt: utc("2026-02-09T00:00:00Z") };
    const capabilityChanged = prepareMarketsWorkspace({ ...snapshot, capabilityVerifications: [...snapshot.capabilityVerifications, needsInformation] }, context());
    expect(capabilityChanged.coverage).toMatchObject({ possible: 0, noVerifiedReadyMatch: 3 });
    const closed = { id: id("life-closed"), acquisitionCaseId: id("case-Ari Confirmed"), reporterId: id("Ari Confirmed"), eventType: "closed" as const, occurredAt: utc("2026-02-09T00:00:00Z"), recordedAt: utc("2026-02-09T00:00:00Z"), actorId: id("team-1"), reasonCode: "synthetic-closed", reasonText: "Synthetic closed status.", marketAtEntry: "LAX" as const, linkedWorkItemId: null, provenance: "synthetic-demo" as const };
    const closedView = prepareMarketsWorkspace({ ...snapshot, lifecycleEvents: [closed] }, context());
    expect(closedView.coverage.confirmed).toBe(0);
    expect(closedView.requests.find((item) => String(item.request.id) === "req-confirmed")).toMatchObject({ status: "no-verified-ready-match" });
  });

  it("derives readiness additions from the saved goal scope without letting a goal edit alter coverage", () => {
    const snapshot = base();
    const readiness = snapshot.readinessEvents.map((item) => String(item.reporterId) === "Bea Shared" ? { ...item, occurredAt: utc("2026-02-06T00:00:00Z"), recordedAt: utc("2026-02-06T00:00:00Z") } : item);
    const acquisition = { id: id("case-Bea Shared"), reporterId: id("Bea Shared"), ownerMarketId: "LAX" as const, primarySourceId: null, openedAt: utc("2026-02-01T00:00:00Z"), recordedAt: utc("2026-02-01T00:00:00Z"), purpose: "first-time" as const, originProgramId: null, provenance: "synthetic-demo" as const };
    const goal = { id: id("goal-rev-1"), goalId: id("goal-1"), version: 1, metric: { id: id("M04"), version: id("v1") }, scope: { marketIds: ["LAX"] as const, programIds: [], acquisitionCasePurpose: "first-time" as const, requiredCapabilityCodes: [id("realtime")] }, baselineAsOfAt: utc("2026-02-05T00:00:00Z"), baselineEvidenceSnapshotId: id("evidence-base"), target: 2, deadline: utc("2026-02-09T00:00:00Z"), ownerId: id("team-1"), savedAt: utc("2026-02-05T00:00:00Z"), changeReason: "Synthetic goal", supersedesRevisionId: null, provenance: "synthetic-demo" as const };
    const first = prepareMarketsWorkspace({ ...snapshot, readinessEvents: readiness, acquisitionCases: [acquisition], goalRevisions: [goal] }, context());
    const revised = prepareMarketsWorkspace({ ...snapshot, readinessEvents: readiness, acquisitionCases: [acquisition], goalRevisions: [{ ...goal, id: id("goal-rev-2"), version: 2, target: 9, supersedesRevisionId: goal.id }] }, context());
    expect(first.growthGoal).toMatchObject({ actual: 1, target: 2 });
    expect(revised.growthGoal).toMatchObject({ actual: 1, target: 9 });
    expect(revised.coverage).toEqual(first.coverage);
    expect(first.growthGoal && validateEvidenceBundle(first.growthGoal.evidence)).toEqual([]);
  });
});
