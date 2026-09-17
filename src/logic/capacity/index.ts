import type {
  AssignmentEvent, DemandRequest, DemoSnapshotV2, EvidenceBundle, MetricDefinitionRef,
  Reporter, ReporterId, RequestId, ResolvedRecordReference, UtcTimestamp,
  WorkspaceFilterPayload, WorkspaceLogicPort, WorkspaceQueryContext,
} from "../../contracts/v2";

export const CAPACITY_WORKSPACE = "markets" as const;
export type CapacityLogicPort = WorkspaceLogicPort<typeof CAPACITY_WORKSPACE>;
export type RequestCapacityStatus = "confirmed" | "possible-match" | "no-verified-ready-match" | "requirements-unknown";

export interface CandidateAssessment {
  readonly reporterId: ReporterId; readonly reporterName: string; readonly eligible: boolean;
  readonly failures: readonly string[]; readonly unknowns: readonly string[];
  /** Candidate lists are options, never additive usable capacity. */
  readonly sharedRequestIds: readonly RequestId[];
}
export interface RequestCapacityAssessment {
  readonly request: DemandRequest; readonly status: RequestCapacityStatus;
  readonly acceptedReporterId: ReporterId | null; readonly candidates: readonly CandidateAssessment[];
  readonly reasons: readonly string[]; readonly invalidAcceptanceReasons: readonly string[];
}
export interface CoverageSummary {
  readonly requested: number; readonly confirmed: number; readonly possible: number;
  readonly noVerifiedReadyMatch: number; readonly requirementsUnknown: number; readonly confirmedRate: number | null;
}
export interface RequirementBreakdownRow {
  readonly kind: "proceeding" | "attendance" | "capability" | "week"; readonly value: string;
  readonly requested: number; readonly confirmed: number; readonly possible: number; readonly unresolved: number;
}
export interface GrowthGoalView {
  readonly goalRevisionId: string; readonly goalId: string; readonly target: number;
  readonly baselineAsOfAt: UtcTimestamp; readonly deadline: UtcTimestamp; readonly actual: number;
  readonly metric: MetricDefinitionRef; readonly evidence: EvidenceBundle;
}
export interface OriginalPlanResults {
  readonly status: "available" | "unavailable"; readonly requestIds: readonly RequestId[];
  readonly completedRequests: number | null; readonly firstJobs: number | null;
  readonly evidence: readonly EvidenceBundle[]; readonly limitation: string | null;
}
export interface MarketSummaryRow {
  readonly marketId: string; readonly marketName: string; readonly coverage: CoverageSummary;
  readonly issue: string; readonly nextAction: string; readonly evidence: readonly EvidenceBundle[];
}
export interface PreparedMarketsView {
  readonly workspace: typeof CAPACITY_WORKSPACE;
  readonly evaluation: WorkspaceQueryContext<typeof CAPACITY_WORKSPACE>["evaluation"];
  readonly appliedFilters: WorkspaceFilterPayload; readonly evidence: readonly EvidenceBundle[];
  readonly coverage: CoverageSummary; readonly requests: readonly RequestCapacityAssessment[];
  readonly requirementBreakdown: readonly RequirementBreakdownRow[]; readonly marketRows: readonly MarketSummaryRow[];
  readonly growthGoal: GrowthGoalView | null; readonly originalPlan: OriginalPlanResults;
  readonly limitations: readonly string[];
}
interface CandidateCheck { readonly failures: readonly string[]; readonly unknowns: readonly string[]; }
interface AcceptedCheck { readonly reporterId: ReporterId | null; readonly reasons: readonly string[]; }
type Context = WorkspaceQueryContext<typeof CAPACITY_WORKSPACE>;

const before = (a: string, b: string) => Date.parse(a) <= Date.parse(b);
const overlap = (as: string, ae: string, bs: string, be: string) => Date.parse(as) < Date.parse(be) && Date.parse(bs) < Date.parse(ae);
const requestRef = (id: RequestId) => ({ kind: "demand-request" as const, id: String(id) });
const reporterRef = (id: ReporterId) => ({ kind: "reporter" as const, id: String(id) });
const isVisible = (reporter: Reporter, asOf: UtcTimestamp) => before(reporter.createdAt, asOf) && before(reporter.recordedAt, asOf);

function scoped(snapshot: DemoSnapshotV2, filters: WorkspaceFilterPayload, asOf: UtcTimestamp, plan: boolean) {
  const selected = new Set(filters.selectedMarket === "ALL" ? snapshot.markets.map((market) => market.id) : [filters.selectedMarket]);
  const markets = new Set(filters.marketIds), ids = new Set(filters.requestIds.map(String));
  const capabilities = new Set(filters.capabilityCodes.map(String)), modes = new Set(filters.attendanceModes);
  return snapshot.demandRequests.filter((request) => {
    if (!before(request.recordedAt, asOf) || !selected.has(request.marketId)) return false;
    if (markets.size && !markets.has(request.marketId)) return false;
    if (ids.size && !ids.has(String(request.id))) return false;
    if (capabilities.size && ![...capabilities].every((capability) => request.requiredCapabilityCodes.some((item) => String(item) === capability))) return false;
    if (modes.size && !modes.has(request.attendanceMode)) return false;
    if (filters.window && (Date.parse(request.startAt) < Date.parse(filters.window.startAt) || Date.parse(request.startAt) >= Date.parse(filters.window.endAt))) return false;
    return plan || Date.parse(request.startAt) >= Date.parse(asOf);
  });
}
function latestAssignments(snapshot: DemoSnapshotV2, asOf: UtcTimestamp) {
  const latest = new Map<string, AssignmentEvent>();
  for (const item of snapshot.assignmentEvents) {
    if (!before(item.recordedAt, asOf) || !before(item.occurredAt, asOf)) continue;
    const key = String(item.requestId) + ":" + String(item.reporterId), prior = latest.get(key);
    if (!prior || (item.occurredAt + item.recordedAt + item.id) > (prior.occurredAt + prior.recordedAt + prior.id)) latest.set(key, item);
  }
  return [...latest.values()];
}
function unknownRequirements(request: DemandRequest): readonly string[] {
  const issues: string[] = [];
  if (!request.requirementsVersion.trim()) issues.push("Requirements version is not recorded.");
  if (!request.proceedingType.trim()) issues.push("Proceeding type is not recorded.");
  if (!request.requiredCapabilityCodes.length && !request.sampleCredentialRequirements.length) issues.push("No required capability or sample credential is recorded.");
  return issues;
}
function reservations(snapshot: DemoSnapshotV2, assignments: readonly AssignmentEvent[]) {
  const requests = new Map(snapshot.demandRequests.map((request) => [String(request.id), request]));
  const result = new Map<ReporterId, DemandRequest[]>();
  for (const assignment of assignments) {
    const request = requests.get(String(assignment.requestId));
    if (assignment.state !== "accepted" || !request || request.status === "canceled") continue;
    const items = result.get(assignment.reporterId) ?? []; items.push(request); result.set(assignment.reporterId, items);
  }
  return result;
}
function latestCapabilityStatus(snapshot: DemoSnapshotV2, reporterId: ReporterId, capability: string, asOf: UtcTimestamp) {
  return snapshot.capabilityVerifications
    .filter((item) => item.reporterId === reporterId && String(item.capabilityCode) === capability && before(item.recordedAt, asOf))
    .sort((left, right) => (right.recordedAt + String(right.id)).localeCompare(left.recordedAt + String(left.id)))[0] ?? null;
}
function latestLifecycleState(snapshot: DemoSnapshotV2, reporterId: ReporterId, asOf: UtcTimestamp) {
  return snapshot.lifecycleEvents
    .filter((item) => item.reporterId === reporterId && before(item.recordedAt, asOf) && before(item.occurredAt, asOf))
    .sort((left, right) => (right.occurredAt + right.recordedAt + String(right.id)).localeCompare(left.occurredAt + left.recordedAt + String(left.id)))[0]?.eventType ?? null;
}
function candidate(snapshot: DemoSnapshotV2, request: DemandRequest, reporter: Reporter, asOf: UtcTimestamp, reserved: Map<ReporterId, readonly DemandRequest[]>, self: RequestId | null): CandidateCheck {
  const failures: string[] = [], unknowns: string[] = [];
  if (latestLifecycleState(snapshot, reporter.id, asOf) === "closed") failures.push("Reporter has a closed lifecycle state.");
  if (!reporter.serviceMarketIds.includes(request.marketId)) failures.push("Reporter does not serve this demand market.");
  const scope = reporter.preferences.serviceMarkets.find((item) => item.marketId === request.marketId);
  if (scope?.status === "does-not-serve") failures.push("Reporter has recorded that this market is not served.");
  if (scope?.status === "needs-confirmation") unknowns.push("Service-market preference needs confirmation.");
  if (!reporter.preferences.attendanceModes.includes(request.attendanceMode)) failures.push("Attendance mode is not supported in recorded preferences.");
  if (!reporter.preferences.supportedProceedingTypes.includes(request.proceedingType)) failures.push("Proceeding type is not supported in recorded preferences.");
  for (const capability of request.requiredCapabilityCodes) {
    const latest = latestCapabilityStatus(snapshot, reporter.id, String(capability), asOf);
    if (latest?.status === "verified") continue;
    if (latest?.status === "not-demonstrated") failures.push("Required capability " + capability + " is not demonstrated.");
    else unknowns.push("Required capability " + capability + " is not verified.");
  }
  for (const requirement of request.sampleCredentialRequirements) {
    const rows = snapshot.credentialRecords.filter((item) => item.reporterId === reporter.id && item.label === requirement.requirementCode && (requirement.jurisdictionScope === null || item.jurisdictionScope === requirement.jurisdictionScope) && before(item.recordedAt, asOf));
    const valid = rows.some((item) => item.verificationStatus === "verified" && (item.validFrom === null || Date.parse(item.validFrom) <= Date.parse(request.startAt)) && (item.validUntil === null || Date.parse(item.validUntil) >= Date.parse(request.endAt)));
    if (valid) continue;
    if (rows.some((item) => item.verificationStatus === "not-demonstrated")) failures.push("Sample credential " + requirement.label + " is not demonstrated.");
    else unknowns.push("Sample credential " + requirement.label + " is not verified.");
  }
  if (!snapshot.readinessEvents.some((item) => item.reporterId === reporter.id && before(item.recordedAt, asOf) && before(item.occurredAt, asOf))) unknowns.push("No readiness event is recorded at this time.");
  const windows = snapshot.availabilityWindows.filter((item) => item.reporterId === reporter.id && before(item.recordedAt, asOf) && Date.parse(item.startAt) <= Date.parse(request.startAt) && Date.parse(item.endAt) >= Date.parse(request.endAt) && item.serviceMarketIds.includes(request.marketId) && item.attendanceModes.includes(request.attendanceMode));
  if (windows.some((item) => item.status === "unavailable")) failures.push("An explicit unavailable window covers this request.");
  if (!windows.some((item) => item.status === "available" && (item.confirmationExpiresAt === null || Date.parse(item.confirmationExpiresAt) > Date.parse(asOf)))) unknowns.push(windows.some((item) => item.status === "unknown" || item.status === "available") ? "Availability is unknown or its confirmation has expired." : "No explicit availability window covers the full request.");
  if ((reserved.get(reporter.id) ?? []).some((item) => item.id !== self && overlap(request.startAt, request.endAt, item.startAt, item.endAt))) failures.push("Reporter has an overlapping accepted commitment.");
  return { failures, unknowns };
}
function accepted(snapshot: DemoSnapshotV2, request: DemandRequest, asOf: UtcTimestamp, assignments: readonly AssignmentEvent[], reserved: Map<ReporterId, readonly DemandRequest[]>): AcceptedCheck {
  const rows = assignments.filter((item) => item.requestId === request.id && item.state === "accepted");
  if (!rows.length) return { reporterId: null, reasons: [] };
  const reasons = [...unknownRequirements(request)];
  if (request.status === "canceled") reasons.push("Canceled requests cannot be confirmed.");
  if (rows.length !== 1) reasons.push("More than one active accepted reporter is recorded for this slot.");
  const row = rows[0], reporter = row && snapshot.reporters.find((item) => item.id === row.reporterId && isVisible(item, asOf));
  if (!reporter) reasons.push("The accepted reporter is not available in source records at this time.");
  else { const check = candidate(snapshot, request, reporter, asOf, reserved, request.id); reasons.push(...check.failures, ...check.unknowns); }
  return reasons.length || !row ? { reporterId: null, reasons } : { reporterId: row.reporterId, reasons: [] };
}
function definition(snapshot: DemoSnapshotV2, id: string): MetricDefinitionRef | null {
  const row = snapshot.metricDefinitions.find((item) => String(item.id) === id);
  return row ? { id: row.id, version: row.version } : null;
}
function filtersWithRequests(filters: WorkspaceFilterPayload, ids: readonly RequestId[]): WorkspaceFilterPayload {
  return { ...filters, requestIds: ids, recordRefs: ids.map(requestRef) };
}
function readableRequest(snapshot: DemoSnapshotV2, request: DemandRequest): ResolvedRecordReference {
  const market = snapshot.markets.find((item) => item.id === request.marketId);
  return { kind: "demand-request", id: String(request.id), label: (market?.name ?? request.marketId) + " " + request.proceedingType + " (" + request.attendanceMode + ") — " + request.startAt, occurredAt: request.startAt, joinPath: [requestRef(request.id)] };
}
function countEvidence(snapshot: DemoSnapshotV2, id: string, ref: MetricDefinitionRef | null, context: Context, requests: readonly DemandRequest[], explanation: string, unknownCount = 0): EvidenceBundle | null {
  if (!ref) return null;
  const filters = filtersWithRequests(context.filters, requests.map((item) => item.id));
  return {
    id: ("evidence-capacity-" + id + "-" + context.evaluation.snapshotRevision) as EvidenceBundle["id"], metric: ref, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: "requests",
    scope: { workspace: CAPACITY_WORKSPACE, marketBasis: "demand-market", selectedMarket: filters.selectedMarket, populationDescription: "Distinct request slots in the selected demand scope." }, filters, reportingWindow: filters.window,
    computation: { status: "available", value: requests.length, numerator: null, denominator: null }, contributingRecords: requests.map((item) => readableRequest(snapshot, item)), numeratorMembers: [], denominatorMembers: [], exclusions: [], unknownCount,
    limitations: ["Candidate options are not guaranteed simultaneously fillable capacity."], explanation,
    navigationTarget: { workspace: CAPACITY_WORKSPACE, intent: "evidence-list", filters, evidenceContext: { asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, metric: ref } },
  };
}
function coverageEvidence(snapshot: DemoSnapshotV2, context: Context, denominator: readonly DemandRequest[], confirmed: readonly RequestCapacityAssessment[]): EvidenceBundle | null {
  const ref = definition(snapshot, "M02"); if (!ref || !denominator.length) return null;
  const numerator = confirmed.map((item) => item.request), filters = filtersWithRequests(context.filters, denominator.map((item) => item.id));
  return {
    id: ("evidence-capacity-M02-" + context.evaluation.snapshotRevision) as EvidenceBundle["id"], metric: ref, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: "ratio",
    scope: { workspace: CAPACITY_WORKSPACE, marketBasis: "demand-market", selectedMarket: filters.selectedMarket, populationDescription: "Requested slots with one valid accepted reporter." }, filters, reportingWindow: filters.window,
    computation: { status: "available", value: numerator.length / denominator.length, numerator: numerator.length, denominator: denominator.length }, contributingRecords: numerator.map((item) => readableRequest(snapshot, item)), numeratorMembers: numerator.map((item) => requestRef(item.id)), denominatorMembers: denominator.map((item) => requestRef(item.id)),
    exclusions: denominator.filter((item) => !numerator.some((covered) => covered.id === item.id)).map((item) => ({ record: requestRef(item.id), reasonCode: "not-valid-confirmed-coverage", reason: "This request has no single valid accepted assignment at the selected time." })), unknownCount: 0,
    limitations: ["Offered and proposed assignments are not confirmed coverage."], explanation: String(numerator.length) + " of " + String(denominator.length) + " requested slots have one valid accepted reporter at the selected time.",
    navigationTarget: { workspace: CAPACITY_WORKSPACE, intent: "evidence-list", filters, evidenceContext: { asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, metric: ref } },
  };
}
function assessments(snapshot: DemoSnapshotV2, requests: readonly DemandRequest[], asOf: UtcTimestamp): readonly RequestCapacityAssessment[] {
  const assignments = latestAssignments(snapshot, asOf), reserved = reservations(snapshot, assignments);
  const values = requests.map((request) => {
    const valid = accepted(snapshot, request, asOf, assignments, reserved), requirements = unknownRequirements(request);
    const candidates = snapshot.reporters.filter((reporter) => isVisible(reporter, asOf)).map((reporter) => {
      const check = candidate(snapshot, request, reporter, asOf, reserved, null);
      return { reporterId: reporter.id, reporterName: reporter.fictionalName, eligible: !check.failures.length && !check.unknowns.length, failures: check.failures, unknowns: check.unknowns, sharedRequestIds: [] as readonly RequestId[] };
    });
    const status: RequestCapacityStatus = requirements.length ? "requirements-unknown" : valid.reporterId ? "confirmed" : candidates.some((item) => item.eligible) ? "possible-match" : "no-verified-ready-match";
    return { request, status, acceptedReporterId: valid.reporterId, candidates, reasons: requirements, invalidAcceptanceReasons: valid.reasons };
  });
  const candidates = new Map<ReporterId, RequestId[]>();
  for (const value of values.filter((item) => item.status === "possible-match")) for (const candidateValue of value.candidates.filter((item) => item.eligible)) {
    const ids = candidates.get(candidateValue.reporterId) ?? []; ids.push(value.request.id); candidates.set(candidateValue.reporterId, ids);
  }
  return values.map((value) => ({ ...value, candidates: value.candidates.map((item) => ({ ...item, sharedRequestIds: candidates.get(item.reporterId) ?? [] })) }));
}
function summary(values: readonly RequestCapacityAssessment[]): CoverageSummary {
  const count = (status: RequestCapacityStatus) => values.filter((item) => item.status === status).length, requested = values.length, confirmed = count("confirmed");
  return { requested, confirmed, possible: count("possible-match"), noVerifiedReadyMatch: count("no-verified-ready-match"), requirementsUnknown: count("requirements-unknown"), confirmedRate: requested ? confirmed / requested : null };
}
function requirements(values: readonly RequestCapacityAssessment[]): readonly RequirementBreakdownRow[] {
  const groups = new Map<string, { kind: RequirementBreakdownRow["kind"]; value: string; rows: RequestCapacityAssessment[] }>();
  for (const value of values) {
    const parts: Array<[RequirementBreakdownRow["kind"], string]> = [["proceeding", String(value.request.proceedingType)], ["attendance", value.request.attendanceMode], ["week", value.request.startAt.slice(0, 10)], ...value.request.requiredCapabilityCodes.map((item) => ["capability", String(item)] as [RequirementBreakdownRow["kind"], string])];
    for (const [kind, label] of parts) { const key = kind + ":" + label, group = groups.get(key) ?? { kind, value: label, rows: [] }; group.rows.push(value); groups.set(key, group); }
  }
  return [...groups.values()].map((group) => ({ kind: group.kind, value: group.value, requested: group.rows.length, confirmed: group.rows.filter((item) => item.status === "confirmed").length, possible: group.rows.filter((item) => item.status === "possible-match").length, unresolved: group.rows.filter((item) => item.status !== "confirmed").length }));
}
function goal(snapshot: DemoSnapshotV2, context: Context): GrowthGoalView | null {
  const saved = snapshot.goalRevisions.filter((item) => String(item.metric.id) === "M04" && item.savedAt <= context.evaluation.asOfAt && (context.filters.selectedMarket === "ALL" || item.scope.marketIds.includes(context.filters.selectedMarket))).sort((a, b) => b.version - a.version || String(b.savedAt).localeCompare(String(a.savedAt)))[0];
  const ref = definition(snapshot, "M04"); if (!saved || !ref) return null;
  const cases = new Map(snapshot.acquisitionCases.map((item) => [item.id, item])), people = new Map(snapshot.reporters.map((item) => [item.id, item]));
  const rows = snapshot.readinessEvents.filter((event) => {
    if (!before(event.recordedAt, context.evaluation.asOfAt) || !before(event.occurredAt, context.evaluation.asOfAt) || Date.parse(event.occurredAt) <= Date.parse(saved.baselineAsOfAt) || Date.parse(event.occurredAt) > Date.parse(saved.deadline)) return false;
    const first = snapshot.readinessEvents.filter((item) => item.reporterId === event.reporterId).sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)))[0], acquisition = cases.get(event.acquisitionCaseId);
    if (first?.id !== event.id || !acquisition || acquisition.purpose !== "first-time" || (saved.scope.marketIds.length && !saved.scope.marketIds.includes(acquisition.ownerMarketId))) return false;
    const verificationIds = new Set(event.capabilityVerificationIds.map(String));
    return saved.scope.requiredCapabilityCodes.every((capability) => snapshot.capabilityVerifications.some((item) => item.reporterId === event.reporterId && item.capabilityCode === capability && item.status === "verified" && verificationIds.has(String(item.id)) && before(item.recordedAt, event.occurredAt)));
  });
  const filters = { ...filtersWithRequests(context.filters, []), marketBasis: "recruiting-market-at-entry" as const };
  const evidence: EvidenceBundle = {
    id: ("evidence-capacity-M04-" + context.evaluation.snapshotRevision) as EvidenceBundle["id"], metric: ref, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: "people",
    scope: { workspace: CAPACITY_WORKSPACE, marketBasis: "recruiting-market-at-entry", selectedMarket: filters.selectedMarket, populationDescription: "Unique first-time readiness additions in the saved goal scope." }, filters, reportingWindow: { startAt: saved.baselineAsOfAt, endAt: saved.deadline, boundary: "[start,end)" },
    computation: { status: "available", value: rows.length, numerator: null, denominator: null }, contributingRecords: rows.map((item) => ({ kind: "readiness-event", id: String(item.id), label: (people.get(item.reporterId)?.fictionalName ?? String(item.reporterId)) + " became ready", occurredAt: item.occurredAt, joinPath: [{ kind: "readiness-event", id: String(item.id) }, reporterRef(item.reporterId)] })), numeratorMembers: [], denominatorMembers: [], exclusions: [], unknownCount: 0,
    limitations: ["Readiness additions do not guarantee current availability or accepted coverage."], explanation: String(rows.length) + " unique first-time reporters became ready after the saved baseline and by its deadline.",
    navigationTarget: { workspace: CAPACITY_WORKSPACE, intent: "evidence-list", filters, evidenceContext: { asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, metric: ref } },
  };
  return { goalRevisionId: String(saved.id), goalId: String(saved.goalId), target: saved.target, baselineAsOfAt: saved.baselineAsOfAt, deadline: saved.deadline, actual: rows.length, metric: ref, evidence };
}
function isValidCompletedOutcome(snapshot: DemoSnapshotV2, outcome: DemoSnapshotV2["jobOutcomes"][number], asOf: UtcTimestamp): boolean {
  if (outcome.outcome !== "completed" || outcome.completedAt === null || !before(outcome.recordedAt, asOf) || !before(outcome.completedAt, asOf)) return false;
  const request = snapshot.demandRequests.find((item) => item.id === outcome.requestId);
  if (!request || Date.parse(outcome.completedAt) < Date.parse(request.endAt)) return false;
  return snapshot.assignmentEvents.some((item) =>
    item.id === outcome.acceptedAssignmentEventId &&
    item.state === "accepted" &&
    item.requestId === outcome.requestId &&
    item.reporterId === outcome.reporterId &&
    before(item.recordedAt, asOf) &&
    before(item.occurredAt, asOf),
  );
}
function originalPlan(snapshot: DemoSnapshotV2, context: Context): OriginalPlanResults {
  const ids = context.filters.requestIds;
  if (!ids.length) return { status: "unavailable", requestIds: [], completedRequests: null, firstJobs: null, evidence: [], limitation: "Original-plan results require an explicit frozen request ID set." };
  const requests = snapshot.demandRequests.filter((item) => ids.includes(item.id) && before(item.recordedAt, context.evaluation.asOfAt));
  const done = snapshot.jobOutcomes.filter((outcome) => requests.some((request) => request.id === outcome.requestId) && isValidCompletedOutcome(snapshot, outcome, context.evaluation.asOfAt));
  const earliest = new Map<ReporterId, typeof done[number]>();
  for (const item of snapshot.jobOutcomes.filter((outcome) => isValidCompletedOutcome(snapshot, outcome, context.evaluation.asOfAt))) { const existing = earliest.get(item.reporterId); if (!existing || Date.parse(item.completedAt!) < Date.parse(existing.completedAt!)) earliest.set(item.reporterId, item); }
  const first = done.filter((item) => earliest.get(item.reporterId)?.id === item.id), ref = definition(snapshot, "M05");
  if (!ref) return { status: "unavailable", requestIds: ids, completedRequests: null, firstJobs: null, evidence: [], limitation: "M05 metric definition is not available in the snapshot." };
  const filters = { ...filtersWithRequests(context.filters, ids), marketBasis: "job-market" as const };
  const bundle = (name: string, values: readonly typeof done[number][], population: string): EvidenceBundle => ({
    id: ("evidence-capacity-M05-" + name + "-" + context.evaluation.snapshotRevision) as EvidenceBundle["id"], metric: ref, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: "jobs",
    scope: { workspace: CAPACITY_WORKSPACE, marketBasis: "job-market", selectedMarket: filters.selectedMarket, populationDescription: population }, filters, reportingWindow: null, computation: { status: "available", value: values.length, numerator: null, denominator: null },
    contributingRecords: values.map((item) => ({ kind: "job-outcome", id: String(item.id), label: "Completed request " + item.requestId, occurredAt: item.completedAt, joinPath: [{ kind: "job-outcome", id: String(item.id) }, requestRef(item.requestId), reporterRef(item.reporterId)] })), numeratorMembers: [], denominatorMembers: [], exclusions: [], unknownCount: 0, limitations: ["This uses the frozen original-plan request set, including later cancellations or completions."], explanation: String(values.length) + " " + population + ".",
    navigationTarget: { workspace: CAPACITY_WORKSPACE, intent: "evidence-list", filters, evidenceContext: { asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, metric: ref } },
  });
  return { status: "available", requestIds: ids, completedRequests: done.length, firstJobs: first.length, evidence: [bundle("completed", done, "original-plan requests completed"), bundle("first-jobs", first, "first jobs completed")], limitation: null };
}
export function prepareMarketsWorkspace(snapshot: DemoSnapshotV2, context: Context): PreparedMarketsView {
  const live = scoped(snapshot, context.filters, context.evaluation.asOfAt, false).filter((item) => item.status === "open"), requests = assessments(snapshot, live, context.evaluation.asOfAt), coverage = summary(requests);
  const m01 = countEvidence(snapshot, "M01", definition(snapshot, "M01"), context, live, String(coverage.requested) + " distinct non-canceled request slots are upcoming in the selected schedule scope.");
  const m02 = coverageEvidence(snapshot, context, live, requests.filter((item) => item.status === "confirmed"));
  const m03 = (["possible-match", "no-verified-ready-match", "requirements-unknown"] as const).map((status) => countEvidence(snapshot, "M03-" + status, definition(snapshot, "M03"), context, requests.filter((item) => item.status === status).map((item) => item.request), status + " requests are derived from current requirements, readiness, verification, availability, scope, and accepted commitments.", status === "requirements-unknown" ? requests.filter((item) => item.status === status).length : 0)).filter((item): item is EvidenceBundle => item !== null);
  const goalValue = goal(snapshot, context), plan = originalPlan(snapshot, context);
  const marketRows = snapshot.markets.map((market) => {
    const values = assessments(snapshot, scoped(snapshot, { ...context.filters, selectedMarket: market.id, requestIds: [] }, context.evaluation.asOfAt, false).filter((item) => item.status === "open"), context.evaluation.asOfAt), itemSummary = summary(values);
    const issue = itemSummary.requirementsUnknown ? String(itemSummary.requirementsUnknown) + " request needs requirements confirmation" : itemSummary.noVerifiedReadyMatch ? String(itemSummary.noVerifiedReadyMatch) + " request has no verified ready match" : itemSummary.possible ? String(itemSummary.possible) + " request has unconfirmed candidate options" : "No unresolved upcoming request slots";
    return { marketId: market.id, marketName: market.name, coverage: itemSummary, issue, nextAction: itemSummary.requirementsUnknown ? "Confirm request requirements" : itemSummary.noVerifiedReadyMatch ? "Inspect the affected gap" : itemSummary.possible ? "Contact suitable available reporters" : "Monitor upcoming commitments", evidence: [] };
  });
  const limitations: string[] = [];
  if (!snapshot.metricDefinitions.some((item) => ["M01", "M02", "M03"].includes(String(item.id)))) limitations.push("Some capacity metric definitions are absent from the snapshot; their evidence is unavailable.");
  return { workspace: CAPACITY_WORKSPACE, evaluation: context.evaluation, appliedFilters: context.filters, evidence: [m01, m02, ...m03, ...(goalValue ? [goalValue.evidence] : []), ...plan.evidence].filter((item): item is EvidenceBundle => item !== null), coverage, requests, requirementBreakdown: requirements(requests), marketRows, growthGoal: goalValue, originalPlan: plan, limitations };
}
export const capacityLogic: CapacityLogicPort = { workspace: CAPACITY_WORKSPACE, prepare: prepareMarketsWorkspace };
