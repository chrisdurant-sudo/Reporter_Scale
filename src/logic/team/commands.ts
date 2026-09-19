import type { CoachingAction, DemoSnapshotV2, RecordPointer, TeamCommandEnvelope, TeamTarget, V2CommandMutation, WorkItem, WorkItemChanges, WorkItemKind, WorkOwnershipDomain } from "../../contracts/v2";
import { isUtcTimestamp, isValidHalfOpenWindow } from "../shared/time";
import { before, completion, completionChoices, key, lastOpenStatus, ms, ref, recordIndex, statusAt } from "./support";

export const TEAM_WORK_KINDS: Readonly<Record<WorkOwnershipDomain, readonly WorkItemKind[]>> = { sourcing: ["source"], screening: ["screen"], onboarding: ["onboard"], market: ["first-opportunity", "re-engage"], program: ["partner-task"] };
const requireText = (value: string, field: string) => { if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required.`); };
const validDate = (value: string | null, field: string) => { if (value !== null && (typeof value !== "string" || !isUtcTimestamp(value))) throw new Error(`${field} must be a UTC timestamp or null.`); };
const priority = (value: string | undefined) => { if (value !== undefined && !["low", "normal", "high", "urgent"].includes(value)) throw new Error("Choose a known priority."); };
const sameTargetScope = (a: TeamTarget, b: TeamTarget) => a.teamMemberId === b.teamMemberId && (a.teamMemberId !== null || a.role === b.role) && a.metric.id === b.metric.id && a.metric.version === b.metric.version && ms(a.reportingWindow.startAt) === ms(b.reportingWindow.startAt) && ms(a.reportingWindow.endAt) === ms(b.reportingWindow.endAt);

/** Pure semantic preparation. Integration alone saves, revisions and records replay identity. */
export function prepareTeamCommand(snapshot: DemoSnapshotV2, command: TeamCommandEnvelope): V2CommandMutation {
  const { context, payload } = command; const at = context.occurredAt;
  const activeMember = (id: string) => snapshot.teamMembers.find((member) => member.id === id && before(member.activeFrom, at) && (member.activeTo === null || ms(member.activeTo) > ms(at)));
  const actor = snapshot.teamMembers.find((member) => member.actorId === context.actorId && activeMember(member.id));
  if (!context.commandId.trim() || !isUtcTimestamp(at) || ms(at) !== ms(snapshot.currentAsOfAt) || !actor) throw new Error("Team commands require a unique ID, active actor and the current demo time.");
  const index = recordIndex(snapshot, at);
  const known = (pointer: RecordPointer) => { if (!index.has(key(pointer))) throw new Error(`Unknown or future ${pointer.kind}: ${pointer.id}.`); };
  const owner = (id: string | null) => { if (id !== null && !activeMember(id)) throw new Error("Choose an active owner or explicitly leave work unassigned."); };
  const workById = (id: string) => { const work = snapshot.workItems.find((item) => item.id === id && before(item.createdAt, at)); if (!work) throw new Error("Choose known work."); return work; };
  const done = (next: DemoSnapshotV2, affectedRecords: readonly RecordPointer[], message: string): V2CommandMutation => ({ snapshot: next, affectedRecords, message });
  const replaceWork = (work: WorkItem, message: string) => done({ ...snapshot, workItems: snapshot.workItems.map((item) => item.id === work.id ? work : item) }, [ref("work-item", work.id)], message);
  const evidence = (work: WorkItem, refs: readonly RecordPointer[] | undefined) => {
    if (!refs?.length) throw new Error("Completion requires explicit linked source evidence.");
    if (new Set(refs.map(key)).size !== refs.length) throw new Error("Completion evidence must contain distinct records.");
    const choices = new Set(completionChoices(work, snapshot, at, index).map(key));
    for (const pointer of refs) { known(pointer); if (!choices.has(key(pointer))) throw new Error("Completion evidence must be related to this work."); }
    return refs.map((pointer) => ({ ...pointer }));
  };
  const validateCoaching = (action: CoachingAction) => {
    requireText(action.id, "Coaching identity"); owner(action.teamMemberId);
    if (snapshot.coachingActions.some((item) => item.id === action.id)) throw new Error("Coaching identity already exists.");
    if (action.authorId !== context.actorId || ms(action.createdAt) !== ms(at) || ms(action.updatedAt) !== ms(at)) throw new Error("Coaching author and timestamps must match this command.");
    for (const field of ["observedIssueOrStrength", "expectedPractice", "nextAction"] as const) requireText(action[field], field);
    validDate(action.dueAt, "Due date"); validDate(action.reviewAt, "Review date");
    if (ms(action.dueAt) < ms(at) || ms(action.reviewAt) < ms(action.dueAt)) throw new Error("Coaching due/review dates must follow creation in order.");
    if (!action.linkedWorkItemIds.length || new Set(action.linkedWorkItemIds).size !== action.linkedWorkItemIds.length) throw new Error("Coaching requires distinct linked work.");
    action.linkedWorkItemIds.forEach(workById);
    if (action.outcomeNote !== null) requireText(action.outcomeNote, "Recorded outcome");
  };
  switch (command.type) {
    case "work.create": {
      const input = command.payload; requireText(input.title, "Work title"); owner(input.ownerId);
      const kinds = TEAM_WORK_KINDS[input.domain]; const kind = input.kind ?? kinds?.[0];
      if (!kind || !kinds?.includes(kind)) throw new Error("Work kind does not belong to this ownership domain.");
      if (!["open", "in-progress", "blocked", "completed"].includes(input.status)) throw new Error("Choose a valid work status.");
      if (input.programId !== null) known(ref("program", input.programId));
      const id = `work-${context.commandId}` as WorkItem["id"];
      const primary = input.primaryEntityRef ?? (input.programId ? ref("program", input.programId) : ref("work-item", id));
      if (key(primary) !== key(ref("work-item", id))) known(primary);
      const requests = input.relatedRequestIds ?? []; if (new Set(requests).size !== requests.length) throw new Error("Related requests must be distinct."); requests.forEach((id) => known(ref("demand-request", id)));
      validDate(input.dueAt ?? null, "Due date"); priority(input.priority);
      if (input.blockerCode !== undefined && input.blockerCode !== null) requireText(input.blockerCode, "Blocker");
      if (input.status === "blocked" && !input.blockerCode) throw new Error("Blocked work requires an explicit blocker.");
      if (input.status === "completed" && input.blockerCode) throw new Error("Clear the blocker before completing work.");
      if (snapshot.workItems.some((work) => work.id === id)) throw new Error("Work identity already exists; replay through the repository transaction.");
      const work: WorkItem = { id, title: input.title, kind, primaryEntityRef: { ...primary }, relatedRequestIds: [...requests], programId: input.programId, createdAt: at,
        ownerHistory: [{ ownerId: input.ownerId, occurredAt: at, actorId: context.actorId, reason: "Created work with explicit ownership." }],
        statusHistory: [{ status: input.status, occurredAt: at, actorId: context.actorId, reason: "Created work with explicit status." }], dueAt: input.dueAt ?? null,
        ...(input.priority !== undefined ? { priority: input.priority } : {}), blockerCode: input.blockerCode ?? null, completionEvidenceRefs: [], provenance: "demo-simulation" };
      const refs = input.status === "completed" || input.completionEvidenceRefs?.length ? evidence(work, input.completionEvidenceRefs) : [];
      return done({ ...snapshot, workItems: [...snapshot.workItems, { ...work, completionEvidenceRefs: refs }] }, [ref("work-item", id)], "Canonical Team work prepared.");
    }
    case "work.edit": {
      const input = command.payload; const work = workById(input.workItemId); requireText(input.reason, "Edit reason");
      const changes = input.changes; const fields = Object.keys(changes);
      if (fields.some((field) => !["title", "dueAt", "priority", "blockerCode"].includes(field))) throw new Error("Unknown editable work field.");
      if (!fields.length && input.appendNote === undefined) throw new Error("Supply a work edit or note.");
      if (input.appendNote !== undefined) requireText(input.appendNote, "Note");
      if ("title" in changes) requireText(changes.title!, "Work title");
      if ("dueAt" in changes) validDate(changes.dueAt!, "Due date");
      if ("priority" in changes) { if (changes.priority === undefined) throw new Error("Priority cannot be undefined."); priority(changes.priority); }
      if ("blockerCode" in changes && changes.blockerCode !== null) requireText(changes.blockerCode!, "Blocker");
      if ((completion(work) || statusAt(work, at) === "canceled") && changes.blockerCode) throw new Error("Terminal work cannot become blocked.");
      const previous: WorkItemChanges = { ...("title" in changes && work.title !== undefined ? { title: work.title } : {}), ...("priority" in changes && work.priority !== undefined ? { priority: work.priority } : {}), ...("dueAt" in changes ? { dueAt: work.dueAt } : {}), ...("blockerCode" in changes ? { blockerCode: work.blockerCode } : {}) };
      const restored = "blockerCode" in changes && changes.blockerCode === null && statusAt(work, at) === "blocked";
      return replaceWork({ ...work, ...changes, ...(fields.length ? { editHistory: [...(work.editHistory ?? []), { commandId: context.commandId, actorId: context.actorId, occurredAt: at, reason: input.reason, previous, changes: { ...changes } }] } : {}),
        ...(input.appendNote !== undefined ? { notes: [...(work.notes ?? []), { commandId: context.commandId, actorId: context.actorId, occurredAt: at, text: input.appendNote }] } : {}),
        ...(restored ? { statusHistory: [...work.statusHistory, { status: lastOpenStatus(work, at), occurredAt: at, actorId: context.actorId, reason: input.reason }] } : {}) }, "Work edits and notes prepared with history.");
    }
    case "work.assign": {
      const input = command.payload; const work = workById(input.workItemId); owner(input.ownerId); requireText(input.reason, "Assignment reason");
      return replaceWork({ ...work, ownerHistory: [...work.ownerHistory, { ownerId: input.ownerId, occurredAt: at, actorId: context.actorId, reason: input.reason }] }, "Work ownership prepared; historical completion credit retained.");
    }
    case "work.transition": {
      const input = command.payload; const work = workById(input.workItemId); requireText(input.reason, "Transition reason");
      if (!["open", "in-progress", "blocked", "completed"].includes(input.status)) throw new Error("Choose a valid work status.");
      if (completion(work) || statusAt(work, at) === "canceled") throw new Error("Terminal work cannot transition again.");
      if (input.status === "blocked" && !work.blockerCode) throw new Error("Record an explicit blocker first.");
      if (input.status === "completed" && work.blockerCode) throw new Error("Clear the blocker before completing work.");
      if (input.status !== "completed" && input.completionEvidenceRefs !== undefined) throw new Error("Completion evidence belongs to a completion transition.");
      return replaceWork({ ...work, statusHistory: [...work.statusHistory, { status: input.status, occurredAt: at, actorId: context.actorId, reason: input.reason }], ...(input.status === "completed" ? { completionEvidenceRefs: evidence(work, input.completionEvidenceRefs) } : {}) }, "Work status prepared without changing reporter outcomes.");
    }
    case "team.target.save-revision": {
      const { target, supersedesTargetId } = command.payload; requireText(target.id, "Target identity"); requireText(target.rationale, "Target rationale");
      if (snapshot.teamTargets.some((item) => item.id === target.id)) throw new Error("Use a new target revision identity.");
      if (target.teamMemberId !== null) owner(target.teamMemberId);
      if (target.teamMemberId === null && !target.role?.trim()) throw new Error("A target requires a member or role.");
      if (target.role !== null && !snapshot.teamMembers.some((member) => member.focusRole === target.role)) throw new Error("Choose a known role.");
      if (target.teamMemberId && target.role && activeMember(target.teamMemberId)?.focusRole !== target.role) throw new Error("Target member and role differ.");
      if (!snapshot.metricDefinitions.some((metric) => metric.id === target.metric.id && metric.version === target.metric.version)) throw new Error("Choose a known metric version.");
      if (!Number.isFinite(target.target) || target.target < 0 || !isValidHalfOpenWindow(target.reportingWindow) || !isUtcTimestamp(target.createdAt) || ms(target.createdAt) !== ms(at)) throw new Error("Target requires a nonnegative value, exact reporting window and current creation time.");
      const prior = snapshot.teamTargets.filter((item) => sameTargetScope(item, target) && before(item.createdAt, at)).sort((a, b) => ms(b.createdAt) - ms(a.createdAt) || snapshot.teamTargets.indexOf(b) - snapshot.teamTargets.indexOf(a))[0];
      if ((prior?.id ?? null) !== supersedesTargetId) throw new Error("Supersede the latest target for this exact member/role, metric and window.");
      return done({ ...snapshot, teamTargets: [...snapshot.teamTargets, { ...structuredClone(target), provenance: "demo-simulation" }] }, [ref("team-target", target.id)], "Target revision prepared; previous targets and actual work retained.");
    }
    case "team.quality.record": {
      const check = command.payload.qualityCheck; requireText(check.id, "Inspection identity"); workById(check.workItemId);
      if (snapshot.workQualityChecks.some((item) => item.id === check.id)) throw new Error("Inspection identity already exists.");
      if (check.checkedBy !== actor.id || !isUtcTimestamp(check.checkedAt) || ms(check.checkedAt) !== ms(at)) throw new Error("Inspection reviewer and time must match the command actor.");
      if (!check.requiredCheckResults.length || new Set(check.requiredCheckResults.map((result) => result.checkCode)).size !== check.requiredCheckResults.length) throw new Error("An inspection requires distinct required checks.");
      for (const result of check.requiredCheckResults) { requireText(result.checkCode, "Check code"); requireText(result.reason, "Check reason"); if (typeof result.passed !== "boolean") throw new Error("Record each check result explicitly."); }
      if (check.outcome !== (check.requiredCheckResults.every((result) => result.passed) ? "passed" : "needs-follow-up")) throw new Error("Inspection outcome must match its required checks.");
      return done({ ...snapshot, workQualityChecks: [...snapshot.workQualityChecks, { ...structuredClone(check), provenance: "demo-simulation" }] }, [ref("work-quality-check", check.id), ref("work-item", check.workItemId)], "Inspection prepared with explicit reviewer and reasons.");
    }
    case "team.coaching.record":
    case "team.practice.share": {
      const action = command.payload.coachingAction; validateCoaching(action);
      return done({ ...snapshot, coachingActions: [...snapshot.coachingActions, { ...structuredClone(action), provenance: "demo-simulation" }] }, [ref("coaching-action", action.id)], command.type === "team.practice.share" ? "Successful practice prepared with its linked work and next review." : "Coaching action prepared with its linked work and next review.");
    }
    case "team.coaching.review": {
      const input = command.payload; const action = snapshot.coachingActions.find((item) => item.id === input.coachingActionId && before(item.createdAt, at));
      if (!action) throw new Error("Choose a known coaching action."); requireText(input.outcomeNote, "Review result");
      if (!isUtcTimestamp(input.reviewedAt) || ms(input.reviewedAt) !== ms(at)) throw new Error("Review time must be the current demo time.");
      return done({ ...snapshot, coachingActions: snapshot.coachingActions.map((item) => item.id === action.id ? { ...item, outcomeNote: input.outcomeNote, updatedAt: at } : item) }, [ref("coaching-action", action.id)], "Current coaching review result prepared; original author retained.");
    }
    default: throw new Error(`Unsupported Team command: ${String((payload as { type?: string }).type ?? "unknown")}.`);
  }
}
