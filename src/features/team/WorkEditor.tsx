import { useState } from "react";
import type { WorkCreatePayload, WorkEditPayload, WorkTransitionPayload, WorkspaceNavigationTarget, UtcTimestamp } from "../../contracts/v2";
import type { TeamWorkDetail } from "../../logic/team";
import { Drawer } from "../../ui/interview";
import { displayDate } from "../../ui/presentationFormat";
import type { TeamScreenProps } from "./index";

const statusLabels = { open: "To do", "in-progress": "In progress", completed: "Done", blocked: "Blocked" };
const dateInput = (value: string | null | undefined) => value?.slice(0, 16) ?? "";
const utcInput = (value: string): UtcTimestamp | null => value ? `${value}:00Z` as UtcTimestamp : null;
const recordKey = (value: { kind: string; id: string }) => `${value.kind}:${value.id}`;

export function WorkEditor({ view, actions, commandContext, onEditWork, onTransitionWork, detail, onClose, onNavigate }: TeamScreenProps & { detail?: TeamWorkDetail; onClose: () => void; onNavigate: (target: WorkspaceNavigationTarget) => void }) {
  const [title, setTitle] = useState(detail?.title ?? "");
  const [ownerId, setOwnerId] = useState(detail?.ownerId ?? "");
  const [status, setStatus] = useState<WorkCreatePayload["status"]>(detail?.status === "blocked" ? (detail.card?.status === "In progress" ? "in-progress" : "open") : detail?.status === "canceled" ? "open" : detail?.status ?? "open");
  const [domain, setDomain] = useState<WorkCreatePayload["domain"]>(detail?.card?.ownershipDomain ?? "sourcing");
  const [kind, setKind] = useState<WorkCreatePayload["kind"]>(detail?.kind);
  const [programId, setProgramId] = useState(detail?.programId ?? "");
  const [primaryKey, setPrimaryKey] = useState(detail ? recordKey(detail.primaryEntityRef) : "");
  const [dueAt, setDueAt] = useState(dateInput(detail?.dueAt));
  const [priority, setPriority] = useState<NonNullable<WorkCreatePayload["priority"]> | "">(detail?.priority ?? (detail ? "" : "normal"));
  const [blocker, setBlocker] = useState(detail?.blockerCode ?? "");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [completionKey, setCompletionKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const disabled = busy || commandContext?.busy || !commandContext?.actor;
  const primary = view.addWorkOptions.primaryEntities.find((item) => recordKey(item) === primaryKey);
  // Creation can cite its explicitly selected canonical primary record. The command validates the relation.
  const evidenceOptions = detail?.completionEvidenceOptions ?? (primary ? [primary] : []);
  const completionRecord = evidenceOptions.find((item) => recordKey(item) === completionKey);
  async function save(operation: () => Promise<void>, message: string, after?: () => void) {
    if (disabled) return;
    setBusy(true); setError(""); setFeedback("");
    try { await operation(); setFeedback(message); after?.(); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Save failed. Check the fields and retry."); }
    finally { setBusy(false); }
  }
  const detailSave = () => {
    if (!detail || !onEditWork) return;
    const changes: WorkEditPayload["changes"] = { ...(title !== detail.title ? { title } : {}), ...(dueAt !== dateInput(detail.dueAt) ? { dueAt: utcInput(dueAt) } : {}), ...(priority && priority !== detail.priority ? { priority } : {}), ...(blocker !== (detail.blockerCode ?? "") ? { blockerCode: blocker.trim() || null } : {}) };
    if (!Object.keys(changes).length && !note.trim()) { setFeedback("No detail changes to save."); return; }
    void save(() => onEditWork({ workItemId: detail.id as WorkEditPayload["workItemId"], changes, ...(note.trim() ? { appendNote: note } : {}), reason }), "Details and note saved.", () => setNote(""));
  };
  const create = () => {
    if (!actions.onCreateWork) return;
    void save(() => actions.onCreateWork!({ title, ownerId: ownerId as WorkCreatePayload["ownerId"] || null, status, domain, ...(kind ? { kind } : {}), programId: programId as WorkCreatePayload["programId"] || null, ...(primary ? { primaryEntityRef: { kind: primary.kind, id: primary.id } } : {}), dueAt: utcInput(dueAt), ...(priority ? { priority } : {}), blockerCode: blocker.trim() || null, ...(status === "completed" && completionRecord ? { completionEvidenceRefs: [{ kind: completionRecord.kind, id: completionRecord.id }] } : {}) }), "Work added.", onClose);
  };
  return <Drawer title={detail?.title ?? "Add work"} eyebrow="Team management" onClose={onClose}>
    <p className="ip2-scope">{commandContext?.actor ? `Acting as ${commandContext.actor.name} · ${displayDate(commandContext.occurredAt)}` : "An active manager is required to save."}{detail?.card ? ` · ${detail.card.marketIds.join(", ") || "Unscoped"} · ${detail.card.relatedRecordLabel}` : " · Choose a linked record."}</p>
    {detail?.card?.blocked ? <p className="team-work-notice">Blocked · {detail.blockerCode?.replaceAll("-", " ") ?? "Status blocked"}. Save a cleared blocker before completing work.</p> : null}
    {detail?.completion ? <p className="team-work-notice">Completed {displayDate(detail.completion.occurredAt)} · Original actor: {detail.completion.actorId}. Ownership changes retain this completion record.</p> : null}
    <form aria-label={detail ? "Edit work details" : "Add work"} onSubmit={(event) => { event.preventDefault(); if (detail) detailSave(); else create(); }}>
      <fieldset disabled={disabled} className="team-form-fields ip2-form">
        <label>Title<input aria-label="Work title" required value={title} onChange={(event) => setTitle(event.target.value)} /></label>
        {!detail ? <label>Owner<select aria-label="Owner" value={ownerId} onChange={(event) => setOwnerId(event.target.value as typeof ownerId)}>{view.addWorkOptions.owners.map((item) => <option key={item.id ?? "none"} value={item.id ?? ""}>{item.name}</option>)}</select></label> : <label>Domain<input value={detail.card?.ownershipDomain ?? detail.kind} readOnly /></label>}
        {!detail ? <><label>Status<select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>{(["open", "in-progress", "completed"] as const).map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></label><label>Domain<select aria-label="Domain" value={domain} onChange={(event) => { setDomain(event.target.value as typeof domain); setKind(undefined); }}>{view.addWorkOptions.domains.map((item) => <option key={item.domain} value={item.domain}>{item.domain}</option>)}</select></label>{view.addWorkOptions.domains.find((item) => item.domain === domain)!.kinds.length > 1 ? <label>Work purpose<select aria-label="Work purpose" value={kind ?? ""} onChange={(event) => setKind(event.target.value as typeof kind)} required><option value="">Choose a purpose</option>{view.addWorkOptions.domains.find((item) => item.domain === domain)!.kinds.map((item) => <option key={item} value={item}>{item.replaceAll("-", " ")}</option>)}</select></label> : null}</> : null}
        <label>Due date (UTC)<input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} /></label><label>Priority<select aria-label="Priority" value={priority} onChange={(event) => setPriority(event.target.value as typeof priority)}>{!priority ? <option value="">Unspecified</option> : null}{view.addWorkOptions.priorities.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label>Linked program{detail ? <input value={detail.card?.programTitle ?? "None"} readOnly /> : <select aria-label="Linked program" value={programId} onChange={(event) => setProgramId(event.target.value as typeof programId)}><option value="">None</option>{view.addWorkOptions.programs.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>}</label>
        <label>Related record{detail ? <input value={detail.card?.relatedRecordLabel ?? detail.primaryEntityRef.kind} readOnly /> : <select aria-label="Related record" value={primaryKey} onChange={(event) => { setPrimaryKey(event.target.value); setCompletionKey(""); }}><option value="">No direct link (unscoped unless program linked)</option>{view.addWorkOptions.primaryEntities.map((item) => <option key={recordKey(item)} value={recordKey(item)}>{item.label} · {item.kind}</option>)}</select>}</label>
        <label className="team-form-wide">Blocker<input value={blocker} onChange={(event) => setBlocker(event.target.value)} placeholder="No blocker" disabled={disabled || !!detail?.completion} /></label>
        {detail ? <><label className="team-form-wide">Note<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} /></label><label className="team-form-wide">Edit reason<input required value={reason} onChange={(event) => setReason(event.target.value)} /></label></> : <p className="ip2-scope team-form-wide">Add notes from the work detail after creation. A completed item requires the linked source record below.</p>}
        {!detail && status === "completed" ? <label className="team-form-wide">Completion evidence<select aria-label="Completion evidence" required value={completionKey} onChange={(event) => setCompletionKey(event.target.value)}><option value="">Select linked source evidence</option>{evidenceOptions.map((item) => <option key={recordKey(item)} value={recordKey(item)}>{item.label}</option>)}</select></label> : null}
        <div className="ip2-actions team-form-wide"><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={disabled || (detail ? !onEditWork : !actions.onCreateWork)}>{detail ? "Save details" : "Add"}</button></div>
      </fieldset>
    </form>
    {detail ? <div className="team-work-transactions">
      <form aria-label="Assign work" onSubmit={(event) => { event.preventDefault(); void save(() => actions.onReassignWork({ workItemId: detail.id as WorkEditPayload["workItemId"], ownerId: ownerId as WorkCreatePayload["ownerId"] || null, reason }), "Owner saved. Original completion actor retained."); }}><fieldset disabled={disabled} className="team-form-fields ip2-form"><label>Owner<select aria-label="Owner" value={ownerId} onChange={(event) => setOwnerId(event.target.value as typeof ownerId)}>{view.addWorkOptions.owners.map((item) => <option key={item.id ?? "none"} value={item.id ?? ""}>{item.name}</option>)}</select></label><label>Assignment reason<input required value={reason} onChange={(event) => setReason(event.target.value)} /></label><button type="submit">Save owner</button></fieldset></form>
      {detail.allowedStatuses.length ? <form aria-label="Change work status" onSubmit={(event) => { event.preventDefault(); if (!onTransitionWork) return; void save(() => onTransitionWork({ workItemId: detail.id as WorkTransitionPayload["workItemId"], status, reason, ...(status === "completed" && completionRecord ? { completionEvidenceRefs: [{ kind: completionRecord.kind, id: completionRecord.id }] } : {}) }), "Status and evidence saved."); }}><fieldset disabled={disabled} className="team-form-fields ip2-form"><label>Status<select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>{detail.allowedStatuses.filter((item) => item !== "blocked").map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}</select></label><label>Status reason<input required value={reason} onChange={(event) => setReason(event.target.value)} /></label>{status === "completed" ? <label className="team-form-wide">Completion evidence<select aria-label="Completion evidence" required value={completionKey} onChange={(event) => setCompletionKey(event.target.value)}><option value="">Select linked source evidence</option>{evidenceOptions.map((item) => <option key={recordKey(item)} value={recordKey(item)}>{item.label} · {item.kind}</option>)}</select></label> : null}<button type="submit" disabled={disabled || !onTransitionWork}>Save status</button></fieldset></form> : <p>Work is complete; status is final.</p>}
    </div> : null}
    {error ? <p role="alert">{error}</p> : null}{feedback ? <p role="status">{feedback}</p> : null}
    {detail ? <><h3>Linked evidence</h3><button type="button" onClick={() => onNavigate(detail.navigationTarget)}>Open linked work context</button><ul>{detail.linkedRecords.map((item) => <li key={recordKey(item)}>{item.label} <small>· {item.kind}</small>{detail.completionEvidenceRefs.some((ref) => recordKey(ref) === recordKey(item)) ? " · Completion evidence" : ""}</li>)}</ul><details open><summary>History</summary><h4>Assignment</h4>{detail.ownerHistory.map((item, index) => <p key={index}>{displayDate(item.occurredAt)} · {view.addWorkOptions.owners.find((owner) => owner.id === item.ownerId)?.name ?? "Unassigned"} · {item.reason}<small> Recorded by {item.actorId}</small></p>)}<h4>Status</h4>{detail.statusHistory.map((item, index) => <p key={index}>{displayDate(item.occurredAt)} · {item.status} · {item.reason}<small> Recorded by {item.actorId}</small></p>)}<h4>Edits</h4>{detail.editHistory.map((item) => <p key={item.commandId}>{displayDate(item.occurredAt)} · {item.reason} · {Object.entries(item.changes).map(([key, value]) => `${key}: ${value ?? "cleared"}`).join("; ")}<small> Recorded by {item.actorId}</small></p>)}<h4>Notes</h4>{detail.notes.length ? detail.notes.map((item) => <p className="team-preserve-text" key={item.commandId}>{item.text}<small> {displayDate(item.occurredAt)} · {item.actorId}</small></p>) : <p>No notes yet.</p>}</details></> : null}
  </Drawer>;
}
