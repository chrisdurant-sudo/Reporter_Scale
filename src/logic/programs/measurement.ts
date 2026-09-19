import type { DemoSnapshotV2, EvidenceBundle, EvidenceUnit, GoalRevision, Program, ProgramEnrollment, RecordPointer, SourceSpend, WorkspaceQueryContext } from "../../contracts/v2";
import { firstCompletedJobs } from "../network";

export type Context = WorkspaceQueryContext<"programs">;
export const ms = (at: string) => Date.parse(at);
export const known = (at: string, asOf: string) => ms(at) <= ms(asOf);
export const inWindow = (at: string, start: string, end: string) => ms(at) >= ms(start) && ms(at) < ms(end);
export const ref = (kind: RecordPointer["kind"], id: string): RecordPointer => ({ kind, id });
export const includes = (ids: readonly string[], id: string | null) => !ids.length || (id !== null && ids.includes(id));
export function latest<T>(records: readonly T[], date: (record: T) => string, asOf: string): T | null {
  return records.reduce<T | null>((best, record) => known(date(record), asOf) && (!best || ms(date(record)) >= ms(date(best))) ? record : best, null);
}
export const deadline = (entry: ProgramEnrollment, program: Program) => ms(entry.enteredAt) + program.measurementPlan.followUpDays * 86400000;
export function population(snapshot: DemoSnapshotV2, program: Program, context: Context) {
  return snapshot.programEnrollments.filter((entry) => entry.programId === program.id && known(entry.enteredAt, context.evaluation.asOfAt) && inWindow(entry.enteredAt, program.measurementPlan.entryWindow.startAt, program.measurementPlan.entryWindow.endAt));
}
export function entryReferences(snapshot: DemoSnapshotV2, entry: ProgramEnrollment, asOf: string): RecordPointer[] {
  return [ref("program", entry.programId), ref("program-enrollment", entry.id), ref("reporter", entry.reporterId), ref("market", entry.marketAtEntry),
    ...(entry.acquisitionCaseId ? [ref("acquisition-case", entry.acquisitionCaseId)] : []), ...(entry.sourceAtEntry ? [ref("source", entry.sourceAtEntry)] : []), ...(entry.processVersionId ? [ref("process-version", entry.processVersionId)] : []),
    ...snapshot.lifecycleEvents.filter((event) => event.acquisitionCaseId === entry.acquisitionCaseId && event.reporterId === entry.reporterId && known(event.recordedAt, asOf) && known(event.occurredAt, asOf)).map((event) => ref("lifecycle-event", event.id)),
    ...snapshot.jobOutcomes.filter((job) => job.reporterId === entry.reporterId && known(job.recordedAt, asOf) && job.completedAt && known(job.completedAt, asOf)).flatMap((job) => [ref("job-outcome", job.id), ref("demand-request", job.requestId)]),
    ...snapshot.programDecisions.filter((item) => item.programId === entry.programId && known(item.decidedAt, asOf)).map((item) => ref("program-decision", item.id)),
    ...snapshot.programNotes.filter((item) => item.programId === entry.programId && known(item.createdAt, asOf)).map((item) => ref("program-note", item.id)),
    ...snapshot.workItems.filter((work) => known(work.createdAt, asOf) && (work.primaryEntityRef.id === entry.reporterId || work.primaryEntityRef.id === entry.acquisitionCaseId || (work.programId === entry.programId && ["program", "program-decision", "process-version"].includes(work.primaryEntityRef.kind)))).map((work) => ref("work-item", work.id))];
}
export function filterEnrollments(snapshot: DemoSnapshotV2, program: Program, context: Context) {
  const f = context.filters;
  return population(snapshot, program, context).filter((entry) => {
    if (f.matchNone || !includes(f.programIds, program.id) || (f.selectedMarket !== "ALL" && f.selectedMarket !== entry.marketAtEntry) || !includes(f.marketIds, entry.marketAtEntry) || !includes(f.reporterIds, entry.reporterId) || !includes(f.acquisitionCaseIds, entry.acquisitionCaseId) || !includes(f.programEnrollmentIds, entry.id) || !includes(f.sourceIds, entry.sourceAtEntry)) return false;
    const refs = entryReferences(snapshot, entry, context.evaluation.asOfAt);
    const matches = (kind: RecordPointer["kind"], ids: readonly string[]) => !ids.length || refs.some((r) => r.kind === kind && ids.includes(r.id));
    // Alternatives within a reference kind; conjunction across all supplied kinds and ID dimensions.
    return matches("demand-request", f.requestIds) && matches("job-outcome", f.jobOutcomeIds) && matches("work-item", f.workItemIds) && [...new Set(f.recordRefs.map((r) => r.kind))].every((kind) => matches(kind, f.recordRefs.filter((r) => r.kind === kind).map((r) => r.id)));
  });
}
export function planDefinition(snapshot: DemoSnapshotV2, program: Program) {
  const metric = program.measurementPlan.metric;
  const definition = snapshot.metricDefinitions.find((item) => item.id === metric.id && item.version === metric.version);
  const unit: EvidenceUnit = metric.id === "M09" ? "currency-minor" : "ratio";
  const valid = ["M07", "M09", "M12"].includes(metric.id) && metric.version === "v2-frozen-1" && definition?.unit === unit && program.primaryMetric.id === metric.id && program.primaryMetric.version === metric.version && Number.isFinite(program.measurementPlan.followUpDays) && program.measurementPlan.followUpDays > 0;
  return { unit: definition?.unit ?? unit, reason: valid ? null : "Missing or incompatible frozen measurement plan, metric version or unit." };
}
export interface SourceContribution {
  readonly sourceId: string | null; readonly sourceLabel: string;
  readonly attributableSpendMinor: number | null; readonly timelyFirstJobs: number;
  readonly spendPerFirstJobMinor: number | null; readonly status: "available" | "unavailable"; readonly reason: string | null;
  readonly currency: SourceSpend["currency"] | null; readonly spendRecords: readonly SourceSpend[];
  readonly allocation: string; readonly exclusions: readonly string[];
}
function outcomes(snapshot: DemoSnapshotV2, program: Program, entries: readonly ProgramEnrollment[], context: Context) {
  const first = new Map(firstCompletedJobs(snapshot, context.evaluation.asOfAt).map((job) => [job.reporterId, job]));
  const mature = entries.filter((entry) => ms(context.evaluation.asOfAt) >= deadline(entry, program));
  const stage = (entry: ProgramEnrollment, type: string) => snapshot.lifecycleEvents.find((event) => event.acquisitionCaseId === entry.acquisitionCaseId && event.reporterId === entry.reporterId && event.eventType === type && known(event.recordedAt, context.evaluation.asOfAt) && known(event.occurredAt, context.evaluation.asOfAt) && ms(event.occurredAt) >= ms(entry.enteredAt) && ms(event.occurredAt) <= deadline(entry, program));
  const timely = mature.filter((entry) => { const job = first.get(entry.reporterId); return job?.completedAt && ms(job.completedAt) >= ms(entry.enteredAt) && ms(job.completedAt) <= deadline(entry, program); });
  return { first, mature, timely, qualified: mature.filter((entry) => stage(entry, "qualified")), contacted: mature.filter((entry) => stage(entry, "contacted")), ready: mature.filter((entry) => stage(entry, "ready")), stage };
}
function contributions(snapshot: DemoSnapshotV2, program: Program, groupId: string, entries: readonly ProgramEnrollment[], context: Context): SourceContribution[] {
  const facts = outcomes(snapshot, program, entries, context);
  return [...new Set(entries.map((entry) => entry.sourceAtEntry))].map((sourceId) => {
    const selected = entries.filter((entry) => entry.sourceAtEntry === sourceId);
    const full = population(snapshot, program, context).filter((entry) => entry.groupId === groupId && entry.sourceAtEntry === sourceId);
    const window = program.measurementPlan.entryWindow;
    const spends = snapshot.sourceSpend.filter((spend) => spend.sourceId === sourceId && spend.programId === program.id && spend.cohortRef === groupId && known(spend.occurredAt, context.evaluation.asOfAt) && spend.attributableWindow && ms(spend.attributableWindow.startAt) === ms(window.startAt) && ms(spend.attributableWindow.endAt) === ms(window.endAt));
    const currencies = new Set(spends.map((spend) => spend.currency));
    const observing = full.some((entry) => ms(context.evaluation.asOfAt) < deadline(entry, program));
    const partial = full.length !== selected.length || full.some((entry) => !selected.some((item) => item.id === entry.id));
    const timely = facts.timely.filter((entry) => entry.sourceAtEntry === sourceId).length;
    const reason = partial ? "Whole-cohort spend cannot be attributed to this filtered subset." : currencies.size > 1 ? "Mixed currencies cannot be summed." : !spends.length ? "Spend not recorded." : observing ? "Whole-cohort spend cannot be allocated to mature-only outcomes while participants are still observing." : !timely ? "No timely first jobs; cost per job is unavailable." : null;
    const amount = partial || currencies.size !== 1 ? null : spends.reduce((sum, spend) => sum + spend.amountMinor, 0);
    return { sourceId, sourceLabel: snapshot.sources.find((source) => source.id === sourceId)?.label ?? "Unknown source", attributableSpendMinor: amount, timelyFirstJobs: timely, spendPerFirstJobMinor: reason === null && amount !== null ? amount / timely : null, status: reason === null ? "available" : "unavailable", reason, currency: currencies.size === 1 ? spends[0]!.currency : null, spendRecords: spends, allocation: partial ? "Unallocated whole-cohort spend shown for context only." : "Exact source, program, group and entry-window allocation.", exclusions: ["Direct recorded spend only; labor and overhead excluded."] };
  });
}
export function calculateSourceContribution(snapshot: DemoSnapshotV2, program: Program, groupId: string, context: Context): readonly SourceContribution[] {
  return contributions(snapshot, program, groupId, filterEnrollments(snapshot, program, context).filter((entry) => entry.groupId === groupId), context);
}
export interface ProgramResultGroup {
  readonly programId: Program["id"]; readonly groupId: string; readonly label: string; readonly outcomeLabel: string; readonly unit: EvidenceUnit;
  readonly entrants: number; readonly matureEntrants: number; readonly stillObservingEntrants: number; readonly timelyFirstJobs: number;
  readonly qualified: number; readonly result: number | null; readonly evidence: EvidenceBundle; readonly followUpDays: number;
  readonly currency: SourceSpend["currency"] | null; readonly sourceContributions: readonly SourceContribution[];
  readonly supportingOutcomes: { readonly contacted: readonly RecordPointer[]; readonly qualified: readonly RecordPointer[]; readonly ready: readonly RecordPointer[]; readonly firstJobs: readonly RecordPointer[]; readonly mature: readonly RecordPointer[]; readonly firstJobConversion: number | null; readonly label: string };
}
export function groupEvidence(snapshot: DemoSnapshotV2, program: Program, groupId: string, entries: readonly ProgramEnrollment[], context: Context): ProgramResultGroup {
  const plan = planDefinition(snapshot, program), facts = outcomes(snapshot, program, entries, context);
  const qualifiedMetric = program.measurementPlan.metric.id === "M07", costMetric = program.measurementPlan.metric.id === "M09";
  const success = qualifiedMetric ? facts.qualified : facts.timely;
  const spend = contributions(snapshot, program, groupId, entries, context);
  const currencies = new Set(spend.map((item) => item.currency).filter((item) => item !== null));
  const costReason = !spend.length ? "Spend not recorded." : currencies.size > 1 ? "Mixed currencies cannot be summed." : spend.find((item) => item.attributableSpendMinor === null)?.reason ?? (facts.mature.length < entries.length ? "Whole-cohort spend cannot be allocated to mature-only outcomes while participants are still observing." : !facts.timely.length ? "No timely first jobs; cost per job is unavailable." : null);
  const reason = plan.reason ?? (!entries.length ? "No participants in this market or exact selection." : !facts.mature.length ? "Participants are still being observed; no final outcome denominator is mature." : costMetric ? costReason : null);
  const result = reason ? null : costMetric ? spend.reduce((sum, item) => sum + item.attributableSpendMinor!, 0) / facts.timely.length : success.length / facts.mature.length;
  const members = (items: readonly ProgramEnrollment[]) => items.map((entry) => ref("program-enrollment", entry.id));
  const filters = { ...context.filters, marketBasis: "program-market-at-entry" as const, matchNone: !entries.length, programIds: [program.id], programEnrollmentIds: entries.map((entry) => entry.id), recordRefs: members(entries) };
  const label = plan.reason ? "Declared outcome unavailable" : qualifiedMetric ? "Qualified within the observation horizon" : costMetric ? "Direct spend per timely first job" : "First completed job within the observation horizon";
  const records = entries.flatMap((entry) => {
    const joinPath = [ref("program", program.id), ref("program-enrollment", entry.id)];
    const caseRecord = snapshot.acquisitionCases.find((item) => item.id === entry.acquisitionCaseId && known(item.recordedAt, context.evaluation.asOfAt));
    const job = facts.first.get(entry.reporterId);
    const lifecycle = snapshot.lifecycleEvents.filter((event) => event.acquisitionCaseId === entry.acquisitionCaseId && event.reporterId === entry.reporterId && known(event.recordedAt, context.evaluation.asOfAt) && known(event.occurredAt, context.evaluation.asOfAt));
    return [{ ...ref("program-enrollment", entry.id), label: `${snapshot.reporters.find((person) => person.id === entry.reporterId)?.fictionalName ?? entry.reporterId}: ${groupId}`, occurredAt: entry.enteredAt, joinPath: [ref("program", program.id)] },
      ...(caseRecord ? [{ ...ref("acquisition-case", caseRecord.id), label: "First-time acquisition case", occurredAt: caseRecord.openedAt, joinPath }] : []),
      ...lifecycle.map((event) => ({ ...ref("lifecycle-event", event.id), label: event.eventType, occurredAt: event.occurredAt, joinPath })),
      ...(job ? [{ ...ref("job-outcome", job.id), label: "Globally first valid completed job", occurredAt: job.completedAt, joinPath }] : [])];
  });
  if (costMetric && result !== null) for (const contribution of spend) for (const source of contribution.spendRecords) records.push({ ...ref("source-spend", source.id), label: `${source.amountMinor} ${source.currency} minor units: ${source.allocationNote}`, occurredAt: source.occurredAt, joinPath: [ref("program", program.id)] });
  const evidence: EvidenceBundle = { id: `evidence-program-${program.id}-${groupId}-${context.evaluation.snapshotRevision}-${context.filters.selectedMarket}` as EvidenceBundle["id"], metric: program.measurementPlan.metric, asOfAt: context.evaluation.asOfAt, snapshotRevision: context.evaluation.snapshotRevision, unit: plan.unit,
    scope: { workspace: "programs", marketBasis: "program-market-at-entry", selectedMarket: context.filters.selectedMarket, populationDescription: `Frozen ${groupId} enrollments; ${facts.mature.length} mature and ${entries.length - facts.mature.length} still observing over ${program.measurementPlan.followUpDays} elapsed days.` }, filters, reportingWindow: program.measurementPlan.entryWindow,
    computation: result === null ? { status: "unavailable", value: null, numerator: null, denominator: null, reason: reason! } : { status: "available", value: result, numerator: costMetric ? null : success.length, denominator: costMetric ? null : facts.mature.length },
    contributingRecords: [...new Map(records.map((record) => [`${record.kind}:${record.id}`, record])).values()], numeratorMembers: result === null || costMetric ? [] : members(success), denominatorMembers: result === null || costMetric ? [] : members(facts.mature),
    exclusions: entries.filter((entry) => !facts.mature.includes(entry)).map((entry) => ({ record: ref("program-enrollment", entry.id), reasonCode: "still-observing", reason: "Observation horizon is not complete." })), unknownCount: plan.reason ? entries.length : 0,
    limitations: [...program.limitations, "Observed synthetic outcomes do not establish causality.", ...(entries.length > facts.mature.length ? ["Still observing participants are excluded from final denominators."] : []), ...(context.filters.capabilityCodes.length || context.filters.attendanceModes.length ? ["Demand capability and attendance filters do not describe frozen program enrollment and are not applied."] : []), ...(costMetric ? ["Direct recorded spend only; labor and overhead excluded."] : [])],
    explanation: reason ?? (costMetric ? `${result} ${spend[0]?.currency} minor units per timely first job; ${facts.timely.length} timely jobs.` : `${success.length} of ${facts.mature.length} fully observed participants: ${label.toLowerCase()} (${program.measurementPlan.followUpDays} days).`),
    navigationTarget: { workspace: "programs", intent: "evidence-list", filters, evidenceContext: { ...context.evaluation, metric: program.measurementPlan.metric } } };
  return { programId: program.id, groupId, label: groupId, outcomeLabel: label, unit: plan.unit, entrants: entries.length, matureEntrants: facts.mature.length, stillObservingEntrants: entries.length - facts.mature.length, timelyFirstJobs: facts.timely.length, qualified: facts.qualified.length, result, evidence, followUpDays: program.measurementPlan.followUpDays, currency: costMetric && currencies.size === 1 ? spend.find((item) => item.currency)?.currency ?? null : null, sourceContributions: spend,
    supportingOutcomes: { contacted: members(facts.contacted), qualified: members(facts.qualified), ready: members(facts.ready), firstJobs: members(facts.timely), mature: members(facts.mature), firstJobConversion: facts.mature.length ? facts.timely.length / facts.mature.length : null, label: "Supporting timely first-job conversion; separate from the primary metric." } };
}
export function targetProjection(snapshot: DemoSnapshotV2, program: Program, context: Context) {
  const revisions = snapshot.goalRevisions.filter((goal) => goal.goalId === program.targetRef && known(goal.savedAt, context.evaluation.asOfAt)).sort((a, b) => a.version - b.version);
  const currentRevision = revisions.at(-1) ?? null;
  const decision = latest(snapshot.programDecisions.filter((item) => item.programId === program.id), (item) => item.decidedAt, context.evaluation.asOfAt);
  const evaluatedRevisions = decision ? revisions.filter((goal) => known(goal.savedAt, decision.decidedAt)) : revisions;
  const revision = evaluatedRevisions.at(-1) ?? null;
  const evaluatedAt = decision?.decidedAt ?? context.evaluation.asOfAt;
  const baseline = snapshot.evidenceSnapshots.find((item) => item.id === revision?.baselineEvidenceSnapshotId);
  const targetGroupIds = [...new Set(snapshot.programEnrollments.filter((entry) => entry.programId === program.id && baseline?.denominatorMembers.some((member) => member.kind === "program-enrollment" && member.id === entry.id)).map((entry) => entry.groupId))];
  const matches = (goal: GoalRevision) => goal.metric.id === program.measurementPlan.metric.id && goal.metric.version === program.measurementPlan.metric.version && goal.scope.programIds.length === 1 && goal.scope.programIds[0] === program.id && program.marketIds.every((market) => goal.scope.marketIds.includes(market)) && !goal.scope.requiredCapabilityCodes.length && (goal.scope.acquisitionCasePurpose === null || population(snapshot, program, context).every((entry) => snapshot.acquisitionCases.find((item) => item.id === entry.acquisitionCaseId)?.purpose === goal.scope.acquisitionCasePurpose));
  const narrow = context.filters.reporterIds.length || context.filters.acquisitionCaseIds.length || context.filters.programEnrollmentIds.length || context.filters.sourceIds.length || context.filters.requestIds.length || context.filters.jobOutcomeIds.length || context.filters.workItemIds.length || context.filters.recordRefs.some((r) => r.kind !== "program");
  const selectedMarkets = program.marketIds.filter((market) => (context.filters.selectedMarket === "ALL" || market === context.filters.selectedMarket) && includes(context.filters.marketIds, market));
  const marketMismatch = revision && (selectedMarkets.length !== revision.scope.marketIds.length || selectedMarkets.some((market) => !revision.scope.marketIds.includes(market)));
  const reason = !revision ? "No declared target." : planDefinition(snapshot, program).reason ?? (!matches(revision) ? "Target metric, version or scope does not match this program." : marketMismatch ? "Declared whole-program target is a benchmark only for this market subset; no per-market target is declared." : narrow ? "Target applies to the declared cohort, not this exact filtered subset." : null);
  return { value: reason ? null : revision!.target, benchmark: revision && matches(revision) ? revision.target : null, revision, currentRevision, evaluatedAt, targetGroupIds, revisions, originallyDeclared: revisions[0] ?? null, reason, label: decision ? "Target revision in force at the retained decision; market subsets are descriptive benchmarks only." : "Current declared program threshold; market subsets are descriptive benchmarks only." };
}
