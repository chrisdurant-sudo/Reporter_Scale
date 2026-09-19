import type { AssignmentEvent, AttendanceMode, AvailabilityStatus, AvailabilityWindow, CapabilityVerification, CredentialRecord, DateWindow, DemoSnapshotV2, EvidenceBundle, JobOutcome, MarketId, RecordPointer, Reporter, ReporterId, ReporterPreferences, UtcTimestamp, WorkItemId, WorkspaceLogicPort, WorkspaceNavigationTarget, WorkspaceQueryContext } from "../../contracts/v2";
import { isValidHalfOpenWindow } from "../shared/time";
import { credentialProjection, latestCredentials } from "./credentials";
import { openReengagementWork } from "./commands";
import { reporterMatches } from "./scope";
import { before, exactFilters, includes, inWindow, known, latest, marketMatches, ms, ref, target } from "./support";
export { prepareNetworkCommand, prepareReengagementFollowUp } from "./commands";
export type { PreparedReengagementFollowUp, ReengagementFollowUpInput } from "./commands";

export const NETWORK_WORKSPACE = "reporters" as const;
export type NetworkLogicPort = WorkspaceLogicPort<typeof NETWORK_WORKSPACE>;
export type AvailabilityState = AvailabilityStatus | "expired";
type Context = WorkspaceQueryContext<typeof NETWORK_WORKSPACE>;
export interface NetworkCompliance { readonly state: "clear" | "expiring" | "needs-check"; readonly evidenceLabel: string; }
export interface NetworkSkill { readonly code: CapabilityVerification["capabilityCode"]; readonly label: string; readonly record: CapabilityVerification; readonly sourceRef: RecordPointer; readonly evidenceRef: RecordPointer; }
export interface NetworkAvailabilityCell { readonly marketId: MarketId; readonly attendanceMode: AttendanceMode; readonly state: AvailabilityState; readonly window: AvailabilityWindow | null; readonly sourceRef: RecordPointer | null; }
export interface NetworkReporterRow {
  readonly reporterId: ReporterId; readonly name: string; readonly serviceMarkets: readonly MarketId[];
  readonly readinessAt: UtcTimestamp; readonly availability: AvailabilityState; readonly capabilitySummary: string;
  readonly certificationSummary: string; readonly compliance: NetworkCompliance;
  readonly lastCompletedJobAt: UtcTimestamp | null; readonly recentJobCount: number;
  readonly followUp: "create-reengagement-task" | "open-task" | null;
  readonly readinessRef: RecordPointer; readonly verifiedSkills: readonly NetworkSkill[];
  readonly capabilityRecords: readonly CapabilityVerification[];
  readonly preferences: ReporterPreferences; readonly preferencesRef: RecordPointer;
  readonly credentialRecords: readonly CredentialRecord[];
  readonly availabilityWindows: readonly AvailabilityWindow[]; readonly availabilityCells: readonly NetworkAvailabilityCell[];
  readonly availabilityIsMixed: boolean; readonly availabilityLimitations: readonly string[];
  readonly firstCompletedJob: JobOutcome | null; readonly recentJobRefs: readonly RecordPointer[];
  readonly openReengagementWorkItemId: WorkItemId | null; readonly followUpTarget: WorkspaceNavigationTarget | null;
  readonly detailTarget: WorkspaceNavigationTarget; readonly checklistTarget: WorkspaceNavigationTarget | null;
}
export interface NetworkTrendPoint {
  readonly windowStartAt: UtcTimestamp; readonly windowEndAt: UtcTimestamp;
  readonly activeReporterIds: readonly ReporterId[]; readonly firstTimeEnteringReporterIds: readonly ReporterId[];
  readonly returningReporterIds: readonly ReporterId[]; readonly noRecentWorkReporterIds: readonly ReporterId[];
  readonly priorWindow: DateWindow; readonly currentWindow: DateWindow; readonly priorActiveReporterIds: readonly ReporterId[];
  readonly boundary: "[start,end)"; readonly marketBasis: "job-market"; readonly limitations: readonly string[];
}
export interface PreparedNetworkView {
  readonly workspace: typeof NETWORK_WORKSPACE; readonly evaluation: Context["evaluation"]; readonly appliedFilters: Context["filters"];
  readonly evidence: readonly EvidenceBundle[]; readonly reporters: readonly NetworkReporterRow[];
  readonly trend: readonly NetworkTrendPoint[]; readonly reengagementCandidates: readonly NetworkReporterRow[];
  readonly needsConfirmationReporterIds: readonly ReporterId[];
  readonly attention: readonly { reporterId: ReporterId; reason: "needs-availability-confirmation" | "no-recent-completed-work"; target: WorkspaceNavigationTarget }[];
  readonly followUpInputs: { readonly ownerOptions: readonly { id: DemoSnapshotV2["teamMembers"][number]["id"]; label: string }[]; readonly marketOptions: DemoSnapshotV2["markets"]; readonly ownerRequired: true; readonly dueAtRequired: true; readonly allowsUnassigned: true; readonly allowsNoDueDate: true; readonly asOfAt: UtcTimestamp };
  readonly filterScope: { readonly records: string; readonly recentWork: string; readonly trend: string; readonly firstJob: string; readonly availability: string };
}
const daysBefore = (at: UtcTimestamp, days: number) => new Date(ms(at) - days * 86_400_000).toISOString() as UtcTimestamp;

function latestAssignments(snapshot: DemoSnapshotV2, asOf: UtcTimestamp, occurredThrough: UtcTimestamp = asOf) {
  const result = new Map<string, AssignmentEvent>();
  for (const event of snapshot.assignmentEvents.filter((item) => known(item, asOf) && before(item.occurredAt, occurredThrough))) {
    const key = `${event.requestId}:${event.reporterId}`;
    const prior = result.get(key);
    if (!prior || ms(event.occurredAt) >= ms(prior.occurredAt)) result.set(key, event);
  }
  return result;
}
/** Completion is a separate fact, with a valid accepted-assignment join and actual work interval. */
function completedJobs(snapshot: DemoSnapshotV2, asOf: UtcTimestamp): JobOutcome[] {
  const result = new Map<string, JobOutcome>();
  for (const job of snapshot.jobOutcomes) {
    if (job.outcome !== "completed" || job.completedAt === null || !before(job.completedAt, asOf) || !before(job.recordedAt, asOf)) continue;
    const request = snapshot.demandRequests.find((item) => item.id === job.requestId);
    const reporter = snapshot.reporters.find((item) => item.id === job.reporterId);
    const acceptance = latestAssignments(snapshot, asOf, job.completedAt).get(`${job.requestId}:${job.reporterId}`);
    if (!request || !reporter || !before(request.createdAt, job.completedAt) || !before(request.recordedAt, asOf) || !before(reporter.createdAt, job.completedAt) || !before(reporter.recordedAt, asOf)) continue;
    if (!acceptance || acceptance.id !== job.acceptedAssignmentEventId || acceptance.state !== "accepted" || !before(request.endAt, job.completedAt) || (job.startedAt !== null && (!before(request.startAt, job.startedAt) || !before(job.startedAt, job.completedAt)))) continue;
    if (snapshot.assignmentEvents.some((event) => event.requestId === job.requestId && event.reporterId !== job.reporterId && latestAssignments(snapshot, asOf, job.completedAt!).get(`${event.requestId}:${event.reporterId}`)?.state === "accepted")) continue;
    const prior = result.get(job.requestId);
    if (!prior || ms(job.completedAt) < ms(prior.completedAt!)) result.set(job.requestId, job);
  }
  return [...result.values()];
}
/** Earliest valid completion is global to the person, before any workspace filter. */
export function firstCompletedJobs(snapshot: DemoSnapshotV2, asOfAt: UtcTimestamp) {
  const first = new Map<ReporterId, JobOutcome>();
  for (const job of completedJobs(snapshot, asOfAt).sort((a, b) => ms(a.completedAt!) - ms(b.completedAt!))) if (!first.has(job.reporterId)) first.set(job.reporterId, job);
  return [...first.values()];
}
function capabilitiesAt(snapshot: DemoSnapshotV2, reporterId: ReporterId, asOf: UtcTimestamp) {
  const result = new Map<string, CapabilityVerification>();
  for (const item of snapshot.capabilityVerifications.filter((item) => item.reporterId === reporterId && before(item.recordedAt, asOf))) {
    const prior = result.get(item.capabilityCode);
    if (!prior || ms(item.recordedAt) >= ms(prior.recordedAt)) result.set(item.capabilityCode, item);
  }
  return [...result.values()];
}
function readyAt(snapshot: DemoSnapshotV2, reporter: Reporter, asOf: UtcTimestamp) {
  if (!before(reporter.createdAt, asOf) || !before(reporter.recordedAt, asOf)) return undefined;
  const lifecycle = latest(snapshot.lifecycleEvents.filter((item) => item.reporterId === reporter.id && known(item, asOf)), (item) => item.occurredAt);
  if (lifecycle?.eventType === "closed") return undefined;
  return latest(snapshot.readinessEvents.filter((item) => item.reporterId === reporter.id && known(item, asOf)), (item) => item.occurredAt);
}
function availabilityProjection(snapshot: DemoSnapshotV2, reporter: Reporter, context: Context) {
  const asOf = context.evaluation.asOfAt;
  // Cover both supported attendance modes when no explicit attendance filter is selected.
  // Preferences are not confirmation; a missing cell stays unknown.
  const modes: readonly AttendanceMode[] = context.filters.attendanceModes.length ? context.filters.attendanceModes : ["remote", "in-person"];
  const windows = snapshot.availabilityWindows.filter((window) => window.reporterId === reporter.id && before(window.recordedAt, asOf) && window.serviceMarketIds.some((market) => marketMatches(market, context.filters)) && window.attendanceModes.some((mode) => modes.includes(mode)));
  const markets = [...new Set([...reporter.serviceMarketIds, ...windows.flatMap((window) => window.serviceMarketIds), ...(context.filters.selectedMarket === "ALL" ? context.filters.marketIds : [context.filters.selectedMarket])])].filter((market) => marketMatches(market, context.filters));
  const cells: NetworkAvailabilityCell[] = markets.flatMap((marketId) => modes.map((attendanceMode) => {
    const window = latest(windows.filter((item) => item.serviceMarketIds.includes(marketId) && item.attendanceModes.includes(attendanceMode) && inWindow(asOf, { startAt: item.startAt, endAt: item.endAt, boundary: "[start,end)" })), (item) => item.recordedAt) ?? null;
    const state: AvailabilityState = !window ? "unknown" : window.confirmationExpiresAt !== null && before(window.confirmationExpiresAt, asOf) ? "expired" : window.status;
    return { marketId, attendanceMode, state, window, sourceRef: window ? ref("availability-window", window.id) : null };
  }));
  const states = new Set(cells.map((cell) => cell.state));
  const summary: AvailabilityState = states.size === 1 ? cells[0]!.state : states.has("expired") && [...states].every((state) => state === "expired" || state === "unknown") ? "expired" : "unknown";
  return { availability: summary, availabilityWindows: windows, availabilityCells: cells, availabilityIsMixed: states.size > 1,
    availabilityLimitations: ["Availability is scoped to each dated market and attendance-mode record; missing scope is unknown.", "Mixed cells remain unknown, except an expired/missing-only mix retains expired: some scope has expired evidence and other scope may be missing. Inspect each bounded record.", "Preferences, credentials and recent work do not confirm availability."] };
}
function scopeJobs(snapshot: DemoSnapshotV2, jobs: readonly JobOutcome[], filters: Context["filters"]) {
  return jobs.filter((job) => {
    const request = snapshot.demandRequests.find((item) => item.id === job.requestId);
    if (!request || !marketMatches(request.marketId, filters) || !includes(filters.requestIds, job.requestId) || !includes(filters.jobOutcomeIds, job.id) || !includes(filters.attendanceModes, request.attendanceMode)) return false;
    const workReferences = filters.recordRefs.filter((item) => item.kind === "job-outcome" || item.kind === "demand-request" || item.kind === "assignment-event");
    if (!workReferences.length) return true;
    return filters.recordRefs.some((item) => item.kind === "job-outcome" ? item.id === job.id : item.kind === "demand-request" ? item.id === job.requestId : item.kind === "assignment-event" ? item.id === job.acceptedAssignmentEventId : item.kind === "reporter" ? item.id === job.reporterId : !workReferences.includes(item));
  });
}
function activityPopulation(snapshot: DemoSnapshotV2, context: Context, jobs: readonly JobOutcome[], window: DateWindow, asOf: UtcTimestamp) {
  const scoped = scopeJobs(snapshot, jobs, context.filters).filter((job) => inWindow(job.completedAt!, window));
  return snapshot.reporters.filter((reporter) => readyAt(snapshot, reporter, asOf) && reporterMatches(snapshot, reporter, context.filters, asOf, jobs, capabilitiesAt(snapshot, reporter.id, asOf)) && scoped.some((job) => job.reporterId === reporter.id)).map((reporter) => reporter.id);
}
function networkEvidence(snapshot: DemoSnapshotV2, context: Context, rows: readonly NetworkReporterRow[], jobs: readonly JobOutcome[], window: DateWindow): EvidenceBundle {
  const recent = rows.filter((row) => row.recentJobCount > 0);
  const support = recent.map((row) => latest(jobs.filter((job) => job.reporterId === row.reporterId && inWindow(job.completedAt!, window)), (job) => job.completedAt!)!);
  const references = support.map((job) => ({ ...ref("job-outcome", job.id), label: `${rows.find((row) => row.reporterId === job.reporterId)!.name} completed work in ${snapshot.demandRequests.find((request) => request.id === job.requestId)!.marketId}`, occurredAt: job.completedAt, joinPath: [ref("demand-request", job.requestId), ref("reporter", job.reporterId)] }));
  const filters = { ...exactFilters(context.filters.selectedMarket, "job-market"), matchNone: !support.length, reporterIds: recent.map((row) => row.reporterId), jobOutcomeIds: support.map((job) => job.id), recordRefs: references.map((item) => ref(item.kind, item.id)), window };
  const navigationTarget = target(snapshot, context.evaluation.asOfAt, filters, "reporters", "evidence-list");
  return { id: `evidence-network-recent-${snapshot.revision}` as EvidenceBundle["id"], metric: navigationTarget.evidenceContext.metric, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: "people", scope: { workspace: NETWORK_WORKSPACE, marketBasis: "job-market", selectedMarket: context.filters.selectedMarket, populationDescription: "Distinct ready reporters with completed jobs in the stated half-open window, based on actual job market." }, filters, reportingWindow: window, computation: { status: "available", value: recent.length, numerator: null, denominator: null }, contributingRecords: references, numeratorMembers: [], denominatorMembers: [], exclusions: [], unknownCount: rows.filter((row) => row.availability === "unknown" || row.availability === "expired").length, limitations: ["Recently working is not an availability claim.", "No recent work is not attrition or unwillingness.", "Service-market browsing is separate from actual job-market activity."], explanation: `${recent.length} distinct ready reporters completed work in ${context.filters.window ? "the selected half-open window" : "the trailing 28 elapsed days"}, using actual job market.`, navigationTarget };
}
export function prepareNetworkView(snapshot: DemoSnapshotV2, context: Context): PreparedNetworkView {
  const asOf = context.evaluation.asOfAt;
  if (context.evaluation.snapshotRevision !== snapshot.revision) throw new Error("Network evidence requires the queried snapshot revision.");
  const window: DateWindow = context.filters.window ?? { startAt: daysBefore(asOf, 28), endAt: asOf, boundary: "[start,end)" };
  if (!isValidHalfOpenWindow(window) || ms(window.endAt) > ms(asOf)) throw new Error("Network activity requires a valid observed half-open window.");
  const jobs = completedJobs(snapshot, asOf);
  const scopedJobs = scopeJobs(snapshot, jobs, context.filters);
  const globalFirst = firstCompletedJobs(snapshot, asOf);
  const rows: NetworkReporterRow[] = snapshot.reporters.flatMap((reporter) => {
    const readiness = readyAt(snapshot, reporter, asOf);
    const capabilities = capabilitiesAt(snapshot, reporter.id, asOf);
    if (!readiness || !reporterMatches(snapshot, reporter, context.filters, asOf, jobs, capabilities)) return [];
    const reporterJobs = scopedJobs.filter((job) => job.reporterId === reporter.id);
    const recentJobs = reporterJobs.filter((job) => inWindow(job.completedAt!, window));
    const lastCompletedJobAt = latest(reporterJobs, (job) => job.completedAt!)?.completedAt ?? null;
    const openWork = openReengagementWork(snapshot, reporter.id, asOf);
    const reengagement = recentJobs.length === 0 && lastCompletedJobAt !== null;
    const market = context.filters.selectedMarket !== "ALL" ? context.filters.selectedMarket : context.filters.marketIds.length === 1 ? context.filters.marketIds[0]! : "ALL";
    const detailTarget = target(snapshot, asOf, { ...exactFilters(market, context.filters.marketBasis), marketIds: context.filters.marketIds, reporterIds: [reporter.id], recordRefs: [ref("reporter", reporter.id)] });
    const cases = (snapshot.acquisitionCases ?? []).filter((item) => item.reporterId === reporter.id && before(item.openedAt, asOf) && before(item.recordedAt, asOf) && includes(context.filters.acquisitionCaseIds, item.id));
    const caseMarkets = [...new Set(cases.map((item) => item.ownerMarketId))];
    const checklistTarget = cases.length ? target(snapshot, asOf, { ...exactFilters(caseMarkets.length === 1 ? caseMarkets[0]! : "ALL", "recruiting-market-at-entry"), marketIds: caseMarkets, reporterIds: [reporter.id], acquisitionCaseIds: cases.map((item) => item.id), recordRefs: cases.map((item) => ref("acquisition-case", item.id)) }, "recruiting") : null;
    const verified = capabilities.filter((item) => item.status === "verified");
    return [{ reporterId: reporter.id, name: reporter.fictionalName, serviceMarkets: reporter.serviceMarketIds, readinessAt: readiness.occurredAt, readinessRef: ref("readiness-event", readiness.id), ...availabilityProjection(snapshot, reporter, context),
      capabilitySummary: capabilities.length ? `${verified.length} verified; ${capabilities.filter((item) => item.status === "unreviewed" || item.status === "needs-information").length} unknown; ${capabilities.filter((item) => item.status === "not-demonstrated").length} not demonstrated` : "No capability verification recorded",
      verifiedSkills: verified.map((record) => ({ code: record.capabilityCode, label: record.capabilityCode.replaceAll("-", " ").replaceAll("_", " "), record, sourceRef: ref("capability-verification", record.id), evidenceRef: record.evidenceRef })), capabilityRecords: capabilities,
      preferences: reporter.preferences, preferencesRef: ref("reporter", reporter.id), credentialRecords: latestCredentials(snapshot.credentialRecords ?? [], reporter.id, asOf), ...credentialProjection(snapshot.credentialRecords ?? [], reporter.id, asOf),
      lastCompletedJobAt, recentJobCount: recentJobs.length, recentJobRefs: recentJobs.map((job) => ref("job-outcome", job.id)), firstCompletedJob: globalFirst.find((job) => job.reporterId === reporter.id) ?? null,
      followUp: reengagement ? openWork ? "open-task" : "create-reengagement-task" : null,
      openReengagementWorkItemId: openWork?.id ?? null, followUpTarget: openWork ? target(snapshot, asOf, { ...exactFilters(market), reporterIds: [reporter.id], workItemIds: [openWork.id], recordRefs: [ref("work-item", openWork.id)] }, "team") : null, detailTarget, checklistTarget }];
  });
  const priorWindow: DateWindow = { startAt: daysBefore(window.startAt, 7), endAt: daysBefore(window.endAt, 7), boundary: "[start,end)" };
  const active = activityPopulation(snapshot, context, completedJobs(snapshot, window.endAt), window, window.endAt);
  const priorJobs = completedJobs(snapshot, priorWindow.endAt);
  const priorActive = activityPopulation(snapshot, context, priorJobs, priorWindow, priorWindow.endAt);
  const entering = active.filter((id) => !priorActive.includes(id));
  const firstTime = entering.filter((id) => { const first = globalFirst.find((job) => job.reporterId === id); return first !== undefined && ms(first.completedAt!) >= ms(priorWindow.endAt); });
  const needsConfirmationReporterIds = rows.filter((row) => row.availability === "unknown" || row.availability === "expired").map((row) => row.reporterId);
  return { workspace: NETWORK_WORKSPACE, evaluation: context.evaluation, appliedFilters: context.filters, reporters: rows, evidence: [networkEvidence(snapshot, context, rows, scopedJobs, window)], reengagementCandidates: rows.filter((row) => row.followUp !== null), needsConfirmationReporterIds,
    attention: rows.flatMap<PreparedNetworkView["attention"][number]>((row) => needsConfirmationReporterIds.includes(row.reporterId) ? [{ reporterId: row.reporterId, reason: "needs-availability-confirmation" as const, target: row.detailTarget }] : row.followUp ? [{ reporterId: row.reporterId, reason: "no-recent-completed-work" as const, target: row.followUpTarget ?? row.detailTarget }] : []),
    followUpInputs: { ownerOptions: (snapshot.teamMembers ?? []).filter((member) => before(member.activeFrom, asOf) && (member.activeTo === null || ms(member.activeTo) > ms(asOf))).map((member) => ({ id: member.id, label: member.fictionalName })), marketOptions: snapshot.markets ?? [], ownerRequired: true, dueAtRequired: true, allowsUnassigned: true, allowsNoDueDate: true, asOfAt: asOf },
    filterScope: { records: "Conjunctive exact IDs/record references and declared market basis; capability filters require verified evidence, mode filters use preferences.", recentWork: "Same record population; actual job market and attendance; selected window or trailing 28 elapsed days.", trend: "Same filters at each boundary; same-length half-open windows shifted seven days; readiness and records known at each boundary.", firstJob: "Globally earliest valid completion before any market or record filtering.", availability: "Current as-of time, per-market/mode bounded records; no preference or recent-work inference." },
    trend: [{ windowStartAt: window.startAt, windowEndAt: window.endAt, currentWindow: window, priorWindow, boundary: "[start,end)", marketBasis: "job-market", activeReporterIds: active, priorActiveReporterIds: priorActive, firstTimeEnteringReporterIds: firstTime, returningReporterIds: entering.filter((id) => !firstTime.includes(id)), noRecentWorkReporterIds: priorActive.filter((id) => !active.includes(id)), limitations: ["Set departure is not churn or unwillingness.", "First-time uses global first work; returning includes prior work outside this market.", "Boundary populations include only records known and ready at each evaluation time."] }] };
}
export function acceptedCommitmentIssues(snapshot: DemoSnapshotV2, asOfAt: UtcTimestamp): readonly string[] {
  const commitments = [...latestAssignments(snapshot, asOfAt).values()].filter((event) => event.state === "accepted");
  const issues: string[] = [];
  for (let i = 0; i < commitments.length; i += 1) for (let j = i + 1; j < commitments.length; j += 1) {
    const left = commitments[i]!, right = commitments[j]!;
    const leftRequest = snapshot.demandRequests.find((item) => item.id === left.requestId), rightRequest = snapshot.demandRequests.find((item) => item.id === right.requestId);
    if (!leftRequest || !rightRequest) continue;
    if (left.requestId === right.requestId && left.reporterId !== right.reporterId) issues.push(`Request ${left.requestId} has two accepted reporters.`);
    if (left.reporterId === right.reporterId && ms(leftRequest.startAt) < ms(rightRequest.endAt) && ms(rightRequest.startAt) < ms(leftRequest.endAt)) issues.push(`Reporter ${left.reporterId} has overlapping accepted work.`);
  }
  return issues;
}
export const networkLogic: NetworkLogicPort = { workspace: NETWORK_WORKSPACE, prepare: prepareNetworkView };
