import type { AcquisitionCase, AcquisitionCaseId, DateWindow, DemoSnapshotV2, EvidenceBundle, EvidenceBundleId, LifecycleEvent, LifecycleEventId, MarketId, MetricDefinitionRef, RecordPointer, Reporter, ReporterId, SourceId, UtcTimestamp, WorkItem, TeamMemberId, WorkspaceFilterPayload, WorkspaceNavigationTarget, SourceSpendId } from "../../contracts/v2";
import type { PreparedWorkspaceViewBase, WorkspaceQueryContext } from "../../contracts/v2";

import { projectWorkItemAt } from "../shared";

export const RECRUITING_WORKSPACE = "recruiting" as const;
const DAY = 86_400_000;
export type RecruitingStage = "sourced" | "contacted" | "responded" | "screening" | "qualified" | "onboarding" | "ready" | "paused" | "closed" | "first-job-completed" | "not-recorded";
export const FUNNEL_SLA_STATUSES = ["Applicant", "Screening", "Approved", "Onboarding", "Starting soon"] as const;
export type FunnelSlaStatus = (typeof FUNNEL_SLA_STATUSES)[number];
export type SlaEvaluationState = "under" | "at" | "over" | "not-applicable";
export interface FunnelSlaSet { readonly overallDays: number; readonly statusDays: Readonly<Record<FunnelSlaStatus, number>>; }
export interface FunnelSlaSetInput { readonly overallDays?: number; readonly statusDays?: Partial<Record<FunnelSlaStatus, number>>; }
/**
 * Demo-only input, initialized from the approved reference values. DemoSnapshotV2 has no persisted
 * SLA-policy record, so callers own this local value and must not present it as stored policy.
 */
export interface FunnelSlaInput { readonly defaultSet?: FunnelSlaSetInput; readonly marketOverrides?: Partial<Record<MarketId, FunnelSlaSetInput>>; }
export interface FunnelSlaConfiguration { readonly source: "demo-input-not-persisted"; readonly canonicalPolicyStatus: "not-present-in-DemoSnapshotV2"; readonly defaultSet: FunnelSlaSet; readonly marketOverrides: Readonly<Record<MarketId, FunnelSlaSet>>; }
export interface SlaEvaluation { readonly elapsedDays: number | null; readonly slaDays: number | null; readonly state: SlaEvaluationState; }
export interface CaseSlaEvaluation { readonly total: SlaEvaluation; readonly currentStatus: SlaEvaluation; }
export interface RecruitingAction { readonly kind: "screening" | "onboarding" | "work-item"; readonly label: string; readonly reason: string; readonly assignedTo: TeamMemberId | null; readonly waitingOnKey: string; readonly waitingOnLabel: string; readonly dueAt: UtcTimestamp | null; readonly record: RecordPointer; }
export interface CurrentCaseProjection { readonly acquisitionCaseId: AcquisitionCaseId; readonly reporterId: ReporterId; readonly reporterName: string; readonly marketId: MarketId; readonly sourceId: SourceId | null; readonly responsibility: CaseResponsibility; readonly stage: RecruitingStage; readonly funnelStatus: FunnelSlaStatus | null; readonly stageEnteredAt: UtcTimestamp | null; readonly stageEntryEventId: LifecycleEventId | null; readonly totalElapsedDays: number; readonly statusElapsedDays: number | null; readonly sla: CaseSlaEvaluation; readonly openActions: readonly RecruitingAction[]; }
export interface FunnelProgression extends CohortObservation { readonly entryWindow: DateWindow; readonly horizonDays: number; readonly matureCaseIds: readonly AcquisitionCaseId[]; readonly observingCaseIds: readonly AcquisitionCaseId[]; readonly stages: readonly { readonly stage: RecruitingStage; readonly caseIds: readonly AcquisitionCaseId[]; readonly conversion: CohortRatio; readonly notReachedCaseIds: readonly AcquisitionCaseId[]; readonly dropOffFromPreviousCaseIds: readonly AcquisitionCaseId[] }[]; }
export interface FunnelWaitTrendPoint { readonly asOfAt: UtcTimestamp; readonly meanElapsedDays: number | null; readonly acquisitionCaseIds: readonly AcquisitionCaseId[]; readonly lifecycleEventIds: readonly LifecycleEventId[]; }
export interface FunnelWaitTimeTrends { readonly R7: Readonly<Record<FunnelSlaStatus, readonly FunnelWaitTrendPoint[]>>; readonly R28: Readonly<Record<FunnelSlaStatus, readonly FunnelWaitTrendPoint[]>>; }
export type RecruitingLocalNoteTarget = { readonly kind: "candidate"; readonly acquisitionCaseId: AcquisitionCaseId } | { readonly kind: "process"; readonly marketId: "ALL" | MarketId };
export interface RecruitingLocalNote { readonly target: RecruitingLocalNoteTarget; readonly text: string; }
/** Local interaction state only: it is intentionally outside DemoSnapshotV2 and is never externally written. */
export interface RecruitingLocalNoteState { readonly persistence: "local-only-not-persisted"; readonly notes: readonly RecruitingLocalNote[]; }
export interface RecruitingLocalNoteCommand { readonly type: "recruiting.local-note.set"; readonly target: RecruitingLocalNoteTarget; readonly text: string; }
export type RecruitingLocalNoteCommandResult = { readonly ok: true; readonly state: RecruitingLocalNoteState; readonly message: string } | { readonly ok: false; readonly state: RecruitingLocalNoteState; readonly message: string };
export interface RecruitingPreparedViewOptions { readonly slaInput?: FunnelSlaInput; readonly filters?: RecruitingRecordFilters; }
export interface RecruitingKpis { readonly activePeopleInFunnel: { readonly value: number; readonly acquisitionCaseIds: readonly AcquisitionCaseId[]; readonly definition: string }; readonly peopleNeedingFollowUp: { readonly value: number; readonly acquisitionCaseIds: readonly AcquisitionCaseId[]; readonly definition: string }; readonly slowestStep: { readonly status: FunnelSlaStatus; readonly meanElapsedDays: number; readonly acquisitionCaseIds: readonly AcquisitionCaseId[]; readonly lifecycleEventIds: readonly LifecycleEventId[] } | null; readonly percentStartedWork: CohortObservation & { readonly value: number | null; readonly numerator: number; readonly denominator: number; readonly numeratorCaseIds: readonly AcquisitionCaseId[]; readonly denominatorCaseIds: readonly AcquisitionCaseId[]; readonly definition: string }; }
export interface ApplicableFunnelSla { readonly scope: "default-all-markets" | "market-override"; readonly marketId: "ALL" | MarketId; readonly values: FunnelSlaSet; }
export interface FunnelStatusFilterCount { readonly status: FunnelSlaStatus; readonly count: number; readonly acquisitionCaseIds: readonly AcquisitionCaseId[]; }
export interface WaitingOnFilterOption { readonly key: string; readonly label: string; readonly count: number; readonly acquisitionCaseIds: readonly AcquisitionCaseId[]; readonly actionRecords: readonly RecordPointer[]; }
export interface RecruitingAttentionItem { readonly marketId: MarketId; readonly reporterId: ReporterId; readonly actionRecord: RecordPointer; readonly evidence: EvidenceBundle; readonly navigationTarget: WorkspaceNavigationTarget; readonly acquisitionCaseId: AcquisitionCaseId; readonly finding: string; readonly nextAction: string; readonly contributingRecords: readonly RecordPointer[]; }
export interface PreparedRecruitingView extends PreparedWorkspaceViewBase<typeof RECRUITING_WORKSPACE> { readonly recordFilters: RecruitingRecordFilters; readonly filterScope: RecruitingFilterScope; readonly ownerFilterOptions: readonly OwnerFilterOption[]; readonly waitByStatus: readonly StatusWaitSummary[]; readonly currentCases: readonly CurrentCaseProjection[]; readonly funnel: FunnelProgression; readonly onboarding: OnboardingOutcome; readonly sources: readonly SourceOutcome[]; readonly slaConfiguration: FunnelSlaConfiguration; readonly applicableSla: ApplicableFunnelSla; readonly waitTimeTrends: FunnelWaitTimeTrends; readonly kpis: RecruitingKpis; readonly focusCondition: string; readonly statusFilterCounts: readonly FunnelStatusFilterCount[]; readonly waitingOnFilterOptions: readonly WaitingOnFilterOption[]; readonly attentionItems: readonly RecruitingAttentionItem[]; readonly localNoteCommand: { readonly type: "recruiting.local-note.set"; readonly persistence: "local-only-not-persisted"; readonly noninterference: "does-not-change-lifecycle-funnel-readiness-acceptance-or-completion"; }; }
export interface OnboardingOutcome extends CohortObservation { readonly conversion: CohortRatio; readonly entryWindow: DateWindow; readonly matureCaseIds: readonly AcquisitionCaseId[]; readonly observingCaseIds: readonly AcquisitionCaseId[]; readonly timelyCaseIds: readonly AcquisitionCaseId[]; readonly completedToDateCaseIds: readonly AcquisitionCaseId[]; readonly rate: number | null; }
export interface SourceOutcome extends CohortObservation { readonly matureCaseIds: readonly AcquisitionCaseId[]; readonly conversions: Readonly<Record<"contacted" | "qualified" | "ready" | "firstJob", CohortRatio>>; readonly spendAttribution: SourceSpendAttribution; readonly sourceId: SourceId | null; readonly label: string; readonly caseIds: readonly AcquisitionCaseId[]; readonly observingCaseIds: readonly AcquisitionCaseId[]; readonly contactedCaseIds: readonly AcquisitionCaseId[]; readonly qualifiedCaseIds: readonly AcquisitionCaseId[]; readonly readyCaseIds: readonly AcquisitionCaseId[]; readonly firstJobCaseIds: readonly AcquisitionCaseId[]; readonly spend: { readonly status: "recorded"; readonly amountMinor: number; readonly currency: string; readonly display: string } | { readonly status: "missing"; readonly display: string }; }

/** These are operational filters. Cohort and trend scopes are declared separately on the view. */
export interface RecruitingRecordFilters {
  readonly status?: FunnelSlaStatus;
  readonly stage?: RecruitingStage;
  readonly ownerId?: TeamMemberId | "unassigned";
  readonly waitingOnKey?: string;
  readonly slaState?: SlaEvaluationState;
  readonly search?: string;
  readonly sort?: "name" | "longest-wait";
}
export interface CaseResponsibility {
  readonly memberIds: readonly TeamMemberId[];
  readonly hasUnassignedActions: boolean;
  readonly state: "not-recorded" | "unassigned" | "single-responsibility" | "multiple-responsibilities";
  readonly basis: "canonical-open-actions-not-case-owner";
}
export interface OwnerFilterOption extends WaitingOnFilterOption { readonly memberId: TeamMemberId | null; }
export interface CohortMemberObservation {
  readonly acquisitionCaseId: AcquisitionCaseId;
  readonly reporterId: ReporterId;
  readonly enteredAt: UtcTimestamp;
  readonly entryRecord: RecordPointer;
  readonly observationDeadlineAt: UtcTimestamp;
  readonly observationEndAt: UtcTimestamp;
  readonly mature: boolean;
}
export interface CohortObservation {
  readonly entryWindow: DateWindow;
  readonly entryBasis: "first-outbound-contact" | "first-onboarding-entry" | "acquisition-case-opened";
  readonly horizonDays: number;
  readonly observationEndAt: UtcTimestamp;
  readonly members: readonly CohortMemberObservation[];
  readonly observingCaseIds: readonly AcquisitionCaseId[];
}
export interface CohortRatio {
  readonly value: number | null;
  readonly numerator: number;
  readonly denominator: number;
  readonly numeratorCaseIds: readonly AcquisitionCaseId[];
  readonly denominatorCaseIds: readonly AcquisitionCaseId[];
}
export interface SourceSpendAttribution {
  readonly status: "exact-cohort" | "subset-not-allocatable" | "unattributed" | "missing" | "mixed-currencies";
  readonly sourceSpendIds: readonly SourceSpendId[];
  readonly unattributedSourceSpendIds: readonly SourceSpendId[];
  readonly costPerFirstJobMinor: number | null;
  readonly outcomeDenominatorCaseIds: readonly AcquisitionCaseId[];
  readonly reason: string;
}
export interface StatusWaitSummary {
  readonly status: FunnelSlaStatus;
  readonly medianElapsedDays: number | null;
  readonly meanElapsedDays: number | null;
  readonly acquisitionCaseIds: readonly AcquisitionCaseId[];
  readonly basis: "current-status-elapsed-time-not-completed-stage-duration";
}
export interface RecruitingFilterScope {
  readonly records: "market-and-exact-record-filters-plus-operational-filters";
  readonly counts: "same-filtered-records";
  readonly attention: "same-filtered-records";
  readonly cohorts: "market-and-exact-record-filters-plus-entry-window; excludes-operational-filters";
  readonly trends: "market-and-exact-record-filters; excludes-operational-filters";
  readonly percentage: "M08-first-onboarding-cohort; excludes-operational-filters";
  readonly ignoredDemandFilters: readonly ["requestIds", "capabilityCodes", "attendanceModes"];
}

const ms = (value: UtcTimestamp) => new Date(value).valueOf();
const known = <T extends { readonly occurredAt: UtcTimestamp; readonly recordedAt: UtcTimestamp }>(item: T, asOf: UtcTimestamp) => ms(item.occurredAt) <= ms(asOf) && ms(item.recordedAt) <= ms(asOf);
const inWindow = (window: DateWindow, value: UtcTimestamp) => ms(value) >= ms(window.startAt) && ms(value) < ms(window.endAt);
const caseRef = (id: AcquisitionCaseId): RecordPointer => ({ kind: "acquisition-case", id });
const stageFor = (event: LifecycleEvent): RecruitingStage => event.eventType === "screening-started" ? "screening" : event.eventType === "onboarding-started" ? "onboarding" : event.eventType === "resumed" ? "not-recorded" : event.eventType;
const distinct = <T,>(values: readonly T[]) => [...new Set(values)];
const caseKnown = (item: AcquisitionCase, asOf: UtcTimestamp) => ms(item.openedAt) <= ms(asOf) && ms(item.recordedAt) <= ms(asOf);
const elapsedDays = (start: UtcTimestamp, end: UtcTimestamp) => Math.max(0, (ms(end) - ms(start)) / DAY);
const funnelStatusFor = (stage: RecruitingStage): FunnelSlaStatus | null => stage === "sourced" || stage === "contacted" || stage === "responded" ? "Applicant" : stage === "screening" ? "Screening" : stage === "qualified" ? "Approved" : stage === "onboarding" ? "Onboarding" : stage === "ready" ? "Starting soon" : null;

function responsibility(actions: readonly RecruitingAction[]): CaseResponsibility {
  const memberIds = distinct(actions.flatMap((item) => item.assignedTo === null ? [] : [item.assignedTo]));
  const hasUnassignedActions = actions.some((item) => item.assignedTo === null);
  return { memberIds, hasUnassignedActions, state: !actions.length ? "not-recorded" : !memberIds.length ? "unassigned" : memberIds.length === 1 && !hasUnassignedActions ? "single-responsibility" : "multiple-responsibilities", basis: "canonical-open-actions-not-case-owner" };
}
function matchesCaseScope(snapshot: DemoSnapshotV2, acq: AcquisitionCase, filters: WorkspaceFilterPayload | undefined, asOfAt: UtcTimestamp): boolean {
  if (!filters) return true;
  const includes = <T,>(ids: readonly T[], id: T) => !ids.length || ids.includes(id);
  if (filters.matchNone || (filters.selectedMarket !== "ALL" && filters.selectedMarket !== acq.ownerMarketId) || !includes(filters.marketIds, acq.ownerMarketId) || !includes(filters.acquisitionCaseIds, acq.id) || !includes(filters.reporterIds, acq.reporterId) || (filters.sourceIds.length && (acq.primarySourceId === null || !filters.sourceIds.includes(acq.primarySourceId)))) return false;
  const work = snapshot.workItems.filter((item) => ms(item.createdAt) <= ms(asOfAt) && ((item.primaryEntityRef.kind === "acquisition-case" && item.primaryEntityRef.id === acq.id) || (item.primaryEntityRef.kind === "reporter" && item.primaryEntityRef.id === acq.reporterId)));
  const enrollments = snapshot.programEnrollments.filter((item) => ms(item.enteredAt) <= ms(asOfAt) && item.acquisitionCaseId === acq.id);
  const jobs = snapshot.jobOutcomes.filter((item) => item.reporterId === acq.reporterId && ms(item.recordedAt) <= ms(asOfAt) && (item.completedAt === null || ms(item.completedAt) <= ms(asOfAt)));
  if (filters.workItemIds.length && !work.some((item) => filters.workItemIds.includes(item.id))) return false;
  if (filters.programIds.length && !filters.programIds.includes(acq.originProgramId!) && !enrollments.some((item) => filters.programIds.includes(item.programId))) return false;
  if (filters.programEnrollmentIds.length && !enrollments.some((item) => filters.programEnrollmentIds.includes(item.id))) return false;
  if (filters.jobOutcomeIds.length && !jobs.some((item) => filters.jobOutcomeIds.includes(item.id))) return false;
  if (!filters.recordRefs.length) return true;
  const refs: RecordPointer[] = [caseRef(acq.id), { kind: "reporter", id: acq.reporterId }, ...work.map((item): RecordPointer => ({ kind: "work-item", id: item.id })), ...events(snapshot, acq.id, asOfAt).map((item): RecordPointer => ({ kind: "lifecycle-event", id: item.id })), ...snapshot.screeningReviews.filter((item) => item.acquisitionCaseId === acq.id && ms(item.recordedAt) <= ms(asOfAt) && ms(item.reviewedAt) <= ms(asOfAt)).map((item): RecordPointer => ({ kind: "screening-review", id: item.id })), ...snapshot.onboardingSteps.filter((item) => item.acquisitionCaseId === acq.id && ms(item.recordedAt) <= ms(asOfAt)).map((item): RecordPointer => ({ kind: "onboarding-step", id: item.id }))];
  return filters.recordRefs.some((target) => refs.some((ref) => ref.kind === target.kind && ref.id === target.id));
}
/** Pure filtering for a prepared population; use IDs/keys, never option display labels. */
export function filterRecruitingCases(cases: readonly CurrentCaseProjection[], filters: RecruitingRecordFilters = {}): readonly CurrentCaseProjection[] {
  const search = filters.search?.trim().toLocaleLowerCase() ?? "";
  return cases.filter((item) => (!filters.status || item.funnelStatus === filters.status) && (!filters.stage || item.stage === filters.stage) && (!filters.ownerId || (filters.ownerId === "unassigned" ? item.responsibility.hasUnassignedActions : item.responsibility.memberIds.includes(filters.ownerId))) && (!filters.waitingOnKey || (filters.waitingOnKey === "no-open-action" ? !item.openActions.length : item.openActions.some((action) => action.waitingOnKey === filters.waitingOnKey))) && (!filters.slaState || item.sla.currentStatus.state === filters.slaState) && (!search || `${item.reporterName} ${item.acquisitionCaseId}`.toLocaleLowerCase().includes(search))).sort((left, right) => filters.sort === "name" ? left.reporterName.localeCompare(right.reporterName) || left.acquisitionCaseId.localeCompare(right.acquisitionCaseId) : (right.statusElapsedDays ?? -1) - (left.statusElapsedDays ?? -1) || right.totalElapsedDays - left.totalElapsedDays || left.acquisitionCaseId.localeCompare(right.acquisitionCaseId));
}
const REFERENCE_DEFAULT_SLA: FunnelSlaSet = { overallDays: 35, statusDays: { Applicant: 5, Screening: 7, Approved: 5, Onboarding: 10, "Starting soon": 7 } };
const REFERENCE_MARKET_SLAS: Readonly<Record<MarketId, FunnelSlaSet>> = {
  LAX: { overallDays: 32, statusDays: { Applicant: 4, Screening: 6, Approved: 5, Onboarding: 10, "Starting soon": 7 } },
  SFO: { overallDays: 35, statusDays: { Applicant: 5, Screening: 7, Approved: 5, Onboarding: 11, "Starting soon": 7 } },
  DFW: { overallDays: 30, statusDays: { Applicant: 4, Screening: 6, Approved: 4, Onboarding: 9, "Starting soon": 7 } },
  ORD: { overallDays: 38, statusDays: { Applicant: 5, Screening: 8, Approved: 6, Onboarding: 12, "Starting soon": 7 } },
  ATL: { overallDays: 34, statusDays: { Applicant: 5, Screening: 7, Approved: 5, Onboarding: 10, "Starting soon": 7 } },
};
const validSlaDays = (value: number | undefined, fallback: number) => value !== undefined && Number.isFinite(value) && value > 0 ? value : fallback;
const mergeSlaSet = (base: FunnelSlaSet, input?: FunnelSlaSetInput): FunnelSlaSet => ({ overallDays: validSlaDays(input?.overallDays, base.overallDays), statusDays: Object.fromEntries(FUNNEL_SLA_STATUSES.map((status) => [status, validSlaDays(input?.statusDays?.[status], base.statusDays[status])])) as Record<FunnelSlaStatus, number> });
export function resolveFunnelSlaConfiguration(input: FunnelSlaInput = {}): FunnelSlaConfiguration { const defaultSet = mergeSlaSet(REFERENCE_DEFAULT_SLA, input.defaultSet); return { source: "demo-input-not-persisted", canonicalPolicyStatus: "not-present-in-DemoSnapshotV2", defaultSet, marketOverrides: Object.fromEntries((Object.keys(REFERENCE_MARKET_SLAS) as MarketId[]).map((market) => [market, mergeSlaSet(REFERENCE_MARKET_SLAS[market], input.marketOverrides?.[market])])) as Record<MarketId, FunnelSlaSet> }; }
const evaluateSla = (elapsed: number | null, limit: number | null): SlaEvaluation => elapsed === null || limit === null ? { elapsedDays: elapsed, slaDays: limit, state: "not-applicable" } : { elapsedDays: elapsed, slaDays: limit, state: elapsed < limit ? "under" : elapsed === limit ? "at" : "over" };
const applicableSla = (configuration: FunnelSlaConfiguration, marketId: MarketId) => configuration.marketOverrides[marketId] ?? configuration.defaultSet;

/** One valid globally earliest completion per reporter; no later/cross-market duplicate is a first job. */
export function globallyEarliestCompletedOutcomes(snapshot: DemoSnapshotV2, asOfAt: UtcTimestamp) {
  return snapshot.jobOutcomes.filter((item) => { const accepted = snapshot.assignmentEvents.find((assignment) => assignment.id === item.acceptedAssignmentEventId && assignment.state === "accepted" && assignment.requestId === item.requestId && assignment.reporterId === item.reporterId && known(assignment, asOfAt)); return item.outcome === "completed" && item.completedAt !== null && ms(item.completedAt) <= ms(asOfAt) && ms(item.recordedAt) <= ms(asOfAt) && accepted !== undefined; }).reduce((results, item) => { const earlier = results.get(item.reporterId); if (!earlier || ms(item.completedAt!) < ms(earlier.completedAt!)) results.set(item.reporterId, item); return results; }, new Map<ReporterId, DemoSnapshotV2["jobOutcomes"][number]>());
}
function events(snapshot: DemoSnapshotV2, id: AcquisitionCaseId, asOf: UtcTimestamp) { return snapshot.lifecycleEvents.filter((item) => item.acquisitionCaseId === id && known(item, asOf)).sort((a, b) => ms(a.occurredAt) - ms(b.occurredAt) || ms(a.recordedAt) - ms(b.recordedAt)); }
function currentStageEntry(timeline: readonly LifecycleEvent[]) {
  const last = timeline.at(-1);
  if (!last) return { stage: "not-recorded" as const, enteredAt: null, eventId: null };
  if (last.eventType === "resumed") {
    const previous = [...timeline].reverse().find((event) => event.eventType !== "resumed" && event.eventType !== "paused");
    return previous ? { stage: stageFor(previous), enteredAt: last.occurredAt, eventId: last.id } : { stage: "not-recorded" as const, enteredAt: last.occurredAt, eventId: last.id };
  }
  return { stage: stageFor(last), enteredAt: last.occurredAt, eventId: last.id };
}
function openWork(item: WorkItem, asOf: UtcTimestamp) { const status = item.statusHistory.filter((change) => ms(change.occurredAt) <= ms(asOf)).sort((left, right) => ms(left.occurredAt) - ms(right.occurredAt)).at(-1)?.status; return status !== undefined && status !== "completed" && status !== "canceled"; }
function actions(snapshot: DemoSnapshotV2, acq: AcquisitionCase, asOf: UtcTimestamp): readonly RecruitingAction[] {
  const result: RecruitingAction[] = []; const screening = snapshot.screeningReviews.filter((item) => item.acquisitionCaseId === acq.id && ms(item.reviewedAt) <= ms(asOf) && ms(item.recordedAt) <= ms(asOf)).sort((left, right) => ms(left.reviewedAt) - ms(right.reviewedAt) || ms(left.recordedAt) - ms(right.recordedAt)).at(-1);
  if (screening && (screening.outcome === "pending" || screening.outcome === "needs-information" || screening.unresolvedInformation.length > 0)) result.push({ kind: "screening", label: "Resolve screening information", reason: screening.unresolvedInformation.join("; ") || screening.reason, waitingOnKey: "action:screening", waitingOnLabel: "Screening information", assignedTo: screening.reviewerId, dueAt: null, record: { kind: "screening-review", id: screening.id } });
  for (const step of snapshot.onboardingSteps.filter((item) => item.acquisitionCaseId === acq.id && ms(item.recordedAt) <= ms(asOf) && item.required && item.state !== "completed" && item.state !== "waived")) result.push({ kind: "onboarding", label: `Complete ${step.stepDefinitionId}`, reason: step.blockerCode ? `Blocked: ${step.blockerCode}` : `Required onboarding step is ${step.state}`, waitingOnKey: step.blockerCode ? `blocker:${step.blockerCode}` : `onboarding:${step.stepDefinitionId}`, waitingOnLabel: step.blockerCode ? `Blocked: ${step.blockerCode}` : `Onboarding: ${step.stepDefinitionId}`, assignedTo: step.assignedTo, dueAt: step.dueAt, record: { kind: "onboarding-step", id: step.id } });
  for (const work of snapshot.workItems.filter((item) => ms(item.createdAt) <= ms(asOf) && openWork(item, asOf) && ((item.primaryEntityRef.kind === "acquisition-case" && item.primaryEntityRef.id === acq.id) || (item.primaryEntityRef.kind === "reporter" && item.primaryEntityRef.id === acq.reporterId))).map((item) => projectWorkItemAt(item, asOf))) { const owner = work.ownerHistory.filter((change) => ms(change.occurredAt) <= ms(asOf)).sort((left, right) => ms(left.occurredAt) - ms(right.occurredAt)).at(-1)?.ownerId ?? null; const overdue = work.dueAt !== null && ms(work.dueAt) < ms(asOf); result.push({ kind: "work-item", label: work.title ?? work.kind.replaceAll("-", " "), reason: work.blockerCode ? `Blocked: ${work.blockerCode}` : overdue ? "Open work is overdue" : owner === null ? "Needed action is unowned" : "Concrete work remains open", waitingOnKey: work.blockerCode ? `blocker:${work.blockerCode}` : `work:${work.kind}`, waitingOnLabel: work.blockerCode ? `Blocked: ${work.blockerCode}` : work.kind.replaceAll("-", " "), assignedTo: owner, dueAt: work.dueAt, record: { kind: "work-item", id: work.id } }); }
  return result;
}
export function projectCurrentCases(snapshot: DemoSnapshotV2, asOfAt: UtcTimestamp, selectedMarket: "ALL" | MarketId = "ALL", slaConfiguration = resolveFunnelSlaConfiguration()): readonly CurrentCaseProjection[] { const earliest = globallyEarliestCompletedOutcomes(snapshot, asOfAt); return snapshot.acquisitionCases.filter((item) => caseKnown(item, asOfAt) && (selectedMarket === "ALL" || item.ownerMarketId === selectedMarket)).map((acq) => { const entry = currentStageEntry(events(snapshot, acq.id, asOfAt)); const completed = earliest.get(acq.reporterId); const stage = completed ? "first-job-completed" : entry.stage; const funnelStatus = funnelStatusFor(stage); const stageEnteredAt = completed ? null : entry.enteredAt; const statusElapsedDays = stageEnteredAt !== null && funnelStatus !== null ? elapsedDays(stageEnteredAt, asOfAt) : null; const applicable = applicableSla(slaConfiguration, acq.ownerMarketId); const allActions = actions(snapshot, acq, asOfAt); const openActions = stage === "closed" || stage === "first-job-completed" ? allActions.filter((action) => action.kind === "work-item") : allActions; return { acquisitionCaseId: acq.id, reporterId: acq.reporterId, reporterName: (snapshot.reporters.find((item) => item.id === acq.reporterId) as Reporter).fictionalName, marketId: acq.ownerMarketId, sourceId: acq.primarySourceId, responsibility: responsibility(openActions), stage, funnelStatus, stageEnteredAt, stageEntryEventId: completed ? null : entry.eventId, totalElapsedDays: elapsedDays(acq.openedAt, asOfAt), statusElapsedDays, sla: { total: evaluateSla(elapsedDays(acq.openedAt, asOfAt), applicable.overallDays), currentStatus: evaluateSla(statusElapsedDays, funnelStatus === null ? null : applicable.statusDays[funnelStatus]) }, openActions }; }); }

const trendOffsets = (range: "R7" | "R28") => { const span = range === "R7" ? 7 : 28; return Array.from({ length: 7 }, (_, index) => -Math.round((span - 1) * (6 - index) / 6)); };
const timestampOffsetByDays = (asOfAt: UtcTimestamp, offsetDays: number) => new Date(ms(asOfAt) + offsetDays * DAY).toISOString() as UtcTimestamp;
export function funnelWaitTimeTrends(snapshot: DemoSnapshotV2, asOfAt: UtcTimestamp, selectedMarket: "ALL" | MarketId = "ALL"): FunnelWaitTimeTrends {
  // A point's source population is shared by its five status series.
  const cache = new Map<UtcTimestamp, readonly CurrentCaseProjection[]>();
  const series = (range: "R7" | "R28") => Object.fromEntries(FUNNEL_SLA_STATUSES.map((status): [FunnelSlaStatus, readonly FunnelWaitTrendPoint[]] => [status, trendOffsets(range).map((offset) => {
    const pointAsOf = timestampOffsetByDays(asOfAt, offset);
    let cases = cache.get(pointAsOf);
    if (!cases) { cases = projectCurrentCases(snapshot, pointAsOf, selectedMarket); cache.set(pointAsOf, cases); }
    const members = cases.filter((item) => item.funnelStatus === status && item.statusElapsedDays !== null && item.stageEntryEventId !== null);
    return { asOfAt: pointAsOf, meanElapsedDays: members.length ? members.reduce((sum, item) => sum + item.statusElapsedDays!, 0) / members.length : null, acquisitionCaseIds: members.map((item) => item.acquisitionCaseId), lifecycleEventIds: members.map((item) => item.stageEntryEventId!) };
  })])) as Record<FunnelSlaStatus, readonly FunnelWaitTrendPoint[]>;
  return { R7: series("R7"), R28: series("R28") };
}

/** Applies only to caller-owned local presentation state; no DemoSnapshotV2 collection is changed. */
export function applyRecruitingLocalNoteCommand(snapshot: DemoSnapshotV2, asOfAt: UtcTimestamp, state: RecruitingLocalNoteState, command: RecruitingLocalNoteCommand): RecruitingLocalNoteCommandResult {
  if (command.target.kind === "candidate") { const candidateCaseId = command.target.acquisitionCaseId; if (!snapshot.acquisitionCases.some((item) => item.id === candidateCaseId && caseKnown(item, asOfAt))) return { ok: false, state, message: "Candidate note target is not known at the selected as-of time." }; }
  const targetKey = (target: RecruitingLocalNoteTarget) => target.kind === "candidate" ? `candidate:${target.acquisitionCaseId}` : `process:${target.marketId}`;
  const text = command.text.trim(); const commandTargetKey = targetKey(command.target); const sameTarget = (note: RecruitingLocalNote) => targetKey(note.target) === commandTargetKey;
  const notes = state.notes.filter((note) => !sameTarget(note));
  return { ok: true, state: { persistence: "local-only-not-persisted", notes: text ? [...notes, { target: command.target, text }] : notes }, message: text ? "Local note updated; lifecycle, funnel, readiness, acceptance, and completion facts are unchanged." : "Local note cleared; lifecycle, funnel, readiness, acceptance, and completion facts are unchanged." };
}
function reaches(snapshot: DemoSnapshotV2, id: AcquisitionCaseId, stage: RecruitingStage, start: UtcTimestamp, end: number, asOf: UtcTimestamp) { return events(snapshot, id, asOf).some((item) => stageFor(item) === stage && ms(item.occurredAt) >= ms(start) && ms(item.occurredAt) <= end); }
function cohortObservation(snapshot: DemoSnapshotV2, asOfAt: UtcTimestamp, entryWindow: DateWindow, selectedMarket: "ALL" | MarketId, entryType: "contacted" | "onboarding-started", horizonDays: number, filters?: WorkspaceFilterPayload): CohortObservation {
  // Find the first event globally BEFORE testing the window; a repeat contact cannot re-enroll a case.
  const members = snapshot.acquisitionCases.filter((acq) => caseKnown(acq, asOfAt) && (selectedMarket === "ALL" || acq.ownerMarketId === selectedMarket) && matchesCaseScope(snapshot, acq, filters, asOfAt)).flatMap((acq) => {
    const entry = events(snapshot, acq.id, asOfAt).find((item) => item.eventType === entryType);
    if (!entry || !inWindow(entryWindow, entry.occurredAt)) return [];
    const deadline = ms(entry.occurredAt) + horizonDays * DAY;
    return [{ acquisitionCaseId: acq.id, reporterId: acq.reporterId, enteredAt: entry.occurredAt, entryRecord: { kind: "lifecycle-event" as const, id: entry.id }, observationDeadlineAt: new Date(deadline).toISOString() as UtcTimestamp, observationEndAt: new Date(Math.min(ms(asOfAt), deadline)).toISOString() as UtcTimestamp, mature: ms(asOfAt) >= deadline }];
  });
  return { entryWindow, entryBasis: entryType === "contacted" ? "first-outbound-contact" : "first-onboarding-entry", horizonDays, observationEndAt: asOfAt, members, observingCaseIds: members.filter((item) => !item.mature).map((item) => item.acquisitionCaseId) };
}
const ratio = (numeratorCaseIds: readonly AcquisitionCaseId[], denominatorCaseIds: readonly AcquisitionCaseId[]): CohortRatio => ({ value: denominatorCaseIds.length ? numeratorCaseIds.length / denominatorCaseIds.length : null, numerator: numeratorCaseIds.length, denominator: denominatorCaseIds.length, numeratorCaseIds, denominatorCaseIds });
export function funnelProgression(snapshot: DemoSnapshotV2, asOfAt: UtcTimestamp, entryWindow: DateWindow, selectedMarket: "ALL" | MarketId = "ALL", filters?: WorkspaceFilterPayload): FunnelProgression {
  const cohort = cohortObservation(snapshot, asOfAt, entryWindow, selectedMarket, "contacted", 30, filters);
  const mature = cohort.members.filter((item) => item.mature);
  const matureCaseIds = mature.map((item) => item.acquisitionCaseId);
  const stages: RecruitingStage[] = ["contacted", "responded", "screening", "qualified", "onboarding", "ready"];
  let previous = matureCaseIds;
  return { ...cohort, matureCaseIds, stages: stages.map((stage) => {
    const caseIds = mature.filter((item) => reaches(snapshot, item.acquisitionCaseId, stage, item.enteredAt, ms(item.observationDeadlineAt), asOfAt)).map((item) => item.acquisitionCaseId);
    const dropOffFromPreviousCaseIds = previous.filter((id) => !caseIds.includes(id));
    previous = caseIds;
    return { stage, caseIds, conversion: ratio(caseIds, matureCaseIds), notReachedCaseIds: matureCaseIds.filter((id) => !caseIds.includes(id)), dropOffFromPreviousCaseIds };
  }) };
}
export function onboardingOutcomes(snapshot: DemoSnapshotV2, asOfAt: UtcTimestamp, entryWindow: DateWindow, selectedMarket: "ALL" | MarketId = "ALL", filters?: WorkspaceFilterPayload): OnboardingOutcome {
  const cohort = cohortObservation(snapshot, asOfAt, entryWindow, selectedMarket, "onboarding-started", 14, filters);
  const firstJobs = globallyEarliestCompletedOutcomes(snapshot, asOfAt);
  const matureCaseIds = cohort.members.filter((item) => item.mature).map((item) => item.acquisitionCaseId);
  const completed = cohort.members.filter((item) => { const job = firstJobs.get(item.reporterId); return job?.completedAt != null && ms(job.completedAt) >= ms(item.enteredAt); });
  const timelyCaseIds = completed.filter((item) => item.mature && ms(firstJobs.get(item.reporterId)!.completedAt!) <= ms(item.observationDeadlineAt)).map((item) => item.acquisitionCaseId);
  const conversion = ratio(timelyCaseIds, matureCaseIds);
  return { ...cohort, matureCaseIds, timelyCaseIds, completedToDateCaseIds: completed.map((item) => item.acquisitionCaseId), conversion, rate: conversion.value };
}
export function sourceOutcomes(snapshot: DemoSnapshotV2, asOfAt: UtcTimestamp, entryWindow: DateWindow, selectedMarket: "ALL" | MarketId = "ALL", filters?: WorkspaceFilterPayload): readonly SourceOutcome[] {
  // M09 uses exactly M07's first-contact population and 30-day horizon, with source fixed at case entry.
  const cohort = cohortObservation(snapshot, asOfAt, entryWindow, selectedMarket, "contacted", 30, filters);
  const globalCohort = cohortObservation(snapshot, asOfAt, entryWindow, "ALL", "contacted", 30);
  const sourceFor = (id: AcquisitionCaseId) => snapshot.acquisitionCases.find((item) => item.id === id)!.primarySourceId;
  const jobs = globallyEarliestCompletedOutcomes(snapshot, asOfAt);
  return distinct(cohort.members.map((item) => sourceFor(item.acquisitionCaseId))).map((sourceId) => {
    const members = cohort.members.filter((item) => sourceFor(item.acquisitionCaseId) === sourceId);
    const mature = members.filter((item) => item.mature);
    const caseIds = members.map((item) => item.acquisitionCaseId);
    const matureCaseIds = mature.map((item) => item.acquisitionCaseId);
    const at = (stage: RecruitingStage) => mature.filter((item) => reaches(snapshot, item.acquisitionCaseId, stage, item.enteredAt, ms(item.observationDeadlineAt), asOfAt)).map((item) => item.acquisitionCaseId);
    const contactedCaseIds = at("contacted"), qualifiedCaseIds = at("qualified"), readyCaseIds = at("ready");
    const firstJobCaseIds = mature.filter((item) => { const job = jobs.get(item.reporterId); return job?.completedAt != null && ms(job.completedAt) >= ms(item.enteredAt) && ms(job.completedAt) <= ms(item.observationDeadlineAt); }).map((item) => item.acquisitionCaseId);
    const allSpend = snapshot.sourceSpend.filter((item) => sourceId !== null && item.sourceId === sourceId && ms(item.occurredAt) <= ms(asOfAt));
    const cohortKey = `${entryWindow.startAt}/${entryWindow.endAt}`;
    const records = allSpend.filter((item) => {
      const windowMatches = item.attributableWindow !== null && ms(item.attributableWindow.startAt) === ms(entryWindow.startAt) && ms(item.attributableWindow.endAt) === ms(entryWindow.endAt);
      // A named program/group is not automatically the entire source population.
      return item.programId === null && (item.cohortRef === null || item.cohortRef === cohortKey) && (item.attributableWindow === null || windowMatches) && (windowMatches || item.cohortRef === cohortKey);
    });
    const currencies = distinct(records.map((item) => item.currency));
    const total = records.reduce((sum, item) => sum + item.amountMinor, 0);
    const fullPopulation = globalCohort.members.filter((item) => sourceFor(item.acquisitionCaseId) === sourceId);
    const wholeCohort = fullPopulation.length === members.length && fullPopulation.every((item) => caseIds.includes(item.acquisitionCaseId));
    const status: SourceSpendAttribution["status"] = !allSpend.length ? "missing" : !records.length ? "unattributed" : currencies.length !== 1 ? "mixed-currencies" : !wholeCohort ? "subset-not-allocatable" : "exact-cohort";
    const costPerFirstJobMinor = status === "exact-cohort" && members.every((item) => item.mature) && firstJobCaseIds.length ? total / firstJobCaseIds.length : null;
    const reason = status === "missing" ? "Spend not recorded" : status === "unattributed" ? "Recorded source spend has no exact attribution to this cohort" : status === "mixed-currencies" ? "Spend recorded in multiple currencies; no combined rate" : status === "subset-not-allocatable" ? "Source-wide spend cannot be allocated to this filtered subset" : members.some((item) => !item.mature) ? "Cohort still being observed; no finalized cost rate" : !firstJobCaseIds.length ? "No first jobs in the fully observed cohort" : "Exact direct cohort spend; labor and overhead excluded";
    const spend: SourceOutcome["spend"] = status === "exact-cohort" ? { status: "recorded", amountMinor: total, currency: currencies[0]!, display: costPerFirstJobMinor !== null ? `${costPerFirstJobMinor} minor ${currencies[0]} per first job` : members.some((item) => !item.mature) ? `${total} minor ${currencies[0]} spent; cohort still being observed` : `No first jobs yet; ${total} minor ${currencies[0]} spent` } : { status: "missing", display: reason };
    return { ...cohort, members, observingCaseIds: members.filter((item) => !item.mature).map((item) => item.acquisitionCaseId), sourceId, label: snapshot.sources.find((item) => item.id === sourceId)?.label ?? "Source not recorded", caseIds, matureCaseIds, contactedCaseIds, qualifiedCaseIds, readyCaseIds, firstJobCaseIds, conversions: { contacted: ratio(contactedCaseIds, matureCaseIds), qualified: ratio(qualifiedCaseIds, matureCaseIds), ready: ratio(readyCaseIds, matureCaseIds), firstJob: ratio(firstJobCaseIds, matureCaseIds) }, spend, spendAttribution: { status, sourceSpendIds: records.map((item) => item.id), unattributedSourceSpendIds: allSpend.filter((item) => !records.includes(item)).map((item) => item.id), costPerFirstJobMinor, outcomeDenominatorCaseIds: firstJobCaseIds, reason } };
  });
}
function metric(snapshot: DemoSnapshotV2, id: string): MetricDefinitionRef { const found = snapshot.metricDefinitions.find((item) => item.id === id); return found ? { id: found.id, version: found.version } : { id: id as MetricDefinitionRef["id"], version: "sample-v1" as MetricDefinitionRef["version"] }; }
function exactCaseFilters(selectedMarket: WorkspaceFilterPayload["selectedMarket"], cases: readonly AcquisitionCaseId[], window: DateWindow | null): WorkspaceFilterPayload {
  return { matchNone: cases.length === 0, selectedMarket, marketBasis: "recruiting-market-at-entry", marketIds: [], acquisitionCaseIds: cases, reporterIds: [], requestIds: [], workItemIds: [], programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window };
}
function bundle(snapshot: DemoSnapshotV2, context: WorkspaceQueryContext<typeof RECRUITING_WORKSPACE>, id: string, value: number, cases: readonly AcquisitionCaseId[], window: DateWindow | null, explanation: string, ratio?: readonly AcquisitionCaseId[]): EvidenceBundle { const refs = cases.map(caseRef); const filters = exactCaseFilters(context.filters.selectedMarket, cases, window); const definition = metric(snapshot, id); const unavailable = ratio !== undefined && cases.length === 0; return { id: `evidence-${id.toLowerCase()}` as EvidenceBundleId, metric: definition, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: ratio ? "ratio" : "people", scope: { workspace: RECRUITING_WORKSPACE, marketBasis: "recruiting-market-at-entry", selectedMarket: context.filters.selectedMarket, populationDescription: "First-time acquisition cases with complete synthetic records." }, filters, reportingWindow: window, computation: unavailable ? { status: "unavailable", value: null, numerator: null, denominator: null, reason: "No mature cohort members in this reporting window." } : ratio ? { status: "available", value, numerator: ratio.length, denominator: cases.length } : { status: "available", value, numerator: null, denominator: null }, contributingRecords: refs.map((pointer) => ({ ...pointer, label: snapshot.reporters.find((person) => snapshot.acquisitionCases.find((acq) => acq.id === pointer.id)?.reporterId === person.id)?.fictionalName ?? pointer.id, occurredAt: snapshot.acquisitionCases.find((acq) => acq.id === pointer.id)?.openedAt ?? null, joinPath: [pointer] })), numeratorMembers: unavailable ? [] : ratio?.map(caseRef) ?? [], denominatorMembers: unavailable ? [] : ratio ? refs : [], exclusions: [], unknownCount: 0, limitations: ["Synthetic demonstration data; no real messages or policy decisions."], explanation, navigationTarget: { workspace: RECRUITING_WORKSPACE, intent: "work-list", filters, evidenceContext: { asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, metric: definition } } }; }
const activeFunnelCases = (currentCases: readonly CurrentCaseProjection[]) => currentCases.filter((item) => item.funnelStatus !== null);
function recruitingKpis(currentCases: readonly CurrentCaseProjection[], onboarding: OnboardingOutcome): RecruitingKpis {
  const active = activeFunnelCases(currentCases);
  const needingFollowUp = currentCases.filter((item) => item.openActions.length > 0);
  const slowest = waitSummaries(currentCases).filter((item) => item.meanElapsedDays !== null).sort((a, b) => b.meanElapsedDays! - a.meanElapsedDays! || a.status.localeCompare(b.status))[0];
  return {
    activePeopleInFunnel: { value: active.length, acquisitionCaseIds: active.map((item) => item.acquisitionCaseId), definition: "Current inventory in the five Funnel statuses; not cohort conversion." },
    peopleNeedingFollowUp: { value: needingFollowUp.length, acquisitionCaseIds: needingFollowUp.map((item) => item.acquisitionCaseId), definition: "Current cases with concrete unresolved actions; completed/closed cases enter only through explicit open work." },
    slowestStep: slowest ? { status: slowest.status, meanElapsedDays: slowest.meanElapsedDays!, acquisitionCaseIds: slowest.acquisitionCaseIds, lifecycleEventIds: currentCases.filter((item) => slowest.acquisitionCaseIds.includes(item.acquisitionCaseId)).flatMap((item) => item.stageEntryEventId ? [item.stageEntryEventId] : []) } : null,
    percentStartedWork: { ...onboarding, ...onboarding.conversion, definition: "M08: globally first completed job within 14 elapsed days of first onboarding entry, divided by fully observed entrants in the declared entry window. Recent entrants are still being observed." },
  };
}
function waitSummaries(cases: readonly CurrentCaseProjection[]): readonly StatusWaitSummary[] {
  return FUNNEL_SLA_STATUSES.map((status) => {
    const members = cases.filter((item) => item.funnelStatus === status && item.statusElapsedDays !== null);
    const waits = members.map((item) => item.statusElapsedDays!).sort((a, b) => a - b);
    const middle = Math.floor(waits.length / 2);
    return { status, meanElapsedDays: waits.length ? waits.reduce((sum, value) => sum + value, 0) / waits.length : null, medianElapsedDays: waits.length ? waits.length % 2 ? waits[middle]! : (waits[middle - 1]! + waits[middle]!) / 2 : null, acquisitionCaseIds: members.map((item) => item.acquisitionCaseId), basis: "current-status-elapsed-time-not-completed-stage-duration" };
  });
}
function actionFilterOptions(snapshot: DemoSnapshotV2, cases: readonly CurrentCaseProjection[]) {
  const owners = new Map<string, OwnerFilterOption>();
  const waiting = new Map<string, WaitingOnFilterOption>();
  const add = <T extends WaitingOnFilterOption>(map: Map<string, T>, value: T, caseId: AcquisitionCaseId, record?: RecordPointer) => {
    const previous = map.get(value.key) ?? value;
    const acquisitionCaseIds = distinct([...previous.acquisitionCaseIds, caseId]);
    const actionRecords = record && !previous.actionRecords.some((item) => item.kind === record.kind && item.id === record.id) ? [...previous.actionRecords, record] : previous.actionRecords;
    map.set(value.key, { ...previous, acquisitionCaseIds, count: acquisitionCaseIds.length, actionRecords });
  };
  for (const item of cases) {
    if (!item.openActions.length) add(waiting, { key: "no-open-action", label: "No recorded open action", count: 0, acquisitionCaseIds: [], actionRecords: [] }, item.acquisitionCaseId);
    for (const action of item.openActions) {
      const member = snapshot.teamMembers.find((member) => member.id === action.assignedTo);
      add(owners, { key: action.assignedTo ?? "unassigned", memberId: action.assignedTo, label: action.assignedTo === null ? "Unassigned action" : member?.fictionalName ?? action.assignedTo, count: 0, acquisitionCaseIds: [], actionRecords: [] }, item.acquisitionCaseId, action.record);
      add(waiting, { key: action.waitingOnKey, label: action.waitingOnLabel, count: 0, acquisitionCaseIds: [], actionRecords: [] }, item.acquisitionCaseId, action.record);
    }
  }
  const sort = <T extends WaitingOnFilterOption>(values: Iterable<T>) => [...values].sort((a, b) => a.label.localeCompare(b.label) || a.key.localeCompare(b.key));
  return { ownerFilterOptions: sort(owners.values()), waitingOnFilterOptions: sort(waiting.values()) };
}
function attentionItems(snapshot: DemoSnapshotV2, context: WorkspaceQueryContext<typeof RECRUITING_WORKSPACE>, currentCases: readonly CurrentCaseProjection[], asOfAt: UtcTimestamp): readonly RecruitingAttentionItem[] {
  return currentCases.flatMap((item) => item.openActions.map((action) => ({ item, action, priority: action.dueAt !== null && ms(action.dueAt) < ms(asOfAt) ? 0 : item.sla.currentStatus.state === "over" ? 1 : item.sla.currentStatus.state === "at" ? 2 : action.assignedTo === null ? 3 : 4 }))).sort((left, right) => left.priority - right.priority || right.item.statusElapsedDays! - left.item.statusElapsedDays! || right.item.totalElapsedDays - left.item.totalElapsedDays || left.item.acquisitionCaseId.localeCompare(right.item.acquisitionCaseId) || left.action.record.id.localeCompare(right.action.record.id)).slice(0, 3).map(({ item, action }) => { const statusFinding = item.funnelStatus !== null && item.statusElapsedDays !== null && item.sla.currentStatus.slaDays !== null ? `${item.funnelStatus} is ${item.sla.currentStatus.state} SLA at ${item.statusElapsedDays} days against ${item.sla.currentStatus.slaDays} days.` : "Current funnel status has no applicable SLA."; const dueFinding = action.dueAt !== null && ms(action.dueAt) < ms(asOfAt) ? ` ${action.label} is overdue.` : ""; const evidenceBase = bundle(snapshot, context, "M06", 1, [item.acquisitionCaseId], null, `${action.label}: ${action.reason}`);
    const filters = { ...exactCaseFilters(item.marketId, [item.acquisitionCaseId], null), reporterIds: [item.reporterId], workItemIds: action.record.kind === "work-item" ? snapshot.workItems.filter((work) => work.id === action.record.id).map((work) => work.id) : [], recordRefs: [action.record] };
    const navigationTarget: WorkspaceNavigationTarget = { ...evidenceBase.navigationTarget, workspace: action.record.kind === "work-item" ? "team" : RECRUITING_WORKSPACE, intent: "record-detail", filters };
    const evidence: EvidenceBundle = { ...evidenceBase, id: `evidence-m06-${item.acquisitionCaseId}-${action.record.id}` as EvidenceBundleId, scope: { ...evidenceBase.scope, selectedMarket: item.marketId }, filters, navigationTarget, contributingRecords: evidenceBase.contributingRecords.map((ref) => ({ ...ref, joinPath: [caseRef(item.acquisitionCaseId), { kind: "reporter", id: item.reporterId }, action.record] })) };
    return { marketId: item.marketId, reporterId: item.reporterId, actionRecord: action.record, evidence, navigationTarget, acquisitionCaseId: item.acquisitionCaseId, finding: `${statusFinding}${dueFinding}`, nextAction: `${action.label}: ${action.reason}`, contributingRecords: [caseRef(item.acquisitionCaseId), ...(item.stageEntryEventId === null ? [] : [{ kind: "lifecycle-event" as const, id: item.stageEntryEventId }]), action.record] }; });
}
function cohortEvidence(snapshot: DemoSnapshotV2, context: WorkspaceQueryContext<typeof RECRUITING_WORKSPACE>, id: string, observation: CohortObservation, conversion: CohortRatio): EvidenceBundle {
  const evidence = bundle(snapshot, context, id, conversion.value ?? 0, conversion.denominatorCaseIds, observation.entryWindow, `${id === "M07" ? "Ready-stage conversion" : id === "M08" ? "Timely first-job conversion from onboarding" : "First-job conversion by source fixed at acquisition entry; direct spend and allocation limits are reported separately"}. ${observation.entryBasis}; ${observation.horizonDays} elapsed days with an inclusive outcome deadline; observed through ${observation.observationEndAt}. ${observation.observingCaseIds.length} entrants still being observed.`, conversion.numeratorCaseIds);
  return { ...evidence, contributingRecords: evidence.contributingRecords.map((ref) => { const member = observation.members.find((item) => item.acquisitionCaseId === ref.id)!; return { ...ref, occurredAt: member.enteredAt, joinPath: [caseRef(member.acquisitionCaseId), member.entryRecord] }; }), exclusions: observation.observingCaseIds.map((id) => ({ record: caseRef(id), reasonCode: "still-observing", reason: `The ${observation.horizonDays}-day observation horizon is incomplete.` })) };
}
export function prepareRecruitingWorkspace(snapshot: DemoSnapshotV2, context: WorkspaceQueryContext<typeof RECRUITING_WORKSPACE>, options: RecruitingPreparedViewOptions = {}): PreparedRecruitingView {
  const window = context.filters.window ?? { startAt: snapshot.baseAsOfAt, endAt: context.evaluation.asOfAt, boundary: "[start,end)" as const };
  const asOfAt = context.evaluation.asOfAt;
  const slaConfiguration = resolveFunnelSlaConfiguration(options.slaInput);
  const scopeCases = snapshot.acquisitionCases.filter((item) => matchesCaseScope(snapshot, item, context.filters, asOfAt));
  // Retain global job history; trimming it would manufacture a second first job.
  const scopedSnapshot = { ...snapshot, acquisitionCases: scopeCases };
  const currentCases = filterRecruitingCases(projectCurrentCases(scopedSnapshot, asOfAt, context.filters.selectedMarket, slaConfiguration), options.filters);
  const funnel = funnelProgression(snapshot, asOfAt, window, context.filters.selectedMarket, context.filters);
  const onboarding = onboardingOutcomes(snapshot, asOfAt, window, context.filters.selectedMarket, context.filters);
  const sources = sourceOutcomes(snapshot, asOfAt, window, context.filters.selectedMarket, context.filters);
  const ready = funnel.stages.find((item) => item.stage === "ready")!;
  const firstJobs = globallyEarliestCompletedOutcomes(snapshot, asOfAt);
  const firstJobCases = scopeCases.filter((item) => caseKnown(item, asOfAt) && firstJobs.get(item.reporterId)?.completedAt != null && inWindow(window, firstJobs.get(item.reporterId)!.completedAt!)).map((item) => item.id);
  const applicableSla: ApplicableFunnelSla = context.filters.selectedMarket === "ALL" ? { scope: "default-all-markets", marketId: "ALL", values: slaConfiguration.defaultSet } : { scope: "market-override", marketId: context.filters.selectedMarket, values: slaConfiguration.marketOverrides[context.filters.selectedMarket] };
  const kpis = recruitingKpis(currentCases, onboarding);
  const attention = attentionItems(snapshot, context, currentCases, asOfAt);
  const focusCondition = attention[0]?.finding ?? (kpis.slowestStep ? `${kpis.slowestStep.status} has the longest mean current wait at ${kpis.slowestStep.meanElapsedDays} days.` : "No active Funnel cases are recorded in this scope.");
  return {
    workspace: RECRUITING_WORKSPACE, evaluation: context.evaluation, appliedFilters: context.filters,
    recordFilters: options.filters ?? {},
    filterScope: { records: "market-and-exact-record-filters-plus-operational-filters", counts: "same-filtered-records", attention: "same-filtered-records", cohorts: "market-and-exact-record-filters-plus-entry-window; excludes-operational-filters", trends: "market-and-exact-record-filters; excludes-operational-filters", percentage: "M08-first-onboarding-cohort; excludes-operational-filters", ignoredDemandFilters: ["requestIds", "capabilityCodes", "attendanceModes"] },
    currentCases, funnel, onboarding, sources, slaConfiguration, applicableSla,
    waitTimeTrends: funnelWaitTimeTrends(scopedSnapshot, asOfAt, context.filters.selectedMarket),
    waitByStatus: waitSummaries(currentCases), kpis, focusCondition,
    statusFilterCounts: FUNNEL_SLA_STATUSES.map((status) => { const members = currentCases.filter((item) => item.funnelStatus === status); return { status, count: members.length, acquisitionCaseIds: members.map((item) => item.acquisitionCaseId) }; }),
    ...actionFilterOptions(snapshot, currentCases), attentionItems: attention,
    localNoteCommand: { type: "recruiting.local-note.set", persistence: "local-only-not-persisted", noninterference: "does-not-change-lifecycle-funnel-readiness-acceptance-or-completion" },
    evidence: [
      bundle(snapshot, context, "M05", firstJobCases.length, firstJobCases, window, "Each reporter contributes only their globally earliest valid completed job in this reporting window; ownership is fixed at case entry."),
      bundle(snapshot, context, "M06", kpis.peopleNeedingFollowUp.value, kpis.peopleNeedingFollowUp.acquisitionCaseIds, null, kpis.peopleNeedingFollowUp.definition),
      cohortEvidence(snapshot, context, "M07", funnel, ready.conversion),
      cohortEvidence(snapshot, context, "M08", onboarding, onboarding.conversion),
      cohortEvidence(snapshot, context, "M09", funnel, ratio(sources.flatMap((item) => item.firstJobCaseIds), funnel.matureCaseIds)),
      ...attention.map((item) => item.evidence),
    ],
  };
}
