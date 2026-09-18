import { useMemo, useState } from "react";
import type { EvidenceBundle, ReporterId, UtcTimestamp } from "../../contracts/v2";
import type { NetworkReporterRow, PreparedNetworkView } from "../../logic/network";
import "./network.css";

export interface ConfirmAvailabilityInput { readonly reporterId: ReporterId; readonly confirmedAt: UtcTimestamp; }
export interface ReportersNetworkActions { readonly onConfirmAvailability: (input: ConfirmAvailabilityInput) => void | Promise<void>; readonly onCreateReengagementTask: (reporterId: ReporterId) => void | Promise<void>; readonly onOpenEvidence: (evidence: EvidenceBundle) => void; readonly onOpenRecruitingChecklist: (reporterId: ReporterId) => void; }
export interface ReportersNetworkScreenProps { readonly view: PreparedNetworkView; readonly actions: ReportersNetworkActions; }
const availabilityLabel = (value: NetworkReporterRow["availability"]) => ({ available: "Available", unavailable: "Unavailable", expired: "Confirmation expired", unknown: "Needs confirmation" }[value]);
const activityDays = (at: string | null, asOf: string) => at ? Math.max(0, Math.floor((Date.parse(asOf) - Date.parse(at)) / 86_400_000)) : null;
const complianceLabel = (state: NetworkReporterRow["compliance"]["state"]) => ({ clear: "Clear", expiring: "Expiring", "needs-check": "Needs check" }[state]);

export function ReportersNetworkScreen({ view, actions }: ReportersNetworkScreenProps) {
  const [localView, setLocalView] = useState<"ready" | "activity">("ready");
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("all");
  const [message, setMessage] = useState<string | null>(null);
  const trend = view.trend[0];
  const rows = useMemo(() => view.reporters.filter((row) =>
    `${row.name} ${row.serviceMarkets.join(" ")} ${row.capabilitySummary} ${row.certificationSummary} ${row.compliance.evidenceLabel}`.toLowerCase().includes(search.toLowerCase())
      && (availability === "all" || row.availability === availability)
  ), [availability, search, view.reporters]);
  const ready = view.reporters.length;
  const active = trend?.activeReporterIds.length ?? 0;
  const inactive = view.reengagementCandidates.length;
  const licenses = view.reporters.filter((row) => row.compliance.state !== "clear").length;
  const maximum = Math.max(ready, active, inactive, licenses, 1);
  const activity = [["Ready", ready], ["Recently working", active], ["Needs confirmation", licenses], ["Re-engage", inactive]] as const;
  return <section className="network-reporters" aria-label="Reporters">
    <section className="network-reporters__kpis" aria-label="Reporter network summary">{[["Ready", ready], ["Active in 28 days", active], ["Inactive 28+ days", inactive], ["Licenses to check", licenses]].map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}</section>
    <div className="network-reporters__views" aria-label="Reporter views"><button aria-pressed={localView === "ready"} className={localView === "ready" ? "is-active" : undefined} onClick={() => setLocalView("ready")} type="button">Ready</button><button aria-pressed={localView === "activity"} className={localView === "activity" ? "is-active" : undefined} onClick={() => setLocalView("activity")} type="button">Activity</button></div>
    <div className="network-reporters__overview"><section className="network-reporters__attention"><header><h2>What needs attention</h2><span>3 items</span></header><ol><li><b>1</b><div><em>Now</em><strong>Confirm reporter availability</strong><p>Availability remains separate from readiness and recent work.</p></div></li><li><b>2</b><div><em>Next</em><strong>Reconnect with experienced reporters</strong><p>Open re-engagement work only when recent work is absent.</p></div></li><li><b>3</b><div><em>Watch</em><strong>Review credential evidence</strong><p>Missing or expiring evidence needs a separate check.</p></div></li></ol></section>
      <section className="network-reporters__activity"><header><h2>Reporter activity</h2>{view.evidence[0] ? <button onClick={() => actions.onOpenEvidence(view.evidence[0]!)} type="button">Why this?</button> : null}</header><p>A quick view of readiness and recent work.</p><div className="network-reporters__bars">{activity.map(([label, value]) => <div key={label}><span>{label}</span><div aria-label={`${label}: ${value}`} aria-valuemax={maximum} aria-valuemin={0} aria-valuenow={value} role="progressbar"><i style={{ width: `${value / maximum * 100}%` }} /></div><strong>{value}</strong></div>)}</div><small><i /> Reporters · trailing 28 elapsed days</small></section></div>
    {message ? <p className="network-reporters__result" role="status">{message}</p> : null}
    <section className="network-reporters__grid"><header><h2>Reporters</h2><span>{rows.length} shown</span></header><div className="network-reporters__filters" aria-label="Reporter filters"><label className="sr-only" htmlFor="reporter-search">Search reporters</label><input id="reporter-search" onChange={(event) => setSearch(event.target.value)} placeholder="Search…" type="search" value={search} /><label className="sr-only" htmlFor="reporter-availability">Availability</label><select id="reporter-availability" onChange={(event) => setAvailability(event.target.value)} value={availability}><option value="all">All availability</option><option value="available">Available</option><option value="unknown">Needs confirmation</option><option value="expired">Confirmation expired</option></select></div>
      <div className="network-reporters__table"><table><thead><tr><th>Reporter</th><th>Market</th><th>Skills</th><th>Certifications</th><th>Preferences</th><th>Last active</th><th>Compliance</th><th>Follow-up</th></tr></thead><tbody>{rows.map((row) => { const days = activityDays(row.lastCompletedJobAt, view.evaluation.asOfAt); return <tr key={row.reporterId}><th scope="row">{row.name}</th><td>{row.serviceMarkets.join(", ")}</td><td>{row.capabilitySummary}</td><td>{row.certificationSummary}</td><td>{availabilityLabel(row.availability)}</td><td><span className={`network-reporters__pill network-reporters__pill--${days === null || days >= 28 ? "over" : "under"}`}>{days === null ? "No completed work" : `${days} days ago`}</span></td><td><span className={`network-reporters__pill network-reporters__pill--${row.compliance.state}`}>{complianceLabel(row.compliance.state)}</span><small className="network-reporters__evidence">{row.compliance.evidenceLabel}</small></td><td><div className="network-reporters__actions"><button disabled={row.availability !== "unknown" && row.availability !== "expired"} onClick={() => { void actions.onConfirmAvailability({ reporterId: row.reporterId, confirmedAt: view.evaluation.asOfAt }); setMessage(`Availability confirmation requested for ${row.name}. Coverage is unchanged until a reporter accepts.`); }} type="button">Confirm availability</button><button disabled={row.followUp !== "create-reengagement-task"} onClick={() => { void actions.onCreateReengagementTask(row.reporterId); setMessage(`Re-engagement task requested for ${row.name}. No job outcome or acceptance changed.`); }} type="button">Create re-engagement task</button><button onClick={() => actions.onOpenRecruitingChecklist(row.reporterId)} type="button">Inspect checklist</button></div></td></tr>; })}</tbody></table></div>
      {rows.length === 0 ? <p className="network-reporters__empty">No reporters match these filters.</p> : null}
    </section>
  </section>;
}
