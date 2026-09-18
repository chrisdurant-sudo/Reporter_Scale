import { useMemo, useState } from "react";
import type { PreparedProgramRow, PreparedProgramsView } from "../../logic/programs";
import "./programs.css";

export interface ProgramsScreenActions {
  readonly onEditProgram: (programId: string, field: "title" | "stage", value: string) => void | Promise<void>;
  readonly onRecordDecision: (programId: string, decision: "continue" | "change" | "stop" | "expand", rationale: string) => void | Promise<void>;
  readonly onSaveProcessDraft: (programId: string) => void | Promise<void>;
  readonly onCreatePartnerTask: (programId: string) => void | Promise<void>;
  readonly onOpenEvidence: (evidenceId: string) => void;
}

type ViewMode = "Programs" | "Results";
type ProgramType = "All" | "Experiment" | "Campaign" | "Sourcing" | "Process";
type ProgramStatus = "All" | "Running" | "Review now" | "Stopped";

const formatDate = (value: string) => new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(value));
const stageLabel = (stage: PreparedProgramRow["stage"]): Exclude<ProgramStatus, "All"> => stage === "closed" ? "Stopped" : stage === "reviewing" ? "Review now" : "Running";
const typeLabel = (row: PreparedProgramRow): Exclude<ProgramType, "All"> => row.title.toLowerCase().includes("checklist") ? "Experiment" : row.stage === "closed" ? "Sourcing" : row.title.toLowerCase().includes("referral") ? "Campaign" : "Process";
const resultLabel = (row: PreparedProgramRow) => row.result?.result === null ? "Still observing" : row.result ? `${Math.round(row.result.result * 100)}%` : "Not measured";
const goalLabel = (row: PreparedProgramRow) => row.target === null ? "No declared target" : `${Math.round(row.target * 100)}% start work`;

function PilotTrend({ row }: { readonly row: PreparedProgramRow | null }) {
  const current = row?.result?.result ?? null;
  const target = row?.target ?? null;
  const value = current === null ? 0 : Math.round(current * 100);
  const targetValue = target === null ? null : Math.round(target * 100);
  const y = (point: number) => 92 - point * .78;
  return <figure className="programs__chart" aria-label="Program result and target">
    <p>{row ? `${row.title} is shown against its declared target.` : "Choose a program record to view its declared result."}</p>
    <div className="programs__plot-wrap">
      <span>Started work</span>
      <svg aria-label={row ? `${row.title}: current result ${current === null ? "not measured" : `${value} percent`}${targetValue === null ? "; no declared target" : `; target ${targetValue} percent`}.` : "No program selected."} role="img" viewBox="0 0 100 100">
        {[20, 40, 60, 80].map((tick) => <g key={tick}><line className="programs__grid" x1="9" x2="96" y1={y(tick)} y2={y(tick)} /><text x="1" y={y(tick) + 2}>{tick}%</text></g>)}
        {targetValue !== null ? <><line className="programs__target" x1="9" x2="96" y1={y(targetValue)} y2={y(targetValue)} /><text className="programs__target-text" x="95" y={y(targetValue) - 3} textAnchor="end">Target</text></> : null}
        {current !== null ? <><line className="programs__line" x1="24" x2="78" y1={y(value)} y2={y(value)} /><circle className="programs__point" cx="78" cy={y(value)} r="2.6" /><text className="programs__value" x="80" y={y(value) - 4}>{value}%</text></> : null}
        <text x="24" y="98" textAnchor="middle">Current review</text><text x="78" y="98" textAnchor="middle">Declared goal</text>
      </svg>
    </div>
    <figcaption><span className="programs__legend-result">Pilot result</span>{targetValue !== null ? <span className="programs__legend-target">Target</span> : null}</figcaption>
  </figure>;
}

function Attention({ rows, onSelect }: { readonly rows: readonly PreparedProgramRow[]; readonly onSelect: (id: string) => void }) {
  const attention = rows.filter((row) => stageLabel(row.stage) !== "Running").slice(0, 3);
  return <section className="panel attention programs__attention" aria-label="What needs attention"><header><h2>What needs attention</h2><span>{attention.length} items</span></header><ol>{attention.map((row, index) => <li key={row.id}><b>{index + 1}</b><div><small>{stageLabel(row.stage)}</small><strong>{row.title}</strong><button onClick={() => onSelect(String(row.id))} type="button">{row.nextStep}</button></div></li>)}</ol></section>;
}

/** Presentation-only Programs workspace. Prepared records and integration callbacks remain canonical. */
export function ProgramsScreen({ view, actions }: { readonly view: PreparedProgramsView; readonly actions: ProgramsScreenActions }) {
  const [mode, setMode] = useState<ViewMode>("Programs");
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ProgramType>("All");
  const [status, setStatus] = useState<ProgramStatus>("All");
  const [selectedId, setSelectedId] = useState<string | null>(view.rows[0] ? String(view.rows[0].id) : null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [nextSteps, setNextSteps] = useState<Record<string, string>>({});
  const [confirmation, setConfirmation] = useState("");
  const selected = view.rows.find((row) => String(row.id) === selectedId) ?? view.rows[0] ?? null;
  const rows = useMemo(() => view.rows.filter((row) => {
    const text = [row.title, row.marketLabel, row.nextStep, stageLabel(row.stage), typeLabel(row)].join(" ").toLowerCase();
    return text.includes(query.trim().toLowerCase()) && (type === "All" || typeLabel(row) === type) && (status === "All" || stageLabel(row.stage) === status);
  }), [query, status, type, view.rows]);
  const counts = useMemo(() => ({ running: view.rows.filter((row) => stageLabel(row.stage) === "Running").length, review: view.rows.filter((row) => stageLabel(row.stage) === "Review now").length, expanding: view.rows.filter((row) => row.latestDecision?.decision === "expand").length, stopped: view.rows.filter((row) => stageLabel(row.stage) === "Stopped").length }), [view.rows]);
  const select = (id: string) => { setSelectedId(id); setMode("Results"); };
  const updateDraft = (kind: "note" | "next", id: string, value: string) => {
    if (kind === "note") setNotes((current) => ({ ...current, [id]: value })); else setNextSteps((current) => ({ ...current, [id]: value }));
    setConfirmation(`${kind === "note" ? "Note" : "Next step"} draft updated locally. Program outcomes and decisions did not change.`);
  };
  return <main aria-label="Programs" className="workspace programs">
    <section aria-label="Program metrics" className="kpi-strip"><div><span>Running</span><strong>{counts.running}</strong></div><div><span>Review now</span><strong>{counts.review}</strong></div><div><span>Expanding</span><strong>{counts.expanding}</strong></div><div><span>Stopped</span><strong>{counts.stopped}</strong></div></section>
    <div aria-label="Programs view controls" className="workspace-controls">{(["Programs", "Results"] as const).map((item) => <button aria-pressed={mode === item} className={mode === item ? "is-active" : undefined} key={item} onClick={() => setMode(item)} type="button">{item}</button>)}</div>
    <section className="programs__focus-grid"><Attention onSelect={select} rows={view.rows} /><section className="panel programs__result-panel"><header><h2>Pilot results</h2></header><PilotTrend row={selected} /></section></section>
    {mode === "Results" && selected ? <section className="panel programs__result-detail"><header><div><h2>{selected.title}</h2><p>{selected.marketLabel} · review {formatDate(selected.reviewAt)}</p></div><button onClick={() => actions.onOpenEvidence(String(selected.result?.evidence.id ?? view.evidence[0]?.id ?? ""))} type="button">Why this?</button></header><div><p><strong>Goal:</strong> {goalLabel(selected)}</p><p><strong>Result:</strong> {resultLabel(selected)}</p><p><strong>Next review:</strong> {formatDate(selected.reviewAt)}</p><p>Results are descriptive source-backed evidence, not causal proof or an automatic rollout.</p></div></section> : null}
    <section className="panel table-panel programs__table-panel"><header><h2>Programs</h2><span>{rows.length} shown</span></header><div className="table-controls" aria-label="Program filters"><input aria-label="Find program" onChange={(event) => setQuery(event.target.value)} placeholder="Find program…" type="search" value={query} /><select aria-label="Type" onChange={(event) => setType(event.target.value as ProgramType)} value={type}>{(["All", "Experiment", "Campaign", "Sourcing", "Process"] as const).map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Status" onChange={(event) => setStatus(event.target.value as ProgramStatus)} value={status}>{(["All", "Running", "Review now", "Stopped"] as const).map((item) => <option key={item}>{item}</option>)}</select></div><div className="table-scroll"><table><thead><tr><th>Type</th><th>Program</th><th>Market</th><th>Brief</th><th>Start</th><th>Review</th><th>Goal</th><th>Results so far</th><th>Notes</th><th>Next step</th><th>Source</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><span className="status-tag">{typeLabel(row)}</span></td><th><button onClick={() => select(String(row.id))} type="button">{row.title}</button><small>{stageLabel(row.stage)}</small></th><td>{row.marketLabel}</td><td>{row.nextStep}</td><td>—</td><td>{formatDate(row.reviewAt)}</td><td>{goalLabel(row)}</td><td>{resultLabel(row)}</td><td><input aria-label={`Notes for ${row.title}`} onChange={(event) => updateDraft("note", String(row.id), event.target.value)} placeholder="Add note" value={notes[String(row.id)] ?? ""} /></td><td><input aria-label={`Next step for ${row.title}`} onChange={(event) => updateDraft("next", String(row.id), event.target.value)} value={nextSteps[String(row.id)] ?? row.nextStep} /></td><td>Prepared record</td></tr>)}</tbody></table></div></section>
    {confirmation ? <p aria-live="polite" className="programs__confirmation">{confirmation}</p> : null}
  </main>;
}
