import { useState } from "react";
import type { DemoActionContext, EvidenceBundle, NetworkAvailabilityRecordPayload, ReporterId, WorkspaceNavigationTarget } from "../../contracts/v2";
import type { NetworkReporterRow, PreparedNetworkView, ReengagementFollowUpInput } from "../../logic/network";
import { CategoryComparison, Drawer, Panel } from "../../ui/interview";
import { displayDate, displayDateRange } from "../../ui/presentationFormat";
import { AvailabilityForm, FollowUpForm } from "./networkForms";
import "./network.css";

export interface ReportersNetworkActions {
  readonly onOpenEvidence: (evidence: EvidenceBundle) => void;
  readonly onOpenRecruitingChecklist: (reporterId: ReporterId) => void;
}
export type FollowUpPayload = Omit<ReengagementFollowUpInput, "asOfAt">;
export interface ReportersNetworkScreenProps {
  readonly view: PreparedNetworkView;
  readonly actions: ReportersNetworkActions;
  readonly commandContext?: DemoActionContext;
  readonly onRecordAvailability?: (payload: NetworkAvailabilityRecordPayload) => Promise<void>;
  readonly onRequestFollowUp?: (payload: FollowUpPayload) => Promise<void>;
  readonly onNavigateTarget?: (target: WorkspaceNavigationTarget) => void;
}
const availabilityLabel = (value: NetworkReporterRow["availability"]) => ({ available: "Available", unavailable: "Unavailable", expired: "Confirmation expired", unknown: "Needs confirmation" }[value]);
const activityDays = (at: string | null, asOf: string) => at ? Math.max(0, Math.floor((Date.parse(asOf) - Date.parse(at)) / 86_400_000)) : null;
const complianceLabel = (state: NetworkReporterRow["compliance"]["state"]) => ({ clear: "Clear", expiring: "Expiring", "needs-check": "Needs check" }[state]);
const complianceTone = (state: NetworkReporterRow["compliance"]["state"]) => ({ clear: "under", expiring: "at", "needs-check": "over" }[state]);
const timestamp = (at: string) => `${displayDate(at)} · ${at.slice(11, 16)} UTC`;
type Selection = { reporterId: ReporterId; mode: "detail" | "availability" | "followup" } | null;

export function ReportersNetworkScreen({ view, actions, commandContext, onRecordAvailability, onRequestFollowUp, onNavigateTarget }: ReportersNetworkScreenProps) {
  const [localView, setLocalView] = useState<"ready" | "activity">("ready");
  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("");
  const [skill, setSkill] = useState("");
  const [sort, setSort] = useState("");
  const [confirmationOnly, setConfirmationOnly] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [message, setMessage] = useState<string | null>(null);
  const selected = view.reporters.find((row) => row.reporterId === selection?.reporterId);
  const confirmationIds = view.needsConfirmationReporterIds;
  const scopedRows = localView === "ready" ? view.reporters : view.reporters.filter((row) => row.recentJobCount > 0 || row.followUp !== null);
  const filtered = scopedRows.filter((row) => `${row.name} ${row.serviceMarkets.join(" ")} ${row.verifiedSkills.map((s) => s.label).join(" ")} ${row.certificationSummary}`.toLowerCase().includes(search.trim().toLowerCase()) && (!availability || row.availability === availability) && (!skill || row.verifiedSkills.some((s) => s.code === skill)));
  const confirmationCount = filtered.filter((row) => confirmationIds.includes(row.reporterId)).length;
  const rows = filtered.filter((row) => !confirmationOnly || confirmationIds.includes(row.reporterId));
  if (sort === "name") rows.sort((a, b) => a.name.localeCompare(b.name));
  const skillOptions = [...new Map(view.reporters.flatMap((row) => row.verifiedSkills.map((s) => [s.code, s.label] as const))).entries()];
  const recentEvidence = view.evidence[0];
  const recent = recentEvidence?.computation.value ?? view.reporters.filter((row) => row.recentJobCount > 0).length;
  const reviewCount = view.reporters.filter((row) => row.compliance.state !== "clear").length;
  const period = recentEvidence?.reportingWindow;
  const activityLabel = view.appliedFilters.window ? "Worked in selected window" : "Worked in 28 days";
  const periodLabel = period ? displayDateRange(period.startAt, period.endAt) : "Trailing 28 elapsed days";
  const attention = view.attention.slice(0, 3);
  const clear = () => { setSearch(""); setAvailability(""); setSkill(""); setSort(""); setConfirmationOnly(false); };
  const open = (reporterId: ReporterId, mode: NonNullable<Selection>["mode"]) => { setMessage(null); setSelection({ reporterId, mode }); };
  const navigate = (target: WorkspaceNavigationTarget) => { setSelection(null); requestAnimationFrame(() => onNavigateTarget?.(target)); };
  const openFollowUp = (row: NetworkReporterRow) => { if (row.followUpTarget && onNavigateTarget) navigate(row.followUpTarget); else open(row.reporterId, "followup"); };
  const checklist = (row: NetworkReporterRow) => {
    setSelection(null);
    requestAnimationFrame(() => { if (row.checklistTarget && onNavigateTarget) onNavigateTarget(row.checklistTarget); else actions.onOpenRecruitingChecklist(row.reporterId); });
  };
  return <main aria-label="Reporters" className="workspace network-reporters ip2-workspace">
    <section aria-label="Reporter network summary" className="kpi-strip">
      <div><span>Ready</span><strong>{view.reporters.length}</strong></div>
      <div><span>{activityLabel}</span><strong>{recent}</strong><small>{periodLabel}</small></div>
      <div><span>Needs confirmation</span><strong>{confirmationIds.length}</strong><small>Current availability</small></div>
      <div><span>Credentials to check</span><strong>{reviewCount}</strong><small>Evidence review</small></div>
    </section>
    <div aria-label="Reporter views" className="workspace-controls">{(["ready", "activity"] as const).map((mode) => <button key={mode} aria-pressed={localView === mode} className={localView === mode ? "is-active" : ""} onClick={() => setLocalView(mode)} type="button">{mode === "ready" ? "Ready" : "Activity"}</button>)}</div>
    <section className="attention-chart">
      <Panel title="What needs attention" tools={<span>{attention.length} items</span>} className="attention"><ol>{attention.map((item, index) => {
        const row = view.reporters.find((r) => r.reporterId === item.reporterId);
        return <li key={`${item.reporterId}:${item.reason}`}><b>{index + 1}</b><div><small>{row?.serviceMarkets.join(" · ")}</small><strong><button type="button" onClick={() => open(item.reporterId, "detail")}>{row?.name ?? "Reporter"}</button></strong><span>{item.reason === "needs-availability-confirmation" ? "Needs availability confirmation" : "No recent completed work · review follow-up"}</span></div></li>;
      })}</ol>{!attention.length ? <p className="ip2-scope">No actions in this selection.</p> : null}</Panel>
      <Panel title="Readiness and recent work" tools={recentEvidence ? <button type="button" onClick={() => actions.onOpenEvidence(recentEvidence)}>Why this?</button> : null} className="chart-card">
        <CategoryComparison label="Current network" unit="people" observations={[
          { id: "ready", label: "Ready", value: view.reporters.length, valueLabel: `${view.reporters.length} people`, detail: "" },
          { id: "recent", label: activityLabel, value: recent, valueLabel: `${recent} people`, detail: "" },
          { id: "confirmation", label: "Needs confirmation", value: confirmationIds.length, valueLabel: `${confirmationIds.length} people`, detail: "" },
        ]} />
      </Panel>
    </section>
    {message ? <p role="status" className="network-reporters__result">{message}</p> : null}
    <Panel title={localView === "ready" ? "Reporters" : "Reporter activity"} tools={<span>{rows.length} shown</span>} className="table-panel reporters-table-panel">
      <div className="ip2-filters">
        <button type="button" aria-pressed={!confirmationOnly} className={!confirmationOnly ? "is-active" : ""} onClick={() => setConfirmationOnly(false)}>All {filtered.length}</button>
        <button type="button" aria-pressed={confirmationOnly} className={confirmationOnly ? "is-active" : ""} onClick={() => setConfirmationOnly(!confirmationOnly)}>Needs confirmation {confirmationCount}</button>
        <input aria-label="Find a reporter" placeholder="Find a reporter…" type="search" value={search} onChange={(e) => setSearch(e.target.value)} />
        <label>Skill <select aria-label="Skill" value={skill} onChange={(e) => setSkill(e.target.value)}><option value="">All verified skills</option>{skillOptions.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
        <label>Availability <select aria-label="Availability" value={availability} onChange={(e) => setAvailability(e.target.value)}><option value="">All availability</option>{(["available", "unavailable", "unknown", "expired"] as const).map((state) => <option key={state} value={state}>{availabilityLabel(state)}</option>)}</select></label>
        <label>Sort <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}><option value="">Source order</option><option value="name">Name A–Z</option></select></label>
        <button type="button" onClick={clear}>Clear all</button>
      </div>
      <div className="table-scroll"><table><thead><tr><th>Reporter</th><th>Service market</th><th>Verified skills</th><th>Certifications</th><th>Preferences</th><th>Availability</th><th>Last active</th><th>Compliance</th><th>Follow-up</th></tr></thead><tbody>{rows.map((row) => {
        const days = activityDays(row.lastCompletedJobAt, view.evaluation.asOfAt);
        return <tr key={row.reporterId}><th scope="row"><button type="button" onClick={() => open(row.reporterId, "detail")}>{row.name}</button><small className="network-reporters__evidence">Ready</small></th><td>{row.serviceMarkets.join(", ")}</td><td>{row.verifiedSkills.map((s) => s.label).join(", ") || "None recorded"}</td><td>{row.certificationSummary}</td><td>{row.preferences.attendanceModes.join(", ") || "Not recorded"}<small>{row.preferences.supportedProceedingTypes.join(", ") || "No proceeding preference recorded"}</small></td><td>{availabilityLabel(row.availability)}<small>{row.availabilityIsMixed ? "Mixed scope · inspect details" : "Dated market / mode scope"}</small></td><td><span className={`status-tag status-tag--${days === null || days >= 28 ? "over" : "under"}`}>{days === null ? "No completed work" : `${days} days ago`}</span><small>{row.recentJobCount} jobs / {view.appliedFilters.window ? "selected window" : "28 days"}</small></td><td><span className={`status-tag status-tag--${complianceTone(row.compliance.state)}`}>{complianceLabel(row.compliance.state)}</span><small>{row.compliance.evidenceLabel}</small></td><td><div className="network-reporters__actions"><button type="button" onClick={() => open(row.reporterId, "availability")}>Confirm availability</button><details className="network-reporters__more-actions"><summary>More actions</summary><div><button type="button" onClick={() => openFollowUp(row)}>{row.openReengagementWorkItemId ? "Open linked work" : "Create re-engagement task"}</button><button type="button" onClick={() => checklist(row)}>Inspect checklist</button></div></details></div></td></tr>;
      })}</tbody></table></div>
      {!rows.length ? <p className="ip2-scope">No reporters match these filters. Clear all to restore the records.</p> : null}
    </Panel>
    {selected && selection ? <Drawer key={selected.reporterId} title={selection.mode === "detail" ? selected.name : selection.mode === "availability" ? "Confirm availability" : "Create re-engagement task"} eyebrow={selection.mode === "detail" ? "Reporter detail" : selection.mode === "availability" ? "Explicit availability record" : "Linked Team work"} onClose={() => setSelection(null)}>
      {selection.mode === "detail" ? <>
        <p>{selected.serviceMarkets.join(" · ")}</p><dl className="ip2-facts"><div><dt>Readiness</dt><dd>{displayDate(selected.readinessAt)}</dd></div><div><dt>Current availability</dt><dd>{availabilityLabel(selected.availability)}</dd></div><div><dt>First completed job</dt><dd>{selected.firstCompletedJob?.completedAt ? displayDate(selected.firstCompletedJob.completedAt) : "No completed job recorded"}</dd></div><div><dt>Recent work</dt><dd>{selected.recentJobCount} jobs</dd><small>{periodLabel}</small></div></dl>
        <section className="ip2-review-row"><h3>Verified skills</h3><p>{selected.verifiedSkills.map((s) => s.label).join(", ") || "None recorded"}</p></section>
        <section className="ip2-review-row"><h3>Preferences</h3><p>{selected.preferences.attendanceModes.join(", ") || "Not recorded"} · {selected.preferences.supportedProceedingTypes.join(", ") || "Not recorded"}</p><p>{selected.preferences.serviceMarkets.map((p) => `${p.marketId}: ${p.status.replaceAll("-", " ")}`).join(" · ")}</p><p>{selected.preferences.notes}</p></section>
        <section className="ip2-review-row"><h3>Credential evidence</h3><p>{selected.certificationSummary} · {complianceLabel(selected.compliance.state)}</p><p>{selected.compliance.evidenceLabel}</p><details><summary>Inspect credential records</summary>{selected.credentialRecords.map((c) => <p key={c.id}>{c.label} · {c.verificationStatus} · {c.jurisdictionScope ?? "No jurisdiction recorded"} · valid until {c.validUntil ? displayDate(c.validUntil) : "not recorded"}</p>)}</details></section>
        <div className="ip2-actions"><button type="button" onClick={() => open(selected.reporterId, "availability")}>Confirm availability</button><button type="button" onClick={() => openFollowUp(selected)}>{selected.openReengagementWorkItemId ? "Open linked work" : "Create re-engagement task"}</button><button type="button" onClick={() => checklist(selected)}>Inspect checklist</button><button type="button" onClick={() => navigate(selected.detailTarget)} disabled={!onNavigateTarget}>Inspect person evidence</button></div>
        <section className="ip2-review-row"><h3>Availability by market and mode</h3>{selected.availabilityCells.map((cell) => <p key={`${cell.marketId}:${cell.attendanceMode}`}><strong>{cell.marketId} · {cell.attendanceMode} · {availabilityLabel(cell.state)}</strong><br/>{cell.window ? `${timestamp(cell.window.startAt)} – ${timestamp(cell.window.endAt)}; expires ${cell.window.confirmationExpiresAt ? timestamp(cell.window.confirmationExpiresAt) : "not set"}` : "No bounded confirmation recorded"}</p>)}<details><summary>Availability scope and limitations</summary>{selected.availabilityLimitations.map((s) => <p key={s}>{s}</p>)}<p>{view.filterScope.records} {view.filterScope.recentWork} {view.filterScope.firstJob}</p></details></section>
      </> : selection.mode === "availability" ? <AvailabilityForm row={selected} view={view} context={commandContext} onSave={onRecordAvailability} onCancel={() => setSelection(null)} onSaved={() => { setSelection(null); setMessage(`Availability saved for ${selected.name} with the entered scope.`); }} /> : <FollowUpForm row={selected} view={view} context={commandContext} onSave={onRequestFollowUp} onCancel={() => setSelection(null)} onSaved={() => setSelection(null)} />}
    </Drawer> : null}
  </main>;
}
