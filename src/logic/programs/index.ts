import type {
  DemoSnapshotV2,
  DateWindow,
  EvidenceBundle,
  MetricDefinitionRef,
  Program,
  ProgramDecision,
  ProgramEnrollment,
  ProgramId,
  ProgramType,
  ProcessVersion,
  RecordPointer,
  ResolvedRecordReference,
  WorkspaceLogicPort,
  WorkspaceQueryContext,
} from "../../contracts/v2";

export const PROGRAMS_WORKSPACE = "programs" as const;
export type ProgramsLogicPort = WorkspaceLogicPort<typeof PROGRAMS_WORKSPACE>;

export interface ProgramResultGroup {
  readonly groupId: string;
  readonly label: string;
  readonly entrants: number;
  readonly matureEntrants: number;
  readonly stillObservingEntrants: number;
  readonly timelyFirstJobs: number;
  readonly result: number | null;
  readonly evidence: EvidenceBundle;
}

export interface SourceContribution {
  readonly sourceId: string | null;
  readonly sourceLabel: string;
  readonly attributableSpendMinor: number | null;
  readonly timelyFirstJobs: number;
  readonly spendPerFirstJobMinor: number | null;
  readonly status: "available" | "unavailable";
  readonly reason: string | null;
}

export interface GoalIntegrityProjection {
  readonly goalId: string;
  readonly revisions: readonly { readonly version: number; readonly metricId: string; readonly metricVersion: string; readonly target: number; readonly deadline: string; readonly baselineAsOfAt: string; readonly scope: string; readonly baselineEvidenceSnapshotId: string }[];
}

export interface WeeklyProgramsReview {
  readonly reportingWindow: DateWindow;
  readonly asOfAt: string;
  readonly isPartial: boolean;
  readonly actualResults: readonly ProgramResultGroup[];
  readonly stillOpenWork: readonly { readonly id: string; readonly programId: string; readonly status: string }[];
  readonly unknownWork: readonly { readonly id: string; readonly programId: string; readonly blockerCode: string }[];
  readonly decisions: readonly ProgramDecision[];
  readonly evidence: readonly EvidenceBundle[];
}

export interface PreparedProgramRow {
  readonly id: ProgramId;
  readonly title: string;
  readonly typeLabel: "Experiment" | "Campaign" | "Sourcing" | "Process";
  readonly marketLabel: string;
  readonly stage: Program["stage"];
  readonly ownerId: string;
  readonly brief: string;
  readonly implementationAt: string;
  readonly target: number | null;
  readonly result: ProgramResultGroup | null;
  readonly reviewAt: string;
  readonly latestNote: string | null;
  readonly latestNextStep: string | null;
  readonly nextStep: string;
  readonly workflowSource: string;
  readonly latestDecision: ProgramDecision | null;
}

export interface ProgramResultTrendPoint {
  readonly id: string;
  readonly programId: ProgramId;
  readonly groupId: string;
  readonly periodStartAt: string | null;
  readonly periodEndAt: string | null;
  readonly result: number | null;
  readonly target: number | null;
  readonly targetState: "met" | "not-met" | "unavailable" | "not-declared";
  readonly accessibleLabel: string;
  readonly evidenceId: string;
}

export interface ProgramsSummary {
  readonly running: number;
  readonly reviewNow: number;
  readonly expanding: number;
  readonly stopped: number;
}

export interface PreparedProgramsView {
  readonly workspace: typeof PROGRAMS_WORKSPACE;
  readonly evaluation: WorkspaceQueryContext<typeof PROGRAMS_WORKSPACE>["evaluation"];
  readonly appliedFilters: WorkspaceQueryContext<typeof PROGRAMS_WORKSPACE>["filters"];
  readonly evidence: readonly EvidenceBundle[];
  readonly rows: readonly PreparedProgramRow[];
  readonly resultsByProgram: ReadonlyMap<ProgramId, readonly ProgramResultGroup[]>;
  readonly summary: ProgramsSummary;
  readonly resultOverTime: readonly ProgramResultTrendPoint[];
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

const pointer = (kind: RecordPointer["kind"], id: string): RecordPointer => ({ kind, id });
const inWindow = (value: string, start: string, end: string) => value >= start && value < end;
const knownAt = (recordedAt: string, asOfAt: string) => recordedAt <= asOfAt;
const followUpDeadline = (enteredAt: string, days: number) => new Date(new Date(enteredAt).getTime() + days * 86_400_000).toISOString();

const PROGRAM_TYPE_LABELS: Readonly<Record<ProgramType, PreparedProgramRow["typeLabel"]>> = {
  tool: "Experiment",
  incentive: "Campaign",
  source: "Sourcing",
  workflow: "Process",
  "re-engagement": "Campaign",
};

function latestAt<T extends { readonly createdAt?: string; readonly decidedAt?: string }>(records: readonly T[], asOfAt: string): T | null {
  return records.filter((record) => (record.createdAt ?? record.decidedAt ?? "") <= asOfAt).sort((left, right) => (right.createdAt ?? right.decidedAt ?? "").localeCompare(left.createdAt ?? left.decidedAt ?? ""))[0] ?? null;
}

function workflowSource(snapshot: DemoSnapshotV2, program: Program, asOfAt: string): string {
  const sources = new Set<string>();
  const workaround = program.originWorkaroundRef ? snapshot.workaroundExamples.find((item) => item.id === program.originWorkaroundRef) : undefined;
  if (workaround) sources.add(workaround.kind === "synthetic-spreadsheet" ? "Synthetic spreadsheet workaround" : workaround.kind);
  for (const process of snapshot.processVersions.filter((item) => item.programId === program.id && item.approvalHistory.some((approval) => approval.occurredAt <= asOfAt))) {
    sources.add(`Process v${process.version} (${process.status})`);
  }
  const labels = new Map(snapshot.sources.map((source) => [source.id, source.label]));
  for (const enrollment of snapshot.programEnrollments.filter((item) => item.programId === program.id && item.enteredAt <= asOfAt)) {
    if (enrollment.sourceAtEntry) sources.add(labels.get(enrollment.sourceAtEntry) ?? "Unknown recorded source");
  }
  return sources.size ? [...sources].sort().join(" · ") : "No recorded synthetic workflow source";
}

function trendPoint(program: Program, group: ProgramResultGroup, enrollments: readonly ProgramEnrollment[], target: number | null): ProgramResultTrendPoint {
  const ordered = [...enrollments].sort((left, right) => left.enteredAt.localeCompare(right.enteredAt));
  const targetState = target === null ? "not-declared" : group.result === null ? "unavailable" : group.result >= target ? "met" : "not-met";
  const resultLabel = group.result === null ? "result unavailable" : `${group.timelyFirstJobs} of ${group.matureEntrants} timely first jobs (${Math.round(group.result * 100)}%)`;
  const targetLabel = target === null ? "no declared target" : `declared target ${Math.round(target * 100)}%, ${targetState === "met" ? "met" : targetState === "not-met" ? "not met" : "not yet evaluable"}`;
  return {
    id: `${program.id}-${group.groupId}`,
    programId: program.id,
    groupId: group.groupId,
    periodStartAt: ordered[0]?.enteredAt ?? null,
    periodEndAt: ordered.at(-1)?.enteredAt ?? null,
    result: group.result,
    target,
    targetState,
    accessibleLabel: `${program.title}, ${group.groupId}: ${resultLabel}; ${targetLabel}.`,
    evidenceId: group.evidence.id,
  };
}

function filterEnrollments(snapshot: DemoSnapshotV2, program: Program, context: WorkspaceQueryContext<typeof PROGRAMS_WORKSPACE>) {
  const selected = context.filters.selectedMarket;
  return snapshot.programEnrollments.filter((enrollment) =>
    enrollment.programId === program.id &&
    inWindow(enrollment.enteredAt, program.measurementPlan.entryWindow.startAt, program.measurementPlan.entryWindow.endAt) &&
    enrollment.enteredAt <= context.evaluation.asOfAt &&
    (selected === "ALL" || enrollment.marketAtEntry === selected),
  );
}

function firstCompletedJobs(snapshot: DemoSnapshotV2, asOfAt: string) {
  const accepted = new Map(snapshot.assignmentEvents.filter((event) => event.state === "accepted" && knownAt(event.recordedAt, asOfAt) && event.occurredAt <= asOfAt).map((event) => [event.id, event]));
  const first = new Map<string, (typeof snapshot.jobOutcomes)[number]>();
  for (const job of snapshot.jobOutcomes) {
    const assignment = accepted.get(job.acceptedAssignmentEventId);
    if (job.outcome !== "completed" || !job.completedAt || job.completedAt > asOfAt || !knownAt(job.recordedAt, asOfAt) || !assignment || assignment.reporterId !== job.reporterId || assignment.requestId !== job.requestId) continue;
    const existing = first.get(job.reporterId);
    if (!existing || (existing.completedAt && job.completedAt < existing.completedAt)) first.set(job.reporterId, job);
  }
  return first;
}

function referencesFor(
  snapshot: DemoSnapshotV2,
  enrollments: readonly ProgramEnrollment[],
  timely: ReadonlySet<string>,
  asOfAt: string,
): readonly ResolvedRecordReference[] {
  const cases = new Map(snapshot.acquisitionCases.map((item) => [item.id, item]));
  const source = new Map(snapshot.sources.map((item) => [item.id, item]));
  const lifecycle = new Map(snapshot.lifecycleEvents.map((item) => [item.acquisitionCaseId, item]));
  const firstJobs = firstCompletedJobs(snapshot, asOfAt);
  return enrollments.flatMap((enrollment) => {
    const caseRecord = enrollment.acquisitionCaseId ? cases.get(enrollment.acquisitionCaseId) : undefined;
    const sourceRecord = enrollment.sourceAtEntry ? source.get(enrollment.sourceAtEntry) : undefined;
    const enrollmentPointer = pointer("program-enrollment", enrollment.id);
    const values: ResolvedRecordReference[] = [{ ...enrollmentPointer, label: `Enrollment ${enrollment.id}`, occurredAt: enrollment.enteredAt, joinPath: [pointer("program", enrollment.programId)] }];
    if (caseRecord) values.push({ ...pointer("acquisition-case", caseRecord.id), label: `First-time case ${caseRecord.id}`, occurredAt: caseRecord.openedAt, joinPath: [enrollmentPointer] });
    const lifecycleRecord = enrollment.acquisitionCaseId ? lifecycle.get(enrollment.acquisitionCaseId) : undefined;
    if (lifecycleRecord) values.push({ ...pointer("lifecycle-event", lifecycleRecord.id), label: `${lifecycleRecord.eventType} evidence`, occurredAt: lifecycleRecord.occurredAt, joinPath: [enrollmentPointer, pointer("acquisition-case", lifecycleRecord.acquisitionCaseId)] });
    if (sourceRecord) values.push({ ...pointer("source", sourceRecord.id), label: sourceRecord.label, occurredAt: null, joinPath: [enrollmentPointer] });
    const job = firstJobs.get(enrollment.reporterId);
    if (job && timely.has(enrollment.id)) values.push({ ...pointer("job-outcome", job.id), label: `Timely first job ${job.id}`, occurredAt: job.completedAt, joinPath: [enrollmentPointer] });
    return values;
  }).filter((reference, index, all) => all.findIndex((candidate) => candidate.kind === reference.kind && candidate.id === reference.id) === index);
}

function groupEvidence(
  snapshot: DemoSnapshotV2,
  program: Program,
  groupId: string,
  enrollments: readonly ProgramEnrollment[],
  context: WorkspaceQueryContext<typeof PROGRAMS_WORKSPACE>,
): ProgramResultGroup {
  const firstJobs = firstCompletedJobs(snapshot, context.evaluation.asOfAt);
  const mature = enrollments.filter((enrollment) => context.evaluation.asOfAt >= followUpDeadline(enrollment.enteredAt, program.measurementPlan.followUpDays));
  const observing = enrollments.filter((enrollment) => !mature.includes(enrollment));
  const timely = new Set(mature.filter((enrollment) => {
    const job = firstJobs.get(enrollment.reporterId);
    if (!job?.completedAt) return false;
    const deadline = followUpDeadline(enrollment.enteredAt, program.measurementPlan.followUpDays);
    return job.completedAt >= enrollment.enteredAt && job.completedAt <= deadline;
  }).map((enrollment) => enrollment.id));
  const denominatorMembers = mature.map((entry) => pointer("program-enrollment", entry.id));
  const numeratorMembers = mature.filter((entry) => timely.has(entry.id)).map((entry) => pointer("program-enrollment", entry.id));
  const scopedFilters = { ...context.filters, programIds: [program.id], programEnrollmentIds: enrollments.map((entry) => entry.id), recordRefs: enrollments.map((entry) => pointer("program-enrollment", entry.id)) };
  const empty = enrollments.length === 0;
  const noMature = mature.length === 0;
  const evidence: EvidenceBundle = {
    id: `evidence-program-${program.id}-${groupId}-${context.evaluation.snapshotRevision}` as EvidenceBundle["id"],
    metric: program.measurementPlan.metric,
    asOfAt: context.evaluation.asOfAt,
    snapshotRevision: context.evaluation.snapshotRevision,
    unit: "ratio",
    scope: { workspace: PROGRAMS_WORKSPACE, marketBasis: "program-market-at-entry", selectedMarket: context.filters.selectedMarket, populationDescription: empty ? "No participants in this market." : `Explicit frozen ${groupId} enrollments; ${mature.length} fully observed on the same ${program.measurementPlan.followUpDays}-day horizon and ${observing.length} still observing.` },
    filters: scopedFilters,
    reportingWindow: program.measurementPlan.entryWindow,
    computation: empty ? { status: "unavailable", value: null, numerator: null, denominator: null, reason: "No participants in this market." } : noMature ? { status: "unavailable", value: null, numerator: null, denominator: null, reason: "Participants are still being observed; no final outcome denominator is mature." } : { status: "available", value: timely.size / mature.length, numerator: timely.size, denominator: mature.length },
    contributingRecords: referencesFor(snapshot, enrollments, timely, context.evaluation.asOfAt),
    numeratorMembers,
    denominatorMembers,
    exclusions: [],
    unknownCount: 0,
    limitations: [...program.limitations, ...(observing.length ? [`${observing.length} participant(s) are still observing and excluded from the finalized denominator.`] : []), "Observed participant outcomes describe this synthetic sample; they do not establish causality."],
    explanation: empty ? "No participants in this market; this is unavailable rather than a 0% failure." : noMature ? "Participants are still being observed; no final result is available yet." : `${timely.size} of ${mature.length} fully observed participants had a first completed job within the declared follow-up horizon.${observing.length ? ` ${observing.length} are still observing.` : ""}`,
    navigationTarget: { workspace: PROGRAMS_WORKSPACE, intent: "evidence-list", filters: scopedFilters, evidenceContext: { asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, metric: program.measurementPlan.metric } },
  };
  return { groupId, label: groupId, entrants: enrollments.length, matureEntrants: mature.length, stillObservingEntrants: observing.length, timelyFirstJobs: timely.size, result: empty || noMature ? null : timely.size / mature.length, evidence };
}

export function calculateSourceContribution(snapshot: DemoSnapshotV2, program: Program, groupId: string, context: WorkspaceQueryContext<typeof PROGRAMS_WORKSPACE>): readonly SourceContribution[] {
  const enrollments = filterEnrollments(snapshot, program, context).filter((item) => item.groupId === groupId);
  const result = groupEvidence(snapshot, program, groupId, enrollments, context);
  const timelyIds = new Set(result.evidence.numeratorMembers.map((item) => item.id));
  const sources = new Map(snapshot.sources.map((item) => [item.id, item.label]));
  const sourceIds = [...new Set(enrollments.map((item) => item.sourceAtEntry))];
  return sourceIds.map((sourceId) => {
    const sourceEnrollments = enrollments.filter((item) => item.sourceAtEntry === sourceId);
    const timely = sourceEnrollments.filter((item) => timelyIds.has(item.id)).length;
    const planWindow = program.measurementPlan.entryWindow;
    const coversPlan = (window: DateWindow | null) => window !== null && window.startAt <= planWindow.startAt && window.endAt >= planWindow.endAt;
    const spends = snapshot.sourceSpend.filter((spend) => spend.sourceId === sourceId && spend.programId === program.id && spend.cohortRef === groupId && spend.occurredAt <= context.evaluation.asOfAt && coversPlan(spend.attributableWindow));
    if (!spends.length) return { sourceId, sourceLabel: sourceId ? sources.get(sourceId) ?? "Unknown source" : "Unknown source", attributableSpendMinor: null, timelyFirstJobs: timely, spendPerFirstJobMinor: null, status: "unavailable", reason: "Spend not recorded." };
    const amount = spends.reduce((sum, spend) => sum + spend.amountMinor, 0);
    if (!timely) return { sourceId, sourceLabel: sourceId ? sources.get(sourceId) ?? "Unknown source" : "Unknown source", attributableSpendMinor: amount, timelyFirstJobs: 0, spendPerFirstJobMinor: null, status: "unavailable", reason: `No first jobs yet; ${amount} minor units spent.` };
    return { sourceId, sourceLabel: sourceId ? sources.get(sourceId) ?? "Unknown source" : "Unknown source", attributableSpendMinor: amount, timelyFirstJobs: timely, spendPerFirstJobMinor: amount / timely, status: "available", reason: null };
  });
}

export function projectGoalIntegrity(snapshot: DemoSnapshotV2, goalId: string, asOfAt?: string): GoalIntegrityProjection {
  return { goalId, revisions: snapshot.goalRevisions.filter((revision) => revision.goalId === goalId && (asOfAt === undefined || revision.savedAt <= asOfAt)).sort((a, b) => a.version - b.version).map((revision) => ({ version: revision.version, metricId: revision.metric.id, metricVersion: revision.metric.version, target: revision.target, deadline: revision.deadline, baselineAsOfAt: revision.baselineAsOfAt, scope: JSON.stringify(revision.scope), baselineEvidenceSnapshotId: revision.baselineEvidenceSnapshotId })) };
}

function countEvidence(
  context: WorkspaceQueryContext<typeof PROGRAMS_WORKSPACE>,
  metric: MetricDefinitionRef,
  id: string,
  description: string,
  records: readonly ResolvedRecordReference[],
): EvidenceBundle {
  const refs = records.map((record) => pointer(record.kind, record.id));
  const filters = { ...context.filters, recordRefs: refs, programIds: [...new Set(records.flatMap((record) => record.joinPath.filter((path) => path.kind === "program").map((path) => path.id as ProgramId)))] };
  return { id: id as EvidenceBundle["id"], metric, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: "tasks", scope: { workspace: PROGRAMS_WORKSPACE, marketBasis: "program-market-at-entry", selectedMarket: context.filters.selectedMarket, populationDescription: description }, filters, reportingWindow: context.filters.window, computation: { status: "available", value: records.length, numerator: null, denominator: null }, contributingRecords: records, numeratorMembers: [], denominatorMembers: [], exclusions: [], unknownCount: 0, limitations: [], explanation: `${records.length} ${description.toLowerCase()}.`, navigationTarget: { workspace: PROGRAMS_WORKSPACE, intent: "work-list", filters, evidenceContext: { asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, metric } } };
}

export function prepareWeeklyProgramsReview(snapshot: DemoSnapshotV2, context: WorkspaceQueryContext<typeof PROGRAMS_WORKSPACE>): WeeklyProgramsReview {
  if (!context.filters.window) throw new Error("Weekly Programs review requires an explicit half-open reporting window.");
  const view = prepareProgramsView(snapshot, context);
  const programs = new Set(view.rows.map((row) => row.id));
  const weeklyDefinition = snapshot.metricDefinitions.find((definition) => String(definition.id) === "M13");
  if (!weeklyDefinition) throw new Error("Weekly Programs review requires the frozen M13 metric definition.");
  const weeklyMetric: MetricDefinitionRef = { id: weeklyDefinition.id, version: weeklyDefinition.version };
  const statusAt = (work: DemoSnapshotV2["workItems"][number]) => work.statusHistory.filter((change) => change.occurredAt <= context.evaluation.asOfAt).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))[0]?.status ?? "open";
  const currentWork = snapshot.workItems.filter((work) => work.programId !== null && programs.has(work.programId) && work.createdAt <= context.evaluation.asOfAt).map((work) => ({ work, status: statusAt(work) }));
  const open = currentWork.filter((item) => item.status === "open" || item.status === "in-progress" || item.status === "blocked");
  const unknown = open.filter((item) => item.work.blockerCode?.includes("unknown"));
  const decisions = snapshot.programDecisions.filter((decision) => programs.has(decision.programId) && decision.decidedAt <= context.evaluation.asOfAt && inWindow(decision.decidedAt, context.filters.window!.startAt, context.filters.window!.endAt));
  const workRecords = open.map(({ work }) => ({ ...pointer("work-item", work.id), label: `Open ${work.kind} work ${work.id}`, occurredAt: work.createdAt, joinPath: [pointer("program", work.programId!)] }));
  const unknownRecords = unknown.map(({ work }) => ({ ...pointer("work-item", work.id), label: `Unknown information in ${work.id}`, occurredAt: work.createdAt, joinPath: [pointer("program", work.programId!)] }));
  const decisionRecords = decisions.map((decision) => ({ ...pointer("program-decision", decision.id), label: `${decision.decision} decision`, occurredAt: decision.decidedAt, joinPath: [pointer("program", decision.programId)] }));
  const evidence = [
    ...view.evidence,
    countEvidence(context, weeklyMetric, `evidence-weekly-open-${context.evaluation.snapshotRevision}`, "still-open canonical work items", workRecords),
    countEvidence(context, weeklyMetric, `evidence-weekly-unknown-${context.evaluation.snapshotRevision}`, "work items with unknown information", unknownRecords),
    countEvidence(context, weeklyMetric, `evidence-weekly-decisions-${context.evaluation.snapshotRevision}`, "explicit program decisions", decisionRecords),
  ];
  return { reportingWindow: context.filters.window, asOfAt: context.evaluation.asOfAt, isPartial: context.evaluation.asOfAt < context.filters.window.endAt, actualResults: [...view.resultsByProgram.values()].flat(), stillOpenWork: open.map(({ work, status }) => ({ id: work.id, programId: work.programId!, status })), unknownWork: unknown.map(({ work }) => ({ id: work.id, programId: work.programId!, blockerCode: work.blockerCode! })), decisions, evidence };
}

export function prepareProgramsView(snapshot: DemoSnapshotV2, context: WorkspaceQueryContext<typeof PROGRAMS_WORKSPACE>): PreparedProgramsView {
  const resultsByProgram = new Map<ProgramId, readonly ProgramResultGroup[]>();
  const resultOverTime: ProgramResultTrendPoint[] = [];
  const rows = snapshot.programs
    .filter((program) =>
      (context.filters.programIds.length === 0 || context.filters.programIds.includes(program.id)) &&
      (context.filters.selectedMarket === "ALL" || program.marketIds.includes(context.filters.selectedMarket)),
    )
    .map((program) => {
    const groups = new Map<string, ProgramEnrollment[]>();
    for (const enrollment of snapshot.programEnrollments) if (enrollment.programId === program.id && enrollment.enteredAt <= context.evaluation.asOfAt && inWindow(enrollment.enteredAt, program.measurementPlan.entryWindow.startAt, program.measurementPlan.entryWindow.endAt)) groups.set(enrollment.groupId, []);
    for (const enrollment of filterEnrollments(snapshot, program, context)) groups.set(enrollment.groupId, [...(groups.get(enrollment.groupId) ?? []), enrollment]);
    const results = [...groups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([groupId, enrollments]) => groupEvidence(snapshot, program, groupId, enrollments, context));
    resultsByProgram.set(program.id, results);
    const decisions = snapshot.programDecisions.filter((decision) => decision.programId === program.id && decision.decidedAt <= context.evaluation.asOfAt).sort((left, right) => right.decidedAt.localeCompare(left.decidedAt));
    const notes = snapshot.programNotes.filter((note) => note.programId === program.id && note.createdAt <= context.evaluation.asOfAt);
    const latestNote = latestAt(notes.filter((note) => note.kind !== "next-step"), context.evaluation.asOfAt);
    const latestNextStep = latestAt(notes.filter((note) => note.kind === "next-step"), context.evaluation.asOfAt);
    const target = program.targetRef ? snapshot.goalRevisions.filter((goal) => goal.goalId === program.targetRef && goal.savedAt <= context.evaluation.asOfAt).sort((a, b) => b.version - a.version)[0]?.target ?? null : null;
    for (const group of results) resultOverTime.push(trendPoint(program, group, filterEnrollments(snapshot, program, context).filter((enrollment) => enrollment.groupId === group.groupId), target));
    return {
      id: program.id,
      title: program.title,
      typeLabel: PROGRAM_TYPE_LABELS[program.type],
      marketLabel: program.marketIds.join(", "),
      stage: program.stage,
      ownerId: program.ownerId,
      brief: program.changeSummary,
      implementationAt: program.startAt,
      target,
      result: results.at(-1) ?? null,
      reviewAt: program.reviewAt,
      latestNote: latestNote?.text ?? null,
      latestNextStep: latestNextStep?.text ?? null,
      nextStep: latestNextStep?.text ?? decisions[0]?.rationale ?? "No recorded next step.",
      workflowSource: workflowSource(snapshot, program, context.evaluation.asOfAt),
      latestDecision: decisions[0] ?? null,
    };
  });
  const summary: ProgramsSummary = {
    running: rows.filter((row) => row.stage === "trying").length,
    reviewNow: rows.filter((row) => row.stage === "reviewing").length,
    expanding: rows.filter((row) => row.stage === "rolling-out").length,
    stopped: rows.filter((row) => row.stage === "closed").length,
  };
  return {
    workspace: PROGRAMS_WORKSPACE,
    evaluation: context.evaluation,
    appliedFilters: context.filters,
    evidence: [...resultsByProgram.values()].flatMap((groups) => groups.map((group) => group.evidence)),
    rows,
    resultsByProgram,
    summary,
    resultOverTime: resultOverTime.sort((left, right) => (left.periodStartAt ?? "").localeCompare(right.periodStartAt ?? "") || left.id.localeCompare(right.id)),
  };
}
