import { describe, expect, it } from "vitest";
import type { DemandRequest, DemoSnapshotV2, Reporter, WorkspaceFilterPayload, WorkspaceQueryContext } from "../../contracts/v2";
import { validateEvidenceBundle } from "../shared";
import { prepareMarketsWorkspace } from "./index";
import { prepareRecruitingWorkspace } from "../recruiting";
import { DEMO_SNAPSHOT_V2, V2_MAIN_REQUEST_WINDOW, applyScenarioCheckpoint } from "../../data/v2";

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

  it("prepares chronological source-backed supply, demand, and needed-supply points with an explicit forecast boundary", () => {
    const snapshot = base();
    const historicalRequest = request("req-history", "2026-02-06T10:00:00Z", "2026-02-08T12:00:00Z");
    const historicalAvailability = {
      ...snapshot.availabilityWindows[0]!, id: id("avail-history"), startAt: utc("2026-02-05T00:00:00Z"), endAt: utc("2026-02-08T12:00:00Z"),
    };
    const view = prepareMarketsWorkspace({
      ...snapshot,
      demandRequests: [...snapshot.demandRequests, historicalRequest],
      availabilityWindows: [...snapshot.availabilityWindows, historicalAvailability],
    }, context());
    const series = view.supplyDemandSeries!;
    const history = series.points.find((point) => point.at === utc("2026-02-06T10:00:00Z"));
    const forecast = series.points.find((point) => point.at === utc("2026-02-20T10:00:00Z"));
    const boundary = series.points.find((point) => point.at === utc(asOf));

    expect(history).toMatchObject({
      phase: "historical", isProjection: false, availableSupply: 1, demand: 1, neededSupply: 0,
      reporterIds: [id("Ari Confirmed")], demandRequestIds: [id("req-history")],
      readinessEventIds: [id("ready-Ari Confirmed")], availabilityWindowIds: [id("avail-history")],
    });
    expect(boundary).toMatchObject({ phase: "historical", isProjection: false });
    expect(forecast).toMatchObject({
      phase: "forecast", isProjection: true, availableSupply: 0, demand: 1, neededSupply: 1,
      demandRequestIds: [id("req-confirmed")],
    });
    expect(series).toMatchObject({ forecastBoundaryAt: utc(asOf), hasForecast: true });
    expect(series.points.map((point) => Date.parse(point.at))).toEqual([...series.points.map((point) => Date.parse(point.at))].sort((left, right) => left - right));
    expect(series.points.every((point) => point.isProjection === (Date.parse(point.at) > Date.parse(asOf)))).toBe(true);
  });

  it("prepares Overview KPIs from distinct as-of availability, open slots, and the maximum known future gap", () => {
    const snapshot = base();
    const dana = reporter("Dana Available");
    const danaReadiness = { ...snapshot.readinessEvents[0]!, id: id("ready-dana"), reporterId: dana.id, acquisitionCaseId: id("case-dana") };
    const danaAvailability = {
      ...snapshot.availabilityWindows[0]!, id: id("avail-dana"), reporterId: dana.id,
      startAt: utc("2026-02-10T11:00:00Z"), endAt: utc("2026-02-10T14:00:00Z"), confirmationExpiresAt: utc("2026-02-10T13:00:00Z"),
    };
    const availableView = prepareMarketsWorkspace({
      ...snapshot, reporters: [...snapshot.reporters, dana], readinessEvents: [...snapshot.readinessEvents, danaReadiness], availabilityWindows: [...snapshot.availabilityWindows, danaAvailability],
    }, context());
    const baselineOverview = prepareMarketsWorkspace(snapshot, context()).overview!;

    expect(availableView.overview!.kpis).toMatchObject({
      marketCount: { value: 1, source: { marketIds: ["LAX"] } },
      availableReporters: { value: 1, source: { reporterIds: [id("Dana Available")], readinessEventIds: [id("ready-dana")], availabilityWindowIds: [id("avail-dana")] } },
      openSlots: { value: 5, source: { requestIds: [id("req-confirmed"), id("req-none"), id("req-possible-a"), id("req-possible-b"), id("req-unknown")] } },
    });
    expect(availableView.coverage.confirmed).toBe(1);
    expect(baselineOverview.kpis.projectedAdditionalNeed).toMatchObject({ value: 1, forecastPointAt: utc("2026-02-20T10:00:00Z"), source: { requestIds: [id("req-confirmed")] } });
    expect(baselineOverview.kpis.projectedAdditionalNeed.rule).toContain("maximum neededSupply");
  });

  it("scopes the series to the selected demand market and is deterministic across source collection order", () => {
    const snapshot = base();
    const dana = { ...reporter("Dana DFW"), recruitingMarketId: "DFW" as never, serviceMarketIds: ["DFW"] as never, preferences: { ...reporter("Dana DFW").preferences, serviceMarkets: [{ marketId: "DFW", status: "serves" }] as never } };
    const dfwRequest = { ...request("req-dfw", "2026-02-20T10:00:00Z", "2026-02-20T12:00:00Z"), marketId: "DFW" as never };
    const dfwReadiness = { ...snapshot.readinessEvents[0]!, id: id("ready-dana"), reporterId: dana.id, acquisitionCaseId: id("case-dana") };
    const dfwAvailability = { ...snapshot.availabilityWindows[0]!, id: id("avail-dana"), reporterId: dana.id, serviceMarketIds: ["DFW"] as never };
    const expanded = {
      ...snapshot,
      markets: [...snapshot.markets, { id: "DFW", code: "DFW", name: "Dallas-Fort Worth", timeZone: "America/Chicago" as never, provenance: "synthetic-demo" as const }],
      reporters: [...snapshot.reporters, dana],
      readinessEvents: [...snapshot.readinessEvents, dfwReadiness],
      availabilityWindows: [...snapshot.availabilityWindows, dfwAvailability],
      demandRequests: [...snapshot.demandRequests, dfwRequest],
    } as DemoSnapshotV2;
    const dfwContext: WorkspaceQueryContext<"markets"> = { ...context(), filters: { ...filters(), selectedMarket: "DFW" as never } };
    const firstView = prepareMarketsWorkspace(expanded, dfwContext);
    const first = firstView.supplyDemandSeries!;
    const reversedView = prepareMarketsWorkspace({
      ...expanded,
      markets: [...expanded.markets].reverse(), reporters: [...expanded.reporters].reverse(), readinessEvents: [...expanded.readinessEvents].reverse(),
      availabilityWindows: [...expanded.availabilityWindows].reverse(), demandRequests: [...expanded.demandRequests].reverse(),
    }, dfwContext);
    const reversed = reversedView.supplyDemandSeries!;
    const dfwForecast = first.points.find((point) => point.at === utc("2026-02-20T10:00:00Z"));

    expect(dfwForecast).toMatchObject({ availableSupply: 1, demand: 1, neededSupply: 0, reporterIds: [id("Dana DFW")], demandRequestIds: [id("req-dfw")] });
    expect(first.points.every((point) => point.demandRequestIds.every((requestId) => requestId === id("req-dfw")))).toBe(true);
    expect(reversed).toEqual(first);
    expect(firstView.overview!.kpis).toMatchObject({ marketCount: { value: 1, source: { marketIds: ["DFW"] } }, openSlots: { value: 1, source: { requestIds: [id("req-dfw")] } } });
    expect(reversedView.overview!.attention).toEqual(firstView.overview!.attention);
    expect(firstView.marketRows.map((row) => row.marketId)).toEqual(["DFW"]);
    expect(prepareMarketsWorkspace(expanded, { ...dfwContext, filters: { ...dfwContext.filters, selectedMarket: "ALL" } }).marketRows.map((row) => row.marketId)).toEqual(["LAX", "DFW"]);
  });

  it("prepares deterministic attention and honest market direction states with contributing source IDs", () => {
    const snapshot = base();
    const view = prepareMarketsWorkspace(snapshot, context());
    const row = view.marketRows[0]!.overview!;
    const insufficient = prepareMarketsWorkspace({ ...snapshot, readinessEvents: [] }, context()).marketRows[0]!.overview!;
    const possible = prepareMarketsWorkspace({ ...snapshot, demandRequests: snapshot.demandRequests.filter((request) => String(request.id) !== "req-unknown") }, context()).overview!.attention.find((item) => item.id === "possible-match")!;
    const noVerified = view.overview!.attention.find((item) => item.id === "no-verified-ready-match")!;

    expect(view.overview!.attention.map((item) => item.id)).toEqual(["requirements-unknown", "no-verified-ready-match", "possible-match"]);
    expect(view.overview!.attention[0]!.source.requestIds).toEqual([id("req-unknown")]);
    expect(view.overview!.attention[1]!.source.requestIds).toEqual([id("req-none")]);
    expect(noVerified.source).toMatchObject({ readinessEventIds: [id("ready-Ari Confirmed"), id("ready-Bea Shared")], availabilityWindowIds: [id("avail-a"), id("avail-b")] });
    expect(possible.source).toMatchObject({ readinessEventIds: [id("ready-Bea Shared")], availabilityWindowIds: [id("avail-b")] });
    expect(row).toMatchObject({ gap: 0, supplyDirection: { state: "flat" }, demandDirection: { state: "flat" } });
    expect(row.supplyDirection.source).toMatchObject({ marketIds: ["LAX"], reporterIds: [], readinessEventIds: [], availabilityWindowIds: [] });
    expect(insufficient).toMatchObject({ supplyDirection: { state: "insufficient-history", comparedFromAt: null, comparedToAt: null }, demandDirection: { state: "insufficient-history", comparedFromAt: null, comparedToAt: null } });
  });

  it("does not count a known availability window as forecast supply after its confirmation expires", () => {
    const snapshot = base();
    const expiredBeforeForecast = {
      ...snapshot.availabilityWindows[1]!, confirmationExpiresAt: utc("2026-02-21T09:00:00Z"),
    };
    const series = prepareMarketsWorkspace({
      ...snapshot,
      availabilityWindows: [snapshot.availabilityWindows[0]!, expiredBeforeForecast],
    }, context()).supplyDemandSeries!;
    const forecast = series.points.find((point) => point.at === utc("2026-02-21T10:00:00Z"));

    expect(forecast).toMatchObject({ phase: "forecast", availableSupply: 0, demand: 1, neededSupply: 1, reporterIds: [], availabilityWindowIds: [] });
  });
});


describe("IC01 scheduling-window prepared facts", () => {
  const mainIds = Array.from({ length: 10 }, (_, index) => id(`req-lax-${101 + index}`));
  const mainContext = (snapshot: DemoSnapshotV2, selectedMarket: WorkspaceFilterPayload["selectedMarket"] = "LAX") => ({
    ...context(), evaluation: { ...context().evaluation, asOfAt: snapshot.currentAsOfAt, snapshotRevision: snapshot.revision },
    filters: { ...filters(), selectedMarket, window: V2_MAIN_REQUEST_WINDOW },
  });

  it("reconciles all five markets to the same explicit window under conjunctive filters", () => {
    const query = mainContext(DEMO_SNAPSHOT_V2, "ALL");
    for (const patch of [
      {}, { marketIds: ["LAX", "SFO"] as const }, { requestIds: mainIds.slice(0, 3) },
      { marketIds: ["LAX", "SFO"] as const, requestIds: mainIds, attendanceModes: ["remote"] as const,
        recordRefs: [{ kind: "demand-request" as const, id: String(mainIds[0]) }] },
      { selectedMarket: "DFW" as const, marketIds: ["LAX"] as const },
    ]) {
      const view = prepareMarketsWorkspace(DEMO_SNAPSHOT_V2, { ...query, filters: { ...query.filters, ...patch } });
      const schedule = view.schedule;
      expect(schedule.window).toEqual(V2_MAIN_REQUEST_WINDOW);
      expect(schedule.coverage.requested).toBe(schedule.coverage.confirmed + schedule.coverage.unresolved);
      expect(schedule.coverage.unresolved).toBe(schedule.coverage.possible + schedule.coverage.noVerifiedReadyMatch + schedule.coverage.requirementsUnknown);
      for (const field of ["requested", "confirmed", "unresolved", "possible", "noVerifiedReadyMatch", "requirementsUnknown"] as const) {
        expect(view.marketRows.reduce((total, row) => total + row.schedule!.coverage[field], 0), field).toBe(schedule.coverage[field]);
      }
      for (const row of view.marketRows) {
        expect(row.schedule!.window).toEqual(schedule.window);
        expect(row.schedule!.requestIds).toEqual(schedule.requestIds.filter((requestId) => DEMO_SNAPSHOT_V2.demandRequests.find((request) => request.id === requestId)!.marketId === row.marketId));
        expect(row.evidence.flatMap(validateEvidenceBundle)).toEqual([]);
      }
    }
  });

  it("uses half-open request starts, excludes canceled and elapsed work, and keeps future records hidden", () => {
    const snapshot = base();
    const window = { startAt: utc("2026-02-20T10:00:00Z"), endAt: utc("2026-02-21T10:00:00Z"), boundary: "[start,end)" as const };
    const changed = { ...snapshot, demandRequests: [...snapshot.demandRequests,
      { ...snapshot.demandRequests[0]!, id: id("canceled"), status: "canceled" as const, canceledAt: utc(asOf) },
      { ...snapshot.demandRequests[0]!, id: id("not-known-yet"), recordedAt: utc("2026-02-11T00:00:00Z") },
    ] };
    const query = { ...context(), filters: { ...filters(), window } };
    const before = prepareMarketsWorkspace(changed, query);
    expect(before.schedule.requestIds).toEqual([id("req-confirmed")]);
    expect(before.schedule.excludedCanceledRequestIds).toEqual([id("canceled")]);
    const after = prepareMarketsWorkspace(changed, { ...query, evaluation: { ...query.evaluation, asOfAt: utc("2026-02-21T11:00:00Z") } });
    expect(after.schedule.coverage.requested).toBe(0);
    expect(after.schedule.elapsedRequestIds).toEqual([id("not-known-yet"), id("req-confirmed")]);
  });

  it("separates five slots, two possible options and one shared candidate with overlap evidence", () => {
    const schedule = prepareMarketsWorkspace(base(), context()).schedule;
    expect(schedule.coverage).toMatchObject({ requested: 5, confirmed: 1, unresolved: 4, possible: 2, noVerifiedReadyMatch: 1, requirementsUnknown: 1 });
    expect(schedule.people).toMatchObject({ confirmed: 1, possibleCandidates: 1, possibleCandidateReporterIds: [id("Bea Shared")],
      sharedCandidates: [{ reporterId: id("Bea Shared"), requestIds: [id("req-possible-a"), id("req-possible-b")], overlappingRequestPairs: [[id("req-possible-a"), id("req-possible-b")]] }] });
    expect(schedule.possibleRequestIds).toHaveLength(2);
    expect(schedule.people.limitation).toContain("not guaranteed");
  });

  it("deduplicates nationwide candidate people and retains cross-market contention in each row", () => {
    const snapshot = base();
    const shared = { ...snapshot, markets: [...snapshot.markets, { ...snapshot.markets[0]!, id: "DFW" as const, code: "DFW" as const, name: "Dallas" }],
      demandRequests: [...snapshot.demandRequests, { ...snapshot.demandRequests[1]!, id: id("req-dfw-shared"), marketId: "DFW" as const }],
      reporters: snapshot.reporters.map((person) => String(person.id) === "Bea Shared" ? { ...person, serviceMarketIds: ["LAX", "DFW"] as const,
        preferences: { ...person.preferences, serviceMarkets: [{ marketId: "LAX" as const, status: "serves" as const }, { marketId: "DFW" as const, status: "serves" as const }] } } : person),
      availabilityWindows: snapshot.availabilityWindows.map((window) => String(window.reporterId) === "Bea Shared" ? { ...window, serviceMarketIds: ["LAX", "DFW"] as const } : window),
    };
    const view = prepareMarketsWorkspace(shared, { ...context(), filters: { ...filters(), selectedMarket: "ALL" } });
    expect(view.schedule.people.possibleCandidates).toBe(1);
    expect(view.schedule.coverage.possible).toBe(3);
    expect(view.schedule.people.sharedCandidates[0]!.overlappingRequestPairs).toHaveLength(3);
    for (const row of view.marketRows) expect(row.schedule!.people.sharedCandidates[0]!.requestIds).toHaveLength(3);
    expect(view.marketRows.reduce((total, row) => total + row.schedule!.coverage.requested, 0)).toBe(6);
  });

  it("opens exact category evidence and routes each ready or pre-ready person to the right workspace", () => {
    const snapshot: DemoSnapshotV2 = { ...base(), acquisitionCases: [{ id: id("case-cy"), reporterId: id("Cy Missing"), ownerMarketId: "LAX", primarySourceId: null,
      openedAt: utc("2026-02-01T00:00:00Z"), recordedAt: utc("2026-02-01T00:00:00Z"), purpose: "first-time", originProgramId: null, provenance: "synthetic-demo" }] };
    const view = prepareMarketsWorkspace(snapshot, context());
    for (const item of view.overview!.attention) {
      expect(item.evidence).not.toBeNull();
      expect(item.evidence!.contributingRecords.map((record) => record.id).sort()).toEqual([...item.source.requestIds].sort());
      expect(item.navigationTarget!.filters.requestIds).toEqual(item.evidence!.filters.requestIds);
      expect(item.navigationTarget!.filters.window).toEqual(view.schedule.window);
      const roundTrip = prepareMarketsWorkspace(snapshot, { ...context(), filters: item.navigationTarget!.filters });
      expect(roundTrip.schedule.requestIds).toEqual(item.source.requestIds);
      expect(roundTrip.marketRows[0]!.schedule!.requestIds).toEqual(item.source.requestIds);
      expect(validateEvidenceBundle(item.evidence!)).toEqual([]);
    }
    const possible = view.overview!.attention.find((item) => item.id === "possible-match")!;
    expect(possible.personTargets).toHaveLength(1);
    expect(possible.personTargets[0]).toMatchObject({ reporterId: "Bea Shared", target: { workspace: "reporters", intent: "record-detail", filters: { reporterIds: ["Bea Shared"], requestIds: [], recordRefs: [{ kind: "reporter", id: "Bea Shared" }] } } });
    const missing = view.overview!.attention.find((item) => item.id === "no-verified-ready-match")!;
    expect(missing.personTargets.find((item) => item.reporterId === id("Cy Missing"))).toMatchObject({ target: { workspace: "recruiting", filters: { reporterIds: ["Cy Missing"], recordRefs: [{ kind: "reporter", id: "Cy Missing" }, { kind: "acquisition-case", id: "case-cy" }] } } });
    expect(view.overview!.attention.find((item) => item.id === "requirements-unknown")!.personTargets).toEqual([]);
  });

  it("changes attention, window totals and market rows when requirements, verification or assignments change", () => {
    const snapshot = base();
    const baseline = prepareMarketsWorkspace(snapshot, context());
    const changed = prepareMarketsWorkspace({ ...snapshot,
      demandRequests: snapshot.demandRequests.map((request) => String(request.id) === "req-unknown" ? { ...request, requirementsVersion: "verified", requiredCapabilityCodes: [id("realtime")] } : request),
      capabilityVerifications: snapshot.capabilityVerifications.filter((item) => String(item.reporterId) !== "Bea Shared"),
      assignmentEvents: snapshot.assignmentEvents.map((event) => ({ ...event, state: "canceled" as const })),
    }, context());
    expect(changed.schedule.coverage).toMatchObject({ requested: 5, confirmed: 0, unresolved: 5, possible: 1, noVerifiedReadyMatch: 4, requirementsUnknown: 0 });
    expect(changed.overview!.attention.some((item) => item.id === "requirements-unknown")).toBe(false);
    expect(changed.marketRows[0]!.schedule!.coverage).toEqual(changed.schedule.coverage);
    expect(changed.overview!.focus.finding).not.toBe(baseline.overview!.focus.finding);
    expect(changed.schedule.people.possibleCandidateReporterIds).toEqual([id("Ari Confirmed")]);
  });

  it("retains LAX 10/6/4 anchors through planning, readiness, acceptance and completed-plan checkpoints", () => {
    const checkpoints = [
      ["baseline", 6, 2, 2, 0], ["plan-saved", 6, 2, 2, 0], ["existing-acceptances", 8, 0, 2, 0],
      ["two-new-ready", 8, 2, 0, 2], ["new-acceptances", 10, 0, 0, 2],
    ] as const;
    for (const [checkpoint, confirmed, possible, noMatch, growth] of checkpoints) {
      const snapshot = applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, checkpoint);
      const view = prepareMarketsWorkspace(snapshot, { ...mainContext(snapshot), filters: { ...mainContext(snapshot).filters, requestIds: mainIds } });
      expect(view.schedule.coverage).toMatchObject({ requested: 10, confirmed, unresolved: 10 - confirmed, possible, noVerifiedReadyMatch: noMatch });
      expect(view.growthGoal?.actual ?? 0).toBe(growth);
      if (view.growthGoal) {
        expect(view.growthGoal).toMatchObject({ target: 2, deadline: "2026-02-23T17:00:00Z", marketIds: ["LAX"], unit: "people" });
        expect(view.growthGoal.evidence.navigationTarget.filters.reporterIds).toHaveLength(growth);
      }
      expect(view.evidence.flatMap(validateEvidenceBundle)).toEqual([]);
    }
    const completed = applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, "original-plan-delivered");
    const view = prepareMarketsWorkspace(completed, { ...mainContext(completed), filters: { ...mainContext(completed).filters, requestIds: mainIds } });
    expect(view.schedule.coverage).toMatchObject({ requested: 0, confirmed: 0, unresolved: 0 });
    expect(view.schedule.elapsedRequestIds).toHaveLength(10);
    expect(view.originalPlan).toMatchObject({ completedRequests: 10, firstJobs: 2 });
    expect(view.growthGoal!.actual).toBe(2);
  });

  it("preserves a saved goal scope in All and market views, and does not let target edits or unavailability erase readiness", () => {
    const snapshot = applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, "two-new-ready");
    const all = prepareMarketsWorkspace(snapshot, mainContext(snapshot, "ALL"));
    const lax = prepareMarketsWorkspace(snapshot, mainContext(snapshot));
    expect(all.growthGoal).toEqual(lax.growthGoal);
    expect(all.marketRows.find((row) => row.marketId === "DFW")!.growthGoal).toBeNull();
    const changed = { ...snapshot, goalRevisions: snapshot.goalRevisions.map((goal) => goal.metric.id === "M04" ? { ...goal, target: 9 } : goal),
      availabilityWindows: snapshot.availabilityWindows.map((window) => window.reporterId === "person-lax-009" ? { ...window, status: "unavailable" as const } : window) };
    const result = prepareMarketsWorkspace(changed, mainContext(changed));
    expect(result.growthGoal).toMatchObject({ actual: 2, target: 9 });
    expect(result.schedule.coverage.possible).toBeLessThan(lax.schedule.coverage.possible);
  });

  it("counts one accepted person once across two non-overlapping covered slots", () => {
    const snapshot = base();
    const extraRequest = { ...snapshot.demandRequests[0]!, id: id("second-covered-slot"), startAt: utc("2026-02-20T13:00:00Z"), endAt: utc("2026-02-20T14:00:00Z") };
    const expanded = { ...snapshot, demandRequests: [...snapshot.demandRequests, extraRequest],
      availabilityWindows: [...snapshot.availabilityWindows, { ...snapshot.availabilityWindows[0]!, id: id("second-availability"), startAt: extraRequest.startAt, endAt: extraRequest.endAt }],
      assignmentEvents: [...snapshot.assignmentEvents, { ...snapshot.assignmentEvents[0]!, id: id("second-acceptance"), requestId: extraRequest.id }],
    };
    const view = prepareMarketsWorkspace(expanded, context());
    expect(view.schedule.coverage.confirmed).toBe(2);
    expect(view.schedule.people.confirmed).toBe(1);
    expect(view.schedule.people.confirmedReporterIds).toEqual([id("Ari Confirmed")]);
  });

  it("does not project later acceptances backward into historical instant availability", () => {
    const snapshot = base();
    const historical = request("historical-slot", "2026-02-06T10:00:00Z", "2026-02-08T12:00:00Z");
    const view = prepareMarketsWorkspace({ ...snapshot, demandRequests: [...snapshot.demandRequests, historical],
      assignmentEvents: [...snapshot.assignmentEvents, { ...snapshot.assignmentEvents[0]!, id: id("late-recorded-acceptance"), requestId: historical.id, occurredAt: utc("2026-02-07T10:00:00Z"), recordedAt: utc("2026-02-07T10:00:00Z") }],
      availabilityWindows: [...snapshot.availabilityWindows, { ...snapshot.availabilityWindows[0]!, id: id("historical-availability"), startAt: historical.startAt, endAt: historical.endAt }],
    }, context());
    expect(view.supplyDemandSeries!.points.find((point) => point.at === historical.startAt)!.reporterIds).toContain(id("Ari Confirmed"));
  });

  it("keeps instant trends separate and does not invent a prior weekly comparison", () => {
    const view = prepareMarketsWorkspace(base(), context());
    expect(view.schedule.previousPeriod.status).toBe("unavailable");
    expect(view.schedule.previousPeriod.reason).toContain("comparable");
    expect(view.supplyDemandSeries!.limitations.join(" ")).toContain("instants, not scheduling-window totals");
    expect(view.overview!.focus.finding).toBe("1 of 5 scheduling-window slots confirmed; 4 unresolved.");
    const empty = prepareMarketsWorkspace({ ...base(), demandRequests: [] }, context());
    expect(empty.schedule.windowSource).toBe("no-known-upcoming-work");
    expect(empty.schedule.coverage).toMatchObject({ requested: 0, confirmed: 0, unresolved: 0, confirmedRate: null });
    expect(empty.evidence.flatMap(validateEvidenceBundle)).toEqual([]);
  });
});


describe("IC01 coordinator review repairs", () => {
  it("keeps all Capacity evidence units equal to frozen definitions and uses the M02 numerator for confirmed slots", () => {
    for (const checkpoint of ["baseline", "plan-saved", "two-new-ready", "original-plan-delivered"]) {
      const snapshot = applyScenarioCheckpoint(DEMO_SNAPSHOT_V2, checkpoint);
      const query = { ...context(), evaluation: { ...context().evaluation, asOfAt: snapshot.currentAsOfAt, snapshotRevision: snapshot.revision },
        filters: { ...filters(), selectedMarket: "ALL" as const, window: V2_MAIN_REQUEST_WINDOW } };
      const view = prepareMarketsWorkspace(snapshot, query);
      for (const bundle of [...view.evidence, ...view.marketRows.flatMap((row) => row.evidence)]) {
        const definition = snapshot.metricDefinitions.find((metric) => metric.id === bundle.metric.id && metric.version === bundle.metric.version)!;
        expect(bundle.unit, String(bundle.id)).toBe(definition.unit);
      }
      for (const schedule of [view.schedule, ...view.marketRows.map((row) => row.schedule!)]) {
        const bundle = schedule.confirmedCoverageEvidence;
        if (!schedule.coverage.requested) {
          expect(bundle).toBeNull();
          continue;
        }
        expect(bundle).toBe(schedule.evidence.find((item) => item.metric.id === "M02"));
        expect(bundle!.unit).toBe("ratio");
        expect(bundle!.computation).toMatchObject({ value: schedule.coverage.confirmedRate, numerator: schedule.coverage.confirmed, denominator: schedule.coverage.requested });
        expect(bundle!.numeratorMembers.map((member) => member.id).sort()).toEqual([...schedule.confirmedRequestIds].sort());
      }
    }
  });

  it("roundtrips a pre-ready LAX service candidate to the canonical SFO acquisition case", () => {
    const snapshot = base();
    const acquisition = { id: id("case-cy-sfo"), reporterId: id("Cy Missing"), ownerMarketId: "SFO" as const, primarySourceId: null,
      openedAt: utc("2026-02-01T00:00:00Z"), recordedAt: utc("2026-02-01T00:00:00Z"), purpose: "first-time" as const, originProgramId: null, provenance: "synthetic-demo" as const };
    const changed: DemoSnapshotV2 = { ...snapshot,
      acquisitionCases: [acquisition, { ...acquisition, id: id("case-ari-lax"), reporterId: id("Ari Confirmed"), ownerMarketId: "LAX" }],
      reporters: snapshot.reporters.map((person) => person.id === acquisition.reporterId ? { ...person, recruitingMarketId: "SFO" } : person),
    };
    const query = { ...context(), filters: { ...filters(["req-none"]), marketIds: ["LAX"] as const, capabilityCodes: [id("realtime")], attendanceModes: ["remote"] as const } };
    const view = prepareMarketsWorkspace(changed, query);
    const target = view.overview!.attention.find((item) => item.id === "no-verified-ready-match")!.personTargets.find((item) => item.reporterId === acquisition.reporterId)!.target;
    expect(target).toMatchObject({ workspace: "recruiting", filters: {
      selectedMarket: "SFO", marketIds: ["SFO"], marketBasis: "recruiting-market-at-entry", reporterIds: [acquisition.reporterId], acquisitionCaseIds: [acquisition.id],
      requestIds: [], capabilityCodes: [], attendanceModes: [], window: null,
    } });
    const roundtrip = prepareRecruitingWorkspace(changed, { workspace: "recruiting", evaluation: query.evaluation, filters: target.filters });
    expect(roundtrip.currentCases.map((item) => item.acquisitionCaseId)).toEqual([acquisition.id]);
    expect(roundtrip.currentCases[0]!.reporterId).toBe(acquisition.reporterId);
    const missingCase = prepareMarketsWorkspace(snapshot, query).overview!.attention.find((item) => item.id === "no-verified-ready-match")!;
    expect(missingCase.personTargets.some((item) => item.reporterId === acquisition.reporterId)).toBe(false);
  });
});
