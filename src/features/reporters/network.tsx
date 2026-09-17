import { useState } from "react";
import type { EvidenceBundle, ReporterId, UtcTimestamp } from "../../contracts/v2";
import type { PreparedNetworkView } from "../../logic/network";
import "./network.css";

export interface ConfirmAvailabilityInput { readonly reporterId: ReporterId; readonly confirmedAt: UtcTimestamp; }
export interface ReportersNetworkActions {
  readonly onConfirmAvailability: (input: ConfirmAvailabilityInput) => void | Promise<void>;
  readonly onCreateReengagementTask: (reporterId: ReporterId) => void | Promise<void>;
  readonly onOpenEvidence: (evidence: EvidenceBundle) => void;
  readonly onOpenRecruitingChecklist: (reporterId: ReporterId) => void;
}
export interface ReportersNetworkScreenProps { readonly view: PreparedNetworkView; readonly actions: ReportersNetworkActions; }
const label = (state: string) => state === "expired" ? "Confirmation expired" : state === "unknown" ? "Availability unknown" : state === "unavailable" ? "Confirmed unavailable" : "Explicitly available";
const date = (value: string | null) => value ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value)) : "No completed job recorded";

/** Prepared V2 surface: callbacks cross the integration boundary; it stores no tasks or availability locally. */
export function ReportersNetworkScreen({ view, actions }: ReportersNetworkScreenProps) {
  const [message, setMessage] = useState<string | null>(null);
  const trend = view.trend[0];
  return <section className="network-reporters" aria-labelledby="network-reporters-heading">
    <header><div><h2 id="network-reporters-heading">What can our network support?</h2><p>Ready reporters only. Capability, readiness, availability, commitments, and recent work are separate evidence.</p></div><button type="button" onClick={() => actions.onOpenEvidence(view.evidence[0]!)}>Why this?</button></header>
    {trend ? <section className="network-reporters__trend" aria-label="Working network trend"><h3>Working network — trailing 28 elapsed days</h3><p>{trend.activeReporterIds.length} recently working · {trend.firstTimeEnteringReporterIds.length} first-time entering · {trend.returningReporterIds.length} returning · {trend.noRecentWorkReporterIds.length} no recent work</p><small>No recent work is not attrition, willingness, or availability.</small></section> : null}
    {message ? <p role="status" className="network-reporters__result">{message}</p> : null}
    <div className="network-reporters__table"><table><thead><tr><th>Reporter</th><th>Services</th><th>Readiness</th><th>Availability</th><th>Verified capabilities</th><th>Last job</th><th>Recent jobs</th><th>Follow-up</th></tr></thead><tbody>{view.reporters.map((row) => <tr key={row.reporterId}><th scope="row">{row.name}</th><td>{row.serviceMarkets.join(", ")}</td><td>{date(row.readinessAt)}</td><td>{label(row.availability)}</td><td>{row.capabilitySummary}</td><td>{date(row.lastCompletedJobAt)}</td><td>{row.recentJobCount}</td><td><div className="network-reporters__actions">{(row.availability === "unknown" || row.availability === "expired") ? <button type="button" onClick={() => { void actions.onConfirmAvailability({ reporterId: row.reporterId, confirmedAt: view.evaluation.asOfAt }); setMessage(`Availability confirmation requested for ${row.name}. Coverage is unchanged until a reporter accepts.`); }}>Confirm availability</button> : null}{row.followUp === "create-reengagement-task" ? <button type="button" onClick={() => { void actions.onCreateReengagementTask(row.reporterId); setMessage(`Re-engagement task requested for ${row.name}. No job outcome or acceptance changed.`); }}>Create re-engagement task</button> : null}{row.followUp === "open-task" ? <span>Open re-engagement task</span> : null}<button type="button" onClick={() => actions.onOpenRecruitingChecklist(row.reporterId)}>Inspect checklist</button></div></td></tr>)}</tbody></table></div>
  </section>;
}
