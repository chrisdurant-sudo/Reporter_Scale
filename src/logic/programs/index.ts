import type { DemoSnapshotV2, DateWindow, EvidenceBundle, Program, ProgramDecision, ProgramId, ProgramType, ProcessVersion, RecordPointer, ResolvedRecordReference, WeeklyReviewAction, WorkspaceLogicPort, WorkspaceNavigationTarget } from "../../contracts/v2";
import { projectWorkItemAt } from "../shared/work";
import { filterEnrollments, groupEvidence, includes, inWindow, known, latest, ms, population, ref, targetProjection } from "./measurement";
import type { Context, ProgramResultGroup } from "./measurement";
export { calculateSourceContribution } from "./measurement";
export type { ProgramResultGroup, SourceContribution } from "./measurement";
export { prepareProgramsCommand } from "./commands";
export const PROGRAMS_WORKSPACE = "programs" as const;
export type ProgramsLogicPort = WorkspaceLogicPort<typeof PROGRAMS_WORKSPACE>;
export interface GoalIntegrityProjection { readonly goalId: string; readonly revisions: readonly { readonly version: number; readonly metricId: string; readonly metricVersion: string; readonly target: number; readonly deadline: string; readonly baselineAsOfAt: string; readonly scope: string; readonly baselineEvidenceSnapshotId: string }[]; }
export function projectGoalIntegrity(snapshot: DemoSnapshotV2, goalId: string, asOfAt?: string): GoalIntegrityProjection {
  return { goalId, revisions: snapshot.goalRevisions.filter((goal) => goal.goalId === goalId && (!asOfAt || known(goal.savedAt, asOfAt))).sort((a, b) => a.version - b.version).map((goal) => ({ version: goal.version, metricId: goal.metric.id, metricVersion: goal.metric.version, target: goal.target, deadline: goal.deadline, baselineAsOfAt: goal.baselineAsOfAt, scope: JSON.stringify(goal.scope), baselineEvidenceSnapshotId: goal.baselineEvidenceSnapshotId })) };
}
export interface PreparedProgramRow {
  readonly id: ProgramId; readonly title: string; readonly typeLabel: "Experiment" | "Campaign" | "Sourcing" | "Process"; readonly marketLabel: string; readonly stage: Program["stage"];
  readonly ownerId: string; readonly brief: string; readonly implementationAt: string; readonly target: number | null; readonly result: ProgramResultGroup | null; readonly reviewAt: string;
  readonly latestNote: string | null; readonly latestNextStep: string | null; readonly nextStep: string; readonly workflowSource: string; readonly latestDecision: ProgramDecision | null;
  readonly targetDetails: ReturnType<typeof targetProjection>; readonly groups: readonly ProgramResultGroup[]; readonly resultSelectionReason: string;
  readonly detailTarget: WorkspaceNavigationTarget; readonly owner: DemoSnapshotV2["teamMembers"][number] | null;
  readonly hypothesis: string; readonly eligibilityRule: string; readonly processVersions: readonly ProcessVersion[]; readonly workaround: DemoSnapshotV2["workaroundExamples"][number] | null;
  readonly linkedNeedRefs: readonly RecordPointer[]; readonly work: readonly { readonly record: DemoSnapshotV2["workItems"][number]; readonly target: WorkspaceNavigationTarget }[];
  readonly historyLimitations: readonly string[];
  readonly participants: readonly { readonly enrollment: DemoSnapshotV2["programEnrollments"][number]; readonly name: string; readonly onboardingSteps: DemoSnapshotV2["onboardingSteps"]; readonly target: WorkspaceNavigationTarget }[];
  readonly processGaps: readonly { readonly processVersionId: string; readonly stepId: string; readonly missing: readonly string[] }[];
}
/** Compatibility property resultOverTime contains categorical cohort comparisons, never a time series. */
export interface ProgramResultTrendPoint {
  readonly kind: "cohort-comparison"; readonly id: string; readonly programId: ProgramId; readonly groupId: string;
  readonly periodStartAt: string | null; readonly periodEndAt: string | null; readonly result: number | null; readonly target: number | null;
  readonly targetState: "met" | "not-met" | "unavailable" | "not-declared"; readonly accessibleLabel: string; readonly evidenceId: string; readonly unit: EvidenceBundle["unit"]; readonly outcomeLabel: string;
}
export interface ProgramsSummary { readonly running: number; readonly reviewNow: number; readonly expanding: number; readonly stopped: number; }
export interface PreparedProgramsView {
  readonly workspace: typeof PROGRAMS_WORKSPACE; readonly evaluation: Context["evaluation"]; readonly appliedFilters: Context["filters"]; readonly evidence: readonly EvidenceBundle[];
  readonly rows: readonly PreparedProgramRow[]; readonly resultsByProgram: ReadonlyMap<ProgramId, readonly ProgramResultGroup[]>; readonly summary: ProgramsSummary; readonly resultOverTime: readonly ProgramResultTrendPoint[];
  readonly cohortComparisons: readonly ProgramResultTrendPoint[]; readonly ownerOptions: readonly { readonly id: DemoSnapshotV2["teamMembers"][number]["id"]; readonly label: string }[];
  readonly filterScope: { readonly records: string; readonly comparisons: string; readonly attention: string; readonly unsupported: readonly string[] };
}
const labels: Record<ProgramType, PreparedProgramRow["typeLabel"]> = { tool: "Experiment", incentive: "Campaign", source: "Sourcing", workflow: "Process", "re-engagement": "Campaign" };
export function programContext(snapshot: DemoSnapshotV2, programId: ProgramId): Context {
  return { workspace: "programs", evaluation: { asOfAt: snapshot.currentAsOfAt, snapshotRevision: snapshot.revision, reportingTimeZone: "America/Los_Angeles" as never }, filters: { selectedMarket: "ALL", marketBasis: "program-market-at-entry", marketIds: [], reporterIds: [], acquisitionCaseIds: [], requestIds: [], workItemIds: [], programIds: [programId], programEnrollmentIds: [], sourceIds: [], jobOutcomeIds: [], capabilityCodes: [], attendanceModes: [], recordRefs: [], window: null } };
}
function target(context: Context, program: Program, record?: RecordPointer): WorkspaceNavigationTarget {
  const work = record?.kind === "work-item";
  const filters = { ...context.filters, matchNone: false, programIds: [program.id], recordRefs: [record ?? ref("program", program.id)], ...(work ? { workItemIds: [record.id as never] } : {}) };
  return { workspace: work ? "team" : "programs", intent: "record-detail", filters, evidenceContext: { asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, metric: program.measurementPlan.metric } };
}
function scopedWork(snapshot: DemoSnapshotV2, program: Program, context: Context) {
  const f = context.filters;
  const selected = filterEnrollments(snapshot, program, context);
  const personFilter = f.reporterIds.length || f.acquisitionCaseIds.length || f.programEnrollmentIds.length || f.sourceIds.length || f.recordRefs.some((r) => ["reporter", "acquisition-case", "program-enrollment", "source"].includes(r.kind));
  return snapshot.workItems.filter((work) => {
    if (work.programId !== program.id || !known(work.createdAt, context.evaluation.asOfAt) || !includes(f.workItemIds, work.id)) return false;
    if (f.recordRefs.some((r) => r.kind === "work-item") && !f.recordRefs.some((r) => r.kind === "work-item" && r.id === work.id)) return false;
    if (personFilter && !selected.some((entry) => work.primaryEntityRef.id === entry.reporterId || work.primaryEntityRef.id === entry.acquisitionCaseId || work.primaryEntityRef.id === entry.id)) return false;
    return !f.requestIds.length || work.relatedRequestIds.some((id) => f.requestIds.includes(id)) || (work.primaryEntityRef.kind === "demand-request" && f.requestIds.some((id) => id === work.primaryEntityRef.id));
  });
}
function comparison(program: Program, group: ProgramResultGroup, threshold: number | null): ProgramResultTrendPoint {
  const met = group.result !== null && threshold !== null && (group.unit === "currency-minor" ? group.result <= threshold : group.result >= threshold);
  const targetState = threshold === null ? "not-declared" : group.result === null ? "unavailable" : met ? "met" : "not-met";
  const value = group.result === null ? "result unavailable" : group.unit === "ratio" ? `${group.evidence.computation.numerator} of ${group.matureEntrants} ${program.measurementPlan.metric.id === "M07" ? "qualified participants" : "timely first jobs"} (${Math.round(group.result * 100)}%)` : `${group.result} ${group.currency} minor units`;
  const targetLabel = threshold === null ? "no compatible declared target" : `declared target ${group.unit === "ratio" ? `${Math.round(threshold * 100)}%` : `${threshold} minor units`}, ${met ? "met" : group.result === null ? "not yet evaluable" : "not met"}`;
  return { kind: "cohort-comparison", id: `${program.id}-${group.groupId}`, programId: program.id, groupId: group.groupId, periodStartAt: program.measurementPlan.entryWindow.startAt, periodEndAt: program.measurementPlan.entryWindow.endAt, result: group.result, target: threshold, targetState, accessibleLabel: `${program.title}, ${group.label}: ${group.outcomeLabel}; ${value}; ${targetLabel}; ${group.followUpDays}-day observation. Descriptive cohort comparison.`, evidenceId: group.evidence.id, unit: group.unit, outcomeLabel: group.outcomeLabel };
}
function programMatchesReferences(snapshot: DemoSnapshotV2, program: Program, context: Context): boolean {
  const f = context.filters, asOf = context.evaluation.asOfAt;
  const belongs = (record: RecordPointer) => {
    if (record.kind === "program") return record.id === program.id;
    if (record.kind === "program-decision") return snapshot.programDecisions.some((item) => item.id === record.id && item.programId === program.id && known(item.decidedAt, asOf));
    if (record.kind === "program-note") return snapshot.programNotes.some((item) => item.id === record.id && item.programId === program.id && known(item.createdAt, asOf));
    if (record.kind === "process-version") return snapshot.processVersions.some((item) => item.id === record.id && item.programId === program.id && item.approvalHistory.some((approval) => known(approval.occurredAt, asOf)));
    if (record.kind === "work-item") return snapshot.workItems.some((item) => item.id === record.id && item.programId === program.id && known(item.createdAt, asOf));
    return f.programIds.includes(program.id) || filterEnrollments(snapshot, program, context).length > 0;
  };
  return [...new Set(f.recordRefs.map((record) => record.kind))].every((kind) => f.recordRefs.filter((record) => record.kind === kind).some(belongs));
}
export function prepareProgramsView(snapshot: DemoSnapshotV2, context: Context): PreparedProgramsView {
  const f = context.filters, asOf = context.evaluation.asOfAt;
  const resultsByProgram = new Map<ProgramId, readonly ProgramResultGroup[]>();
  const points: ProgramResultTrendPoint[] = [];
  const rows = snapshot.programs.filter((program) => !f.matchNone && (known(program.startAt, asOf) || population(snapshot, program, context).length > 0) && includes(f.programIds, program.id) && (f.selectedMarket === "ALL" || program.marketIds.includes(f.selectedMarket)) && (!f.marketIds.length || program.marketIds.some((market) => f.marketIds.includes(market))) && programMatchesReferences(snapshot, program, context))
    .map((program): PreparedProgramRow => {
      const selected = filterEnrollments(snapshot, program, context);
      const groups = [...new Set(population(snapshot, program, context).map((entry) => entry.groupId))].sort().map((groupId) => groupEvidence(snapshot, program, groupId, selected.filter((entry) => entry.groupId === groupId), context));
      resultsByProgram.set(program.id, groups);
      const latestDecision = latest(snapshot.programDecisions.filter((item) => item.programId === program.id), (item) => item.decidedAt, asOf);
      const notes = snapshot.programNotes.filter((item) => item.programId === program.id);
      const note = latest(notes.filter((item) => item.kind !== "next-step"), (item) => item.createdAt, asOf);
      const nextStep = latest(notes.filter((item) => item.kind === "next-step"), (item) => item.createdAt, asOf);
      const targetDetails = targetProjection(snapshot, program, context);
      // The saved evaluation identifies a group; alphabetical ordering carries no business meaning.
      const savedEvidenceId = latestDecision?.evidenceSnapshotId ?? targetDetails.originallyDeclared?.baselineEvidenceSnapshotId;
      const saved = snapshot.evidenceSnapshots.find((item) => item.id === savedEvidenceId);
      const savedGroups = new Set(snapshot.programEnrollments.filter((entry) => entry.programId === program.id && saved?.denominatorMembers.some((member) => member.kind === "program-enrollment" && member.id === entry.id)).map((entry) => entry.groupId));
      const selectedResult = groups.length === 1 ? groups[0]! : savedGroups.size === 1 ? groups.find((group) => savedGroups.has(group.groupId)) ?? null : null;
      const versions = snapshot.processVersions.filter((item) => item.programId === program.id).flatMap((item) => {
        const history = item.approvalHistory.filter((approval) => known(approval.occurredAt, asOf));
        return history.length ? [{ ...item, status: latest(history, (approval) => approval.occurredAt, asOf)!.status, approvalHistory: history }] : [];
      });
      const workaround = snapshot.workaroundExamples.find((item) => item.id === program.originWorkaroundRef) ?? null;
      const sourceLabels = [...new Set(selected.map((entry) => snapshot.sources.find((source) => source.id === entry.sourceAtEntry)?.label).filter((item): item is string => !!item))];
      const workflowSource = [...(workaround ? ["Synthetic spreadsheet workaround"] : []), ...versions.map((item) => `Process v${item.version} (${item.status})`), ...sourceLabels].sort().join(" · ") || "No recorded synthetic workflow source";
      points.push(...groups.map((group) => comparison(program, group, !targetDetails.targetGroupIds.length || targetDetails.targetGroupIds.includes(group.groupId) ? targetDetails.value : null)));
      return { id: program.id, title: program.title, typeLabel: labels[program.type], marketLabel: program.marketIds.join(", "), stage: program.stage, ownerId: program.ownerId, brief: program.changeSummary, implementationAt: program.startAt, target: targetDetails.value, result: selectedResult, reviewAt: program.reviewAt, latestNote: note?.text ?? null, latestNextStep: nextStep?.text ?? null, nextStep: nextStep?.text ?? latestDecision?.rationale ?? "No recorded next step.", workflowSource, latestDecision, targetDetails, groups, resultSelectionReason: groups.length === 1 ? "Only declared cohort." : selectedResult ? "Cohort identified by retained decision or original target evidence." : "Multiple cohorts; inspect each comparison. No overall result is implied.", detailTarget: target(context, program), owner: snapshot.teamMembers.find((member) => member.id === program.ownerId) ?? null, hypothesis: program.hypothesis, eligibilityRule: program.measurementPlan.eligibilityRule, processVersions: versions, workaround, linkedNeedRefs: program.linkedNeedRefs,
        work: scopedWork(snapshot, program, context).map((work) => ({ record: projectWorkItemAt(work, asOf), target: target(context, program, ref("work-item", work.id)) })),
        participants: selected.map((entry) => ({ enrollment: entry, name: snapshot.reporters.find((person) => person.id === entry.reporterId)?.fictionalName ?? entry.reporterId, onboardingSteps: snapshot.onboardingSteps.filter((step) => step.acquisitionCaseId === entry.acquisitionCaseId && known(step.recordedAt, asOf)), target: target(context, program, ref("program-enrollment", entry.id)) })),
        historyLimitations: ms(asOf) < ms(snapshot.currentAsOfAt) ? ["Program owner, stage and review date are current fields without full historical edit history; historical accountability is unavailable."] : [],
        processGaps: versions.flatMap((version) => version.requiredSteps.flatMap((step) => { const missing = [...(!step.responsibleRole ? ["responsibleRole"] : []), ...(step.slaElapsedHours === undefined ? ["slaElapsedHours"] : []), ...(!step.evidenceRequirement ? ["evidenceRequirement"] : []), ...(!step.exceptionRoute ? ["exceptionRoute"] : [])]; return missing.length ? [{ processVersionId: version.id, stepId: step.id, missing }] : []; })) };
    });
  return { workspace: PROGRAMS_WORKSPACE, evaluation: context.evaluation, appliedFilters: f, evidence: [...resultsByProgram.values()].flatMap((groups) => groups.map((group) => group.evidence)), rows, resultsByProgram,
    summary: { running: rows.filter((row) => row.stage === "trying").length, reviewNow: rows.filter((row) => row.stage === "reviewing").length, expanding: rows.filter((row) => row.stage === "rolling-out").length, stopped: rows.filter((row) => row.stage === "closed").length }, resultOverTime: points, cohortComparisons: points,
    ownerOptions: snapshot.teamMembers.filter((member) => known(member.activeFrom, asOf) && (!member.activeTo || ms(member.activeTo) > ms(asOf))).map((member) => ({ id: member.id, label: `${member.fictionalName} · ${member.focusRole}` })),
    filterScope: { records: "Program rows follow program and market scope; exact member filters retain empty cohorts.", comparisons: "All comparisons use the same exact enrollment filters and frozen entry window/horizon. These are categorical cohorts, not a time series.", attention: "Program accountability and canonical linked work follow the same selected program/market scope.", unsupported: f.capabilityCodes.length || f.attendanceModes.length ? ["Demand capability/attendance filters are not enrollment attributes and are not applied."] : [] } };
}
export interface WeeklyProgramsReview {
  readonly reportingWindow: DateWindow; readonly asOfAt: string; readonly isPartial: boolean; readonly actualResults: readonly ProgramResultGroup[];
  readonly stillOpenWork: readonly { readonly id: string; readonly programId: string; readonly status: string }[];
  readonly unknownWork: readonly { readonly id: string; readonly programId: string; readonly blockerCode: string }[];
  readonly decisions: readonly ProgramDecision[]; readonly evidence: readonly EvidenceBundle[]; readonly actions: readonly WeeklyReviewAction[]; readonly programs: readonly PreparedProgramRow[];
}
export function prepareWeeklyProgramsReview(snapshot: DemoSnapshotV2, context: Context): WeeklyProgramsReview {
  const window = context.filters.window;
  if (!window) throw new Error("Weekly Programs review requires an explicit half-open reporting window.");
  const view = prepareProgramsView(snapshot, context), asOf = context.evaluation.asOfAt;
  const definition = snapshot.metricDefinitions.find((item) => item.id === "M13");
  if (!definition) throw new Error("Weekly Programs review requires the frozen M13 metric definition.");
  const currentWork = view.rows.flatMap((row) => row.work.map(({ record: work }) => ({ work, status: latest(work.statusHistory, (item) => item.occurredAt, asOf)?.status ?? "open" })));
  const open = currentWork.filter((item) => ["open", "in-progress", "blocked"].includes(item.status));
  const unknown = open.filter((item) => item.work.blockerCode?.includes("unknown"));
  const decisions = snapshot.programDecisions.filter((item) => view.rows.some((row) => row.id === item.programId) && known(item.decidedAt, asOf) && inWindow(item.decidedAt, window.startAt, window.endAt));
  const count = (id: string, description: string, records: readonly ResolvedRecordReference[]): EvidenceBundle => {
    const workRecords = records.every((r) => r.kind === "work-item") && id !== "decisions";
    const filters = { ...context.filters, marketBasis: "program-market-at-entry" as const, matchNone: !records.length, workItemIds: workRecords ? records.map((r) => r.id as never) : [], recordRefs: records.map((r) => ref(r.kind, r.id)) };
    const metric = { id: definition.id, version: definition.version };
    return { id: `evidence-weekly-${id}-${context.evaluation.snapshotRevision}` as never, metric, asOfAt: asOf, snapshotRevision: context.evaluation.snapshotRevision, unit: definition.unit, scope: { workspace: "programs", marketBasis: "program-market-at-entry", selectedMarket: filters.selectedMarket, populationDescription: description }, filters, reportingWindow: window, computation: { status: "available", value: records.length, numerator: null, denominator: null }, contributingRecords: records, numeratorMembers: [], denominatorMembers: [], exclusions: [], unknownCount: 0, limitations: [], explanation: `${records.length} ${description}.`, navigationTarget: { workspace: workRecords ? "team" : "programs", intent: "work-list", filters, evidenceContext: { asOfAt: asOf, snapshotRevision: context.evaluation.snapshotRevision, metric } } };
  };
  const workRefs = (items: typeof open) => items.map(({ work }) => ({ ...ref("work-item", work.id), label: work.title ?? work.kind, occurredAt: work.createdAt, joinPath: [ref("program", work.programId!)] }));
  return { reportingWindow: window, asOfAt: asOf, isPartial: ms(asOf) < ms(window.endAt), actualResults: [...view.resultsByProgram.values()].flat(), stillOpenWork: open.map(({ work, status }) => ({ id: work.id, programId: work.programId!, status })), unknownWork: unknown.map(({ work }) => ({ id: work.id, programId: work.programId!, blockerCode: work.blockerCode! })), decisions, programs: view.rows,
    actions: view.rows.flatMap((row) => {
      const reviewAt = row.latestDecision ? row.latestDecision.nextReviewAt : row.reviewAt as Program["reviewAt"];
      const note = latest(snapshot.programNotes.filter((item) => item.programId === row.id && item.kind === "next-step"), (item) => item.createdAt, asOf);
      if (!note?.text.trim() && (!reviewAt || (row.stage === "closed" && !row.latestDecision?.nextReviewAt))) return [];
      const source = note?.text.trim() ? ref("program-note", note.id) : row.latestDecision ? ref("program-decision", row.latestDecision.id) : ref("program", row.id);
      const navigationTarget = { ...row.detailTarget, filters: { ...row.detailTarget.filters, recordRefs: [source] } };
      return [{ id: `program-review-${row.id}`, label: note?.text.trim() ? note.text : `Review ${row.title}`, source, owner: row.historyLimitations.length ? null : row.owner ? { id: row.owner.id, name: row.owner.fictionalName } : null, reviewAt: row.historyLimitations.length && !row.latestDecision ? null : reviewAt, reviewDateLabel: row.latestDecision ? "Decision next review date" : "Program review date", dueAt: null, navigationTarget, limitations: [...row.historyLimitations, "Decision rationale is historical evidence, not an entered next-step action."] }];
    }),
    evidence: [...view.evidence, count("open", "still-open canonical work items", workRefs(open)), count("unknown", "work items with unknown information", workRefs(unknown)), count("decisions", "explicit program decisions", decisions.map((item) => ({ ...ref("program-decision", item.id), label: `${item.decision} decision`, occurredAt: item.decidedAt, joinPath: [ref("program", item.programId)] })))] };
}
/** These builders are intentionally side-effect free. Repository command handling owns persistence. */
export function buildProcessDraft(
  snapshot: DemoSnapshotV2,
  input: Omit<ProcessVersion, "id" | "version" | "status" | "approvalHistory"> & { readonly id: ProcessVersion["id"]; readonly actorId: string; readonly occurredAt: string; readonly rationale: string },
): ProcessVersion {
  if (!snapshot.programs.some((program) => program.id === input.programId)) throw new Error("Program must exist before saving a process draft.");
  const version = Math.max(0, ...snapshot.processVersions.filter((item) => item.programId === input.programId).map((item) => item.version)) + 1;
  return { ...input, version, status: "draft", approvalHistory: [{ status: "draft", actorId: input.actorId as never, occurredAt: input.occurredAt as never, rationale: input.rationale }] };
}

export function advanceLimitedPilotProcess(
  process: ProcessVersion,
  input: { readonly status: "review-ready" | "approved-for-limited-pilot"; readonly actorId: string; readonly occurredAt: string; readonly rationale: string },
): ProcessVersion {
  const allowed = process.status === "draft" ? "review-ready" : process.status === "review-ready" ? "approved-for-limited-pilot" : null;
  if (input.status !== allowed) throw new Error("Process statuses only move from draft to review-ready to approved-for-limited-pilot.");
  return { ...process, status: input.status, approvalHistory: [...process.approvalHistory, { ...input, actorId: input.actorId as never, occurredAt: input.occurredAt as never }] };
}
