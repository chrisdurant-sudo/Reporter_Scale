import type { CoachingAction, DateWindow, EvidenceBundle, DemoSnapshotV2, MetricDefinitionRef, PreparedWorkspaceViewBase, ProgramId, RecordPointer, TeamMember, TeamMemberId, TeamTarget, UtcTimestamp, WorkItem, WorkItemStatus, WorkOwnershipDomain, WorkQualityCheck, WorkspaceFilterPayload, WorkspaceLogicPort, WorkspaceNavigationTarget, WorkspaceQueryContext } from "../../contracts/v2";
import { projectWorkItemAt } from "../shared/work";
import { isValidHalfOpenWindow } from "../shared/time";
import { TEAM_WORK_KINDS } from "./commands";
import { countEvidence, qualityEvidence } from "./evidence";
import { before, completion, completionChoices, inWindow, label, lastOpenStatus, latest, matchesWork, ms, open, ownerAt, ownershipDomain, recordIndex, ref, statusAt, workLinks, workMarkets, type TeamRecordOption } from "./support";
export { prepareTeamCommand, TEAM_WORK_KINDS } from "./commands";
export type { TeamRecordOption } from "./support";

export const TEAM_WORKSPACE = "team" as const;
export type TeamLogicPort = WorkspaceLogicPort<typeof TEAM_WORKSPACE>;
export type TeamBoardStatus = "To do" | "In progress" | "Done";
export interface TeamViewFilters {
  readonly memberId?: TeamMemberId | "unassigned" | null;
  readonly domains?: readonly WorkOwnershipDomain[];
  readonly programIds?: readonly ProgramId[];
  readonly blocked?: boolean;
}
export interface TeamWorkItemView {
  readonly id: string; readonly label: string; readonly currentStatus: Exclude<WorkItemStatus, "completed" | "canceled">;
  readonly dueAt: UtcTimestamp | null; readonly isOverdue: boolean; readonly selectedMarket: boolean;
}
export interface TeamBoardItem {
  readonly id: string; readonly title: string; readonly status: TeamBoardStatus;
  readonly ownerId: string | null; readonly ownerName: string; readonly ownershipDomain: WorkOwnershipDomain;
  readonly programId: string | null; readonly programTitle: string | null;
  readonly dueAt: UtcTimestamp | null; readonly priority: WorkItem["priority"] | null;
  readonly blocked: boolean; readonly blockerCode: string | null;
  readonly marketIds: readonly import("../../contracts/v2").MarketId[]; readonly unscoped: boolean;
  readonly primaryEntityRef: RecordPointer; readonly relatedRecordLabel: string;
  readonly navigationTarget: WorkspaceNavigationTarget;
}
export interface TeamWorkDetail {
  readonly id: string; readonly card: TeamBoardItem | null; readonly title: string;
  readonly kind: WorkItem["kind"]; readonly status: WorkItemStatus | null;
  readonly ownerId: TeamMemberId | null; readonly primaryEntityRef: RecordPointer;
  readonly relatedRequestIds: WorkItem["relatedRequestIds"]; readonly programId: WorkItem["programId"];
  readonly dueAt: UtcTimestamp | null; readonly priority: WorkItem["priority"] | null; readonly blockerCode: string | null;
  readonly createdAt: UtcTimestamp; readonly ownerHistory: WorkItem["ownerHistory"]; readonly statusHistory: WorkItem["statusHistory"];
  readonly editHistory: NonNullable<WorkItem["editHistory"]>; readonly notes: NonNullable<WorkItem["notes"]>;
  readonly completionEvidenceRefs: WorkItem["completionEvidenceRefs"];
  readonly completion: ReturnType<typeof completion>;
  readonly linkedRecords: readonly TeamRecordOption[]; readonly completionEvidenceOptions: readonly TeamRecordOption[];
  readonly allowedStatuses: readonly Exclude<WorkItemStatus, "canceled">[];
  readonly navigationTarget: WorkspaceNavigationTarget;
}
export interface TeamInspectionSample {
  readonly id: string; readonly workItemId: string; readonly label: string; readonly passed: boolean; readonly checkedAt: UtcTimestamp;
  readonly reviewerId: TeamMemberId; readonly reviewerName: string; readonly subjectMemberId: TeamMemberId | null; readonly subjectName: string;
  readonly attributionBasis: "owner-at-inspection"; readonly requiredCheckResults: WorkQualityCheck["requiredCheckResults"];
  readonly navigationTarget: WorkspaceNavigationTarget;
}
export interface TeamTargetView {
  readonly target: TeamTarget; readonly unit: string | null; readonly selectedForComparison: boolean;
  readonly navigationTarget: WorkspaceNavigationTarget;
}
export interface TeamCompletionPeriod {
  readonly window: DateWindow; readonly observedThrough: UtcTimestamp; readonly count: number; readonly evidence: EvidenceBundle;
  readonly facts: readonly { readonly workItemId: string; readonly eventId: string; readonly historyIndex: number; readonly completedAt: UtcTimestamp; readonly actorId: string; readonly memberId: TeamMemberId | null; readonly navigationTarget: WorkspaceNavigationTarget }[];
}
export interface TeamCompletionComparison {
  readonly current: TeamCompletionPeriod; readonly prior: TeamCompletionPeriod; readonly delta: number;
  readonly partialPeriod: boolean; readonly limitation: string | null;
  readonly scope: string; readonly filters: WorkspaceFilterPayload; readonly teamFilters: TeamViewFilters;
}
export interface TeamMemberView {
  readonly id: string; readonly name: string; readonly role: string;
  readonly totalOpenWorkload: number; readonly selectedMarketOpenWorkload: number; readonly filteredOpenWorkload: number;
  readonly overdueWorkload: number; readonly unknownDueWorkload: number;
  readonly completed: { readonly completed: number; readonly target: number | null; readonly targetId: string | null; readonly unit: "tasks"; readonly window: DateWindow | null; readonly note: string };
  readonly targetRevisions: readonly TeamTargetView[];
  readonly quality: { readonly inspectedCount: number; readonly passedCount: number; readonly ratio: number | null; readonly sample: readonly TeamInspectionSample[]; readonly scope: string };
  readonly cycleTime: { readonly completedSamples: readonly { readonly workItemId: string; readonly label: string; readonly createdAt: string; readonly completedAt: string; readonly elapsedHours: number }[]; readonly waitingSamples: readonly { readonly workItemId: string; readonly label: string; readonly createdAt: string; readonly ageHours: number }[] };
  readonly workItems: readonly TeamWorkItemView[]; readonly coachingActions: readonly CoachingAction[];
  readonly coachingDetails: readonly { readonly action: CoachingAction; readonly reviewContentAvailable: boolean; readonly limitation: string | null; readonly navigationTarget: WorkspaceNavigationTarget }[];
}
export interface TeamMemberCompactView { readonly id: string; readonly name: string; readonly ownedDomains: readonly WorkOwnershipDomain[]; readonly openWork: number; readonly goal: number | null; readonly coachingDue: number }
export interface TeamAddWorkOptions {
  readonly owners: readonly { readonly id: string | null; readonly name: string }[];
  readonly programs: readonly { readonly id: string; readonly title: string }[];
  readonly primaryEntities: readonly TeamRecordOption[];
  readonly relatedRequests: readonly TeamRecordOption[];
  readonly domains: readonly { readonly domain: WorkOwnershipDomain; readonly kinds: readonly WorkItem["kind"][] }[];
  readonly priorities: readonly NonNullable<WorkItem["priority"]>[];
}
export interface PreparedTeamView extends PreparedWorkspaceViewBase<typeof TEAM_WORKSPACE> {
  readonly members: readonly TeamMemberView[]; readonly unownedOpenWork: readonly TeamWorkItemView[]; readonly limitations: readonly string[];
  readonly board: readonly TeamBoardItem[]; readonly workDetails: readonly TeamWorkDetail[];
  readonly summary: { readonly openTasks: number; readonly unownedTasks: number; readonly programsOwned: number; readonly coachingDue: number };
  readonly memberCompactValues: readonly TeamMemberCompactView[]; readonly addWorkOptions: TeamAddWorkOptions;
  readonly memberFilterOptions: readonly { readonly id: TeamMemberId | "unassigned" | null; readonly name: string; readonly count: number }[];
  readonly appliedTeamFilters: TeamViewFilters; readonly unscopedWorkItemIds: readonly string[];
  readonly inspectionSamples: readonly TeamInspectionSample[]; readonly unownedInspectionSamples: readonly TeamInspectionSample[];
  readonly completionComparison: TeamCompletionComparison | null; readonly scopeNotes: readonly string[];
}

function navigation(context: WorkspaceQueryContext<"team">, metric: MetricDefinitionRef, refs: readonly RecordPointer[], intent: WorkspaceNavigationTarget["intent"] = "record-detail"): WorkspaceNavigationTarget {
  // A member target/coaching record is not a work-item subset. Preserve market, replace exact record constraints.
  return { workspace: "team", intent, filters: { ...context.filters, matchNone: refs.length === 0, reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: refs.filter((x) => x.kind === "work-item").map((x) => x.id as WorkItem["id"]), programIds: [], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], recordRefs: refs }, evidenceContext: { ...context.evaluation, metric } };
}
function isBlocked(work: WorkItem, at: string) { return !!work.blockerCode || statusAt(work, at) === "blocked"; }
function localMatch(work: WorkItem, at: string, filters: TeamViewFilters, includeMember = true): boolean {
  if (includeMember && filters.memberId && ownerAt(work, at) !== (filters.memberId === "unassigned" ? null : filters.memberId)) return false;
  return (!filters.domains?.length || filters.domains.includes(ownershipDomain(work.kind))) && (!filters.programIds?.length || (!!work.programId && filters.programIds.includes(work.programId))) && (filters.blocked === undefined || isBlocked(work, at) === filters.blocked);
}
function wholeTargetScope(filters: WorkspaceFilterPayload, local: TeamViewFilters) {
  return !filters.matchNone && filters.selectedMarket === "ALL" && !filters.marketIds.length && !filters.recordRefs.length && !filters.reporterIds.length && !filters.acquisitionCaseIds.length && !filters.requestIds.length && !filters.workItemIds.length && !filters.programIds.length && !filters.programEnrollmentIds.length && !filters.sourceIds.length && !filters.jobOutcomeIds.length && !filters.capabilityCodes.length && !filters.attendanceModes.length && !local.domains?.length && !local.programIds?.length && local.blocked === undefined;
}
function targetFor(member: TeamMember, snapshot: DemoSnapshotV2, metric: MetricDefinitionRef, context: WorkspaceQueryContext<"team">) {
  const window = context.filters.window; if (!window) return null;
  const targets = snapshot.teamTargets.filter((target) => before(target.createdAt, context.evaluation.asOfAt) && Number.isFinite(target.target) && target.target >= 0 && (target.teamMemberId === member.id || (target.teamMemberId === null && target.role === member.focusRole)) && (target.role === null || target.role === member.focusRole) && target.metric.id === metric.id && target.metric.version === metric.version && snapshot.metricDefinitions.some((definition) => definition.id === target.metric.id && definition.version === target.metric.version && definition.unit === "tasks") && ms(target.reportingWindow.startAt) === ms(window.startAt) && ms(target.reportingWindow.endAt) === ms(window.endAt));
  return latest(targets.filter((target) => target.teamMemberId === member.id), (target) => target.createdAt, context.evaluation.asOfAt) ?? latest(targets.filter((target) => target.teamMemberId === null), (target) => target.createdAt, context.evaluation.asOfAt);
}

export function prepareTeamCompletionComparison(snapshot: DemoSnapshotV2, context: WorkspaceQueryContext<"team">, metric: MetricDefinitionRef, teamFilters: TeamViewFilters = {}): TeamCompletionComparison | null {
  const window = context.filters.window; if (!window || !isValidHalfOpenWindow(window)) return null;
  const duration = ms(window.endAt) - ms(window.startAt);
  const priorWindow: DateWindow = { startAt: new Date(ms(window.startAt) - duration).toISOString() as UtcTimestamp, endAt: window.startAt, boundary: "[start,end)" };
  const asOf = context.evaluation.asOfAt; const index = recordIndex(snapshot, asOf);
  const comparisonIdentity = encodeURIComponent(JSON.stringify([context.filters, teamFilters, metric, asOf, context.evaluation.snapshotRevision]));
  const period = (range: DateWindow, periodName: "current" | "prior"): TeamCompletionPeriod => {
    const facts = snapshot.workItems.filter((work) => before(work.createdAt, asOf) && matchesWork(work, snapshot, context.filters, asOf, index) && localMatch(projectWorkItemAt(work, asOf), asOf, teamFilters, false)).flatMap((work) => {
      const event = completion(work); if (!event || !before(event.occurredAt, asOf) || !inWindow(event.occurredAt, range)) return [];
      const memberId = snapshot.teamMembers.find((member) => member.actorId === event.actorId)?.id ?? null;
      if (teamFilters.memberId && memberId !== (teamFilters.memberId === "unassigned" ? null : teamFilters.memberId)) return [];
      return [{ workItemId: work.id, eventId: event.eventId, historyIndex: event.historyIndex, completedAt: event.occurredAt, actorId: event.actorId, memberId, navigationTarget: navigation(context, metric, [ref("work-item", work.id)]) }];
    });
    const periodContext = { ...context, filters: { ...context.filters, window: range } };
    const work = facts.map((fact) => projectWorkItemAt(snapshot.workItems.find((item) => item.id === fact.workItemId)!, asOf));
    const evidence = countEvidence(`team-completions-${periodName}-${comparisonIdentity}`, metric, periodContext, work, `Distinct first completion events in this exact window; recorded completion actors and status-history event IDs are listed in the accompanying facts. ${facts.map((fact) => fact.eventId).join(", ")}`);
    return { window: range, observedThrough: (ms(asOf) < ms(range.endAt) ? asOf : range.endAt), count: facts.length, facts, evidence };
  };
  const current = period(window, "current"); const prior = period(priorWindow, "prior"); const partialPeriod = ms(asOf) < ms(window.endAt);
  return { current, prior, delta: current.count - prior.count, partialPeriod, limitation: partialPeriod ? "The current window is not fully observed; its change versus a completed prior period is provisional." : null, scope: "Distinct first completion events in the selected market and exact record scope; member selection uses the recorded completion actor. Current domain/program/blocker filters apply to both periods.", filters: context.filters, teamFilters };
}

export function prepareTeamView(snapshot: DemoSnapshotV2, context: WorkspaceQueryContext<"team">, metric: MetricDefinitionRef, teamFilters: TeamViewFilters = {}): PreparedTeamView {
  const asOf = context.evaluation.asOfAt; const index = recordIndex(snapshot, asOf);
  const activeMembers = snapshot.teamMembers.filter((member) => before(member.activeFrom, asOf) && (member.activeTo === null || ms(member.activeTo) > ms(asOf)));
  const all = snapshot.workItems.filter((work) => before(work.createdAt, asOf)).map((work) => projectWorkItemAt(work, asOf));
  const scoped = all.filter((work) => matchesWork(work, snapshot, context.filters, asOf, index));
  const filtered = scoped.filter((work) => localMatch(work, asOf, teamFilters));
  const operational = filtered.filter((work) => open(work, asOf));
  const itemView = (work: WorkItem): TeamWorkItemView => ({ id: work.id, label: label(work), currentStatus: statusAt(work, asOf) as TeamWorkItemView["currentStatus"], dueAt: work.dueAt, isOverdue: work.dueAt !== null && ms(work.dueAt) < ms(asOf), selectedMarket: context.filters.selectedMarket === "ALL" || workMarkets(work, snapshot, asOf, index).includes(context.filters.selectedMarket) });
  const boardItem = (work: WorkItem): TeamBoardItem | null => {
    const status = statusAt(work, asOf); if (!status || status === "canceled") return null;
    const ownerId = ownerAt(work, asOf); const program = snapshot.programs?.find((item) => item.id === work.programId && before(item.startAt, asOf));
    const markets = workMarkets(work, snapshot, asOf, index);
    return { id: work.id, title: label(work), status: status === "completed" ? "Done" : (status === "blocked" ? lastOpenStatus(work, asOf) : status) === "in-progress" ? "In progress" : "To do", ownerId, ownerName: snapshot.teamMembers.find((member) => member.id === ownerId)?.fictionalName ?? "Unassigned", ownershipDomain: ownershipDomain(work.kind), programId: program?.id ?? null, programTitle: program?.title ?? null, dueAt: work.dueAt, priority: work.priority ?? null, blocked: isBlocked(work, asOf), blockerCode: work.blockerCode, marketIds: markets, unscoped: !markets.length, primaryEntityRef: work.primaryEntityRef, relatedRecordLabel: index.get(`${work.primaryEntityRef.kind}:${work.primaryEntityRef.id}`)?.label ?? "Linked record unavailable", navigationTarget: navigation(context, metric, [ref("work-item", work.id)]) };
  };
  const board = filtered.map(boardItem).filter((item): item is TeamBoardItem => item !== null);
  const workDetails = filtered.map((work): TeamWorkDetail => {
    const event = completion(work); const terminal = !!event && before(event.occurredAt, asOf) || statusAt(work, asOf) === "canceled";
    return { id: work.id, card: boardItem(work), title: label(work), kind: work.kind, status: statusAt(work, asOf), ownerId: ownerAt(work, asOf), primaryEntityRef: work.primaryEntityRef, relatedRequestIds: work.relatedRequestIds, programId: work.programId, dueAt: work.dueAt, priority: work.priority ?? null, blockerCode: work.blockerCode, createdAt: work.createdAt, ownerHistory: work.ownerHistory.filter((x) => before(x.occurredAt, asOf)), statusHistory: work.statusHistory.filter((x) => before(x.occurredAt, asOf)), editHistory: (work.editHistory ?? []).filter((x) => before(x.occurredAt, asOf)), notes: (work.notes ?? []).filter((x) => before(x.occurredAt, asOf)), completionEvidenceRefs: event && before(event.occurredAt, asOf) ? work.completionEvidenceRefs : [], completion: event && before(event.occurredAt, asOf) ? event : null, linkedRecords: workLinks(work, snapshot, asOf, index), completionEvidenceOptions: completionChoices(work, snapshot, asOf, index), allowedStatuses: terminal ? [] : isBlocked(work, asOf) ? ["open", "in-progress", "blocked"] : ["open", "in-progress", "completed"], navigationTarget: navigation(context, metric, [ref("work-item", work.id)]) };
  });
  const checks = new Map<string, WorkQualityCheck>();
  for (const check of snapshot.workQualityChecks) {
    if (!before(check.checkedAt, asOf) || (context.filters.window && !inWindow(check.checkedAt, context.filters.window)) || !scoped.some((work) => work.id === check.workItemId && localMatch(work, asOf, teamFilters, false))) continue;
    const previous = checks.get(check.workItemId); if (!previous || ms(check.checkedAt) >= ms(previous.checkedAt)) checks.set(check.workItemId, check);
  }
  const inspectionSamples = [...checks.values()].map((check): TeamInspectionSample => {
    const work = all.find((item) => item.id === check.workItemId)!; const subjectMemberId = ownerAt(work, check.checkedAt);
    return { id: check.id, workItemId: work.id, label: label(work), passed: check.outcome === "passed" && check.requiredCheckResults.length > 0 && check.requiredCheckResults.every((result) => result.passed), checkedAt: check.checkedAt, reviewerId: check.checkedBy, reviewerName: snapshot.teamMembers.find((member) => member.id === check.checkedBy)?.fictionalName ?? "Unknown reviewer", subjectMemberId, subjectName: snapshot.teamMembers.find((member) => member.id === subjectMemberId)?.fictionalName ?? "Unowned at inspection", attributionBasis: "owner-at-inspection", requiredCheckResults: check.requiredCheckResults, navigationTarget: navigation(context, metric, [ref("work-item", work.id)]) };
  }).filter((sample) => !teamFilters.memberId || sample.subjectMemberId === (teamFilters.memberId === "unassigned" ? null : teamFilters.memberId));
  const actions = snapshot.coachingActions.filter((action) => before(action.createdAt, asOf) && (!teamFilters.memberId || action.teamMemberId === teamFilters.memberId) && (wholeTargetScope(context.filters, { ...teamFilters, memberId: null }) || action.linkedWorkItemIds.some((id) => scoped.some((work) => work.id === id && localMatch(work, asOf, teamFilters, false))))).map((action) => ({ ...action, outcomeNote: action.updatedAt && !before(action.updatedAt, asOf) ? null : action.outcomeNote }));
  const evidence = [];
  const comparable = prepareTeamCompletionComparison(snapshot, context, metric, teamFilters);
  const members = activeMembers.filter((member) => !teamFilters.memberId || member.id === teamFilters.memberId).map((member): TeamMemberView => {
    const assigned = operational.filter((work) => ownerAt(work, asOf) === member.id);
    const credited = (comparable?.current.facts ?? []).filter((fact) => fact.memberId === member.id).map((fact) => all.find((work) => work.id === fact.workItemId)!);
    const samples = inspectionSamples.filter((sample) => sample.subjectMemberId === member.id);
    const target = targetFor(member, snapshot, metric, context); const compareTarget = wholeTargetScope(context.filters, teamFilters) ? target : null;
    evidence.push(countEvidence(`team-open-${member.id}`, metric, context, assigned, "Distinct open work within the selected market and record scope, assigned at evaluation time."), countEvidence(`team-completed-${member.id}`, metric, context, credited, "First completion events within the displayed reporting window, credited to their recorded actor."), countEvidence(`team-waiting-${member.id}`, metric, context, assigned, "Waiting ages for filtered open work."), qualityEvidence(`team-quality-${member.id}`, metric, context, samples.map((sample) => ({ work: all.find((work) => work.id === sample.workItemId)!, passed: sample.passed }))));
    const coachingActions = actions.filter((action) => action.teamMemberId === member.id);
    return { id: member.id, name: member.fictionalName, role: member.focusRole, totalOpenWorkload: all.filter((work) => open(work, asOf) && ownerAt(work, asOf) === member.id).length, selectedMarketOpenWorkload: scoped.filter((work) => open(work, asOf) && ownerAt(work, asOf) === member.id).length, filteredOpenWorkload: assigned.length, overdueWorkload: assigned.filter((work) => work.dueAt !== null && ms(work.dueAt) < ms(asOf)).length, unknownDueWorkload: assigned.filter((work) => work.dueAt === null).length,
      completed: { completed: credited.length, target: compareTarget?.target ?? null, targetId: compareTarget?.id ?? null, unit: "tasks", window: context.filters.window, note: compareTarget ? "All-market first completions versus the latest matching member/role tasks target for this exact reporting window." : target ? "A target exists, but has no market/task subset scope. Comparison is unavailable for the narrowed selection." : "No matching metric-version, unit and member/role target exists for this reporting window." },
      targetRevisions: snapshot.teamTargets.filter((target) => before(target.createdAt, asOf) && (target.teamMemberId === member.id || target.teamMemberId === null && target.role === member.focusRole)).map((revision) => ({ target: revision, unit: snapshot.metricDefinitions.find((definition) => definition.id === revision.metric.id && definition.version === revision.metric.version)?.unit ?? null, selectedForComparison: revision.id === compareTarget?.id, navigationTarget: navigation(context, metric, [ref("team-target", revision.id)]) })),
      quality: { inspectedCount: samples.length, passedCount: samples.filter((sample) => sample.passed).length, ratio: samples.length ? samples.filter((sample) => sample.passed).length / samples.length : null, sample: samples, scope: "Latest applicable check per inspected work item in the selected market/record scope and reporting window; attributed to owner at inspection." },
      cycleTime: { completedSamples: credited.map((work) => ({ workItemId: work.id, label: label(work), createdAt: work.createdAt, completedAt: completion(work)!.occurredAt, elapsedHours: (ms(completion(work)!.occurredAt) - ms(work.createdAt)) / 3_600_000 })), waitingSamples: assigned.map((work) => ({ workItemId: work.id, label: label(work), createdAt: work.createdAt, ageHours: (ms(asOf) - ms(work.createdAt)) / 3_600_000 })) }, workItems: assigned.map(itemView), coachingActions,
      coachingDetails: coachingActions.map((action) => ({ action, reviewContentAvailable: !action.updatedAt || before(action.updatedAt, asOf), limitation: action.updatedAt && !before(action.updatedAt, asOf) ? "The stored review was updated after this as-of time. Earlier review content is unavailable; the schema retains only the current result." : null, navigationTarget: navigation(context, metric, [ref("coaching-action", action.id)]) })) };
  });
  const unowned = operational.filter((work) => ownerAt(work, asOf) === null);
  evidence.push(countEvidence("team-unowned-open", metric, context, unowned, "Unowned open work within the same selected scope."));
  const startedPrograms = (snapshot.programs ?? []).filter((program) => before(program.startAt, asOf) && (context.filters.selectedMarket === "ALL" || program.marketIds?.includes(context.filters.selectedMarket)));
  const dueActions = actions.filter((action) => before(action.reviewAt, asOf) && action.outcomeNote === null);
  const memberOptionsWork = scoped.filter((work) => statusAt(work, asOf) !== "canceled" && localMatch(work, asOf, teamFilters, false));
  const optionEntities = [...index.values()].filter((node) => ["market", "reporter", "acquisition-case", "program", "demand-request", "team-member"].includes(node.kind) && (context.filters.selectedMarket === "ALL" || node.kind === "team-member" || node.marketIds.includes(context.filters.selectedMarket)));
  return { workspace: TEAM_WORKSPACE, evaluation: context.evaluation, appliedFilters: context.filters, appliedTeamFilters: teamFilters, evidence, members, unownedOpenWork: unowned.map(itemView), board, workDetails,
    summary: { openTasks: operational.length, unownedTasks: unowned.length, programsOwned: context.filters.matchNone ? 0 : startedPrograms.filter((program) => (!teamFilters.memberId || program.ownerId === teamFilters.memberId) && (!teamFilters.programIds?.length || teamFilters.programIds.includes(program.id)) && (!context.filters.programIds.length || context.filters.programIds.includes(program.id))).length, coachingDue: dueActions.length },
    memberCompactValues: members.map((member) => ({ id: member.id, name: member.name, ownedDomains: [...new Set(operational.filter((work) => ownerAt(work, asOf) === member.id).map((work) => ownershipDomain(work.kind)))], openWork: member.filteredOpenWorkload, goal: member.completed.target, coachingDue: dueActions.filter((action) => action.teamMemberId === member.id).length })),
    addWorkOptions: { owners: [{ id: null, name: "Unassigned" }, ...activeMembers.map((member) => ({ id: member.id, name: member.fictionalName }))], programs: startedPrograms.map((program) => ({ id: program.id, title: program.title })), primaryEntities: optionEntities, relatedRequests: optionEntities.filter((node) => node.kind === "demand-request"), domains: Object.entries(TEAM_WORK_KINDS).map(([domain, kinds]) => ({ domain: domain as WorkOwnershipDomain, kinds })), priorities: ["low", "normal", "high", "urgent"] },
    memberFilterOptions: [{ id: null, name: "All members", count: memberOptionsWork.length }, ...activeMembers.map((member) => ({ id: member.id, name: member.fictionalName, count: memberOptionsWork.filter((work) => ownerAt(work, asOf) === member.id).length })), { id: "unassigned", name: "Unassigned", count: memberOptionsWork.filter((work) => ownerAt(work, asOf) === null).length }],
    unscopedWorkItemIds: all.filter((work) => !workMarkets(work, snapshot, asOf, index).length).map((work) => work.id), inspectionSamples, unownedInspectionSamples: inspectionSamples.filter((sample) => sample.subjectMemberId === null), completionComparison: comparable,
    scopeNotes: ["Board and open workload use current ownership; completion uses the first completion actor; quality uses owner at inspection.", "Total workload spans all markets; selected-market workload applies workspace filters; filtered workload additionally applies Team controls.", "Targets have no market scope and are compared only against a full member/role population. Coaching shows actions with linked work in the selected scope."],
    limitations: ["Work market scope comes from canonical direct entities and linked requests/programs; unscoped work appears only in All.", "Unknown due dates remain unknown and are not classified as overdue.", "Coaching stores one current result and last update, not a history of earlier review content."] };
}
export function createTeamLogic(metric: MetricDefinitionRef): TeamLogicPort { return { workspace: TEAM_WORKSPACE, prepare: (snapshot, context) => prepareTeamView(snapshot, context, metric) }; }
