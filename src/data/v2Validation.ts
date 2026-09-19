import type { DemoSnapshotV2, RecordKind, RecordPointer, WorkItem, WorkItemChanges } from "../contracts/v2";

const text = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const date = (value: unknown): value is string => typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().replace(".000Z", "Z") === value.replace(".000Z", "Z");
const time = (value: string) => Date.parse(value);
const unique = (values: readonly unknown[]) => new Set(values).size === values.length;
const fields: Partial<Record<RecordKind, keyof DemoSnapshotV2>> = {
  market: "markets", reporter: "reporters", "acquisition-case": "acquisitionCases", "lifecycle-event": "lifecycleEvents",
  "credential-record": "credentialRecords", "capability-verification": "capabilityVerifications", "screening-review": "screeningReviews",
  "onboarding-step": "onboardingSteps", "readiness-event": "readinessEvents", "availability-window": "availabilityWindows",
  "demand-request": "demandRequests", "assignment-event": "assignmentEvents", "job-outcome": "jobOutcomes", "team-member": "teamMembers",
  "work-item": "workItems", "team-target": "teamTargets", "work-quality-check": "workQualityChecks", "coaching-action": "coachingActions",
  source: "sources", "source-spend": "sourceSpend", program: "programs", "program-enrollment": "programEnrollments", "program-note": "programNotes",
  "program-decision": "programDecisions", "goal-revision": "goalRevisions", "workaround-example": "workaroundExamples", "process-version": "processVersions", "command-record": "commandRecords",
};

/** Source-reference validation only: this does not determine readiness, program results or SLA state. */
export function validateInterviewRecords(snapshot: DemoSnapshotV2): string | null {
  if (!Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0 || !text(snapshot.seedVersion) || !date(snapshot.baseAsOfAt) || !date(snapshot.currentAsOfAt) || time(snapshot.currentAsOfAt) < time(snapshot.baseAsOfAt)) return "Snapshot revision, seed identity or clock is invalid.";
  for (const [key, records] of Object.entries(snapshot)) {
    if (!Array.isArray(records)) continue;
    if (key === "appliedCommandIds" || key === "appliedScenarioEventIds") {
      if (!records.every(text) || !unique(records)) return "Replay IDs must be nonempty and unique.";
    } else if (records.some((record: unknown) => !record || typeof record !== "object" || !text((record as { id?: unknown }).id)) || !unique(records.map((record: { id: string }) => record.id))) return `Invalid or duplicate records in ${key}.`;
  }
  // Reject malformed dates anywhere in persisted source records, even in optional histories.
  const datesValid = (value: unknown): boolean => {
    if (!value || typeof value !== "object") return true;
    return Object.entries(value).every(([key, nested]) => ((key.endsWith("At") || key === "validFrom" || key === "validUntil") && nested !== null ? date(nested) : true) && datesValid(nested));
  };
  if (!datesValid(snapshot)) return "Source records contain an invalid UTC timestamp.";
  const resolve = (ref: RecordPointer): Record<string, unknown> | undefined => {
    const field = fields[ref.kind];
    return field ? (snapshot[field] as unknown as readonly Record<string, unknown>[]).find((record) => record.id === ref.id) : undefined;
  };
  const knownAt = (record: Record<string, unknown>, at: string) => ["createdAt", "openedAt", "recordedAt", "occurredAt", "checkedAt", "savedAt", "decidedAt"].every((key) => !record[key] || time(record[key] as string) <= time(at));
  const knownRef = (ref: RecordPointer, at: string) => { const record = resolve(ref); return !!record && knownAt(record, at); };
  const teamIds = new Set<string>(snapshot.teamMembers.map((member) => member.id));
  // Actor IDs also include the demo operator/scenario actors; they are not Team member IDs.
  const historyValid = (items: readonly { occurredAt: string; actorId: string; reason: string }[], createdAt: string) => Array.isArray(items) && items.length > 0 && items.every((item, index) => text(item.actorId) && text(item.reason) && date(item.occurredAt) && time(item.occurredAt) >= time(createdAt) && time(item.occurredAt) <= time(snapshot.currentAsOfAt) && (index === 0 || time(item.occurredAt) >= time(items[index - 1]!.occurredAt)));
  const changesValid = (changes: WorkItemChanges) => changes && typeof changes === "object" && Object.keys(changes).every((key) => ["title", "dueAt", "priority", "blockerCode"].includes(key)) && (changes.title === undefined || text(changes.title)) && (!("dueAt" in changes) || changes.dueAt === null || date(changes.dueAt)) && (changes.priority === undefined || ["low", "normal", "high", "urgent"].includes(changes.priority)) && (!("blockerCode" in changes) || changes.blockerCode === null || text(changes.blockerCode));
  const editIds: string[] = [];
  const noteIds: string[] = [];
  const relatedEvidence = (work: WorkItem, ref: RecordPointer): boolean => {
    if (ref.kind === work.primaryEntityRef.kind && ref.id === work.primaryEntityRef.id) return true;
    if (ref.kind === "work-item" && ref.id === work.id) return true;
    const record = resolve(ref);
    const primary = resolve(work.primaryEntityRef);
    if (!record || !primary) return false;
    const reporterId = work.primaryEntityRef.kind === "reporter" ? work.primaryEntityRef.id : primary.reporterId;
    const programId = work.programId ?? (work.primaryEntityRef.kind === "program" ? work.primaryEntityRef.id : primary.programId);
    const requestIds = [...work.relatedRequestIds, ...(work.primaryEntityRef.kind === "demand-request" ? [work.primaryEntityRef.id] : [])];
    return (reporterId !== undefined && (record.reporterId === reporterId || (!!record.acquisitionCaseId && snapshot.acquisitionCases.some((item) => item.id === record.acquisitionCaseId && item.reporterId === reporterId)))) || (!!programId && (record.programId === programId || (ref.kind === "program" && ref.id === programId))) || requestIds.includes((ref.kind === "demand-request" ? ref.id : record.requestId) as never) || record.workItemId === work.id;
  };
  for (const command of snapshot.commandRecords) {
    if (!text(command.actorId) || !text(command.commandType) || !date(command.occurredAt) || time(command.occurredAt) > time(snapshot.currentAsOfAt) || !Number.isSafeInteger(command.expectedRevision) || command.expectedRevision < 0 || !Number.isSafeInteger(command.appliedRevision) || command.appliedRevision < 0 || command.appliedRevision > snapshot.revision + 1 || !["applied", "replayed", "rejected"].includes(command.result) || !Array.isArray(command.affectedRecords) || command.affectedRecords.some((ref) => !resolve(ref)) || (command.result === "applied" && !snapshot.appliedCommandIds.includes(command.id))) return "Command replay records or revision metadata are invalid.";
  }
  for (const work of snapshot.workItems) {
    if (!date(work.createdAt) || time(work.createdAt) > time(snapshot.currentAsOfAt) || !knownRef(work.primaryEntityRef, snapshot.currentAsOfAt) || !work.relatedRequestIds.every((id) => knownRef({ kind: "demand-request", id }, snapshot.currentAsOfAt)) || (work.programId !== null && !snapshot.programs.some((program) => program.id === work.programId)) || !["source", "screen", "onboard", "first-opportunity", "re-engage", "partner-task"].includes(work.kind) || !["synthetic-demo", "demo-simulation"].includes(work.provenance)) return `Work references, creation time or kind are invalid (${work.id}).`;
    if (!changesValid({ title: work.title, dueAt: work.dueAt, priority: work.priority, blockerCode: work.blockerCode })) return `Work fields are invalid (${work.id}).`;
    if (!historyValid(work.ownerHistory, work.createdAt) || work.ownerHistory.some((change) => change.ownerId !== null && !teamIds.has(change.ownerId)) || !historyValid(work.statusHistory, work.createdAt) || work.statusHistory.some((change) => !["open", "in-progress", "blocked", "completed", "canceled"].includes(change.status))) return `Work ownership/status history is invalid (${work.id}).`;
    const complete = work.statusHistory.find((change) => change.status === "completed");
    if ((complete && !work.completionEvidenceRefs.length) || work.completionEvidenceRefs.some((ref) => !knownRef(ref, complete?.occurredAt ?? snapshot.currentAsOfAt) || !relatedEvidence(work, ref))) return `Work completion evidence must resolve, relate to the work and be known at completion (${work.id}).`;
    for (const index of work.statusHistory.keys()) {
      if (index > 0 && ["completed", "canceled"].includes(work.statusHistory[index - 1]!.status)) return `Terminal work cannot transition again (${work.id}).`;
    }
    if (work.editHistory !== undefined && !Array.isArray(work.editHistory)) return "Work edits must be an array.";
    if (work.notes !== undefined && !Array.isArray(work.notes)) return "Work notes must be an array.";
    const rolledBack: WorkItemChanges = { title: work.title, dueAt: work.dueAt, priority: work.priority, blockerCode: work.blockerCode };
    for (const edit of [...(work.editHistory ?? [])].reverse()) {
      if (!text(edit.commandId) || !text(edit.actorId) || !text(edit.reason) || !changesValid(edit.previous) || !changesValid(edit.changes) || Object.keys(edit.changes).length === 0 || Object.keys(edit.previous).some((key) => !(key in edit.changes))) return `Invalid work edit (${work.id}).`;
      for (const field of Object.keys(edit.changes) as (keyof WorkItemChanges)[]) {
        // Required fields must reconstruct an explicit value; only title/priority may predate their introduction.
        if ((field === "dueAt" || field === "blockerCode") && !Object.prototype.hasOwnProperty.call(edit.previous, field)) return `Work edit is missing its previous ${field} (${work.id}).`;
        if (rolledBack[field] !== edit.changes[field] && !(field === "blockerCode" && work.statusHistory.some((status) => time(status.occurredAt) >= time(edit.occurredAt)))) return `Work edit history does not reconstruct current fields (${work.id}).`;
        Object.assign(rolledBack, { [field]: edit.previous[field] });
      }
      editIds.push(edit.commandId);
    }
    for (const entries of [work.editHistory ?? [], work.notes ?? []]) {
      if (entries.some((entry, index) => !text(entry.commandId) || !text(entry.actorId) || !date(entry.occurredAt) || time(entry.occurredAt) < time(work.createdAt) || time(entry.occurredAt) > time(snapshot.currentAsOfAt) || (index > 0 && time(entry.occurredAt) < time(entries[index - 1]!.occurredAt)))) return `Work edit/note chronology is invalid (${work.id}).`;
    }
    for (const note of work.notes ?? []) { if (!text(note.text)) return "Work notes must contain text."; noteIds.push(note.commandId); }
  }
  // One command may both edit and annotate the same item, but cannot create two edits/notes.
  if (!unique(editIds) || !unique(noteIds)) return "Work note/edit command IDs must be unique.";
  for (const check of snapshot.workQualityChecks) {
    const work = snapshot.workItems.find((item) => item.id === check.workItemId);
    if (!work || !teamIds.has(check.checkedBy) || time(check.checkedAt) < time(work.createdAt) || time(check.checkedAt) > time(snapshot.currentAsOfAt) || check.requiredCheckResults.length === 0 || !unique(check.requiredCheckResults.map((result) => result.checkCode)) || check.requiredCheckResults.some((result) => !text(result.checkCode) || typeof result.passed !== "boolean" || !text(result.reason)) || check.outcome !== (check.requiredCheckResults.every((result) => result.passed) ? "passed" : "needs-follow-up")) return "Inspected quality records or chronology are invalid.";
  }
  for (const coaching of snapshot.coachingActions) {
    if (!teamIds.has(coaching.teamMemberId) || !text(coaching.authorId) || !text(coaching.observedIssueOrStrength) || !text(coaching.expectedPractice) || !text(coaching.nextAction) || coaching.linkedWorkItemIds.length === 0 || coaching.linkedWorkItemIds.some((id) => !knownRef({ kind: "work-item", id }, coaching.createdAt)) || time(coaching.updatedAt) < time(coaching.createdAt) || time(coaching.updatedAt) > time(snapshot.currentAsOfAt) || time(coaching.dueAt) < time(coaching.createdAt) || time(coaching.reviewAt) < time(coaching.dueAt) || (coaching.outcomeNote !== null && !text(coaching.outcomeNote))) return "Coaching records or chronology are invalid.";
  }
  for (const process of snapshot.processVersions) {
    if (!Number.isInteger(process.version) || process.version < 1 || !teamIds.has(process.ownerId) || !process.requiredSteps.length || !unique(process.requiredSteps.map((step) => step.id)) || !unique(process.requiredSteps.map((step) => step.order))) return "Process steps/versions must be identifiable and ordered.";
    if (!snapshot.programs.some((program) => program.id === process.programId) || !snapshot.evidenceSnapshots.some((evidence) => evidence.id === process.evidenceSnapshotId) || !process.approvalHistory.length || process.approvalHistory.at(-1)?.status !== process.status || process.approvalHistory.some((approval, index) => !text(approval.actorId) || !text(approval.rationale) || time(approval.occurredAt) > time(snapshot.currentAsOfAt) || (index > 0 && time(approval.occurredAt) < time(process.approvalHistory[index - 1]!.occurredAt)))) return "Process approval history or evidence is invalid.";
    for (const [index, step] of process.requiredSteps.entries()) {
      const amended = step.responsibleRole !== undefined || step.slaElapsedHours !== undefined || step.exceptionRoute !== undefined;
      if (!text(step.id) || !text(step.instruction) || !text(step.evidenceRequirement) || !Number.isInteger(step.order) || step.order < 1 || (index > 0 && step.order <= process.requiredSteps[index - 1]!.order) || (amended && (!text(step.responsibleRole) || !Number.isFinite(step.slaElapsedHours) || step.slaElapsedHours! <= 0 || !text(step.exceptionRoute)))) return "Process step owner/SLA/evidence/exception fields are invalid.";
    }
  }
  return null;
}

const prefix = (previous: readonly unknown[], next: readonly unknown[]) => previous.length <= next.length && previous.every((value, index) => JSON.stringify(value) === JSON.stringify(next[index]));
export function preservesWorkHistory(previous: DemoSnapshotV2, next: DemoSnapshotV2): boolean {
  return time(next.currentAsOfAt) >= time(previous.currentAsOfAt) && prefix(previous.appliedCommandIds, next.appliedCommandIds) && prefix(previous.appliedScenarioEventIds, next.appliedScenarioEventIds) && prefix(previous.commandRecords, next.commandRecords) && previous.workItems.every((work) => {
    const updated = next.workItems.find((item) => item.id === work.id);
    const changedFields = (["title", "dueAt", "priority"] as const).filter((field) => updated?.[field] !== work[field]);
    const recordedChanges = (updated?.editHistory ?? []).slice(work.editHistory?.length ?? 0);
    const before: WorkItemChanges = { title: work.title, dueAt: work.dueAt, priority: work.priority, blockerCode: work.blockerCode };
    for (const edit of recordedChanges) {
      for (const field of Object.keys(edit.changes) as (keyof WorkItemChanges)[]) {
        if (field !== "blockerCode" && before[field] !== edit.previous[field]) return false;
        Object.assign(before, { [field]: edit.changes[field] });
      }
    }
    return !!updated && changedFields.every((field) => recordedChanges.some((edit) => field in edit.changes)) && updated.createdAt === work.createdAt && prefix(work.ownerHistory, updated.ownerHistory) && prefix(work.statusHistory, updated.statusHistory) && prefix(work.notes ?? [], updated.notes ?? []) && prefix(work.editHistory ?? [], updated.editHistory ?? []) && prefix(work.completionEvidenceRefs, updated.completionEvidenceRefs);
  });
}
