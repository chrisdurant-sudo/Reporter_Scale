import type { DemoSnapshotV2, EvidenceBundle, ProgramsCommandEnvelope, ProgramsCommandMutation, WorkCreatePayload } from "../../contracts/v2";
import { prepareProgramsView, programContext } from "./index";
import { known, ms, ref } from "./measurement";
import { isUtcTimestamp, validateEvidenceBundle } from "../shared";

/** Semantic preparation only: repository revision/replay and atomic Team composition belong to integration. */
export function prepareProgramsCommand(snapshot: DemoSnapshotV2, command: ProgramsCommandEnvelope): ProgramsCommandMutation {
  const { context, payload } = command;
  const active = (member: DemoSnapshotV2["teamMembers"][number]) => known(member.activeFrom, context.occurredAt) && (!member.activeTo || ms(member.activeTo) > ms(context.occurredAt));
  if (!context.commandId.trim() || !isUtcTimestamp(context.occurredAt) || ms(context.occurredAt) !== ms(snapshot.currentAsOfAt) || !snapshot.teamMembers.some((member) => member.actorId === context.actorId && active(member))) throw new Error("Programs commands require a unique command ID, active actor and current demo time.");
  const program = snapshot.programs.find((item) => item.id === payload.programId);
  if (!program || !known(program.startAt, context.occurredAt)) throw new Error("Unknown or not-yet-started program.");
  const unique = (id: string) => { if ([...snapshot.programNotes, ...snapshot.programDecisions, ...snapshot.processVersions, ...snapshot.evidenceSnapshots].some((item) => item.id === id)) throw new Error("Command-derived record identity already exists; use repository replay handling."); };
  const affectedRecords = [ref("program", program.id)];
  if (command.type === "programs.note.save") {
    if (!["note", "next-step"].includes(command.payload.field) || typeof command.payload.text !== "string") throw new Error("A note or next step requires entered text; empty text explicitly clears it.");
    const id = `program-note-${context.commandId}`;
    unique(id);
    const note = { id: id as never, programId: program.id, authorId: context.actorId, kind: command.payload.field, text: command.payload.text, createdAt: context.occurredAt, provenance: "demo-simulation" as const };
    return { snapshot: { ...snapshot, programNotes: [...snapshot.programNotes, note] }, affectedRecords: [...affectedRecords, ref("program-note", id)], requestedWork: [], message: "Program text saved." };
  }
  if (!snapshot.teamMembers.some((member) => member.id === command.payload.ownerId && active(member))) throw new Error("An active accountable owner is required.");
  if (!isUtcTimestamp(command.payload.nextReviewAt) || ms(command.payload.nextReviewAt) <= ms(context.occurredAt)) throw new Error("An explicit future program review date is required.");
  const prepared = prepareProgramsView(snapshot, programContext(snapshot, program.id));
  const row = prepared.rows[0]!;
  const baseEvidence = row.result?.evidence ?? prepared.evidence[0];
  if (!baseEvidence) throw new Error("Program has no declared cohort evidence to attach to this action.");
  // A multi-group decision retains each group's current evidence; it never invents an overall percentage.
  const evidence = prepared.evidence.map((item, index): EvidenceBundle => ({ ...item, id: `program-evidence-${context.commandId}-${index + 1}` as never }));
  for (const item of evidence) { unique(item.id); if (validateEvidenceBundle(item).length) throw new Error("Current program evidence is invalid."); }
  const selectedEvidence = evidence[prepared.evidence.findIndex((item) => item.id === baseEvidence.id)]!;
  const programs = snapshot.programs.map((item) => item.id === program.id ? { ...item, ownerId: command.payload.ownerId, reviewAt: command.payload.nextReviewAt } : item);
  if (command.type === "programs.record-decision") {
    const input = command.payload;
    if (!["continue", "change", "stop", "expand"].includes(input.decision) || !input.rationale.trim()) throw new Error("Decision and entered rationale are required.");
    const id = `program-decision-${context.commandId}`;
    unique(id);
    const decision = { id: id as never, programId: program.id, decision: input.decision, rationale: input.rationale, decidedBy: context.actorId, decidedAt: context.occurredAt, evidenceSnapshotId: selectedEvidence.id, nextReviewAt: input.nextReviewAt, provenance: "demo-simulation" as const };
    const requestedWork: WorkCreatePayload[] = input.decision === "expand" ? [{ title: `Review a bounded expansion proposal: ${program.title}`, ownerId: input.ownerId, status: "open", domain: "program", kind: "partner-task", programId: program.id, primaryEntityRef: ref("program-decision", id), relatedRequestIds: [], dueAt: input.nextReviewAt, priority: "normal", blockerCode: null }] : [];
    return { snapshot: { ...snapshot, programs: programs.map((item) => item.id === program.id ? { ...item, stage: input.decision === "stop" ? "closed" : input.decision === "expand" ? "reviewing" : "trying" } : item), programDecisions: [...snapshot.programDecisions, decision], evidenceSnapshots: [...snapshot.evidenceSnapshots, ...evidence] }, affectedRecords: [...affectedRecords, ref("program-decision", id)], requestedWork, message: input.decision === "expand" ? "Expansion proposal recorded with bounded review work requested; enrollment and outcomes are unchanged." : "Program decision and accountability saved." };
  }
  const source = row.processVersions.find((item) => item.id === command.payload.sourceProcessVersionId);
  if (!source) throw new Error("Select a known process version belonging to this program.");
  const id = `process-${context.commandId}`;
  unique(id);
  const version = Math.max(0, ...snapshot.processVersions.filter((item) => item.programId === program.id).map((item) => item.version)) + 1;
  const draft = { ...structuredClone(source), id: id as never, version, status: "draft" as const, ownerId: command.payload.ownerId, nextReviewAt: command.payload.nextReviewAt, evidenceSnapshotId: selectedEvidence.id, approvalHistory: [{ status: "draft" as const, actorId: context.actorId, occurredAt: context.occurredAt, rationale: `Draft copied from canonical process ${source.id}, version ${source.version}; review before any limited pilot.` }], provenance: "demo-simulation" as const };
  return { snapshot: { ...snapshot, programs, processVersions: [...snapshot.processVersions, draft], evidenceSnapshots: [...snapshot.evidenceSnapshots, ...evidence] }, affectedRecords: [...affectedRecords, ref("process-version", id)], requestedWork: [], message: "Process draft saved from the selected source version; no rollout or enrollment changed." };
}
