import type {
  AcquisitionCase,
  AssignmentEvent,
  AvailabilityWindow,
  CapabilityVerification,
  CoachingAction,
  DateWindow,
  DemoRepositoryV2,
  DemoSnapshotV2,
  EvidenceBundle,
  GoalRevision,
  IanaTimeZone,
  JobOutcome,
  LifecycleEvent,
  Market,
  MetricDefinition,
  OnboardingStep,
  ProcessVersion,
  Program,
  ProgramDecision,
  ProgramEnrollment,
  Reporter,
  RepositoryResult,
  ScenarioAppendRecord,
  ScenarioCheckpointContract,
  ScenarioContractV2,
  ScenarioFeedEvent,
  ScreeningReview,
  Source,
  SourceSpend,
  TeamMember,
  TeamTarget,
  UtcTimestamp,
  WorkItem,
  WorkQualityCheck,
  WorkaroundExample,
  WorkspaceFilterPayload,
} from "../contracts/v2";

const asId = (value: string) => value as never;
const utc = (value: string) => value as UtcTimestamp;
const zone = (value: string) => value as IanaTimeZone;
const provenance = "synthetic-demo" as const;
const simulated = "demo-simulation" as const;
const BASE_AS_OF = utc("2026-02-16T17:00:00Z");
export const V2_MAIN_REQUEST_WINDOW: DateWindow = {
  startAt: utc("2026-02-23T08:00:00Z"),
  endAt: utc("2026-03-02T08:00:00Z"),
  boundary: "[start,end)",
};

const markets: Market[] = [
  { id: "LAX", code: "LAX", name: "Los Angeles", timeZone: zone("America/Los_Angeles"), provenance },
  { id: "SFO", code: "SFO", name: "San Francisco", timeZone: zone("America/Los_Angeles"), provenance },
  { id: "DFW", code: "DFW", name: "Dallas–Fort Worth", timeZone: zone("America/Chicago"), provenance },
  { id: "ORD", code: "ORD", name: "Chicago", timeZone: zone("America/Chicago"), provenance },
  { id: "ATL", code: "ATL", name: "Atlanta", timeZone: zone("America/New_York"), provenance },
];

const metricUnits = [
  "requests", "ratio", "requests", "people", "jobs", "people", "ratio",
  "ratio", "currency-minor", "people", "tasks", "ratio", "events",
] as const;
const metricDefinitions: MetricDefinition[] = metricUnits.map((unit, index) => ({
  id: asId(`M${String(index + 1).padStart(2, "0")}`),
  version: asId("v2-frozen-1"),
  unit,
  description: `Frozen Reporter Growth V2 metric M${String(index + 1).padStart(2, "0")}.`,
  timeWindowSemantics: "Uses the explicit as-of time and the metric's declared half-open window.",
  populationRule: "Derived from distinct canonical source records in the selected scope.",
  attributionRule: "Uses the frozen market, cohort, assignment, and evidence relationships.",
}));

const teamMembers: TeamMember[] = [
  { id: asId("team-1"), actorId: asId("actor-team-1"), fictionalName: "Maya Chen", focusRole: "Recruiting operations", activeFrom: utc("2025-12-01T17:00:00Z"), activeTo: null, provenance },
  { id: asId("team-2"), actorId: asId("actor-team-2"), fictionalName: "Eli Brooks", focusRole: "Program operations", activeFrom: utc("2025-12-01T17:00:00Z"), activeTo: null, provenance },
  { id: asId("team-3"), actorId: asId("actor-team-3"), fictionalName: "Sam Rivera", focusRole: "Network operations", activeFrom: utc("2025-12-01T17:00:00Z"), activeTo: null, provenance },
];

const sources: Source[] = [
  { id: asId("source-targeted-referrals"), label: "Targeted referrals", kind: "referral", description: "Fictional direct referrals for a declared capability need.", provenance },
  { id: asId("source-dfw-broad-outreach"), label: "DFW broad outreach", kind: "outreach", description: "Fictional broad outreach cohort retained with its weak relevant qualification evidence.", provenance },
  { id: asId("source-community-event"), label: "Community event", kind: "event", description: "Fictional community event source used by supporting-market histories.", provenance },
];

const reporters: Reporter[] = [];
const acquisitionCases: AcquisitionCase[] = [];
const lifecycleEvents: LifecycleEvent[] = [];
const capabilityVerifications: CapabilityVerification[] = [];
const screeningReviews: ScreeningReview[] = [];
const onboardingSteps: OnboardingStep[] = [];
const readinessEvents: DemoSnapshotV2["readinessEvents"][number][] = [];
const availabilityWindows: AvailabilityWindow[] = [];
const demandRequests: DemoSnapshotV2["demandRequests"][number][] = [];
const assignmentEvents: AssignmentEvent[] = [];
const jobOutcomes: JobOutcome[] = [];
const programEnrollments: ProgramEnrollment[] = [];

function addReporter(input: {
  id: string;
  name: string;
  market: Market["id"];
  createdAt: string;
  recordedAt?: string;
  capabilities?: readonly string[];
  attendanceModes?: Reporter["preferences"]["attendanceModes"];
  proceedingTypes?: readonly string[];
  serviceMarkets?: readonly Market["id"][];
  sourceId?: string | null;
  originProgramId?: string | null;
}): Reporter {
  const serviceMarkets = input.serviceMarkets ?? [input.market];
  const reporter: Reporter = {
    id: asId(input.id),
    fictionalName: input.name,
    recruitingMarketId: input.market,
    serviceMarketIds: serviceMarkets,
    createdAt: utc(input.createdAt),
    recordedAt: utc(input.recordedAt ?? input.createdAt),
    preferences: {
      attendanceModes: input.attendanceModes ?? ["remote"],
      supportedProceedingTypes: (input.proceedingTypes ?? ["deposition"]).map(asId),
      supportedCapabilityCodes: (input.capabilities ?? []).map(asId),
      serviceMarkets: serviceMarkets.map((marketId) => ({ marketId, status: "serves" as const })),
      notes: "Fictional preferences recorded for the independent synthetic demo.",
    },
    provenance,
  };
  reporters.push(reporter);
  acquisitionCases.push({
    id: asId(`case-${input.id.replace(/^person-/, "")}`),
    reporterId: reporter.id,
    ownerMarketId: input.market,
    primarySourceId: input.sourceId === undefined || input.sourceId === null ? null : asId(input.sourceId),
    openedAt: utc(input.createdAt),
    recordedAt: utc(input.recordedAt ?? input.createdAt),
    purpose: "first-time",
    originProgramId: input.originProgramId ? asId(input.originProgramId) : null,
    provenance,
  });
  return reporter;
}

function addLifecycle(reporterId: string, market: Market["id"], eventType: LifecycleEvent["eventType"], occurredAt: string, suffix = eventType): LifecycleEvent {
  const event: LifecycleEvent = {
    id: asId(`life-${reporterId}-${suffix}`),
    acquisitionCaseId: asId(`case-${reporterId.replace(/^person-/, "")}`),
    reporterId: asId(reporterId),
    eventType,
    occurredAt: utc(occurredAt),
    recordedAt: utc(occurredAt),
    actorId: asId("actor-team-1"),
    reasonCode: `synthetic-${eventType}`,
    reasonText: `Fictional ${eventType.replaceAll("-", " ")} history.`,
    marketAtEntry: market,
    linkedWorkItemId: null,
    provenance,
  };
  lifecycleEvents.push(event);
  return event;
}

function addVerifiedCapability(reporterId: string, capability: string, recordedAt: string, suffix = capability): CapabilityVerification {
  const record: CapabilityVerification = {
    id: asId(`cap-${reporterId}-${suffix}`),
    reporterId: asId(reporterId),
    capabilityCode: asId(capability),
    status: "verified",
    recordedAt: utc(recordedAt),
    reviewerId: asId("team-3"),
    evidenceRef: { kind: "reporter", id: reporterId },
    provenance,
  };
  capabilityVerifications.push(record);
  return record;
}

function addCompletedOnboardingStep(reporterId: string, completedAt: string, suffix = "requirements"): OnboardingStep {
  const step: OnboardingStep = {
    id: asId(`step-${reporterId}-${suffix}`),
    acquisitionCaseId: asId(`case-${reporterId.replace(/^person-/, "")}`),
    stepDefinitionId: suffix,
    required: true,
    state: "completed",
    assignedTo: asId("team-1"),
    dueAt: utc(completedAt),
    completedAt: utc(completedAt),
    completedBy: asId("team-1"),
    evidenceRef: { kind: "reporter", id: reporterId },
    blockerCode: null,
    recordedAt: utc(completedAt),
    provenance,
  };
  onboardingSteps.push(step);
  return step;
}

function addReadiness(reporterId: string, occurredAt: string, capabilityId: string, stepId: string): DemoSnapshotV2["readinessEvents"][number] {
  const record: DemoSnapshotV2["readinessEvents"][number] = {
    id: asId(`ready-${reporterId}`),
    acquisitionCaseId: asId(`case-${reporterId.replace(/^person-/, "")}`),
    reporterId: asId(reporterId),
    occurredAt: utc(occurredAt),
    recordedAt: utc(occurredAt),
    actorId: asId("actor-team-1"),
    checklistVersion: "sample-readiness-v1",
    checkedStepIds: [asId(stepId)],
    capabilityVerificationIds: [asId(capabilityId)],
    provenance,
  };
  readinessEvents.push(record);
  return record;
}

const mainRequestTimes = [
  ["2026-02-23T18:00:00Z", "2026-02-23T21:00:00Z"],
  ["2026-02-23T22:00:00Z", "2026-02-24T01:00:00Z"],
  ["2026-02-24T18:00:00Z", "2026-02-24T21:00:00Z"],
  ["2026-02-24T22:00:00Z", "2026-02-25T01:00:00Z"],
  ["2026-02-25T18:00:00Z", "2026-02-25T21:00:00Z"],
  ["2026-02-25T22:00:00Z", "2026-02-26T01:00:00Z"],
  ["2026-02-26T18:00:00Z", "2026-02-26T21:00:00Z"],
  ["2026-02-26T22:00:00Z", "2026-02-27T01:00:00Z"],
  ["2026-02-27T18:00:00Z", "2026-02-27T21:00:00Z"],
  ["2026-02-27T22:00:00Z", "2026-02-28T01:00:00Z"],
] as const;

for (let number = 1; number <= 10; number += 1) {
  const suffix = String(number).padStart(3, "0");
  const requestNumber = 100 + number;
  const reporterId = `person-lax-${suffix}`;
  const isAvery = number === 9;
  const name = isAvery ? "Avery Cole" : `Fictional LAX Reporter ${suffix}`;
  if (number <= 9) {
    addReporter({
      id: reporterId,
      name,
      market: "LAX",
      createdAt: number === 9 ? "2026-02-01T17:00:00Z" : "2025-12-15T17:00:00Z",
      capabilities: ["realtime-transcription"],
    });
  }
  const [startAt, endAt] = mainRequestTimes[number - 1]!;
  demandRequests.push({
    id: asId(`req-lax-${requestNumber}`),
    marketId: "LAX",
    createdAt: utc("2026-02-12T17:00:00Z"),
    recordedAt: utc("2026-02-12T17:00:00Z"),
    startAt: utc(startAt),
    endAt: utc(endAt),
    timeZone: zone("America/Los_Angeles"),
    proceedingType: asId("deposition"),
    attendanceMode: "remote",
    requiredCapabilityCodes: [asId("realtime-transcription")],
    sampleCredentialRequirements: [],
    requirementsVersion: "sample-realtime-policy-v1",
    status: "open",
    canceledAt: null,
    cancellationReason: null,
    agreedDeliveryAt: utc(endAt),
    provenance,
  });
  if (number <= 8) {
    addLifecycle(reporterId, "LAX", "sourced", `2025-12-${String(10 + number).padStart(2, "0")}T17:00:00Z`);
    addLifecycle(reporterId, "LAX", "contacted", `2025-12-${String(11 + number).padStart(2, "0")}T17:00:00Z`);
    addLifecycle(reporterId, "LAX", "responded", `2025-12-${String(12 + number).padStart(2, "0")}T17:00:00Z`);
    addLifecycle(reporterId, "LAX", "screening-started", `2025-12-${String(13 + number).padStart(2, "0")}T17:00:00Z`);
    addLifecycle(reporterId, "LAX", "qualified", `2025-12-${String(14 + number).padStart(2, "0")}T17:00:00Z`);
    addLifecycle(reporterId, "LAX", "onboarding-started", `2025-12-${String(15 + number).padStart(2, "0")}T17:00:00Z`);
    addLifecycle(reporterId, "LAX", "ready", `2026-01-${String(number).padStart(2, "0")}T17:00:00Z`);
    const capability = addVerifiedCapability(reporterId, "realtime-transcription", `2025-12-${String(20 + number).padStart(2, "0")}T17:00:00Z`);
    const step = addCompletedOnboardingStep(reporterId, `2025-12-${String(22 + number).padStart(2, "0")}T17:00:00Z`);
    addReadiness(reporterId, `2026-01-${String(number).padStart(2, "0")}T17:00:00Z`, capability.id, step.id);
    const historyDay = String(number + 1).padStart(2, "0");
    const historyRequestId = `req-lax-history-${suffix}`;
    const historyAssignmentId = `assignment-${historyRequestId}`;
    demandRequests.push({
      id: asId(historyRequestId), marketId: "LAX", createdAt: utc("2025-12-30T17:00:00Z"), recordedAt: utc("2025-12-30T17:00:00Z"),
      startAt: utc(`2026-01-${historyDay}T18:00:00Z`), endAt: utc(`2026-01-${historyDay}T21:00:00Z`), timeZone: zone("America/Los_Angeles"),
      proceedingType: asId("deposition"), attendanceMode: "remote", requiredCapabilityCodes: [asId("realtime-transcription")], sampleCredentialRequirements: [],
      requirementsVersion: "sample-realtime-policy-v1", status: "concluded", canceledAt: null, cancellationReason: null, agreedDeliveryAt: utc(`2026-01-${historyDay}T21:00:00Z`), provenance,
    });
    availabilityWindows.push({ id: asId(`availability-${reporterId}-history`), reporterId: asId(reporterId), startAt: utc(`2026-01-${historyDay}T18:00:00Z`), endAt: utc(`2026-01-${historyDay}T21:00:00Z`), status: "available", serviceMarketIds: ["LAX"], attendanceModes: ["remote"], recordedAt: utc("2025-12-30T17:00:00Z"), confirmationExpiresAt: utc("2026-02-01T00:00:00Z"), source: "synthetic-seed", actorId: asId("actor-team-3"), provenance });
    assignmentEvents.push({ id: asId(historyAssignmentId), requestId: asId(historyRequestId), reporterId: asId(reporterId), state: "accepted", occurredAt: utc(`2026-01-${String(number).padStart(2, "0")}T18:00:00Z`), recordedAt: utc(`2026-01-${String(number).padStart(2, "0")}T18:00:00Z`), actorId: asId("actor-team-3"), source: "synthetic-seed", reason: "Fictional prior accepted work establishes an existing reporter history.", provenance });
    jobOutcomes.push({ id: asId(`job-lax-history-${suffix}`), requestId: asId(historyRequestId), reporterId: asId(reporterId), acceptedAssignmentEventId: asId(historyAssignmentId), outcome: "completed", startedAt: utc(`2026-01-${historyDay}T18:00:00Z`), completedAt: utc(`2026-01-${historyDay}T21:00:00Z`), deliveryAt: utc(`2026-01-${historyDay}T21:00:00Z`), recordedAt: utc(`2026-01-${historyDay}T21:00:00Z`), provenance });
    availabilityWindows.push({
      id: asId(`availability-${reporterId}-main`),
      reporterId: asId(reporterId),
      startAt: utc(startAt),
      endAt: utc(endAt),
      status: "available",
      serviceMarketIds: ["LAX"],
      attendanceModes: ["remote"],
      recordedAt: utc("2026-02-12T16:00:00Z"),
      confirmationExpiresAt: utc("2026-03-02T08:00:00Z"),
      source: "reporter-confirmed",
      actorId: asId("actor-team-3"),
      provenance,
    });
    if (number <= 6) {
      assignmentEvents.push({
        id: asId(`assignment-req-lax-${requestNumber}`),
        requestId: asId(`req-lax-${requestNumber}`),
        reporterId: asId(reporterId),
        state: "accepted",
        occurredAt: utc("2026-02-13T17:00:00Z"),
        recordedAt: utc("2026-02-13T17:05:00Z"),
        actorId: asId("actor-team-3"),
        source: "synthetic-seed",
        reason: "Fictional accepted assignment known before the baseline.",
        provenance,
      });
    }
  }
}

addLifecycle("person-lax-009", "LAX", "sourced", "2026-02-01T17:00:00Z");
addLifecycle("person-lax-009", "LAX", "contacted", "2026-02-02T17:00:00Z");
addLifecycle("person-lax-009", "LAX", "responded", "2026-02-04T17:00:00Z");
addLifecycle("person-lax-009", "LAX", "screening-started", "2026-02-05T17:00:00Z");
addLifecycle("person-lax-009", "LAX", "qualified", "2026-02-08T17:00:00Z");
addLifecycle("person-lax-009", "LAX", "onboarding-started", "2026-02-10T17:00:00Z");
screeningReviews.push({
  id: asId("screening-lax-009-baseline"), reporterId: asId("person-lax-009"), acquisitionCaseId: asId("case-lax-009"),
  checks: [{ checkCode: "sample-realtime-verification", required: true, status: "needs-information", evidenceRef: null, note: "Required fictional capability evidence is not yet recorded." }],
  outcome: "needs-information", unresolvedInformation: ["sample-realtime-verification"], reviewerId: asId("team-1"),
  reviewedAt: utc("2026-02-10T18:00:00Z"), recordedAt: utc("2026-02-10T18:00:00Z"), reason: "Awaiting the defined sample evidence.", provenance,
});
onboardingSteps.push({
  id: asId("step-person-lax-009-realtime"), acquisitionCaseId: asId("case-lax-009"), stepDefinitionId: "sample-realtime-verification", required: true,
  state: "blocked", assignedTo: asId("team-1"), dueAt: utc("2026-02-19T17:00:00Z"), completedAt: null, completedBy: null, evidenceRef: null,
  blockerCode: "missing-capability-evidence", recordedAt: utc("2026-02-10T18:00:00Z"), provenance,
});
availabilityWindows.push({
  id: asId("availability-person-lax-009-main"), reporterId: asId("person-lax-009"), startAt: utc(mainRequestTimes[8][0]), endAt: utc(mainRequestTimes[8][1]),
  status: "available", serviceMarketIds: ["LAX"], attendanceModes: ["remote"], recordedAt: utc("2026-02-15T17:00:00Z"),
  confirmationExpiresAt: utc("2026-03-02T08:00:00Z"), source: "reporter-confirmed", actorId: asId("actor-team-3"), provenance,
});

const checklistProgramId = asId("program-readiness-checklist");
for (const group of ["earlier", "pilot"] as const) {
  for (const market of ["LAX", "SFO"] as const) {
    for (let member = 1; member <= 10; member += 1) {
      const suffix = String(member).padStart(2, "0");
      const reporterId = `person-checklist-${group}-${market.toLowerCase()}-${suffix}`;
      const enteredDay = group === "earlier" ? 5 + ((member - 1) % 5) : 19 + ((member - 1) % 5);
      const enteredAt = `2026-01-${String(enteredDay).padStart(2, "0")}T17:00:00Z`;
      const timely = group === "earlier" ? member <= 3 : market === "LAX" ? member <= 6 : member <= 5;
      addReporter({ id: reporterId, name: `Fictional ${group} ${market} ${suffix}`, market, createdAt: "2025-12-20T17:00:00Z", capabilities: ["standard-transcription"], originProgramId: checklistProgramId });
      addLifecycle(reporterId, market, "sourced", "2025-12-20T17:00:00Z");
      addLifecycle(reporterId, market, "contacted", "2025-12-21T17:00:00Z");
      addLifecycle(reporterId, market, "responded", "2025-12-22T17:00:00Z");
      addLifecycle(reporterId, market, "screening-started", "2025-12-23T17:00:00Z");
      addLifecycle(reporterId, market, "qualified", "2025-12-26T17:00:00Z");
      addLifecycle(reporterId, market, "onboarding-started", enteredAt);
      const capability = addVerifiedCapability(reporterId, "standard-transcription", "2025-12-27T17:00:00Z");
      const step = addCompletedOnboardingStep(reporterId, enteredAt, "checklist-complete");
      addReadiness(reporterId, enteredAt, capability.id, step.id);
      programEnrollments.push({
        id: asId(`enrollment-checklist-${group}-${market.toLowerCase()}-${suffix}`), programId: checklistProgramId, groupId: group,
        reporterId: asId(reporterId), acquisitionCaseId: asId(`case-${reporterId.replace(/^person-/, "")}`), enteredAt: utc(enteredAt),
        eligibilityEvidenceRefs: [{ kind: "readiness-event", id: `ready-${reporterId}` }], marketAtEntry: market,
        sourceAtEntry: asId("source-community-event"), processVersionId: asId("process-checklist-v1"), provenance,
      });
      if (timely) {
        const requestId = `req-checklist-${group}-${market.toLowerCase()}-${suffix}`;
        const assignmentId = `assignment-${requestId}`;
        const completedDay = enteredDay + 7;
        const completedAt = `2026-01-${String(completedDay).padStart(2, "0")}T21:00:00Z`;
        demandRequests.push({
          id: asId(requestId), marketId: market, createdAt: utc(enteredAt), recordedAt: utc(enteredAt),
          startAt: utc(completedAt.replace("21:00:00Z", "18:00:00Z")), endAt: utc(completedAt),
          timeZone: zone("America/Los_Angeles"), proceedingType: asId("deposition"), attendanceMode: "remote",
          requiredCapabilityCodes: [asId("standard-transcription")], sampleCredentialRequirements: [], requirementsVersion: "sample-standard-v1",
          status: "concluded", canceledAt: null, cancellationReason: null, agreedDeliveryAt: utc(completedAt), provenance,
        });
        availabilityWindows.push({ id: asId(`availability-${reporterId}-checklist`), reporterId: asId(reporterId), startAt: utc(completedAt.replace("21:00:00Z", "18:00:00Z")), endAt: utc(completedAt), status: "available", serviceMarketIds: [market], attendanceModes: ["remote"], recordedAt: utc(enteredAt), confirmationExpiresAt: utc("2026-02-01T00:00:00Z"), source: "synthetic-seed", actorId: asId("actor-team-3"), provenance });
        assignmentEvents.push({
          id: asId(assignmentId), requestId: asId(requestId), reporterId: asId(reporterId), state: "accepted",
          occurredAt: utc(enteredAt), recordedAt: utc(enteredAt), actorId: asId("actor-team-3"), source: "synthetic-seed",
          reason: "Fictional checklist-cohort assignment.", provenance,
        });
        jobOutcomes.push({
          id: asId(`job-checklist-${group}-${market.toLowerCase()}-${suffix}`), requestId: asId(requestId), reporterId: asId(reporterId),
          acceptedAssignmentEventId: asId(assignmentId), outcome: "completed", startedAt: utc(completedAt.replace("21:00:00Z", "18:00:00Z")),
          completedAt: utc(completedAt), deliveryAt: utc(completedAt), recordedAt: utc(completedAt), provenance,
        });
      }
    }
  }
}

const supportingPrograms: Program[] = [];

for (let member = 1; member <= 2; member += 1) {
  const reporterId = `person-lax-referral-${String(member).padStart(2, "0")}`;
  addReporter({ id: reporterId, name: `Fictional LAX Referral ${member}`, market: "LAX", createdAt: `2026-02-${String(10 + member).padStart(2, "0")}T17:00:00Z`, capabilities: ["realtime-transcription"], sourceId: "source-targeted-referrals", originProgramId: "program-lax-realtime-referrals" });
  addLifecycle(reporterId, "LAX", "sourced", `2026-02-${String(10 + member).padStart(2, "0")}T17:00:00Z`);
  addLifecycle(reporterId, "LAX", "contacted", `2026-02-${String(11 + member).padStart(2, "0")}T17:00:00Z`);
  if (member === 1) addLifecycle(reporterId, "LAX", "qualified", "2026-02-14T17:00:00Z");
  programEnrollments.push({
    id: asId(`enrollment-lax-referral-${member}`), programId: asId("program-lax-realtime-referrals"), groupId: "current-cohort",
    reporterId: asId(reporterId), acquisitionCaseId: asId(`case-${reporterId.replace(/^person-/, "")}`), enteredAt: utc(`2026-02-${String(10 + member).padStart(2, "0")}T17:00:00Z`),
    eligibilityEvidenceRefs: [{ kind: "acquisition-case", id: `case-${reporterId.replace(/^person-/, "")}` }], marketAtEntry: "LAX",
    sourceAtEntry: asId("source-targeted-referrals"), processVersionId: null, provenance,
  });
}

for (let member = 1; member <= 6; member += 1) {
  const reporterId = `person-dfw-outreach-${String(member).padStart(2, "0")}`;
  addReporter({ id: reporterId, name: `Fictional DFW Outreach ${member}`, market: "DFW", createdAt: "2025-12-01T18:00:00Z", capabilities: ["standard-transcription"], sourceId: "source-dfw-broad-outreach", originProgramId: "program-dfw-broad-outreach" });
  addLifecycle(reporterId, "DFW", "sourced", "2025-12-01T18:00:00Z");
  addLifecycle(reporterId, "DFW", "contacted", `2025-12-${String(2 + member).padStart(2, "0")}T18:00:00Z`);
  if (member <= 3) addLifecycle(reporterId, "DFW", "responded", `2025-12-${String(5 + member).padStart(2, "0")}T18:00:00Z`);
  if (member === 1) addLifecycle(reporterId, "DFW", "qualified", "2025-12-10T18:00:00Z");
  programEnrollments.push({
    id: asId(`enrollment-dfw-outreach-${member}`), programId: asId("program-dfw-broad-outreach"), groupId: "broad-outreach",
    reporterId: asId(reporterId), acquisitionCaseId: asId(`case-${reporterId.replace(/^person-/, "")}`), enteredAt: utc("2025-12-01T18:00:00Z"),
    eligibilityEvidenceRefs: [{ kind: "acquisition-case", id: `case-${reporterId.replace(/^person-/, "")}` }], marketAtEntry: "DFW",
    sourceAtEntry: asId("source-dfw-broad-outreach"), processVersionId: null, provenance,
  });
}

const sfoReporter = addReporter({ id: "person-sfo-availability-01", name: "Fictional SFO In-person Reporter", market: "SFO", createdAt: "2026-01-05T17:00:00Z", capabilities: ["standard-transcription"], attendanceModes: ["in-person"] });
addLifecycle(sfoReporter.id, "SFO", "onboarding-started", "2026-01-10T17:00:00Z");
addLifecycle(sfoReporter.id, "SFO", "ready", "2026-01-15T17:00:00Z");
const sfoCapability = addVerifiedCapability(sfoReporter.id, "standard-transcription", "2026-01-14T17:00:00Z");
const sfoStep = addCompletedOnboardingStep(sfoReporter.id, "2026-01-15T17:00:00Z");
addReadiness(sfoReporter.id, "2026-01-15T17:00:00Z", sfoCapability.id, sfoStep.id);
demandRequests.push({
  id: asId("req-sfo-in-person-201"), marketId: "SFO", createdAt: utc("2026-02-10T17:00:00Z"), recordedAt: utc("2026-02-10T17:00:00Z"),
  startAt: utc("2026-02-25T17:00:00Z"), endAt: utc("2026-02-25T20:00:00Z"), timeZone: zone("America/Los_Angeles"),
  proceedingType: asId("deposition"), attendanceMode: "in-person", requiredCapabilityCodes: [asId("standard-transcription")], sampleCredentialRequirements: [],
  requirementsVersion: "sample-standard-v1", status: "open", canceledAt: null, cancellationReason: null, agreedDeliveryAt: null, provenance,
});
availabilityWindows.push({
  id: asId("availability-sfo-unknown"), reporterId: sfoReporter.id, startAt: utc("2026-02-25T17:00:00Z"), endAt: utc("2026-02-25T20:00:00Z"),
  status: "unknown", serviceMarketIds: ["SFO"], attendanceModes: ["in-person"], recordedAt: utc("2026-02-12T17:00:00Z"),
  confirmationExpiresAt: null, source: "team-recorded", actorId: asId("actor-team-3"), provenance,
});

for (let member = 1; member <= 3; member += 1) {
  const reporterId = `person-ord-blocked-${member}`;
  addReporter({ id: reporterId, name: `Fictional ORD Onboarding ${member}`, market: "ORD", createdAt: "2026-01-20T18:00:00Z", capabilities: ["standard-transcription"] });
  addLifecycle(reporterId, "ORD", "onboarding-started", `2026-02-0${member}T18:00:00Z`);
  onboardingSteps.push({
    id: asId(`step-${reporterId}-sample-requirement`), acquisitionCaseId: asId(`case-${reporterId.replace(/^person-/, "")}`),
    stepDefinitionId: "sample-required-evidence", required: true, state: "blocked", assignedTo: asId("team-1"), dueAt: utc(`2026-02-1${member}T18:00:00Z`),
    completedAt: null, completedBy: null, evidenceRef: null, blockerCode: "same-required-step-missing", recordedAt: utc(`2026-02-0${member}T18:00:00Z`), provenance,
  });
}

for (let member = 1; member <= 2; member += 1) {
  const reporterId = `person-atl-returning-${member}`;
  addReporter({ id: reporterId, name: `Fictional ATL Returning ${member}`, market: "ATL", createdAt: "2025-10-01T16:00:00Z", capabilities: ["standard-transcription"] });
  addLifecycle(reporterId, "ATL", "onboarding-started", "2025-10-05T16:00:00Z");
  addLifecycle(reporterId, "ATL", "ready", "2025-10-10T16:00:00Z");
  const capability = addVerifiedCapability(reporterId, "standard-transcription", "2025-10-09T16:00:00Z");
  const step = addCompletedOnboardingStep(reporterId, "2025-10-10T16:00:00Z");
  addReadiness(reporterId, "2025-10-10T16:00:00Z", capability.id, step.id);
  const requestId = `req-atl-historic-${member}`;
  const assignmentId = `assignment-${requestId}`;
  demandRequests.push({
    id: asId(requestId), marketId: "ATL", createdAt: utc("2025-11-01T16:00:00Z"), recordedAt: utc("2025-11-01T16:00:00Z"),
    startAt: utc(`2025-11-0${member + 1}T17:00:00Z`), endAt: utc(`2025-11-0${member + 1}T20:00:00Z`), timeZone: zone("America/New_York"),
    proceedingType: asId("deposition"), attendanceMode: "remote", requiredCapabilityCodes: [asId("standard-transcription")], sampleCredentialRequirements: [],
    requirementsVersion: "sample-standard-v1", status: "concluded", canceledAt: null, cancellationReason: null, agreedDeliveryAt: utc(`2025-11-0${member + 1}T20:00:00Z`), provenance,
  });
  availabilityWindows.push({ id: asId(`availability-${reporterId}-historic`), reporterId: asId(reporterId), startAt: utc(`2025-11-0${member + 1}T17:00:00Z`), endAt: utc(`2025-11-0${member + 1}T20:00:00Z`), status: "available", serviceMarketIds: ["ATL"], attendanceModes: ["remote"], recordedAt: utc("2025-10-30T16:00:00Z"), confirmationExpiresAt: utc("2025-12-01T00:00:00Z"), source: "synthetic-seed", actorId: asId("actor-team-3"), provenance });
  assignmentEvents.push({ id: asId(assignmentId), requestId: asId(requestId), reporterId: asId(reporterId), state: "accepted", occurredAt: utc("2025-11-01T17:00:00Z"), recordedAt: utc("2025-11-01T17:00:00Z"), actorId: asId("actor-team-3"), source: "synthetic-seed", reason: "Fictional historic assignment.", provenance });
  jobOutcomes.push({ id: asId(`job-atl-historic-${member}`), requestId: asId(requestId), reporterId: asId(reporterId), acceptedAssignmentEventId: asId(assignmentId), outcome: "completed", startedAt: utc(`2025-11-0${member + 1}T17:00:00Z`), completedAt: utc(`2025-11-0${member + 1}T20:00:00Z`), deliveryAt: utc(`2025-11-0${member + 1}T20:00:00Z`), recordedAt: utc(`2025-11-0${member + 1}T20:00:00Z`), provenance });
  if (member === 1) availabilityWindows.push({ id: asId("availability-atl-expired"), reporterId: asId(reporterId), startAt: utc("2026-02-01T17:00:00Z"), endAt: utc("2026-03-01T17:00:00Z"), status: "available", serviceMarketIds: ["ATL"], attendanceModes: ["remote"], recordedAt: utc("2026-02-01T17:00:00Z"), confirmationExpiresAt: utc("2026-02-10T17:00:00Z"), source: "reporter-confirmed", actorId: asId("actor-team-3"), provenance });
}

const programs: Program[] = [
  {
    id: checklistProgramId, title: "Readiness checklist pilot", marketIds: ["LAX", "SFO"], linkedNeedRefs: [], type: "workflow", stage: "reviewing", ownerId: asId("team-2"),
    hypothesis: "A defined readiness checklist may reduce avoidable onboarding gaps.", changeSummary: "Compare explicit earlier and pilot memberships using the same 14-day horizon.",
    primaryMetric: { id: asId("M12"), version: asId("v2-frozen-1") }, targetRef: asId("goal-checklist-pilot"), startAt: utc("2026-01-01T17:00:00Z"), reviewAt: utc("2026-02-16T16:00:00Z"),
    measurementPlan: { metric: { id: asId("M12"), version: asId("v2-frozen-1") }, entryWindow: { startAt: utc("2026-01-01T00:00:00Z"), endAt: utc("2026-01-25T00:00:00Z"), boundary: "[start,end)" }, followUpDays: 14, eligibilityRule: "Explicit frozen enrollment with complete fictional history.", attributionRule: "First globally valid completed job within 14 elapsed days of enrollment." },
    originWorkaroundRef: asId("workaround-checklist-sheet"), limitations: ["Non-random synthetic comparison across two time periods.", "Descriptive evidence does not establish causality."], provenance,
  },
  {
    id: asId("program-lax-realtime-referrals"), title: "LAX targeted realtime referrals", marketIds: ["LAX"], linkedNeedRefs: [{ kind: "demand-request", id: "req-lax-110" }], type: "source", stage: "trying", ownerId: asId("team-1"),
    hypothesis: "A narrow fictional referral effort may surface qualified realtime candidates.", changeSummary: "Track a declared source cohort without treating immature entrants as final outcomes.",
    primaryMetric: { id: asId("M09"), version: asId("v2-frozen-1") }, targetRef: null, startAt: utc("2026-02-10T17:00:00Z"), reviewAt: utc("2026-03-15T17:00:00Z"),
    measurementPlan: { metric: { id: asId("M09"), version: asId("v2-frozen-1") }, entryWindow: { startAt: utc("2026-02-10T00:00:00Z"), endAt: utc("2026-03-01T00:00:00Z"), boundary: "[start,end)" }, followUpDays: 30, eligibilityRule: "Explicit targeted-referral acquisition case.", attributionRule: "Primary source and market are frozen at acquisition entry." },
    originWorkaroundRef: null, limitations: ["Recent entrants remain under observation."], provenance,
  },
  {
    id: asId("program-dfw-broad-outreach"), title: "DFW broad outreach", marketIds: ["DFW"], linkedNeedRefs: [], type: "source", stage: "closed", ownerId: asId("team-2"),
    hypothesis: "Broad fictional outreach may produce relevant qualified prospects.", changeSummary: "Retain the completed member window, spend, target, and explicit stop decision.",
    primaryMetric: { id: asId("M07"), version: asId("v2-frozen-1") }, targetRef: asId("goal-dfw-qualified"), startAt: utc("2025-12-01T18:00:00Z"), reviewAt: utc("2026-01-15T18:00:00Z"),
    measurementPlan: { metric: { id: asId("M07"), version: asId("v2-frozen-1") }, entryWindow: { startAt: utc("2025-12-01T00:00:00Z"), endAt: utc("2025-12-15T00:00:00Z"), boundary: "[start,end)" }, followUpDays: 30, eligibilityRule: "Explicit broad-outreach member.", attributionRule: "Qualification and spend remain attached to the frozen entry cohort." },
    originWorkaroundRef: null, limitations: ["One fictional market and one completed cohort."], provenance,
  },
  ...supportingPrograms,
];

const sourceSpend: SourceSpend[] = [
  { id: asId("spend-lax-referrals-feb"), sourceId: asId("source-targeted-referrals"), programId: asId("program-lax-realtime-referrals"), cohortRef: "current-cohort", attributableWindow: { startAt: utc("2026-02-10T00:00:00Z"), endAt: utc("2026-03-01T00:00:00Z"), boundary: "[start,end)" }, amountMinor: 120000 as never, currency: asId("USD"), occurredAt: utc("2026-02-12T17:00:00Z"), allocationNote: "Fictional direct referral spend; labor and overhead excluded.", provenance },
  { id: asId("spend-dfw-broad"), sourceId: asId("source-dfw-broad-outreach"), programId: asId("program-dfw-broad-outreach"), cohortRef: "broad-outreach", attributableWindow: { startAt: utc("2025-12-01T00:00:00Z"), endAt: utc("2025-12-15T00:00:00Z"), boundary: "[start,end)" }, amountMinor: 360000 as never, currency: asId("USD"), occurredAt: utc("2025-12-10T18:00:00Z"), allocationNote: "Fictional direct source spend; labor and overhead excluded.", provenance },
];

const workItems: WorkItem[] = [
  {
    id: asId("work-avery-verification"), kind: "onboard", primaryEntityRef: { kind: "reporter", id: "person-lax-009" }, relatedRequestIds: [asId("req-lax-109")], programId: null,
    createdAt: utc("2026-02-10T18:00:00Z"), ownerHistory: [{ ownerId: asId("team-1"), occurredAt: utc("2026-02-10T18:00:00Z"), actorId: asId("actor-team-1"), reason: "Own the missing fictional verification step." }],
    dueAt: utc("2026-02-19T17:00:00Z"), statusHistory: [{ status: "blocked", occurredAt: utc("2026-02-10T18:00:00Z"), actorId: asId("actor-team-1"), reason: "Waiting for defined capability evidence." }],
    blockerCode: "missing-capability-evidence", completionEvidenceRefs: [], provenance,
  },
  ...[1, 2, 3].map((member): WorkItem => ({
    id: asId(`work-ord-required-step-${member}`), kind: "onboard", primaryEntityRef: { kind: "reporter", id: `person-ord-blocked-${member}` }, relatedRequestIds: [], programId: null,
    createdAt: utc(`2026-02-0${member}T18:00:00Z`), ownerHistory: [{ ownerId: member === 3 ? null : asId("team-1"), occurredAt: utc(`2026-02-0${member}T18:00:00Z`), actorId: asId("actor-team-1"), reason: "Track the repeated required step." }],
    dueAt: member === 3 ? null : utc(`2026-02-1${member}T18:00:00Z`), statusHistory: [{ status: "blocked", occurredAt: utc(`2026-02-0${member}T18:00:00Z`), actorId: asId("actor-team-1"), reason: "The same required fictional evidence is missing." }],
    blockerCode: "same-required-step-missing", completionEvidenceRefs: [], provenance,
  })),
  {
    id: asId("work-dfw-review"), kind: "partner-task", primaryEntityRef: { kind: "program", id: "program-dfw-broad-outreach" }, relatedRequestIds: [], programId: asId("program-dfw-broad-outreach"),
    createdAt: utc("2026-01-10T18:00:00Z"), ownerHistory: [{ ownerId: asId("team-2"), occurredAt: utc("2026-01-10T18:00:00Z"), actorId: asId("actor-team-2"), reason: "Review the completed fictional source cohort." }],
    dueAt: utc("2026-01-15T18:00:00Z"), statusHistory: [{ status: "open", occurredAt: utc("2026-01-10T18:00:00Z"), actorId: asId("actor-team-2"), reason: "Review opened." }, { status: "completed", occurredAt: utc("2026-01-15T18:00:00Z"), actorId: asId("actor-team-2"), reason: "Evidence reviewed and stop decision recorded." }],
    blockerCode: null, completionEvidenceRefs: [{ kind: "program", id: "program-dfw-broad-outreach" }], provenance,
  },
  ...[1, 2].map((member): WorkItem => ({
    id: asId(`work-atl-reengage-${member}`), kind: "re-engage", primaryEntityRef: { kind: "reporter", id: `person-atl-returning-${member}` }, relatedRequestIds: [], programId: null,
    createdAt: utc("2026-02-12T17:00:00Z"), ownerHistory: [{ ownerId: asId("team-3"), occurredAt: utc("2026-02-12T17:00:00Z"), actorId: asId("actor-team-3"), reason: "Confirm current availability without inferring willingness." }],
    dueAt: member === 1 ? utc("2026-02-18T17:00:00Z") : null, statusHistory: [{ status: "open", occurredAt: utc("2026-02-12T17:00:00Z"), actorId: asId("actor-team-3"), reason: "Availability confirmation remains open." }],
    blockerCode: "availability-not-current", completionEvidenceRefs: [], provenance,
  })),
];

const targetWindow: DateWindow = { startAt: utc("2026-02-09T08:00:00Z"), endAt: utc("2026-02-16T08:00:00Z"), boundary: "[start,end)" };
const teamTargets: TeamTarget[] = [
  { id: asId("target-recruiting-ops-v1"), teamMemberId: null, role: "Recruiting operations", metric: { id: asId("M11"), version: asId("v2-frozen-1") }, target: 4, reportingWindow: targetWindow, createdAt: utc("2026-02-09T08:00:00Z"), rationale: "Fictional like-role tasks target for the same reporting window.", provenance },
  { id: asId("target-program-ops-v1"), teamMemberId: asId("team-2"), role: "Program operations", metric: { id: asId("M11"), version: asId("v2-frozen-1") }, target: 1, reportingWindow: targetWindow, createdAt: utc("2026-02-09T08:00:00Z"), rationale: "Fictional individual tasks target using the same unit.", provenance },
];
const workQualityChecks: WorkQualityCheck[] = [
  { id: asId("quality-dfw-review"), workItemId: asId("work-dfw-review"), checkedBy: asId("team-2"), checkedAt: utc("2026-01-16T18:00:00Z"), requiredCheckResults: [{ checkCode: "evidence-linked", passed: true, reason: "The fictional decision retains its source records." }], outcome: "passed", provenance },
];
const coachingActions: CoachingAction[] = [
  { id: asId("coaching-positive-program-review"), teamMemberId: asId("team-2"), linkedWorkItemIds: [asId("work-dfw-review")], observedIssueOrStrength: "Clear separation of descriptive evidence from causal claims.", expectedPractice: "Share the evidence-review pattern with the team.", nextAction: "Review one new program decision using the same pattern.", dueAt: utc("2026-02-20T17:00:00Z"), reviewAt: utc("2026-02-23T17:00:00Z"), outcomeNote: null, authorId: asId("actor-team-1"), createdAt: utc("2026-02-15T17:00:00Z"), updatedAt: utc("2026-02-15T17:00:00Z"), provenance },
];

const goalRevisions: GoalRevision[] = [
  { id: asId("goal-revision-checklist-1"), goalId: asId("goal-checklist-pilot"), version: 1, metric: { id: asId("M12"), version: asId("v2-frozen-1") }, scope: { marketIds: ["LAX", "SFO"], programIds: [checklistProgramId], acquisitionCasePurpose: "first-time", requiredCapabilityCodes: [] }, baselineAsOfAt: utc("2026-01-01T17:00:00Z"), baselineEvidenceSnapshotId: asId("evidence-checklist-pilot"), target: 0.5, deadline: utc("2026-02-16T17:00:00Z"), ownerId: asId("team-2"), savedAt: utc("2026-01-01T17:00:00Z"), changeReason: "Predeclare the fictional pilot threshold.", supersedesRevisionId: null, provenance },
  { id: asId("goal-revision-dfw-1"), goalId: asId("goal-dfw-qualified"), version: 1, metric: { id: asId("M07"), version: asId("v2-frozen-1") }, scope: { marketIds: ["DFW"], programIds: [asId("program-dfw-broad-outreach")], acquisitionCasePurpose: "first-time", requiredCapabilityCodes: [] }, baselineAsOfAt: utc("2025-12-01T18:00:00Z"), baselineEvidenceSnapshotId: asId("evidence-dfw-outreach"), target: 0.4, deadline: utc("2026-01-15T18:00:00Z"), ownerId: asId("team-2"), savedAt: utc("2025-12-01T18:00:00Z"), changeReason: "Predeclare the fictional relevant-qualification threshold.", supersedesRevisionId: null, provenance },
];

const workaroundExamples: WorkaroundExample[] = [{
  id: asId("workaround-checklist-sheet"), kind: "synthetic-spreadsheet", purpose: "Illustrate the fictional checklist tracking workaround that preceded the pilot.",
  columnDefinitions: [{ key: "member", label: "Participant" }, { key: "step", label: "Checklist evidence" }, { key: "outcome", label: "Observed first job" }],
  rows: [{ rowId: "sample-1", cells: [{ columnKey: "member", value: "Fictional participant" }, { columnKey: "step", value: "Recorded" }, { columnKey: "outcome", value: "Inspect source record" }] }],
  relatedProblemRefs: [{ kind: "program", id: "program-readiness-checklist" }], provenance,
}];
const processVersions: ProcessVersion[] = [
  { id: asId("process-checklist-v1"), programId: checklistProgramId, version: 1, status: "approved-for-limited-pilot", trigger: "A first-time case reaches onboarding.", ownerId: asId("team-2"), requiredSteps: [{ id: "requirements", order: 1, instruction: "Record the defined fictional readiness evidence.", evidenceRequirement: "Linked source record" }], exceptions: ["Missing evidence remains blocked rather than inferred."], approvalHistory: [{ status: "draft", actorId: asId("actor-team-2"), occurredAt: utc("2025-12-20T17:00:00Z"), rationale: "Draft from the fictional workaround." }, { status: "review-ready", actorId: asId("actor-team-1"), occurredAt: utc("2025-12-22T17:00:00Z"), rationale: "Ready for limited review." }, { status: "approved-for-limited-pilot", actorId: asId("actor-team-1"), occurredAt: utc("2025-12-23T17:00:00Z"), rationale: "Approved only for the declared synthetic pilot." }], evidenceSnapshotId: asId("evidence-checklist-pilot"), nextReviewAt: utc("2026-02-16T17:00:00Z"), definitionVersion: asId("v1"), provenance },
];

const emptyFilters = (selectedMarket: WorkspaceFilterPayload["selectedMarket"], marketBasis: WorkspaceFilterPayload["marketBasis"]): WorkspaceFilterPayload => ({
  selectedMarket, marketBasis, marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: null,
});
function historicalRatioEvidence(idValue: string, metricId: string, programId: string, numeratorIds: readonly string[], denominatorIds: readonly string[], asOfAt: string, explanation: string): EvidenceBundle {
  const denominatorMembers = denominatorIds.map((idValue) => ({ kind: "program-enrollment" as const, id: idValue }));
  const numeratorMembers = numeratorIds.map((idValue) => ({ kind: "program-enrollment" as const, id: idValue }));
  const filters = { ...emptyFilters("ALL", "program-market-at-entry"), programIds: [asId(programId)], programEnrollmentIds: denominatorIds.map(asId), recordRefs: denominatorMembers };
  return {
    id: asId(idValue), metric: { id: asId(metricId), version: asId("v2-frozen-1") }, asOfAt: utc(asOfAt), snapshotRevision: 0, unit: "ratio",
    scope: { workspace: "programs", marketBasis: "program-market-at-entry", selectedMarket: "ALL", populationDescription: "Frozen fictional program enrollment." },
    filters, reportingWindow: null, computation: { status: "available", value: numeratorIds.length / denominatorIds.length, numerator: numeratorIds.length, denominator: denominatorIds.length },
    contributingRecords: denominatorIds.map((idValue) => ({ kind: "program-enrollment", id: idValue, label: `Enrollment ${idValue}`, occurredAt: programEnrollments.find((item) => item.id === idValue)?.enteredAt ?? null, joinPath: [{ kind: "program", id: programId }] })),
    numeratorMembers, denominatorMembers, exclusions: [], unknownCount: 0, limitations: ["Synthetic descriptive evidence; no causal claim."], explanation,
    navigationTarget: { workspace: "programs", intent: "evidence-list", filters, evidenceContext: { asOfAt: utc(asOfAt), snapshotRevision: 0, metric: { id: asId(metricId), version: asId("v2-frozen-1") } } },
  };
}

const checklistPilotIds = programEnrollments.filter((item) => item.programId === checklistProgramId && item.groupId === "pilot").map((item) => String(item.id));
const checklistPilotSuccessIds = checklistPilotIds.filter((enrollmentId) => {
  const enrollment = programEnrollments.find((item) => item.id === enrollmentId)!;
  return jobOutcomes.some((job) => job.reporterId === enrollment.reporterId);
});
const dfwEnrollmentIds = programEnrollments.filter((item) => item.programId === asId("program-dfw-broad-outreach")).map((item) => String(item.id));
const evidenceSnapshots: EvidenceBundle[] = [
  historicalRatioEvidence("evidence-checklist-pilot", "M12", "program-readiness-checklist", checklistPilotSuccessIds, checklistPilotIds, "2026-02-16T17:00:00Z", "The frozen pilot sample met its predeclared threshold; this does not establish causality."),
  historicalRatioEvidence("evidence-dfw-outreach", "M07", "program-dfw-broad-outreach", dfwEnrollmentIds.slice(0, 1), dfwEnrollmentIds, "2026-01-15T18:00:00Z", "One of six fictional broad-outreach members reached relevant qualification in the completed window."),
];
const programDecisions: ProgramDecision[] = [
  { id: asId("decision-checklist-expand"), programId: checklistProgramId, decision: "expand", rationale: "The target was met in this synthetic sample; propose only a limited rollout and retain the stated limitations.", decidedBy: asId("actor-team-2"), decidedAt: utc("2026-02-16T16:30:00Z"), evidenceSnapshotId: asId("evidence-checklist-pilot"), nextReviewAt: utc("2026-03-16T17:00:00Z"), provenance },
  { id: asId("decision-dfw-stop"), programId: asId("program-dfw-broad-outreach"), decision: "stop", rationale: "The completed fictional cohort produced weak relevant qualification against its predeclared target; revise targeting before another test.", decidedBy: asId("actor-team-2"), decidedAt: utc("2026-01-15T18:00:00Z"), evidenceSnapshotId: asId("evidence-dfw-outreach"), nextReviewAt: null, provenance },
];

const scenarioEvents: ScenarioFeedEvent[] = [];
let scenarioSequence = 0;
function scenarioEvent(checkpointId: string, eventId: string, applyAt: string, value: ScenarioAppendRecord): ScenarioFeedEvent {
  const event: ScenarioFeedEvent = { id: asId(eventId), sequence: ++scenarioSequence, checkpointId: asId(checkpointId), recordedAt: utc(applyAt), applyAt: utc(applyAt), operation: { kind: "append-record", value } };
  scenarioEvents.push(event);
  return event;
}

const planEventIds = [
  scenarioEvent("plan-saved", "scenario-goal-lax-v1", "2026-02-16T17:05:00Z", { kind: "goal-revision", record: { id: asId("goal-revision-lax-1"), goalId: asId("goal-lax-realtime-ready"), version: 1, metric: { id: asId("M04"), version: asId("v2-frozen-1") }, scope: { marketIds: ["LAX"], programIds: [], acquisitionCasePurpose: "first-time", requiredCapabilityCodes: [asId("realtime-transcription")] }, baselineAsOfAt: BASE_AS_OF, baselineEvidenceSnapshotId: asId("evidence-lax-baseline"), target: 2, deadline: utc("2026-02-23T17:00:00Z"), ownerId: asId("team-1"), savedAt: utc("2026-02-16T17:05:00Z"), changeReason: "Fictional two-addition readiness goal.", supersedesRevisionId: null, provenance: simulated } }),
].map((event) => event.id);

const existingAcceptanceIds = [7, 8].map((number, index) => {
  const request = `req-lax-${100 + number}`;
  return scenarioEvent("existing-acceptances", `scenario-accept-${request}`, `2026-02-18T17:0${index}:00Z`, { kind: "assignment-event", record: { id: asId(`assignment-${request}`), requestId: asId(request), reporterId: asId(`person-lax-00${number}`), state: "accepted", occurredAt: utc(`2026-02-18T17:0${index}:00Z`), recordedAt: utc(`2026-02-18T17:0${index}:00Z`), actorId: asId("actor-team-3"), source: "demo-simulation", reason: "Fictional existing candidate accepted the specific request.", provenance: simulated } }).id;
});

const readyEventIds: DemoSnapshotV2["appliedScenarioEventIds"][number][] = [];
const pushReadyEvent = (event: ScenarioFeedEvent) => { readyEventIds.push(event.id); };
const averyCapability: CapabilityVerification = { id: asId("cap-person-lax-009-realtime"), reporterId: asId("person-lax-009"), capabilityCode: asId("realtime-transcription"), status: "verified", recordedAt: utc("2026-02-20T16:00:00Z"), reviewerId: asId("team-3"), evidenceRef: { kind: "screening-review", id: "screening-lax-009-baseline" }, provenance: simulated };
pushReadyEvent(scenarioEvent("two-new-ready", "scenario-avery-capability", "2026-02-20T16:00:00Z", { kind: "capability-verification", record: averyCapability }));
const averyStep: OnboardingStep = { id: asId("step-person-lax-009-realtime-complete"), acquisitionCaseId: asId("case-lax-009"), stepDefinitionId: "sample-realtime-verification", required: true, state: "completed", assignedTo: asId("team-1"), dueAt: utc("2026-02-20T17:00:00Z"), completedAt: utc("2026-02-20T16:30:00Z"), completedBy: asId("team-1"), evidenceRef: { kind: "capability-verification", id: averyCapability.id }, blockerCode: null, recordedAt: utc("2026-02-20T16:30:00Z"), provenance: simulated };
pushReadyEvent(scenarioEvent("two-new-ready", "scenario-avery-step", "2026-02-20T16:30:00Z", { kind: "onboarding-step", record: averyStep }));
pushReadyEvent(scenarioEvent("two-new-ready", "scenario-avery-ready", "2026-02-20T17:00:00Z", { kind: "readiness-event", record: { id: asId("ready-person-lax-009"), acquisitionCaseId: asId("case-lax-009"), reporterId: asId("person-lax-009"), occurredAt: utc("2026-02-20T17:00:00Z"), recordedAt: utc("2026-02-20T17:00:00Z"), actorId: asId("actor-team-1"), checklistVersion: "sample-readiness-v1", checkedStepIds: [averyStep.id], capabilityVerificationIds: [averyCapability.id], provenance: simulated } }));
pushReadyEvent(scenarioEvent("two-new-ready", "scenario-avery-lifecycle-ready", "2026-02-20T17:00:00Z", { kind: "lifecycle-event", record: { id: asId("life-person-lax-009-ready"), acquisitionCaseId: asId("case-lax-009"), reporterId: asId("person-lax-009"), eventType: "ready", occurredAt: utc("2026-02-20T17:00:00Z"), recordedAt: utc("2026-02-20T17:00:00Z"), actorId: asId("actor-team-1"), reasonCode: "synthetic-ready", reasonText: "Defined fictional readiness evidence completed.", marketAtEntry: "LAX", linkedWorkItemId: asId("work-avery-verification"), provenance: simulated } }));

const rowan: Reporter = { id: asId("person-lax-010"), fictionalName: "Rowan Ellis", recruitingMarketId: "LAX", serviceMarketIds: ["LAX"], createdAt: utc("2026-02-17T17:00:00Z"), recordedAt: utc("2026-02-17T17:00:00Z"), preferences: { attendanceModes: ["remote"], supportedProceedingTypes: [asId("deposition")], supportedCapabilityCodes: [asId("realtime-transcription")], serviceMarkets: [{ marketId: "LAX", status: "serves" }], notes: "Fictional targeted-referral participant." }, provenance: simulated };
pushReadyEvent(scenarioEvent("two-new-ready", "scenario-rowan-reporter", "2026-02-17T17:00:00Z", { kind: "reporter", record: rowan }));
pushReadyEvent(scenarioEvent("two-new-ready", "scenario-rowan-case", "2026-02-17T17:01:00Z", { kind: "acquisition-case", record: { id: asId("case-lax-010"), reporterId: rowan.id, ownerMarketId: "LAX", primarySourceId: asId("source-targeted-referrals"), openedAt: utc("2026-02-17T17:00:00Z"), recordedAt: utc("2026-02-17T17:01:00Z"), purpose: "first-time", originProgramId: asId("program-lax-realtime-referrals"), provenance: simulated } }));
for (const [eventType, at] of [["sourced", "2026-02-17T17:00:00Z"], ["contacted", "2026-02-17T18:00:00Z"], ["responded", "2026-02-18T17:00:00Z"], ["screening-started", "2026-02-18T18:00:00Z"], ["qualified", "2026-02-19T16:00:00Z"], ["onboarding-started", "2026-02-19T17:00:00Z"]] as const) {
  pushReadyEvent(scenarioEvent("two-new-ready", `scenario-rowan-life-${eventType}`, at, { kind: "lifecycle-event", record: { id: asId(`life-person-lax-010-${eventType}`), acquisitionCaseId: asId("case-lax-010"), reporterId: rowan.id, eventType, occurredAt: utc(at), recordedAt: utc(at), actorId: asId("actor-team-1"), reasonCode: `synthetic-${eventType}`, reasonText: `Fictional ${eventType.replaceAll("-", " ")} history.`, marketAtEntry: "LAX", linkedWorkItemId: null, provenance: simulated } }));
}
const rowanCapability: CapabilityVerification = { id: asId("cap-person-lax-010-realtime"), reporterId: rowan.id, capabilityCode: asId("realtime-transcription"), status: "verified", recordedAt: utc("2026-02-22T16:00:00Z"), reviewerId: asId("team-3"), evidenceRef: { kind: "reporter", id: rowan.id }, provenance: simulated };
pushReadyEvent(scenarioEvent("two-new-ready", "scenario-rowan-capability", "2026-02-22T16:00:00Z", { kind: "capability-verification", record: rowanCapability }));
const rowanStep: OnboardingStep = { id: asId("step-person-lax-010-requirements"), acquisitionCaseId: asId("case-lax-010"), stepDefinitionId: "sample-realtime-verification", required: true, state: "completed", assignedTo: asId("team-1"), dueAt: utc("2026-02-23T16:00:00Z"), completedAt: utc("2026-02-22T16:30:00Z"), completedBy: asId("team-1"), evidenceRef: { kind: "capability-verification", id: rowanCapability.id }, blockerCode: null, recordedAt: utc("2026-02-22T16:30:00Z"), provenance: simulated };
pushReadyEvent(scenarioEvent("two-new-ready", "scenario-rowan-step", "2026-02-22T16:30:00Z", { kind: "onboarding-step", record: rowanStep }));
pushReadyEvent(scenarioEvent("two-new-ready", "scenario-rowan-availability", "2026-02-22T17:00:00Z", { kind: "availability-window", record: { id: asId("availability-person-lax-010-main"), reporterId: rowan.id, startAt: utc(mainRequestTimes[9][0]), endAt: utc(mainRequestTimes[9][1]), status: "available", serviceMarketIds: ["LAX"], attendanceModes: ["remote"], recordedAt: utc("2026-02-22T17:00:00Z"), confirmationExpiresAt: utc("2026-03-02T08:00:00Z"), source: "demo-simulation", actorId: asId("actor-team-3"), provenance: simulated } }));
pushReadyEvent(scenarioEvent("two-new-ready", "scenario-rowan-enrollment", "2026-02-22T17:01:00Z", { kind: "program-enrollment", record: { id: asId("enrollment-lax-referral-rowan"), programId: asId("program-lax-realtime-referrals"), groupId: "current-cohort", reporterId: rowan.id, acquisitionCaseId: asId("case-lax-010"), enteredAt: utc("2026-02-19T17:00:00Z"), eligibilityEvidenceRefs: [{ kind: "acquisition-case", id: "case-lax-010" }], marketAtEntry: "LAX", sourceAtEntry: asId("source-targeted-referrals"), processVersionId: null, provenance: simulated } }));
pushReadyEvent(scenarioEvent("two-new-ready", "scenario-rowan-ready", "2026-02-23T16:00:00Z", { kind: "readiness-event", record: { id: asId("ready-person-lax-010"), acquisitionCaseId: asId("case-lax-010"), reporterId: rowan.id, occurredAt: utc("2026-02-23T16:00:00Z"), recordedAt: utc("2026-02-23T16:00:00Z"), actorId: asId("actor-team-1"), checklistVersion: "sample-readiness-v1", checkedStepIds: [rowanStep.id], capabilityVerificationIds: [rowanCapability.id], provenance: simulated } }));
pushReadyEvent(scenarioEvent("two-new-ready", "scenario-rowan-lifecycle-ready", "2026-02-23T16:00:00Z", { kind: "lifecycle-event", record: { id: asId("life-person-lax-010-ready"), acquisitionCaseId: asId("case-lax-010"), reporterId: rowan.id, eventType: "ready", occurredAt: utc("2026-02-23T16:00:00Z"), recordedAt: utc("2026-02-23T16:00:00Z"), actorId: asId("actor-team-1"), reasonCode: "synthetic-ready", reasonText: "Defined fictional readiness evidence completed.", marketAtEntry: "LAX", linkedWorkItemId: null, provenance: simulated } }));

const newAcceptanceIds = [9, 10].map((number, index) => {
  const request = `req-lax-${100 + number}`;
  const reporterId = `person-lax-${String(number).padStart(3, "0")}`;
  const at = index === 0 ? "2026-02-23T17:30:00Z" : "2026-02-23T17:35:00Z";
  return scenarioEvent("new-acceptances", `scenario-accept-${request}`, at, { kind: "assignment-event", record: { id: asId(`assignment-${request}`), requestId: asId(request), reporterId: asId(reporterId), state: "accepted", occurredAt: utc(at), recordedAt: utc(at), actorId: asId("actor-team-3"), source: "demo-simulation", reason: "Fictional newly ready reporter accepted the request.", provenance: simulated } }).id;
});

const deliveryEventIds = mainRequestTimes.map(([startAt, completedAt], index) => {
  const number = index + 1;
  const request = `req-lax-${101 + index}`;
  const reporterId = `person-lax-${String(number).padStart(3, "0")}`;
  return scenarioEvent("original-plan-delivered", `scenario-complete-${request}`, completedAt, { kind: "job-outcome", record: { id: asId(`outcome-${request}`), requestId: asId(request), reporterId: asId(reporterId), acceptedAssignmentEventId: asId(`assignment-${request}`), outcome: "completed", startedAt: utc(startAt), completedAt: utc(completedAt), deliveryAt: utc(completedAt), recordedAt: utc(completedAt), provenance: simulated } }).id;
});

const cumulative = (...groups: readonly (readonly DemoSnapshotV2["appliedScenarioEventIds"][number][])[]) => groups.flat();
const checkpoint = (idValue: string, label: string, asOfAt: string, appliedEventIds: readonly DemoSnapshotV2["appliedScenarioEventIds"][number][], facts: ScenarioCheckpointContract["expectedFactsForTestsOnly"]): ScenarioCheckpointContract => ({ id: asId(idValue), label, asOfAt: utc(asOfAt), appliedEventIds, expectedFactsForTestsOnly: facts });
const facts = (requested: number, confirmed: number, possible: number, noReady: number, ready = 0, pairJobs = 0): ScenarioCheckpointContract["expectedFactsForTestsOnly"] => [
  { metricKey: "requested", value: requested, unit: "requests" }, { metricKey: "confirmed", value: confirmed, unit: "requests" },
  { metricKey: "possible", value: possible, unit: "requests" }, { metricKey: "noReadyMatch", value: noReady, unit: "requests" },
  { metricKey: "newRealtimeReady", value: ready, unit: "people" }, { metricKey: "mainPairFirstJobs", value: pairJobs, unit: "jobs" },
];
export const SCENARIO_CONTRACT: ScenarioContractV2 = {
  feed: { id: asId("scenario-feed-v2"), version: 1, baseSeedVersion: "v2-synthetic-seed-1", events: scenarioEvents },
  checkpoints: [
    checkpoint("baseline", "Baseline", "2026-02-16T17:00:00Z", [], facts(10, 6, 2, 2)),
    checkpoint("plan-saved", "Plan saved", "2026-02-16T17:10:00Z", cumulative(planEventIds), facts(10, 6, 2, 2)),
    checkpoint("existing-acceptances", "Existing candidates accepted", "2026-02-18T17:10:00Z", cumulative(planEventIds, existingAcceptanceIds), facts(10, 8, 0, 2)),
    checkpoint("two-new-ready", "Two new reporters ready", "2026-02-23T17:00:00Z", cumulative(planEventIds, existingAcceptanceIds, readyEventIds), facts(10, 8, 2, 0, 2)),
    checkpoint("new-acceptances", "New reporters accepted", "2026-02-23T17:45:00Z", cumulative(planEventIds, existingAcceptanceIds, readyEventIds, newAcceptanceIds), facts(10, 10, 0, 0, 2)),
    checkpoint("original-plan-delivered", "Original plan delivered", "2026-02-28T02:00:00Z", cumulative(planEventIds, existingAcceptanceIds, readyEventIds, newAcceptanceIds, deliveryEventIds), facts(0, 0, 0, 0, 2, 2)),
    checkpoint("pair-cohort-mature", "Pair onboarding cohort mature", "2026-03-09T17:00:00Z", cumulative(planEventIds, existingAcceptanceIds, readyEventIds, newAcceptanceIds, deliveryEventIds), [{ metricKey: "mainPairMatureOnboardingEntrants", value: 2, unit: "people" }, { metricKey: "mainPairTimelyFirstJobs", value: 1, unit: "people" }, { metricKey: "mainPairCompletedToDate", value: 2, unit: "people" }]),
  ],
};

export const DEMO_SNAPSHOT_V2: DemoSnapshotV2 = {
  schemaVersion: 2,
  seedVersion: "v2-synthetic-seed-1",
  revision: 0,
  baseAsOfAt: BASE_AS_OF,
  currentAsOfAt: BASE_AS_OF,
  appliedCommandIds: [],
  appliedScenarioEventIds: [],
  markets,
  metricDefinitions,
  evidenceSnapshots,
  manualMarketNotes: [],
  reporters,
  acquisitionCases,
  lifecycleEvents,
  credentialRecords: [],
  capabilityVerifications,
  screeningReviews,
  onboardingSteps,
  readinessEvents,
  availabilityWindows,
  demandRequests,
  assignmentEvents,
  jobOutcomes,
  teamMembers,
  workItems,
  teamTargets,
  workQualityChecks,
  coachingActions,
  sources,
  sourceSpend,
  programs,
  programEnrollments,
  programNotes: [
    { id: asId("note-dfw-stop"), programId: asId("program-dfw-broad-outreach"), authorId: asId("actor-team-2"), text: "Fictional completed cohort retained with the explicit stop rationale.", createdAt: utc("2026-01-15T18:00:00Z"), provenance },
    { id: asId("note-lax-observing"), programId: asId("program-lax-realtime-referrals"), authorId: asId("actor-team-1"), text: "Recent fictional entrants remain under observation; no final conversion claim.", createdAt: utc("2026-02-15T17:00:00Z"), provenance },
  ],
  programDecisions,
  goalRevisions,
  workaroundExamples,
  processVersions,
  commandRecords: [],
};

const appendTargets: Record<ScenarioAppendRecord["kind"], keyof DemoSnapshotV2> = {
  reporter: "reporters",
  "acquisition-case": "acquisitionCases",
  "lifecycle-event": "lifecycleEvents",
  "credential-record": "credentialRecords",
  "capability-verification": "capabilityVerifications",
  "screening-review": "screeningReviews",
  "onboarding-step": "onboardingSteps",
  "readiness-event": "readinessEvents",
  "availability-window": "availabilityWindows",
  "assignment-event": "assignmentEvents",
  "job-outcome": "jobOutcomes",
  "work-item": "workItems",
  "program-enrollment": "programEnrollments",
  "program-decision": "programDecisions",
  "goal-revision": "goalRevisions",
  "process-version": "processVersions",
};

function appendScenarioRecord(snapshot: DemoSnapshotV2, value: ScenarioAppendRecord): DemoSnapshotV2 {
  const field = appendTargets[value.kind];
  const records = snapshot[field] as readonly { readonly id: string }[];
  if (records.some((record) => record.id === value.record.id)) return snapshot;
  return { ...snapshot, [field]: [...records, structuredClone(value.record)] } as DemoSnapshotV2;
}

export function applyScenarioEvent(snapshot: DemoSnapshotV2, event: ScenarioFeedEvent): DemoSnapshotV2 {
  if (snapshot.appliedScenarioEventIds.includes(event.id)) return structuredClone(snapshot);
  if (event.sequence !== snapshot.appliedScenarioEventIds.length + 1) throw new Error("Scenario events must be applied once in sequence.");
  let next = snapshot;
  if (event.operation.kind === "append-record") next = appendScenarioRecord(next, event.operation.value);
  if (event.operation.kind === "replace-demand-request") {
    const replacement = event.operation.record;
    next = { ...next, demandRequests: next.demandRequests.map((record) => record.id === replacement.id ? structuredClone(replacement) : record) };
  }
  if (event.operation.kind === "replace-work-item") {
    const replacement = event.operation.record;
    next = { ...next, workItems: next.workItems.map((record) => record.id === replacement.id ? structuredClone(replacement) : record) };
  }
  return { ...next, revision: next.revision + 1, currentAsOfAt: event.applyAt, appliedScenarioEventIds: [...next.appliedScenarioEventIds, event.id] };
}

export function applyScenarioCheckpoint(snapshot: DemoSnapshotV2, checkpointId: string): DemoSnapshotV2 {
  const checkpointRecord = SCENARIO_CONTRACT.checkpoints.find((item) => item.id === checkpointId);
  if (!checkpointRecord) throw new Error(`Unknown scenario checkpoint: ${checkpointId}`);
  const expected = new Set(checkpointRecord.appliedEventIds);
  const requiredEvents = SCENARIO_CONTRACT.feed.events.filter((event) => expected.has(event.id));
  const next = requiredEvents.reduce(applyScenarioEvent, structuredClone(snapshot));
  return { ...next, currentAsOfAt: checkpointRecord.asOfAt };
}

const failure = (snapshot: Partial<DemoSnapshotV2> | null, code: "validation-failed" | "invariant-failed", message: string, field: string | null = null): RepositoryResult<DemoSnapshotV2> => ({
  ok: false,
  errors: [{ code, message, field, relatedRecords: [] }],
  revision: snapshot?.revision ?? 0,
  message,
});
const duplicates = (values: readonly string[]) => new Set(values).size !== values.length;
const after = (left: string, right: string) => Date.parse(left) > Date.parse(right);

export function validateDemoSnapshot(value: unknown): RepositoryResult<DemoSnapshotV2> {
  if (!value || typeof value !== "object") return failure(null, "validation-failed", "Snapshot must be an object.");
  const snapshot = value as Partial<DemoSnapshotV2>;
  const requiredArrays: readonly (keyof DemoSnapshotV2)[] = ["markets", "metricDefinitions", "reporters", "acquisitionCases", "lifecycleEvents", "capabilityVerifications", "onboardingSteps", "readinessEvents", "availabilityWindows", "demandRequests", "assignmentEvents", "jobOutcomes", "teamMembers", "workItems", "programs", "programEnrollments", "goalRevisions", "processVersions", "appliedCommandIds", "appliedScenarioEventIds"];
  if (snapshot.schemaVersion !== 2 || requiredArrays.some((key) => !Array.isArray(snapshot[key]))) return failure(snapshot, "validation-failed", "Snapshot schema or required collections are invalid.");
  const candidate = snapshot as DemoSnapshotV2;
  if (candidate.markets.length !== 5 || duplicates(candidate.markets.map((item) => String(item.id)))) return failure(candidate, "invariant-failed", "Exactly five distinct markets are required.", "markets");
  if (duplicates(candidate.reporters.map((item) => String(item.id))) || duplicates(candidate.demandRequests.map((item) => String(item.id))) || duplicates(candidate.assignmentEvents.map((item) => String(item.id))) || duplicates(candidate.jobOutcomes.map((item) => String(item.id))) || duplicates(candidate.appliedCommandIds.map(String)) || duplicates(candidate.appliedScenarioEventIds.map(String))) return failure(candidate, "invariant-failed", "Canonical IDs and replay IDs must be unique.");
  const marketIds = new Set(candidate.markets.map((item) => item.id));
  const reporterIds = new Set(candidate.reporters.map((item) => item.id));
  const caseById = new Map(candidate.acquisitionCases.map((item) => [item.id, item]));
  const requestById = new Map(candidate.demandRequests.map((item) => [item.id, item]));
  const assignmentById = new Map(candidate.assignmentEvents.map((item) => [item.id, item]));
  const teamIds = new Set(candidate.teamMembers.map((item) => item.id));
  const sourceIds = new Set(candidate.sources.map((item) => item.id));
  const programIds = new Set(candidate.programs.map((item) => item.id));
  const workIds = new Set(candidate.workItems.map((item) => item.id));
  if (candidate.reporters.some((item) => !marketIds.has(item.recruitingMarketId) || after(item.createdAt, candidate.currentAsOfAt) || after(item.recordedAt, candidate.currentAsOfAt))) return failure(candidate, "validation-failed", "Reporter market or as-of visibility is invalid.", "reporters");
  if (candidate.acquisitionCases.some((item) => !reporterIds.has(item.reporterId) || !marketIds.has(item.ownerMarketId) || (item.primarySourceId !== null && !sourceIds.has(item.primarySourceId)) || (item.originProgramId !== null && !programIds.has(item.originProgramId)) || after(item.openedAt, candidate.currentAsOfAt) || after(item.recordedAt, candidate.currentAsOfAt))) return failure(candidate, "validation-failed", "Acquisition case references or visibility are invalid.", "acquisitionCases");
  if (candidate.lifecycleEvents.some((item) => caseById.get(item.acquisitionCaseId)?.reporterId !== item.reporterId || after(item.occurredAt, item.recordedAt) || after(item.recordedAt, candidate.currentAsOfAt))) return failure(candidate, "validation-failed", "Lifecycle event references or timestamps are invalid.", "lifecycleEvents");
  if (candidate.capabilityVerifications.some((item) => !reporterIds.has(item.reporterId) || !teamIds.has(item.reviewerId) || after(item.recordedAt, candidate.currentAsOfAt))) return failure(candidate, "validation-failed", "Capability verification references or timestamps are invalid.", "capabilityVerifications");
  if (candidate.onboardingSteps.some((item) => !caseById.has(item.acquisitionCaseId) || !teamIds.has(item.assignedTo ?? asId("team-1")) || (item.state === "completed" && (item.completedAt === null || item.evidenceRef === null)) || after(item.recordedAt, candidate.currentAsOfAt))) return failure(candidate, "validation-failed", "Onboarding step references or completion evidence are invalid.", "onboardingSteps");
  if (candidate.readinessEvents.some((item) => {
    const acquisitionCase = caseById.get(item.acquisitionCaseId);
    if (acquisitionCase?.reporterId !== item.reporterId || after(item.occurredAt, item.recordedAt) || after(item.recordedAt, candidate.currentAsOfAt)) return true;
    const checkedSteps = item.checkedStepIds.map((idValue) => candidate.onboardingSteps.find((step) => step.id === idValue));
    const requiredSteps = candidate.onboardingSteps.filter((step) => step.acquisitionCaseId === item.acquisitionCaseId && step.required).filter((step, _, steps) => !steps.some((other) => other.stepDefinitionId === step.stepDefinitionId && Date.parse(other.recordedAt) > Date.parse(step.recordedAt)));
    if (requiredSteps.some((step) => !item.checkedStepIds.includes(step.id)) || checkedSteps.some((step) => !step || step.acquisitionCaseId !== item.acquisitionCaseId || !step.required || step.state !== "completed" || step.completedAt === null || step.evidenceRef === null || after(step.completedAt, item.occurredAt) || after(step.recordedAt, item.occurredAt))) return true;
    const referencedCapabilities = item.capabilityVerificationIds.map((idValue) => candidate.capabilityVerifications.find((capability) => capability.id === idValue));
    return referencedCapabilities.some((capability) => !capability || capability.reporterId !== item.reporterId || capability.status !== "verified" || after(capability.recordedAt, item.occurredAt) || capability.evidenceRef === null);
  })) return failure(candidate, "validation-failed", "Readiness prerequisites or timestamps are invalid.", "readinessEvents");
  if (candidate.availabilityWindows.some((item) => !reporterIds.has(item.reporterId) || !marketIds.has(item.serviceMarketIds[0]!) || !after(item.endAt, item.startAt) || after(item.recordedAt, candidate.currentAsOfAt))) return failure(candidate, "validation-failed", "Availability references or interval are invalid.", "availabilityWindows");
  if (candidate.demandRequests.some((item) => !marketIds.has(item.marketId) || candidate.markets.find((market) => market.id === item.marketId)?.timeZone !== item.timeZone || !after(item.endAt, item.startAt) || after(item.recordedAt, candidate.currentAsOfAt))) return failure(candidate, "validation-failed", "Demand references, time zone, or interval are invalid.", "demandRequests");
  let invalidAssignmentId = "";
  if (candidate.assignmentEvents.some((item) => {
    const request = requestById.get(item.requestId);
    if (!reporterIds.has(item.reporterId) || !request || after(item.occurredAt, item.recordedAt) || after(item.recordedAt, candidate.currentAsOfAt)) { invalidAssignmentId = String(item.id); return true; }
    if (item.state !== "accepted") return false;
    const readiness = candidate.readinessEvents.filter((event) => event.reporterId === item.reporterId && !after(event.occurredAt, item.occurredAt) && !after(event.recordedAt, item.occurredAt)).sort((left, right) => (right.occurredAt + right.recordedAt + String(right.id)).localeCompare(left.occurredAt + left.recordedAt + String(left.id)))[0];
    const requiredCapabilities = new Set(request.requiredCapabilityCodes);
    const verified = candidate.capabilityVerifications.filter((capability) => capability.reporterId === item.reporterId && capability.status === "verified" && !after(capability.recordedAt, item.occurredAt));
    if (!readiness || [...requiredCapabilities].some((code) => !readiness.capabilityVerificationIds.some((idValue) => verified.some((capability) => capability.id === idValue && capability.capabilityCode === code)))) { invalidAssignmentId = String(item.id); return true; }
    const reporter = candidate.reporters.find((candidateReporter) => candidateReporter.id === item.reporterId)!;
    if (!request.requirementsVersion.trim() || !String(request.proceedingType).trim() || (!request.requiredCapabilityCodes.length && !request.sampleCredentialRequirements.length) || !reporter.serviceMarketIds.includes(request.marketId) || !reporter.preferences.supportedProceedingTypes.includes(request.proceedingType) || !reporter.preferences.attendanceModes.includes(request.attendanceMode) || request.status === "canceled" || request.sampleCredentialRequirements.some((requirement) => !requirement.requirementCode.trim() || !requirement.label.trim())) { invalidAssignmentId = String(item.id); return true; }
    const latestLifecycle = candidate.lifecycleEvents.filter((event) => event.reporterId === item.reporterId && !after(event.occurredAt, item.occurredAt) && !after(event.recordedAt, item.occurredAt)).sort((left, right) => (right.occurredAt + right.recordedAt + String(right.id)).localeCompare(left.occurredAt + left.recordedAt + String(left.id)))[0];
    if (latestLifecycle?.eventType === "closed") { invalidAssignmentId = String(item.id); return true; }
    if ([...requiredCapabilities].some((code) => {
      const latest = candidate.capabilityVerifications.filter((capability) => capability.reporterId === item.reporterId && capability.capabilityCode === code && !after(capability.recordedAt, item.occurredAt)).sort((left, right) => (right.recordedAt + String(right.id)).localeCompare(left.recordedAt + String(left.id)))[0];
      return !latest || latest.status !== "verified" || !readiness.capabilityVerificationIds.includes(latest.id);
    })) { invalidAssignmentId = String(item.id); return true; }
    if (request.sampleCredentialRequirements.some((requirement) => !candidate.credentialRecords.some((credential) => credential.reporterId === item.reporterId && credential.verificationStatus === "verified" && credential.label === requirement.requirementCode && (requirement.jurisdictionScope === null || credential.jurisdictionScope === requirement.jurisdictionScope) && (credential.validFrom === null || !after(credential.validFrom, request.startAt)) && (credential.validUntil === null || !after(request.endAt, credential.validUntil)) && !after(credential.recordedAt, item.occurredAt)))) { invalidAssignmentId = String(item.id); return true; }
    const servicePreference = candidate.reporters.find((candidateReporter) => candidateReporter.id === item.reporterId)?.preferences.serviceMarkets.find((preference) => preference.marketId === request.marketId);
    if (servicePreference?.status !== "serves" || !candidate.reporters.find((candidateReporter) => candidateReporter.id === item.reporterId)?.preferences.attendanceModes.includes(request.attendanceMode)) { invalidAssignmentId = String(item.id); return true; }
    const reporterWindows = candidate.availabilityWindows.filter((window) => window.reporterId === item.reporterId);
    if (reporterWindows.some((window) => window.status === "unavailable" && !after(window.startAt, request.startAt) && !after(request.endAt, window.endAt) && !after(window.recordedAt, item.occurredAt))) { invalidAssignmentId = String(item.id); return true; }
    if (!reporterWindows.some((window) => window.status === "available" && window.serviceMarketIds.includes(request.marketId) && window.attendanceModes.includes(request.attendanceMode) && !after(window.startAt, request.startAt) && !after(request.endAt, window.endAt) && !after(window.recordedAt, item.occurredAt) && (window.confirmationExpiresAt === null || after(window.confirmationExpiresAt, item.occurredAt)))) { invalidAssignmentId = String(item.id); return true; }
    return false;
  })) return failure(candidate, "validation-failed", `Assignment references, eligibility, or timestamps are invalid (${invalidAssignmentId}).`, "assignmentEvents");
  if (candidate.jobOutcomes.some((item) => { const request = requestById.get(item.requestId); const assignment = assignmentById.get(item.acceptedAssignmentEventId); return !request || !assignment || assignment.state !== "accepted" || assignment.requestId !== item.requestId || assignment.reporterId !== item.reporterId || after(assignment.occurredAt, item.recordedAt) || (item.outcome === "completed" && (item.completedAt === null || after(assignment.occurredAt, item.completedAt) || after(request.endAt, item.completedAt))) || after(item.recordedAt, candidate.currentAsOfAt); })) return failure(candidate, "validation-failed", "Job outcome references, acceptance, or chronology are invalid.", "jobOutcomes");
  const accepted = candidate.assignmentEvents.filter((item) => item.state === "accepted");
  if (new Set(accepted.map((item) => item.requestId)).size !== accepted.length) return failure(candidate, "invariant-failed", "One reporter slot cannot have two accepted reporters.", "assignmentEvents");
  for (let leftIndex = 0; leftIndex < accepted.length; leftIndex += 1) for (let rightIndex = leftIndex + 1; rightIndex < accepted.length; rightIndex += 1) {
    const left = accepted[leftIndex]!; const right = accepted[rightIndex]!;
    if (left.reporterId !== right.reporterId) continue;
    const leftRequest = requestById.get(left.requestId)!; const rightRequest = requestById.get(right.requestId)!;
    if (Date.parse(leftRequest.startAt) < Date.parse(rightRequest.endAt) && Date.parse(rightRequest.startAt) < Date.parse(leftRequest.endAt)) return failure(candidate, "invariant-failed", "A reporter cannot hold overlapping accepted work.", "assignmentEvents");
  }
  if (candidate.programEnrollments.some((item) => !programIds.has(item.programId) || !reporterIds.has(item.reporterId) || (item.acquisitionCaseId !== null && !caseById.has(item.acquisitionCaseId)))) return failure(candidate, "validation-failed", "Program enrollment references are invalid.", "programEnrollments");
  if (candidate.sourceSpend.some((item) => !sourceIds.has(item.sourceId) || (item.programId !== null && !programIds.has(item.programId)) || !Number.isInteger(item.amountMinor) || item.amountMinor < 0)) return failure(candidate, "validation-failed", "Source spend references or minor-unit amount are invalid.", "sourceSpend");
  if (candidate.workQualityChecks.some((item) => !workIds.has(item.workItemId) || !teamIds.has(item.checkedBy)) || candidate.coachingActions.some((item) => !teamIds.has(item.teamMemberId) || item.linkedWorkItemIds.some((idValue) => !workIds.has(idValue)))) return failure(candidate, "validation-failed", "Team evidence references are invalid.", "team");
  if (candidate.goalRevisions.some((item) => !teamIds.has(item.ownerId) || item.scope.programIds.some((idValue) => !programIds.has(idValue))) || candidate.processVersions.some((item) => !programIds.has(item.programId) || !teamIds.has(item.ownerId))) return failure(candidate, "validation-failed", "Goal or process references are invalid.", "governance");
  return { ok: true, value: structuredClone(candidate), revision: candidate.revision, message: "V2 snapshot validated." };
}

export function createDemoRepositoryV2(seed: DemoSnapshotV2 = DEMO_SNAPSHOT_V2): DemoRepositoryV2 {
  const validatedSeed = validateDemoSnapshot(seed);
  if (!validatedSeed.ok) throw new Error(validatedSeed.message);
  const frozenSeed = structuredClone(validatedSeed.value);
  let current = structuredClone(frozenSeed);
  return {
    async load() { return { ok: true, value: structuredClone(current), revision: current.revision, message: "V2 snapshot loaded." }; },
    async save(next, expectedRevision) {
      if (expectedRevision !== current.revision) return {
        ok: false,
        errors: [{ code: "stale-revision", message: "Stale revision.", field: "expectedRevision", relatedRecords: [] }],
        revision: current.revision,
        message: "Stale revision.",
      };
      const checked = validateDemoSnapshot(next);
      if (!checked.ok) return checked;
      current = { ...structuredClone(checked.value), revision: current.revision + 1 };
      return { ok: true, value: structuredClone(current), revision: current.revision, message: "V2 snapshot saved." };
    },
    async reset() {
      current = structuredClone(frozenSeed);
      return { ok: true, value: structuredClone(current), revision: current.revision, message: "V2 snapshot reset." };
    },
  };
}

export const V2_RECORD_COUNTS = {
  markets: DEMO_SNAPSHOT_V2.markets.length,
  reporters: DEMO_SNAPSHOT_V2.reporters.length,
  laxMainRequests: DEMO_SNAPSHOT_V2.demandRequests.filter((item) => String(item.id).startsWith("req-lax-1")).length,
  baselineAcceptedAssignments: DEMO_SNAPSHOT_V2.assignmentEvents.filter((item) => String(item.requestId).startsWith("req-lax-1") && item.state === "accepted").length,
  checklistEnrollments: DEMO_SNAPSHOT_V2.programEnrollments.filter((item) => item.programId === checklistProgramId).length,
} as const;
