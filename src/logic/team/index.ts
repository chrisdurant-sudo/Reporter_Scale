import type {
  CoachingAction,
  DemoSnapshotV2,
  EvidenceBundle,
  EvidenceBundleId,
  MarketId,
  MetricDefinitionRef,
  PreparedWorkspaceViewBase,
  RecordPointer,
  ResolvedRecordReference,
  TeamMember,
  TeamTarget,
  WorkItem,
  WorkItemStatus,
  WorkspaceFilterPayload,
  WorkspaceLogicPort,
  WorkspaceQueryContext,
} from "../../contracts/v2";

export const TEAM_WORKSPACE = "team" as const;
export type TeamLogicPort = WorkspaceLogicPort<typeof TEAM_WORKSPACE>;
type OpenStatus = Exclude<WorkItemStatus, "completed" | "canceled">;

export interface TeamWorkItemView {
  readonly id: string; readonly label: string; readonly currentStatus: OpenStatus; readonly dueAt: string | null;
  readonly isOverdue: boolean; readonly selectedMarket: boolean;
}
export interface TeamMemberView {
  readonly id: string; readonly name: string; readonly role: string;
  readonly totalOpenWorkload: number; readonly selectedMarketOpenWorkload: number;
  readonly overdueWorkload: number; readonly unknownDueWorkload: number;
  readonly completed: { readonly completed: number; readonly target: number | null; readonly note: string };
  readonly quality: { readonly inspectedCount: number; readonly passedCount: number; readonly ratio: number | null; readonly sample: readonly { readonly workItemId: string; readonly label: string; readonly passed: boolean; readonly checkedAt: string }[] };
  readonly workItems: readonly TeamWorkItemView[]; readonly coachingActions: readonly CoachingAction[];
}
export interface PreparedTeamView extends PreparedWorkspaceViewBase<typeof TEAM_WORKSPACE> {
  readonly members: readonly TeamMemberView[]; readonly unownedOpenWork: readonly TeamWorkItemView[]; readonly limitations: readonly string[];
}

const stamp = (value: string) => Date.parse(value);
const beforeOrAt = (value: string, asOf: string) => stamp(value) <= stamp(asOf);
const latest = <T extends { readonly occurredAt: string }>(items: readonly T[], asOf: string): T | null =>
  items.filter((item) => beforeOrAt(item.occurredAt, asOf)).sort((a, b) => stamp(b.occurredAt) - stamp(a.occurredAt))[0] ?? null;
const ownerAt = (work: WorkItem, asOf: string) => latest(work.ownerHistory, asOf)?.ownerId ?? null;
const statusAt = (work: WorkItem, asOf: string) => latest(work.statusHistory, asOf)?.status ?? null;
/** A canonical WorkItem may earn only its first completion credit. */
const completion = (work: WorkItem) => work.statusHistory.filter((event) => event.status === "completed").sort((a, b) => stamp(a.occurredAt) - stamp(b.occurredAt))[0] ?? null;
const inWindow = (value: string, window: WorkspaceFilterPayload["window"]) => window !== null && stamp(value) >= stamp(window.startAt) && stamp(value) < stamp(window.endAt);

function selected(work: WorkItem, snapshot: DemoSnapshotV2, market: "ALL" | MarketId) {
  return market === "ALL" || work.relatedRequestIds.some((id) => snapshot.demandRequests.find((request) => request.id === id)?.marketId === market);
}
function label(work: WorkItem) { return `${work.kind.replaceAll("-", " ")} work`; }
function workRef(work: WorkItem): ResolvedRecordReference { return { kind: "work-item", id: work.id, label: label(work), occurredAt: work.createdAt, joinPath: [work.primaryEntityRef] }; }
function filtersFor(base: WorkspaceFilterPayload, work: readonly WorkItem[]): WorkspaceFilterPayload {
  const refs: RecordPointer[] = work.map((item) => ({ kind: "work-item", id: item.id }));
  return { ...base, workItemIds: work.map((item) => item.id) as WorkspaceFilterPayload["workItemIds"], recordRefs: refs };
}
function countEvidence(id: string, metric: MetricDefinitionRef, context: WorkspaceQueryContext<typeof TEAM_WORKSPACE>, work: readonly WorkItem[], explanation: string): EvidenceBundle {
  const filters = filtersFor(context.filters, work);
  return { id: id as EvidenceBundleId, metric, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: "tasks", scope: { workspace: TEAM_WORKSPACE, marketBasis: filters.marketBasis, selectedMarket: filters.selectedMarket, populationDescription: "Canonical work items." }, filters, reportingWindow: filters.window, computation: { status: "available", value: work.length, numerator: null, denominator: null }, contributingRecords: work.map(workRef), numeratorMembers: [], denominatorMembers: [], exclusions: [], unknownCount: 0, limitations: [], explanation, navigationTarget: { workspace: TEAM_WORKSPACE, intent: "work-list", filters, evidenceContext: { asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, metric } } };
}
function qualityEvidence(id: string, metric: MetricDefinitionRef, context: WorkspaceQueryContext<typeof TEAM_WORKSPACE>, samples: readonly { work: WorkItem; passed: boolean }[]): EvidenceBundle {
  const work = samples.map((sample) => sample.work); const filters = filtersFor(context.filters, work); const denominator = work.map((item) => ({ kind: "work-item" as const, id: item.id })); const numerator = samples.filter((sample) => sample.passed).map((sample) => ({ kind: "work-item" as const, id: sample.work.id }));
  return { id: id as EvidenceBundleId, metric, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: "ratio", scope: { workspace: TEAM_WORKSPACE, marketBasis: filters.marketBasis, selectedMarket: filters.selectedMarket, populationDescription: "Distinct inspected work items." }, filters, reportingWindow: filters.window, computation: denominator.length ? { status: "available", value: numerator.length / denominator.length, numerator: numerator.length, denominator: denominator.length } : { status: "unavailable", value: null, numerator: null, denominator: null, reason: "No inspected work items." }, contributingRecords: work.map(workRef), numeratorMembers: numerator, denominatorMembers: denominator, exclusions: [], unknownCount: 0, limitations: ["Only inspected work appears in this quality sample; uninspected work is not treated as checked."], explanation: "Quality is passed required checks divided by distinct inspected work items.", navigationTarget: { workspace: TEAM_WORKSPACE, intent: "work-list", filters, evidenceContext: { asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, metric } } };
}
function targetFor(member: TeamMember, targets: readonly TeamTarget[], snapshot: DemoSnapshotV2, window: WorkspaceFilterPayload["window"]) {
  if (!window) return null;
  const eligible = targets.filter((target) => {
    const definition = snapshot.metricDefinitions.find((candidate) => candidate.id === target.metric.id && candidate.version === target.metric.version);
    return target.role === member.focusRole && definition?.unit === "tasks" && target.reportingWindow.startAt === window.startAt && target.reportingWindow.endAt === window.endAt;
  });
  return eligible.find((target) => target.teamMemberId === member.id) ?? eligible.find((target) => target.teamMemberId === null) ?? null;
}
function itemView(work: WorkItem, snapshot: DemoSnapshotV2, context: WorkspaceQueryContext<typeof TEAM_WORKSPACE>): TeamWorkItemView {
  const status = statusAt(work, context.evaluation.asOfAt) as OpenStatus;
  return { id: work.id, label: label(work), currentStatus: status, dueAt: work.dueAt, isOverdue: work.dueAt !== null && stamp(work.dueAt) < stamp(context.evaluation.asOfAt), selectedMarket: selected(work, snapshot, context.filters.selectedMarket) };
}

export function prepareTeamView(snapshot: DemoSnapshotV2, context: WorkspaceQueryContext<typeof TEAM_WORKSPACE>, metric: MetricDefinitionRef): PreparedTeamView {
  const asOf = context.evaluation.asOfAt;
  const open = snapshot.workItems.filter((work) => { const status = statusAt(work, asOf); return status !== null && status !== "completed" && status !== "canceled"; });
  const evidence: EvidenceBundle[] = [];
  const members = snapshot.teamMembers.filter((member) => beforeOrAt(member.activeFrom, asOf) && (member.activeTo === null || stamp(member.activeTo) > stamp(asOf))).map((member) => {
    const assigned = open.filter((work) => ownerAt(work, asOf) === member.id);
    const credited = snapshot.workItems.filter((work) => { const event = completion(work); return event !== null && event.actorId === member.actorId && beforeOrAt(event.occurredAt, asOf) && inWindow(event.occurredAt, context.filters.window); });
    const latestChecks = new Map<string, { work: WorkItem; passed: boolean; checkedAt: string }>();
    snapshot.workQualityChecks.filter((check) => check.checkedBy === member.id && beforeOrAt(check.checkedAt, asOf) && (context.filters.window === null || inWindow(check.checkedAt, context.filters.window))).forEach((check) => { const work = snapshot.workItems.find((item) => item.id === check.workItemId); const prior = work ? latestChecks.get(work.id) : undefined; if (work && (!prior || stamp(prior.checkedAt) < stamp(check.checkedAt))) latestChecks.set(work.id, { work, passed: check.outcome === "passed" && check.requiredCheckResults.every((result) => result.passed), checkedAt: check.checkedAt }); });
    const samples = [...latestChecks.values()]; const target = targetFor(member, snapshot.teamTargets, snapshot, context.filters.window);
    evidence.push(countEvidence(`team-open-${member.id}`, metric, context, assigned, "Open workload is distinct canonical work currently assigned at the selected as-of time."));
    evidence.push(countEvidence(`team-completed-${member.id}`, metric, context, credited, "Completion credit stays with the recorded completion actor after reassignment."));
    evidence.push(qualityEvidence(`team-quality-${member.id}`, metric, context, samples));
    return { id: member.id, name: member.fictionalName, role: member.focusRole, totalOpenWorkload: assigned.length, selectedMarketOpenWorkload: assigned.filter((work) => selected(work, snapshot, context.filters.selectedMarket)).length, overdueWorkload: assigned.filter((work) => work.dueAt !== null && stamp(work.dueAt) < stamp(asOf)).length, unknownDueWorkload: assigned.filter((work) => work.dueAt === null).length, completed: { completed: credited.length, target: target?.target ?? null, note: target ? `Compared with the ${member.focusRole} tasks target for this same reporting window.` : "No like-role tasks target is recorded for this reporting window." }, quality: { inspectedCount: samples.length, passedCount: samples.filter((sample) => sample.passed).length, ratio: samples.length ? samples.filter((sample) => sample.passed).length / samples.length : null, sample: samples.map((sample) => ({ workItemId: sample.work.id, label: label(sample.work), passed: sample.passed, checkedAt: sample.checkedAt })) }, workItems: assigned.map((work) => itemView(work, snapshot, context)), coachingActions: snapshot.coachingActions.filter((action) => action.teamMemberId === member.id && beforeOrAt(action.createdAt, asOf)) };
  });
  const unowned = open.filter((work) => ownerAt(work, asOf) === null); evidence.push(countEvidence("team-unowned-open", metric, context, unowned, "Unowned open work is separate from individual workload."));
  return { workspace: TEAM_WORKSPACE, evaluation: context.evaluation, appliedFilters: context.filters, evidence, members, unownedOpenWork: unowned.map((work) => itemView(work, snapshot, context)), limitations: ["Selected-market workload is linked-demand workload; total workload remains visible for context.", "Unknown due dates remain unknown and are not classified as overdue."] };
}
export function createTeamLogic(metric: MetricDefinitionRef): TeamLogicPort { return { workspace: TEAM_WORKSPACE, prepare: (snapshot, context) => prepareTeamView(snapshot, context, metric) }; }
