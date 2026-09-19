import type {
  AssignmentEvent, AvailabilityWindowId, DateWindow, DemandRequest, DemoSnapshotV2, EvidenceBundle, MarketId,
  MetricDefinitionRef, ReadinessEventId, Reporter, ReporterId, RequestId, ResolvedRecordReference, UtcTimestamp,
  WorkspaceFilterPayload, WorkspaceLogicPort, WorkspaceNavigationTarget, WorkspaceQueryContext,
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
  readonly marketIds: readonly MarketId[]; readonly ownerId: string; readonly unit: "people";
}
export interface OriginalPlanResults {
  readonly status: "available" | "unavailable"; readonly requestIds: readonly RequestId[];
  readonly completedRequests: number | null; readonly firstJobs: number | null;
  readonly evidence: readonly EvidenceBundle[]; readonly limitation: string | null;
}
export interface MarketSummaryRow {
  readonly marketId: string; readonly marketName: string; readonly coverage: CoverageSummary;
  readonly issue: string; readonly nextAction: string; readonly evidence: readonly EvidenceBundle[];
  /** Always supplied by prepareMarketsWorkspace; optional only for legacy hand-built view fixtures. */
  readonly overview?: PreparedMarketOverviewRow;
  readonly schedule?: PreparedSchedulingWindow;
  readonly growthGoal?: GrowthGoalView | null;
  readonly attention?: readonly PreparedOverviewAttentionItem[];
}
export interface PreparedMarketsSourceIds {
  readonly marketIds: readonly MarketId[];
  readonly reporterIds: readonly ReporterId[];
  readonly requestIds: readonly RequestId[];
  readonly readinessEventIds: readonly ReadinessEventId[];
  readonly availabilityWindowIds: readonly AvailabilityWindowId[];
}
export interface PreparedMarketDirection {
  readonly state: "up" | "down" | "flat" | "insufficient-history";
  readonly comparedFromAt: UtcTimestamp | null;
  readonly comparedToAt: UtcTimestamp | null;
  readonly rule: string;
  readonly source: PreparedMarketsSourceIds;
}
export interface PreparedMarketOverviewRow {
  readonly gap: number;
  readonly supplyDirection: PreparedMarketDirection;
  readonly demandDirection: PreparedMarketDirection;
  readonly source: PreparedMarketsSourceIds;
}
export interface PreparedOverviewKpis {
  readonly marketCount: { readonly value: number; readonly source: PreparedMarketsSourceIds };
  readonly availableReporters: { readonly value: number; readonly source: PreparedMarketsSourceIds };
  readonly openSlots: { readonly value: number; readonly source: PreparedMarketsSourceIds };
  readonly projectedAdditionalNeed: {
    /** Maximum neededSupply across known future series points; null when no future point is recorded. */
    readonly value: number | null;
    readonly forecastPointAt: UtcTimestamp | null;
    readonly source: PreparedMarketsSourceIds;
    readonly rule: string;
  };
}
export interface PreparedOverviewFocus {
  readonly condition: "projected-additional-need" | "open-slots" | "available-supply" | "no-current-work";
  readonly finding: string;
  readonly nextAction: string;
  readonly source: PreparedMarketsSourceIds;
}
export interface PreparedOverviewAttentionItem {
  readonly id: "requirements-unknown" | "projected-additional-need" | "no-verified-ready-match" | "possible-match";
  readonly finding: string;
  readonly nextAction: string;
  readonly source: PreparedMarketsSourceIds;
  readonly marketIds: readonly MarketId[];
  readonly evidence: EvidenceBundle | null;
  readonly navigationTarget: WorkspaceNavigationTarget | null;
  readonly reporterTarget: WorkspaceNavigationTarget | null;
  readonly personTargets: readonly { readonly reporterId: ReporterId; readonly target: WorkspaceNavigationTarget }[];
}
export interface PreparedOverview {
  readonly kpis: PreparedOverviewKpis;
  readonly focus: PreparedOverviewFocus;
  /** Window-scoped requests: missing requirements, no verified match, possible match. */
  readonly attention: readonly PreparedOverviewAttentionItem[];
}
/**
 * A source-backed instant in the Overview supply-and-demand series. Historical points use facts that
 * occurred on or before the evaluation as-of time. Forecast points are not extrapolations: they
 * contain only future request and availability facts already recorded by that same as-of time.
 */
export interface SupplyDemandSeriesPoint {
  readonly at: UtcTimestamp;
  readonly phase: "historical" | "forecast";
  readonly isProjection: boolean;
  readonly availableSupply: number;
  readonly demand: number;
  readonly neededSupply: number;
  /** Distinct ready reporters with an explicit, current availability window in the selected market scope. */
  readonly reporterIds: readonly ReporterId[];
  /** Scheduled, non-canceled request slots active at this instant in the selected demand scope. */
  readonly demandRequestIds: readonly RequestId[];
  /** Source records establishing the ready and explicitly available supply values. */
  readonly readinessEventIds: readonly ReadinessEventId[];
  readonly availabilityWindowIds: readonly AvailabilityWindowId[];
}
export interface SupplyDemandSeries {
  /** The selected evaluation as-of time; points after it are known-schedule projections. */
  readonly forecastBoundaryAt: UtcTimestamp;
  readonly hasForecast: boolean;
  readonly points: readonly SupplyDemandSeriesPoint[];
  readonly limitations: readonly string[];
}
/** Slots in one declared window; these are not chart instants or person headcounts. */
export interface PreparedSchedulingWindow {
  /** Null only when no window was selected and no upcoming source request establishes one. */
  readonly window: DateWindow | null;
  readonly windowSource: "selected-window" | "known-upcoming-schedule" | "no-known-upcoming-work";
  readonly asOfAt: UtcTimestamp;
  readonly unit: "request-slots";
  readonly rule: string;
  readonly coverage: CoverageSummary & { readonly unresolved: number };
  readonly requestIds: readonly RequestId[];
  readonly confirmedRequestIds: readonly RequestId[];
  readonly unresolvedRequestIds: readonly RequestId[];
  readonly possibleRequestIds: readonly RequestId[];
  readonly noVerifiedReadyMatchRequestIds: readonly RequestId[];
  readonly requirementsUnknownRequestIds: readonly RequestId[];
  readonly excludedCanceledRequestIds: readonly RequestId[];
  readonly elapsedRequestIds: readonly RequestId[];
  readonly people: {
    readonly unit: "people";
    readonly confirmed: number;
    readonly confirmedReporterIds: readonly ReporterId[];
    readonly possibleCandidates: number;
    readonly possibleCandidateReporterIds: readonly ReporterId[];
    readonly sharedCandidates: readonly {
      readonly reporterId: ReporterId;
      readonly requestIds: readonly RequestId[];
      readonly overlappingRequestPairs: readonly (readonly [RequestId, RequestId])[];
    }[];
    readonly limitation: string;
  };
  readonly evidence: readonly EvidenceBundle[];
  readonly previousPeriod: {
    readonly status: "unavailable";
    readonly reason: string;
  };
}
export interface PreparedMarketsView {
  readonly workspace: typeof CAPACITY_WORKSPACE;
  readonly evaluation: WorkspaceQueryContext<typeof CAPACITY_WORKSPACE>["evaluation"];
  readonly appliedFilters: WorkspaceFilterPayload; readonly evidence: readonly EvidenceBundle[];
  readonly schedule?: PreparedSchedulingWindow;
  readonly coverage: CoverageSummary; readonly requests: readonly RequestCapacityAssessment[];
  readonly requirementBreakdown: readonly RequirementBreakdownRow[]; readonly marketRows: readonly MarketSummaryRow[];
  readonly growthGoal: GrowthGoalView | null; readonly originalPlan: OriginalPlanResults;
  /** Always supplied by prepareMarketsWorkspace; optional only for legacy hand-built view fixtures. */
  readonly supplyDemandSeries?: SupplyDemandSeries;
  /** Always supplied by prepareMarketsWorkspace; optional only for legacy hand-built view fixtures. */
  readonly overview?: PreparedOverview;
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
const activeAt = (startAt: string, endAt: string, at: string) => Date.parse(startAt) <= Date.parse(at) && Date.parse(at) < Date.parse(endAt);

function scopedMarketIds(snapshot: DemoSnapshotV2, filters: WorkspaceFilterPayload): readonly MarketId[] {
  const selected = filters.selectedMarket === "ALL" ? null : filters.selectedMarket;
  const explicit = new Set(filters.marketIds);
  return snapshot.markets
    .map((market) => market.id)
    .filter((marketId) => (selected === null || marketId === selected) && (!explicit.size || explicit.has(marketId)));
}

function scoped(snapshot: DemoSnapshotV2, filters: WorkspaceFilterPayload, asOf: UtcTimestamp, plan: boolean) {
  const selected = new Set(filters.selectedMarket === "ALL" ? snapshot.markets.map((market) => market.id) : [filters.selectedMarket]);
  const markets = new Set(filters.marketIds), ids = new Set(filters.requestIds.map(String));
  const recordIds = new Set(filters.recordRefs.filter((ref) => ref.kind === "demand-request").map((ref) => ref.id));
  const capabilities = new Set(filters.capabilityCodes.map(String)), modes = new Set(filters.attendanceModes);
  return snapshot.demandRequests.filter((request) => {
    if (!before(request.recordedAt, asOf) || !selected.has(request.marketId)) return false;
    if (markets.size && !markets.has(request.marketId)) return false;
    if (ids.size && !ids.has(String(request.id))) return false;
    if (recordIds.size && !recordIds.has(String(request.id))) return false;
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
    id: ("evidence-capacity-" + id + "-" + context.evaluation.snapshotRevision + "-" + encodeURIComponent(JSON.stringify([filters.selectedMarket, filters.window, sortedIds(requests.map((request) => request.id))]))) as EvidenceBundle["id"], metric: ref, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: "requests",
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
    id: ("evidence-capacity-M02-" + context.evaluation.snapshotRevision + "-" + encodeURIComponent(JSON.stringify([filters.selectedMarket, filters.window, sortedIds(denominator.map((request) => request.id))]))) as EvidenceBundle["id"], metric: ref, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: "ratio",
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
  const saved = snapshot.goalRevisions.filter((item) => String(item.metric.id) === "M04" && item.savedAt <= context.evaluation.asOfAt && (context.filters.selectedMarket === "ALL" || !item.scope.marketIds.length || item.scope.marketIds.includes(context.filters.selectedMarket)) && (!context.filters.marketIds.length || !item.scope.marketIds.length || item.scope.marketIds.some((marketId) => context.filters.marketIds.includes(marketId)))).sort((a, b) => b.version - a.version || String(b.savedAt).localeCompare(String(a.savedAt)))[0];
  if (!saved || !snapshot.metricDefinitions.some((item) => item.id === saved.metric.id && item.version === saved.metric.version)) return null;
  const ref = saved.metric;
  const cases = new Map(snapshot.acquisitionCases.map((item) => [item.id, item])), people = new Map(snapshot.reporters.map((item) => [item.id, item]));
  const rows = snapshot.readinessEvents.filter((event) => {
    if (!before(event.recordedAt, context.evaluation.asOfAt) || !before(event.occurredAt, context.evaluation.asOfAt) || Date.parse(event.occurredAt) <= Date.parse(saved.baselineAsOfAt) || Date.parse(event.occurredAt) > Date.parse(saved.deadline)) return false;
    const first = snapshot.readinessEvents.filter((item) => item.reporterId === event.reporterId && before(item.recordedAt, context.evaluation.asOfAt) && before(item.occurredAt, context.evaluation.asOfAt)).sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)) || String(a.id).localeCompare(String(b.id)))[0], acquisition = cases.get(event.acquisitionCaseId);
    if (first?.id !== event.id || !acquisition || acquisition.purpose !== "first-time" || (saved.scope.marketIds.length && !saved.scope.marketIds.includes(acquisition.ownerMarketId))) return false;
    const verificationIds = new Set(event.capabilityVerificationIds.map(String));
    return saved.scope.requiredCapabilityCodes.every((capability) => snapshot.capabilityVerifications.some((item) => item.reporterId === event.reporterId && item.capabilityCode === capability && item.status === "verified" && verificationIds.has(String(item.id)) && before(item.recordedAt, event.occurredAt)));
  });
  const filters: WorkspaceFilterPayload = {
    ...context.filters, selectedMarket: saved.scope.marketIds.length === 1 ? saved.scope.marketIds[0]! : "ALL",
    marketBasis: "recruiting-market-at-entry", marketIds: saved.scope.marketIds,
    reporterIds: sortedIds(rows.map((item) => item.reporterId)), acquisitionCaseIds: rows.map((item) => item.acquisitionCaseId),
    requestIds: [], workItemIds: [], programIds: saved.scope.programIds, programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [],
    capabilityCodes: saved.scope.requiredCapabilityCodes, attendanceModes: [], recordRefs: rows.map((item) => reporterRef(item.reporterId)), window: null,
  };
  const evidence: EvidenceBundle = {
    id: ("evidence-capacity-M04-" + context.evaluation.snapshotRevision) as EvidenceBundle["id"], metric: ref, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: "people",
    scope: { workspace: CAPACITY_WORKSPACE, marketBasis: "recruiting-market-at-entry", selectedMarket: filters.selectedMarket, populationDescription: "Unique first-time readiness additions in the saved goal scope." }, filters, reportingWindow: { startAt: new Date(Date.parse(saved.baselineAsOfAt) + 1).toISOString() as UtcTimestamp, endAt: new Date(Date.parse(saved.deadline) + 1).toISOString() as UtcTimestamp, boundary: "[start,end)" },
    computation: { status: "available", value: rows.length, numerator: null, denominator: null }, contributingRecords: rows.map((item) => ({ kind: "readiness-event", id: String(item.id), label: (people.get(item.reporterId)?.fictionalName ?? String(item.reporterId)) + " became ready", occurredAt: item.occurredAt, joinPath: [{ kind: "readiness-event", id: String(item.id) }, reporterRef(item.reporterId)] })), numeratorMembers: [], denominatorMembers: [], exclusions: [], unknownCount: 0,
    limitations: ["Readiness additions do not guarantee current availability or accepted coverage."], explanation: String(rows.length) + " unique first-time reporters became ready after the saved baseline and by its deadline.",
    navigationTarget: { workspace: "reporters", intent: "evidence-list", filters, evidenceContext: { asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, metric: saved.metric } },
  };
  return { goalRevisionId: String(saved.id), goalId: String(saved.goalId), target: saved.target, baselineAsOfAt: saved.baselineAsOfAt, deadline: saved.deadline, actual: rows.length, metric: saved.metric, evidence, marketIds: saved.scope.marketIds, ownerId: String(saved.ownerId), unit: "people" };
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
  if (!context.filters.requestIds.length) return { status: "unavailable", requestIds: [], completedRequests: null, firstJobs: null, evidence: [], limitation: "Original-plan results require an explicit frozen request ID set." };
  const requests = scoped(snapshot, context.filters, context.evaluation.asOfAt, true);
  const ids = sortedIds(requests.map((request) => request.id));
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
function supplyDemandSeries(snapshot: DemoSnapshotV2, context: Context): SupplyDemandSeries {
  const asOf = context.evaluation.asOfAt;
  const marketIds = new Set(scopedMarketIds(snapshot, context.filters));
  const requests = scoped(snapshot, context.filters, asOf, true).filter((item) => item.status !== "canceled");
  const reporters = snapshot.reporters.filter((reporter) =>
    reporter.serviceMarketIds.some((marketId) => marketIds.has(marketId)) && before(reporter.recordedAt, asOf),
  );
  const reporterIds = new Set(reporters.map((reporter) => reporter.id));
  const readiness = snapshot.readinessEvents.filter((item) =>
    reporterIds.has(item.reporterId) && before(item.recordedAt, asOf) && before(item.occurredAt, asOf),
  );
  const availability = snapshot.availabilityWindows.filter((item) =>
    reporterIds.has(item.reporterId) &&
    before(item.recordedAt, asOf) &&
    item.serviceMarketIds.some((marketId) => marketIds.has(marketId)),
  );
  const pointTimes = new Set<string>([asOf]);
  for (const request of requests) {
    pointTimes.add(request.startAt);
    pointTimes.add(request.endAt);
  }
  for (const event of readiness) pointTimes.add(event.occurredAt);
  for (const window of availability) {
    pointTimes.add(window.startAt);
    pointTimes.add(window.endAt);
  }
  const points = [...pointTimes]
    .sort((left, right) => Date.parse(left) - Date.parse(right) || left.localeCompare(right))
    .map((time) => {
      const knownAt = (Date.parse(time) < Date.parse(asOf) ? time : asOf) as UtcTimestamp;
      const acceptedReservations = reservations(snapshot, latestAssignments(snapshot, knownAt));
      const demandRequestIds = requests
        .filter((request) => before(request.createdAt, time) && before(request.recordedAt, asOf) && before(request.recordedAt, time) && activeAt(request.startAt, request.endAt, time))
        .map((request) => request.id)
        .sort((left, right) => String(left).localeCompare(String(right)));
      const supply = reporters
        .filter((reporter) => {
          if (!before(reporter.createdAt, time) || !before(reporter.recordedAt, time)) return false;
          if (!readiness.some((event) => event.reporterId === reporter.id && before(event.occurredAt, time) && before(event.recordedAt, time))) return false;
          if (latestLifecycleState(snapshot, reporter.id, knownAt) === "closed") return false;
          const windows = availability.filter((window) =>
            window.reporterId === reporter.id &&
            before(window.recordedAt, time) &&
            activeAt(window.startAt, window.endAt, time) &&
            window.serviceMarketIds.some((marketId) => marketIds.has(marketId) && reporter.serviceMarketIds.includes(marketId)),
          );
          if (windows.some((window) => window.status === "unavailable")) return false;
          if (!windows.some((window) => window.status === "available" && (window.confirmationExpiresAt === null || Date.parse(window.confirmationExpiresAt) > Date.parse(time)))) return false;
          return !(acceptedReservations.get(reporter.id) ?? []).some((request) => activeAt(request.startAt, request.endAt, time));
        })
        .map((reporter) => reporter.id)
        .sort((left, right) => String(left).localeCompare(String(right)));
      const supplyIds = new Set(supply);
      const readinessEventIds = readiness
        .filter((event) => supplyIds.has(event.reporterId) && before(event.occurredAt, time) && before(event.recordedAt, time))
        .map((event) => event.id)
        .sort((left, right) => String(left).localeCompare(String(right)));
      const availabilityWindowIds = availability
        .filter((window) => supplyIds.has(window.reporterId) && window.status === "available" && before(window.recordedAt, time) && activeAt(window.startAt, window.endAt, time))
        .map((window) => window.id)
        .sort((left, right) => String(left).localeCompare(String(right)));
      const phase: SupplyDemandSeriesPoint["phase"] = Date.parse(time) > Date.parse(asOf) ? "forecast" : "historical";
      return {
        at: time as UtcTimestamp,
        phase,
        isProjection: phase === "forecast",
        availableSupply: supply.length,
        demand: demandRequestIds.length,
        neededSupply: Math.max(demandRequestIds.length - supply.length, 0),
        reporterIds: supply,
        demandRequestIds,
        readinessEventIds,
        availabilityWindowIds,
      };
    });
  return {
    forecastBoundaryAt: asOf,
    hasForecast: points.some((point) => point.isProjection),
    points,
    limitations: [
      "Supply counts distinct reporters with recorded readiness and explicit current availability in the selected market scope; it does not assert request-specific qualification.",
      "Forecast points are known schedules and availability windows recorded by the selected as-of time, not a predictive staffing model.",
      "These points are instants, not scheduling-window totals. The difference is not request-specific unresolved coverage or a staffing recommendation.",
      "Needed supply is the non-negative difference between active scheduled request slots and distinct available supply at each source timestamp; possible matches are not added as capacity.",
    ],
  };
}
function sortedIds<T extends string>(values: readonly T[]): readonly T[] {
  return [...new Set(values)].sort((left, right) => String(left).localeCompare(String(right)));
}
function sourceIds(
  marketIds: readonly MarketId[],
  reporterIds: readonly ReporterId[] = [],
  requestIds: readonly RequestId[] = [],
  readinessEventIds: readonly ReadinessEventId[] = [],
  availabilityWindowIds: readonly AvailabilityWindowId[] = [],
): PreparedMarketsSourceIds {
  return {
    marketIds: sortedIds(marketIds), reporterIds: sortedIds(reporterIds), requestIds: sortedIds(requestIds),
    readinessEventIds: sortedIds(readinessEventIds), availabilityWindowIds: sortedIds(availabilityWindowIds),
  };
}
function pointSource(marketIds: readonly MarketId[], point: SupplyDemandSeriesPoint): PreparedMarketsSourceIds {
  return sourceIds(marketIds, point.reporterIds, point.demandRequestIds, point.readinessEventIds, point.availabilityWindowIds);
}
function candidateSource(
  snapshot: DemoSnapshotV2,
  marketIds: readonly MarketId[],
  assessments: readonly RequestCapacityAssessment[],
  asOf: UtcTimestamp,
): PreparedMarketsSourceIds {
  const reporterIds = sortedIds(assessments.flatMap((assessment) => assessment.candidates.filter((candidate) => candidate.eligible || (assessment.status !== "possible-match" && !candidate.failures.length)).map((candidate) => candidate.reporterId)));
  const contributing = new Set(reporterIds);
  const readinessEventIds = snapshot.readinessEvents
    .filter((event) => contributing.has(event.reporterId) && before(event.occurredAt, asOf) && before(event.recordedAt, asOf))
    .map((event) => event.id);
  const availabilityWindowIds = snapshot.availabilityWindows
    .filter((window) => contributing.has(window.reporterId) && before(window.recordedAt, asOf) && window.serviceMarketIds.some((marketId) => marketIds.includes(marketId)))
    .map((window) => window.id);
  return sourceIds(marketIds, reporterIds, assessments.map((assessment) => assessment.request.id), readinessEventIds, availabilityWindowIds);
}
function direction(
  marketIds: readonly MarketId[],
  points: readonly SupplyDemandSeriesPoint[],
  value: (point: SupplyDemandSeriesPoint) => number,
): PreparedMarketDirection {
  const historical = points.filter((point) => point.phase === "historical");
  if (historical.length < 2) {
    return { state: "insufficient-history", comparedFromAt: null, comparedToAt: null, rule: "Two historical source timestamps are required to describe a direction.", source: sourceIds(marketIds) };
  }
  const from = historical[historical.length - 2]!;
  const to = historical[historical.length - 1]!;
  const change = value(to) - value(from);
  return {
    state: change > 0 ? "up" : change < 0 ? "down" : "flat",
    comparedFromAt: from.at,
    comparedToAt: to.at,
    rule: "Compares the final two historical source timestamps; direction is the change in the prepared value.",
    source: sourceIds(
      marketIds,
      [...from.reporterIds, ...to.reporterIds],
      [...from.demandRequestIds, ...to.demandRequestIds],
      [...from.readinessEventIds, ...to.readinessEventIds],
      [...from.availabilityWindowIds, ...to.availabilityWindowIds],
    ),
  };
}
function overview(
  snapshot: DemoSnapshotV2,
  context: Context,
  series: SupplyDemandSeries,
  assessments: readonly RequestCapacityAssessment[],
): PreparedOverview {
  const marketIds = scopedMarketIds(snapshot, context.filters);
  const current = series.points.find((point) => point.at === context.evaluation.asOfAt)!;
  const openRequests = scoped(snapshot, context.filters, context.evaluation.asOfAt, true)
    .filter((request) => request.status === "open")
    .map((request) => request.id);
  const forecast = series.points.filter((point) => point.isProjection);
  const projected = forecast.reduce<SupplyDemandSeriesPoint | null>(
    (selected, point) => selected === null || point.neededSupply > selected.neededSupply ? point : selected,
    null,
  );
  const currentSource = pointSource(marketIds, current);
  const projectedSource = projected === null ? sourceIds(marketIds) : pointSource(marketIds, projected);
  const kpis: PreparedOverviewKpis = {
    marketCount: { value: marketIds.length, source: sourceIds(marketIds) },
    availableReporters: { value: current.availableSupply, source: currentSource },
    openSlots: { value: openRequests.length, source: sourceIds(marketIds, [], openRequests) },
    projectedAdditionalNeed: {
      value: projected?.neededSupply ?? null,
      forecastPointAt: projected?.at ?? null,
      source: projectedSource,
      rule: "The maximum neededSupply among source-backed future series points; each point is active scheduled request slots minus distinct explicitly available reporters, floored at zero.",
    },
  };
  const unresolved = assessments.filter((item) => item.status !== "confirmed");
  const focus: PreparedOverviewFocus = {
    condition: assessments.length ? "open-slots" : "no-current-work",
    finding: assessments.length ? String(assessments.length - unresolved.length) + " of " + assessments.length + " scheduling-window slots confirmed; " + unresolved.length + " unresolved."
      : "No upcoming request slots in the scheduling window.",
    nextAction: unresolved.length ? "Inspect unresolved requests in this window." : "Monitor scheduled commitments.",
    source: sourceIds(marketIds, [], (unresolved.length ? unresolved : assessments).map((item) => item.request.id)),
  };
  return { kpis, focus, attention: requestAttention(snapshot, context, assessments) };
}

function requestAttention(snapshot: DemoSnapshotV2, context: Context, values: readonly RequestCapacityAssessment[]): readonly PreparedOverviewAttentionItem[] {
  return (["requirements-unknown", "no-verified-ready-match", "possible-match"] as const).flatMap((status) => {
    const matching = values.filter((item) => item.status === status);
    if (!matching.length) return [];
    const marketIds = sortedIds(matching.map((item) => item.request.marketId));
    const source = status === "requirements-unknown"
      ? sourceIds(marketIds, [], matching.map((item) => item.request.id))
      : candidateSource(snapshot, marketIds, matching, context.evaluation.asOfAt);
    const nextAction = status === "requirements-unknown" ? "Confirm the missing request requirements."
      : status === "possible-match" ? "Inspect suitable reporters and request acceptance." : "Inspect the affected requests and missing readiness evidence.";
    const finding = String(matching.length) + " request slots: " + (status === "requirements-unknown" ? "requirements need confirmation."
      : status === "possible-match" ? "unconfirmed candidate options." : "no verified ready match.");
    const evidence = countEvidence(snapshot, "M03-" + status, definition(snapshot, "M03"), context,
      matching.map((item) => item.request), finding, status === "requirements-unknown" ? matching.length : 0);
    const reporterTarget: WorkspaceNavigationTarget | null = evidence && source.reporterIds.length ? {
      workspace: "reporters", intent: "evidence-list", evidenceContext: evidence.navigationTarget.evidenceContext,
      filters: { ...context.filters, marketBasis: "service-market", marketIds, reporterIds: source.reporterIds,
        requestIds: [], acquisitionCaseIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [],
        recordRefs: source.reporterIds.map(reporterRef), window: null },
    } : null;
    const personTargets = reporterTarget ? source.reporterIds.map((reporterId) => {
      const ready = snapshot.readinessEvents.some((event) => event.reporterId === reporterId && before(event.recordedAt, context.evaluation.asOfAt) && before(event.occurredAt, context.evaluation.asOfAt));
      const target: WorkspaceNavigationTarget = { ...reporterTarget, workspace: ready ? "reporters" : "recruiting", intent: "record-detail",
        filters: { ...reporterTarget.filters, reporterIds: [reporterId], recordRefs: [reporterRef(reporterId)],
          acquisitionCaseIds: ready ? [] : snapshot.acquisitionCases.filter((item) => item.reporterId === reporterId && before(item.recordedAt, context.evaluation.asOfAt)).map((item) => item.id) } };
      return { reporterId, target };
    }) : [];
    return [{ id: status, finding, nextAction, source, marketIds, evidence, navigationTarget: evidence?.navigationTarget ?? null, reporterTarget, personTargets }];
  });
}

function resolveSchedule(snapshot: DemoSnapshotV2, context: Context): { window: DateWindow | null; windowSource: PreparedSchedulingWindow["windowSource"] } {
  if (context.filters.window) return { window: context.filters.window, windowSource: "selected-window" };
  const upcoming = scoped(snapshot, context.filters, context.evaluation.asOfAt, false).filter((item) => item.status === "open");
  if (!upcoming.length) return { window: null, windowSource: "no-known-upcoming-work" };
  const end = Math.max(...upcoming.map((item) => Date.parse(item.endAt)));
  return {
    window: { startAt: context.evaluation.asOfAt, endAt: new Date(end).toISOString() as UtcTimestamp, boundary: "[start,end)" },
    windowSource: "known-upcoming-schedule",
  };
}

function schedulingWindow(snapshot: DemoSnapshotV2, context: Context, resolved: ReturnType<typeof resolveSchedule>, values: readonly RequestCapacityAssessment[]): PreparedSchedulingWindow {
  const ids = (status: RequestCapacityStatus) => sortedIds(values.filter((item) => item.status === status).map((item) => item.request.id));
  const coverage = summary(values);
  const confirmedReporterIds = sortedIds(values.flatMap((item) => item.acceptedReporterId && item.status === "confirmed" ? [item.acceptedReporterId] : []));
  const possible = values.filter((item) => item.status === "possible-match");
  const possibleCandidateReporterIds = sortedIds(possible.flatMap((item) => item.candidates.filter((candidate) => candidate.eligible).map((candidate) => candidate.reporterId)));
  const sharedCandidates = possibleCandidateReporterIds.flatMap((reporterId) => {
    const relatedIds = new Set(possible.flatMap((item) => item.candidates.filter((candidate) => candidate.reporterId === reporterId && candidate.eligible).flatMap((candidate) => candidate.sharedRequestIds)));
    const requests = snapshot.demandRequests.filter((request) => relatedIds.has(request.id)).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    if (requests.length < 2) return [];
    const pairs: [RequestId, RequestId][] = [];
    requests.forEach((left, index) => requests.slice(index + 1).forEach((right) => {
      if (overlap(left.startAt, left.endAt, right.startAt, right.endAt)) pairs.push([left.id, right.id]);
    }));
    return [{ reporterId, requestIds: requests.map((item) => item.id), overlappingRequestPairs: pairs }];
  });
  const evidence = [
    countEvidence(snapshot, "M01", definition(snapshot, "M01"), context, values.map((item) => item.request), "Non-canceled upcoming request slots starting in the declared scheduling window."),
    coverageEvidence(snapshot, context, values.map((item) => item.request), values.filter((item) => item.status === "confirmed")),
    countEvidence(snapshot, "M02-confirmed-slots", definition(snapshot, "M02"), context, values.filter((item) => item.status === "confirmed").map((item) => item.request), "Request slots with one valid accepted assignment; this is not a count of people."),
    countEvidence(snapshot, "M03-unresolved", definition(snapshot, "M03"), context, values.filter((item) => item.status !== "confirmed").map((item) => item.request), "Unresolved = possible + no verified ready match + requirements unknown. Categories are exclusive."),
    ...requestAttention(snapshot, context, values).map((item) => item.evidence),
  ].filter((item): item is EvidenceBundle => item !== null);
  const all = scoped(snapshot, context.filters, context.evaluation.asOfAt, true);
  return {
    ...resolved, asOfAt: context.evaluation.asOfAt, unit: "request-slots",
    rule: "One request is one reporter slot. Include known, open requests starting in [start,end) and at or after as-of. Requested = confirmed + unresolved; unresolved = possible + no verified ready match + requirements unknown. Elapsed and canceled requests are excluded.",
    coverage: { ...coverage, unresolved: coverage.requested - coverage.confirmed },
    requestIds: sortedIds(values.map((item) => item.request.id)), confirmedRequestIds: ids("confirmed"),
    unresolvedRequestIds: sortedIds(values.filter((item) => item.status !== "confirmed").map((item) => item.request.id)),
    possibleRequestIds: ids("possible-match"), noVerifiedReadyMatchRequestIds: ids("no-verified-ready-match"), requirementsUnknownRequestIds: ids("requirements-unknown"),
    excludedCanceledRequestIds: sortedIds(all.filter((item) => item.status === "canceled").map((item) => item.id)),
    elapsedRequestIds: sortedIds(all.filter((item) => item.status !== "canceled" && Date.parse(item.startAt) < Date.parse(context.evaluation.asOfAt)).map((item) => item.id)),
    people: { unit: "people", confirmed: confirmedReporterIds.length, confirmedReporterIds, possibleCandidates: possibleCandidateReporterIds.length, possibleCandidateReporterIds, sharedCandidates,
      limitation: "Distinct people are separate from slots. A person can cover separate non-overlapping slots. Shared options, especially overlapping pairs, are not guaranteed simultaneously fillable capacity." },
    evidence,
    previousPeriod: { status: "unavailable", reason: "No frozen comparable prior scheduling-window evaluation is supplied. Current request status and verification records do not establish an equivalent prior-period coverage snapshot; instant chart points are not weekly slot totals." },
  };
}

export function prepareMarketsWorkspace(snapshot: DemoSnapshotV2, context: Context): PreparedMarketsView & { readonly schedule: PreparedSchedulingWindow } {
  const resolved = resolveSchedule(snapshot, context);
  const scheduleContext: Context = { ...context, filters: { ...context.filters, window: resolved.window } };
  const live = scoped(snapshot, scheduleContext.filters, context.evaluation.asOfAt, false).filter((item) => item.status === "open");
  const requests = assessments(snapshot, live, context.evaluation.asOfAt), coverage = summary(requests);
  const schedule = schedulingWindow(snapshot, scheduleContext, resolved, requests);
  const goalValue = goal(snapshot, context), plan = originalPlan(snapshot, context), series = supplyDemandSeries(snapshot, context);
  const overviewValue = overview(snapshot, scheduleContext, series, requests);
  const marketIds = scopedMarketIds(snapshot, context.filters);
  const marketRows = snapshot.markets.filter((market) => marketIds.includes(market.id)).map((market) => {
    // Slice the same assessments: preserve the window, exact IDs and cross-market candidate contention.
    const values = requests.filter((item) => item.request.marketId === market.id), itemSummary = summary(values);
    const marketContext: Context = { ...scheduleContext, filters: { ...scheduleContext.filters, selectedMarket: market.id } };
    const marketSchedule = schedulingWindow(snapshot, marketContext, resolved, values);
    const attention = requestAttention(snapshot, marketContext, values);
    const marketSeries = supplyDemandSeries(snapshot, { ...context, filters: { ...context.filters, selectedMarket: market.id } });
    const current = marketSeries.points.find((point) => point.at === context.evaluation.asOfAt)!;
    return {
      marketId: market.id, marketName: market.name, coverage: itemSummary,
      issue: attention[0]?.finding ?? "No unresolved upcoming request slots",
      nextAction: attention[0]?.nextAction ?? "Monitor upcoming commitments", evidence: marketSchedule.evidence,
      schedule: marketSchedule, growthGoal: goal(snapshot, marketContext), attention,
      overview: { gap: current.neededSupply, supplyDirection: direction([market.id], marketSeries.points, (point) => point.availableSupply),
        demandDirection: direction([market.id], marketSeries.points, (point) => point.demand), source: pointSource([market.id], current) },
    };
  });
  const limitations: string[] = [];
  if (["M01", "M02", "M03"].some((id) => !snapshot.metricDefinitions.some((item) => String(item.id) === id))) limitations.push("Some capacity metric definitions are absent from the snapshot; their evidence is unavailable.");
  limitations.push("Scheduling-window coverage and readiness-goal progress have separate units and scopes. The legacy supply/demand series compares instant counts, not window coverage or guaranteed additional staffing need.");
  return { workspace: CAPACITY_WORKSPACE, evaluation: context.evaluation, appliedFilters: context.filters,
    evidence: [...schedule.evidence, ...(goalValue ? [goalValue.evidence] : []), ...plan.evidence], schedule, coverage, requests,
    requirementBreakdown: requirements(requests), marketRows, growthGoal: goalValue, originalPlan: plan,
    supplyDemandSeries: series, overview: overviewValue, limitations };
}
export const capacityLogic: CapacityLogicPort = { workspace: CAPACITY_WORKSPACE, prepare: prepareMarketsWorkspace };
