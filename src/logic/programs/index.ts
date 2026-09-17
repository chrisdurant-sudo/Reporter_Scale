import type {
  DemoSnapshotV2,
  EvidenceBundle,
  Program,
  ProgramDecision,
  ProgramEnrollment,
  ProgramId,
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
  readonly timelyFirstJobs: number;
  readonly result: number | null;
  readonly evidence: EvidenceBundle;
}

export interface PreparedProgramRow {
  readonly id: ProgramId;
  readonly title: string;
  readonly marketLabel: string;
  readonly stage: Program["stage"];
  readonly ownerId: string;
  readonly target: number | null;
  readonly result: ProgramResultGroup | null;
  readonly reviewAt: string;
  readonly nextStep: string;
  readonly latestDecision: ProgramDecision | null;
}

export interface PreparedProgramsView {
  readonly workspace: typeof PROGRAMS_WORKSPACE;
  readonly evaluation: WorkspaceQueryContext<typeof PROGRAMS_WORKSPACE>["evaluation"];
  readonly appliedFilters: WorkspaceQueryContext<typeof PROGRAMS_WORKSPACE>["filters"];
  readonly evidence: readonly EvidenceBundle[];
  readonly rows: readonly PreparedProgramRow[];
  readonly resultsByProgram: ReadonlyMap<ProgramId, readonly ProgramResultGroup[]>;
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

function filterEnrollments(snapshot: DemoSnapshotV2, program: Program, context: WorkspaceQueryContext<typeof PROGRAMS_WORKSPACE>) {
  const selected = context.filters.selectedMarket;
  return snapshot.programEnrollments.filter((enrollment) =>
    enrollment.programId === program.id &&
    inWindow(enrollment.enteredAt, program.measurementPlan.entryWindow.startAt, program.measurementPlan.entryWindow.endAt) &&
    (selected === "ALL" || enrollment.marketAtEntry === selected),
  );
}

function firstCompletedJobs(snapshot: DemoSnapshotV2, asOfAt: string) {
  const accepted = new Set(snapshot.assignmentEvents.filter((event) => event.state === "accepted" && knownAt(event.recordedAt, asOfAt)).map((event) => event.id));
  const first = new Map<string, (typeof snapshot.jobOutcomes)[number]>();
  for (const job of snapshot.jobOutcomes) {
    if (job.outcome !== "completed" || !job.completedAt || !knownAt(job.recordedAt, asOfAt) || !accepted.has(job.acceptedAssignmentEventId)) continue;
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
  const timely = new Set(enrollments.filter((enrollment) => {
    const job = firstJobs.get(enrollment.reporterId);
    if (!job?.completedAt) return false;
    const deadline = new Date(new Date(enrollment.enteredAt).getTime() + program.measurementPlan.followUpDays * 86_400_000).toISOString();
    return job.completedAt >= enrollment.enteredAt && job.completedAt <= deadline;
  }).map((enrollment) => enrollment.id));
  const denominatorMembers = enrollments.map((entry) => pointer("program-enrollment", entry.id));
  const numeratorMembers = enrollments.filter((entry) => timely.has(entry.id)).map((entry) => pointer("program-enrollment", entry.id));
  const scopedFilters = { ...context.filters, programIds: [program.id], programEnrollmentIds: enrollments.map((entry) => entry.id), recordRefs: denominatorMembers };
  const empty = enrollments.length === 0;
  const evidence: EvidenceBundle = {
    id: `evidence-program-${program.id}-${groupId}-${context.evaluation.snapshotRevision}` as EvidenceBundle["id"],
    metric: program.measurementPlan.metric,
    asOfAt: context.evaluation.asOfAt,
    snapshotRevision: context.evaluation.snapshotRevision,
    unit: "ratio",
    scope: { workspace: PROGRAMS_WORKSPACE, marketBasis: "program-market-at-entry", selectedMarket: context.filters.selectedMarket, populationDescription: empty ? "No participants in this market." : `Explicit frozen ${groupId} enrollments with the same ${program.measurementPlan.followUpDays}-day horizon.` },
    filters: scopedFilters,
    reportingWindow: program.measurementPlan.entryWindow,
    computation: empty ? { status: "unavailable", value: null, numerator: null, denominator: null, reason: "No participants in this market." } : { status: "available", value: timely.size / enrollments.length, numerator: timely.size, denominator: enrollments.length },
    contributingRecords: referencesFor(snapshot, enrollments, timely, context.evaluation.asOfAt),
    numeratorMembers,
    denominatorMembers,
    exclusions: [],
    unknownCount: 0,
    limitations: [...program.limitations, "Observed participant outcomes describe this synthetic sample; they do not establish causality."],
    explanation: empty ? "No participants in this market; this is unavailable rather than a 0% failure." : `${timely.size} of ${enrollments.length} explicitly enrolled participants had a first completed job within the declared follow-up horizon.`,
    navigationTarget: { workspace: PROGRAMS_WORKSPACE, intent: "evidence-list", filters: scopedFilters, evidenceContext: { asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, metric: program.measurementPlan.metric } },
  };
  return { groupId, label: groupId, entrants: enrollments.length, timelyFirstJobs: timely.size, result: empty ? null : timely.size / enrollments.length, evidence };
}

export function prepareProgramsView(snapshot: DemoSnapshotV2, context: WorkspaceQueryContext<typeof PROGRAMS_WORKSPACE>): PreparedProgramsView {
  const resultsByProgram = new Map<ProgramId, readonly ProgramResultGroup[]>();
  const rows = snapshot.programs.filter((program) => context.filters.programIds.length === 0 || context.filters.programIds.includes(program.id)).map((program) => {
    const groups = new Map<string, ProgramEnrollment[]>();
    for (const enrollment of filterEnrollments(snapshot, program, context)) groups.set(enrollment.groupId, [...(groups.get(enrollment.groupId) ?? []), enrollment]);
    const results = [...groups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([groupId, enrollments]) => groupEvidence(snapshot, program, groupId, enrollments, context));
    resultsByProgram.set(program.id, results);
    const decisions = snapshot.programDecisions.filter((decision) => decision.programId === program.id).sort((left, right) => right.decidedAt.localeCompare(left.decidedAt));
    return { id: program.id, title: program.title, marketLabel: program.marketIds.join(", "), stage: program.stage, ownerId: program.ownerId, target: program.targetRef ? snapshot.goalRevisions.filter((goal) => goal.goalId === program.targetRef).sort((a, b) => b.version - a.version)[0]?.target ?? null : null, result: results.at(-1) ?? null, reviewAt: program.reviewAt, nextStep: decisions[0]?.rationale ?? "Review participant evidence before deciding.", latestDecision: decisions[0] ?? null };
  });
  return { workspace: PROGRAMS_WORKSPACE, evaluation: context.evaluation, appliedFilters: context.filters, evidence: [...resultsByProgram.values()].flatMap((groups) => groups.map((group) => group.evidence)), rows, resultsByProgram };
}
