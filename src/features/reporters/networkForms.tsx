import { useState } from "react";
import type { FormEvent } from "react";
import type { AttendanceMode, AvailabilityStatus, DemoActionContext, MarketId, NetworkAvailabilityRecordPayload, TeamMemberId, UtcTimestamp } from "../../contracts/v2";
import type { NetworkReporterRow, PreparedNetworkView } from "../../logic/network";
import { displayDate } from "../../ui/presentationFormat";
import type { FollowUpPayload } from "./network";

type SharedProps = { readonly row: NetworkReporterRow; readonly view: PreparedNetworkView; readonly context?: DemoActionContext; readonly onCancel: () => void; readonly onSaved: () => void };
const utcInput = (value: string) => new Date(`${value}:00Z`).toISOString() as UtcTimestamp;
const errorMessage = (error: unknown) => error instanceof Error ? error.message : "The save did not complete. Review the inputs and try again.";
function Actor({ row, context }: Pick<SharedProps, "row" | "context">) {
  return <p className="ip2-scope">{row.name} · {context?.actor ? `Acting as ${context.actor.name} in the synthetic demo · ${displayDate(context.occurredAt)} ${context.occurredAt.slice(11, 16)} UTC` : "An active synthetic member is required to save."}</p>;
}

export function AvailabilityForm({ row, view, context, onSave, onCancel, onSaved }: SharedProps & { readonly onSave?: (payload: NetworkAvailabilityRecordPayload) => Promise<void> }) {
  const [status, setStatus] = useState<AvailabilityStatus | "">("");
  const [markets, setMarkets] = useState<MarketId[]>([]);
  const [modes, setModes] = useState<AttendanceMode[]>([]);
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [expires, setExpires] = useState("");
  const [noExpiry, setNoExpiry] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!status || !markets.length || !modes.length || !starts || !ends || (!noExpiry && !expires)) { setError("Choose a status, at least one market and attendance mode, and the full time window and expiry."); return; }
    if (!context?.actor || !onSave) { setError("Availability saving is unavailable. Your inputs have been kept."); return; }
    if (saving || context.busy) return;
    setSaving(true);
    try {
      await onSave({ reporterId: row.reporterId, status, serviceMarketIds: markets, attendanceModes: modes, startAt: utcInput(starts), endAt: utcInput(ends), confirmationExpiresAt: noExpiry ? null : utcInput(expires) });
      onSaved();
    } catch (cause) { setError(errorMessage(cause)); } finally { setSaving(false); }
  };
  return <form className="network-reporters-form" onSubmit={(event) => { void save(event); }}>
    <Actor row={row} context={context} />
    <p className="ip2-scope">Enter the full scope before saving. Availability is separate from readiness and job acceptance. All entered times are UTC.</p>
    <div className="ip2-form">
      <label>Status<select required value={status} onChange={(e) => setStatus(e.target.value as AvailabilityStatus | "")}><option value="">Choose status</option><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="unknown">Unknown</option></select></label>
      <fieldset><legend>Service markets</legend><div className="network-reporters-form__choices">{view.followUpInputs.marketOptions.map((market) => <label className="network-reporters-form__choice" key={market.id}><input type="checkbox" checked={markets.includes(market.id)} onChange={(e) => setMarkets(e.target.checked ? [...markets, market.id] : markets.filter((id) => id !== market.id))} />{market.id}</label>)}</div></fieldset>
      <fieldset><legend>Attendance modes</legend><div className="network-reporters-form__choices">{(["remote", "in-person"] as const).map((mode) => <label className="network-reporters-form__choice" key={mode}><input type="checkbox" checked={modes.includes(mode)} onChange={(e) => setModes(e.target.checked ? [...modes, mode] : modes.filter((value) => value !== mode))}/>{mode === "remote" ? "Remote" : "In person"}</label>)}</div></fieldset>
      <label>Starts at (UTC)<input required type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)}/></label>
      <label>Ends at (UTC)<input required type="datetime-local" value={ends} onChange={(e) => setEnds(e.target.value)}/></label>
      <div><label>Confirmation expires at (UTC)<input required={!noExpiry} disabled={noExpiry} type="datetime-local" value={expires} onChange={(e) => setExpires(e.target.value)}/></label><label className="network-reporters-form__choice"><input type="checkbox" checked={noExpiry} onChange={(e) => setNoExpiry(e.target.checked)}/>No expiry</label></div>
    </div>
    {error ? <p role="alert">{error} Your inputs have been kept.</p> : null}
    <div className="ip2-actions"><button type="button" disabled={saving} onClick={onCancel}>Cancel</button><button type="submit" className="is-active" disabled={saving || context?.busy || !context?.actor || !onSave}>{saving ? "Saving availability…" : "Save availability"}</button></div>
  </form>;
}

export function FollowUpForm({ row, view, context, onSave, onCancel, onSaved }: SharedProps & { readonly onSave?: (payload: FollowUpPayload) => Promise<void> }) {
  const [market, setMarket] = useState("");
  const [owner, setOwner] = useState("");
  const [due, setDue] = useState("");
  const [noDue, setNoDue] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(null);
    if (!market || !owner || (!due && !noDue)) { setError("Choose a market, an owner or Unassigned, and a due date or No due date."); return; }
    if (!context?.actor || !onSave) { setError("Follow-up saving is unavailable. Your inputs have been kept."); return; }
    if (saving || context.busy) return;
    setSaving(true);
    try {
      await onSave({ reporterId: row.reporterId, marketId: market as MarketId, ownerId: owner === "unassigned" ? null : owner as TeamMemberId, dueAt: noDue ? null : new Date(`${due}T00:00:00Z`).toISOString() as UtcTimestamp });
      onSaved();
    } catch (cause) { setError(errorMessage(cause)); } finally { setSaving(false); }
  };
  return <form className="network-reporters-form" onSubmit={(event) => { void save(event); }}>
    <Actor row={row} context={context}/><p className="ip2-scope">Repeated follow-up opens the same existing open Team item. Choose the accountable owner and next action date before saving.</p>
    <div className="ip2-form"><label>Market<select required value={market} onChange={(e) => setMarket(e.target.value)}><option value="">Choose market</option>{view.followUpInputs.marketOptions.map((m) => <option key={m.id} value={m.id}>{m.id}</option>)}</select></label><label>Owner<select required value={owner} onChange={(e) => setOwner(e.target.value)}><option value="">Choose owner</option><option value="unassigned">Unassigned</option>{view.followUpInputs.ownerOptions.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}</select></label><div><label>Due date (UTC)<input required={!noDue} disabled={noDue} type="date" value={due} onChange={(e) => setDue(e.target.value)}/></label><label className="network-reporters-form__choice"><input type="checkbox" checked={noDue} onChange={(e) => setNoDue(e.target.checked)}/>No due date</label></div></div>
    {error ? <p role="alert">{error} Your inputs have been kept.</p> : null}
    <div className="ip2-actions"><button type="button" disabled={saving} onClick={onCancel}>Cancel</button><button type="submit" className="is-active" disabled={saving || context?.busy || !context?.actor || !onSave}>{saving ? "Saving linked work…" : "Save and open linked work"}</button></div>
  </form>;
}
